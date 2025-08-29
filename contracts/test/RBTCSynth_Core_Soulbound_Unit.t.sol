// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../RBTCSynth.sol";

interface IERC20Events {
    event Transfer(address indexed from, address indexed to, uint256 value);
}

interface IERC20AllowanceExt {
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);
}

contract RBTCSynth_Core_Soulbound_Unit is Test, IERC20Events {
    // Actors
    address internal constant ORACLE = address(0xC0117CEe);
    address internal constant USER = address(0xA11CE);
    address internal constant OTHER = address(0xB0B);

    // System under test
    RBTCSynth internal synth;

    function setUp() public {
        // Deploy with the real oracle address (immutable in your contract)
        synth = new RBTCSynth(ORACLE);

        // Fund actors just in case
        vm.deal(ORACLE, 10 ether);
        vm.deal(USER, 10 ether);
        vm.deal(OTHER, 10 ether);
    }

    // ------------------------------------------------------------
    // Metadata and events + totalSupply behavior
    // ------------------------------------------------------------
    function test_Metadata_Decimals_Events_And_TotalSupply() public {
        // Your contract exposes these constants:
        // name = "Reserve BTC Synth", symbol = "rBTC-SYNTH", decimals = 8
        assertEq(synth.name(), "Reserve BTC Synth");
        assertEq(synth.symbol(), "rBTC-SYNTH");
        assertEq(synth.decimals(), 8);

        // --- Mint emits Transfer(0x0, USER, amount) and increases totalSupply ---
        uint64 mintSats = 50_000;
        vm.startPrank(ORACLE);
        vm.expectEmit(true, true, false, true, address(synth));
        emit Transfer(address(0), USER, mintSats);
        synth.oracleMint(USER, mintSats);
        vm.stopPrank();

        assertEq(synth.totalSupply(), mintSats, "totalSupply must equal minted sats");
        assertEq(synth.balanceOf(USER), mintSats, "user balance must equal minted sats");

        // --- Burn emits Transfer(USER, 0x0, amount) and decreases totalSupply ---
        uint64 burnSats = 50_000;
        vm.startPrank(ORACLE);
        vm.expectEmit(true, true, false, true, address(synth));
        emit Transfer(USER, address(0), burnSats);
        synth.oracleBurn(USER, burnSats);
        vm.stopPrank();

        assertEq(synth.totalSupply(), 0, "totalSupply must return to zero after full burn");
        assertEq(synth.balanceOf(USER), 0, "user balance must return to zero after burn");
    }

    // ------------------------------------------------------------
    // Only the oracle may mint/burn
    // ------------------------------------------------------------
    function test_OnlyOracle_CanMintAndBurn() public {
        // Non-oracle reverts
        vm.startPrank(USER);
        vm.expectRevert(RBTCSynth.Restricted.selector);
        synth.oracleMint(USER, 1);
        vm.expectRevert(RBTCSynth.Restricted.selector);
        synth.oracleBurn(USER, 1);
        vm.stopPrank();

        // Oracle succeeds
        vm.prank(ORACLE);
        synth.oracleMint(USER, 123);
        vm.prank(ORACLE);
        synth.oracleBurn(USER, 123);
    }

    // ------------------------------------------------------------
    // Soulbound: all transfer/approval flows must revert
    // ------------------------------------------------------------
    function test_Soulbound_AllTransferAndApprovalPathsRevert() public {
        // Give USER a balance first
        vm.prank(ORACLE);
        synth.oracleMint(USER, 1_000);

        // transfer
        vm.startPrank(USER);
        vm.expectRevert(RBTCSynth.Soulbound.selector);
        synth.transfer(OTHER, 1);

        // approve
        vm.expectRevert(RBTCSynth.Soulbound.selector);
        synth.approve(OTHER, 1);
        vm.stopPrank();

        // transferFrom (even if approval is impossible, this call itself must revert)
        vm.prank(OTHER);
        vm.expectRevert(RBTCSynth.Soulbound.selector);
        synth.transferFrom(USER, OTHER, 1);

        // increaseAllowance / decreaseAllowance (not implemented; should revert anyway)
        vm.startPrank(USER);
        vm.expectRevert(); // generic revert is OK since methods don't exist
        IERC20AllowanceExt(address(synth)).increaseAllowance(OTHER, 1);

        vm.expectRevert();
        IERC20AllowanceExt(address(synth)).decreaseAllowance(OTHER, 1);
        vm.stopPrank();
    }

    // ------------------------------------------------------------
    // Mint/Burn must not affect allowance (must remain zero)
    // ------------------------------------------------------------
    function test_Allowance_Unaffected_By_MintAndBurn() public {
        // Initially zero
        assertEq(synth.allowance(USER, OTHER), 0, "initial allowance must be zero");

        // Mint some to USER
        vm.prank(ORACLE);
        synth.oracleMint(USER, 5_000);
        assertEq(synth.allowance(USER, OTHER), 0, "allowance must remain zero after mint");

        // Burn some from USER
        vm.prank(ORACLE);
        synth.oracleBurn(USER, 2_000);
        assertEq(synth.allowance(USER, OTHER), 0, "allowance must remain zero after burn");
    }
}
