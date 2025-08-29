// ============================================================================
// File: test/FeeVault.security.t.sol
// ============================================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeeVault.sol";
import "../interfaces/IFeeVault.sol";

contract ReenterFeeCollector {
    IFeeVault public vault;
    address public targetUser;

    constructor() {}

    function setup(IFeeVault _vault, address _user) external {
        vault = _vault;
        targetUser = _user;
    }

    receive() external payable {
        // Attempt reentrancy (must be blocked by nonReentrant)
        if (address(vault) != address(0) && targetUser != address(0)) {
            try vault.spendFrom(targetUser, 1) {
                revert("reentrancy-should-fail-spendFrom");
            } catch {}
            try vault.withdrawUnused() {
                revert("reentrancy-should-fail-withdraw");
            } catch {}
        }
    }
}

contract FeeVaultSecurityTest is Test {
    // Use a fixed oracle address distinct from address(this) to test access control.
    address constant ORACLE = address(0xBEEF);

    FeeVault vault;

    address user = address(0xA11CE);
    address other = address(0xB0B);

    // local event mirrors (for expectEmit usage)
    event Deposited(address indexed user, uint256 amount);
    event Spent(address indexed user, uint256 amount, address indexed by);
    event Withdrawn(address indexed user, uint256 amount);

    function setUp() public {
        vm.deal(user, 100 ether);
        vm.deal(other, 100 ether);
        vm.deal(ORACLE, 0); // ensure oracle exists
    }

    function _deployWithFeeCollector(address payable fc) internal {
        vault = new FeeVault(ORACLE, fc);
    }

    function test_Reentrancy_BlockedOnSpendAndWithdraw() public {
        // Deploy attacker first
        ReenterFeeCollector attacker = new ReenterFeeCollector();
        // Deploy vault with attacker as feeCollector
        _deployWithFeeCollector(payable(address(attacker)));
        // Wire vault/user into attacker
        attacker.setup(vault, user);

        // Prepay for user
        vm.startPrank(user);
        vm.expectEmit(true, false, false, false, address(vault));
        emit Deposited(user, 1 ether);
        vault.depositETH{value: 1 ether}(user);
        vm.stopPrank();

        // Only oracle may spend
        vm.prank(ORACLE);
        vault.spendFrom(user, 0.5 ether);

        // Balance reduced; attacker attempted reentrancy in receive(), but failed
        assertEq(vault.balanceOf(user), 0.5 ether);
    }

    function test_ReceiveDirectTransfer_Reverts() public {
        _deployWithFeeCollector(payable(address(0xCAFE)));
        (bool ok,) = address(vault).call{value: 1 ether}("");
        assertTrue(!ok, "direct receive must revert");
    }

    function test_Withdraw_CEI_AndEvent() public {
        _deployWithFeeCollector(payable(address(0xCAFE)));
        // Deposit for user
        vm.prank(user);
        vault.depositETH{value: 3 ether}(user);

        uint256 beforeUser = user.balance;
        vm.expectEmit(true, false, false, false, address(vault));
        emit Withdrawn(user, 3 ether);

        vm.prank(user);
        vault.withdrawUnused();

        assertEq(vault.balanceOf(user), 0);
        assertEq(user.balance, beforeUser + 3 ether);
    }

    function test_SpendOnlyOracle() public {
        _deployWithFeeCollector(payable(address(0xCAFE)));
        vault.depositETH{value: 1 ether}(user);

        // non-oracle (address(this)) must revert
        vm.expectRevert(FeeVault.NotOracle.selector);
        vault.spendFrom(user, 0.1 ether);

        // oracle succeeds
        vm.prank(ORACLE);
        vm.expectEmit(true, false, true, false, address(vault));
        emit Spent(user, 0.1 ether, ORACLE);
        vault.spendFrom(user, 0.1 ether);
    }

    function test_ZeroGuards() public {
        _deployWithFeeCollector(payable(address(0xCAFE)));
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        vault.depositETH{value: 1 ether}(address(0));

        vm.expectRevert(FeeVault.ZeroValue.selector);
        vault.depositETH(address(0x1));

        vm.expectRevert(FeeVault.ZeroValue.selector);
        vm.prank(ORACLE);
        vault.spendFrom(address(0x1), 0);
    }
}
