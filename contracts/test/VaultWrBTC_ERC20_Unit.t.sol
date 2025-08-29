// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

// Import only the vault. We'll declare a tiny local interface for unwrap.
import { VaultWrBTC } from "../VaultWrBTC.sol";

/// Minimal interface that matches what VaultWrBTC calls on the rBTC synth.
/// Keeping it local avoids any name collisions with other IRBTCSynths.
interface IVaultSynth {
    function unwrapFromVault(address to, uint256 amount) external;
}

/// --------------------------------------------------------------
/// Minimal rBTC synth mock (records unwrap calls for assertions)
/// --------------------------------------------------------------
contract SynthMock is IVaultSynth {
    address public lastTo;
    uint256 public lastAmount;
    uint256 public unwrapCalls;

    function unwrapFromVault(address to, uint256 amount) external override {
        lastTo = to;
        lastAmount = amount;
        unwrapCalls += 1;
    }
}

/// ---------------------------------------------------
/// Reentrant synth mock: tries to reenter vault.redeem
/// ---------------------------------------------------
interface IVaultRedeem {
    function redeem(uint256 amount) external;
}

contract SynthReenter is IVaultSynth {
    address public vault;
    uint256 public tryAmount;

    constructor(address _vault, uint256 _tryAmount) {
        vault = _vault;
        tryAmount = _tryAmount;
    }

    function unwrapFromVault(address /*to*/, uint256 /*amount*/) external override {
        // Malicious attempt to reenter redeem during unwrap callback.
        IVaultRedeem(vault).redeem(tryAmount);
    }
}

contract VaultWrBTC_ERC20_Unit is Test {
    // Actors
    address internal constant ORACLE = address(0xC0117CEe);
    address internal constant USER   = address(0xA11CE);
    address internal constant OTHER  = address(0xB0B);

    VaultWrBTC internal vault;
    SynthMock  internal synth; // acts as rBTC token in normal tests

    function setUp() public {
        // Deploy mock synth first: its address will be the onlyToken-allowed caller
        synth = new SynthMock();

        // Deploy vault with rbtc = synth and oracle = ORACLE
        vault = new VaultWrBTC(address(synth), ORACLE);

        // Fund actors (not strictly needed, but harmless)
        vm.deal(USER,  10 ether);
        vm.deal(OTHER, 10 ether);
        vm.deal(ORACLE, 1 ether);
    }

    // --------------------
    // Metadata & baseline
    // --------------------
    function test_Metadata_And_InitialState() public {
        assertEq(vault.name(), "Wrapped Reserve BTC");
        assertEq(vault.symbol(), "wrBTC");
        assertEq(vault.decimals(), 8);
        assertEq(vault.totalSupply(), 0);
        assertEq(vault.balanceOf(USER), 0);
    }

    // -----------------------------------------
    // onWrap: onlyToken, mint, events, balances
    // -----------------------------------------
    function test_OnWrap_OnlyToken_Mints_And_Emits() public {
        // Non-rbtc caller must revert
        vm.expectRevert(VaultWrBTC.OnlyToken.selector);
        vault.onWrap(USER, 100);

        // rbtc (synth) succeeds
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Transfer(address(0), USER, 100);
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Wrapped(USER, 100);
        vm.prank(address(synth));
        vault.onWrap(USER, 100);

        assertEq(vault.totalSupply(), 100);
        assertEq(vault.balanceOf(USER), 100);
    }

    // -------------------------------------------------------
    // transfer / approve / transferFrom including MAX allow
    // -------------------------------------------------------
    function test_ERC20_Transfers_Allowances() public {
        // Mint 1_000 to USER
        vm.prank(address(synth));
        vault.onWrap(USER, 1_000);

        // transfer
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Transfer(USER, OTHER, 400);
        vm.prank(USER);
        vault.transfer(OTHER, 400);
        assertEq(vault.balanceOf(USER), 600);
        assertEq(vault.balanceOf(OTHER), 400);

        // approve & transferFrom
        vm.prank(USER);
        vault.approve(OTHER, 300);
        assertEq(vault.allowance(USER, OTHER), 300);

        vm.expectEmit(address(vault));
        emit VaultWrBTC.Transfer(USER, OTHER, 300);
        vm.prank(OTHER);
        vault.transferFrom(USER, OTHER, 300);
        assertEq(vault.balanceOf(USER), 300);
        assertEq(vault.balanceOf(OTHER), 700);
        assertEq(vault.allowance(USER, OTHER), 0);

        // approve max: allowance should NOT decrease when set to max
        vm.prank(USER);
        vault.approve(OTHER, type(uint256).max);
        vm.prank(OTHER);
        vault.transferFrom(USER, OTHER, 100);
        assertEq(vault.balanceOf(USER), 200);
        assertEq(vault.balanceOf(OTHER), 800);
        // remains max (not decremented)
        assertEq(vault.allowance(USER, OTHER), type(uint256).max);
    }

    function test_ERC20_InsufficientBalanceAndAllowance_Reverts() public {
        // No balance: transfer reverts
        vm.prank(USER);
        vm.expectRevert(VaultWrBTC.InsufficientBalance.selector);
        vault.transfer(OTHER, 1);

        // Mint to USER
        vm.prank(address(synth));
        vault.onWrap(USER, 10);

        // Insufficient allowance on transferFrom
        vm.prank(OTHER);
        vm.expectRevert(VaultWrBTC.InsufficientAllowance.selector);
        vault.transferFrom(USER, OTHER, 5);

        // Allowance ok but balance not enough
        vm.prank(USER);
        vault.approve(OTHER, 1_000);
        vm.prank(OTHER);
        vm.expectRevert(VaultWrBTC.InsufficientBalance.selector);
        vault.transferFrom(USER, OTHER, 50);
    }

    // -----------------------------
    // redeem: burns & calls unwrap
    // -----------------------------
    function test_Redeem_Burns_And_CallsUnwrap() public {
        // Mint to USER
        vm.prank(address(synth));
        vault.onWrap(USER, 500);

        // Expect Transfer(USER, 0x0, amount) and Redeemed
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Transfer(USER, address(0), 200);
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Redeemed(USER, 200);

        vm.prank(USER);
        vault.redeem(200);

        // Supply/balances updated
        assertEq(vault.totalSupply(), 300);
        assertEq(vault.balanceOf(USER), 300);

        // synth got the unwrap call
        assertEq(synth.unwrapCalls(), 1);
        assertEq(synth.lastTo(), USER);
        assertEq(synth.lastAmount(), 200);
    }

    function test_Redeem_InsufficientBalance_Reverts() public {
        vm.prank(address(synth));
        vault.onWrap(USER, 10);
        vm.prank(USER);
        vm.expectRevert(VaultWrBTC.InsufficientBalance.selector);
        vault.redeem(11);
    }

    // --------------------------------------------
    // slashFromOracle: onlyOracle & burn + event
    // --------------------------------------------
    function test_SlashFromOracle_OnlyOracle_Burns_And_Emits() public {
        vm.prank(address(synth));
        vault.onWrap(USER, 1_000);

        // Non-oracle reverts
        vm.expectRevert(VaultWrBTC.OnlyOracle.selector);
        vault.slashFromOracle(USER, 100);

        // Oracle slashes
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Transfer(USER, address(0), 250);
        vm.expectEmit(address(vault));
        emit VaultWrBTC.Slashed(USER, 250);
        vm.prank(ORACLE);
        vault.slashFromOracle(USER, 250);

        assertEq(vault.totalSupply(), 750);
        assertEq(vault.balanceOf(USER), 750);

        // Insufficient balance in slash
        vm.prank(ORACLE);
        vm.expectRevert(VaultWrBTC.InsufficientBalance.selector);
        vault.slashFromOracle(USER, 10_000);
    }

    // ------------------------------------------------------
    // Reentrancy: redeem must be protected (nonReentrant)
    // ------------------------------------------------------
    function test_Redeem_ReentrancyBlocked() public {
        // Deploy a fresh vault that points to reentrant synth
        VaultWrBTC reVault;
        {
            SynthReenter reSynth = new SynthReenter(address(0), 1); // placeholder
            reVault = new VaultWrBTC(address(reSynth), ORACLE);

            // Recreate reSynth with proper vault address and redeploy reVault bound to it
            reSynth = new SynthReenter(address(reVault), 1);
            reVault = new VaultWrBTC(address(reSynth), ORACLE);

            // Mint to USER on reVault
            vm.prank(address(reSynth));
            reVault.onWrap(USER, 10);
        }

        // redeem should revert due to inner reentrant call
        vm.prank(USER);
        vm.expectRevert(); // any revert is fine; exact error depends on ReentrancyGuard impl
        reVault.redeem(5);

        // State should remain unchanged
        assertEq(reVault.balanceOf(USER), 10);
        assertEq(reVault.totalSupply(), 10);
    }
}