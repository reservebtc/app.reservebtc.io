// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeeVault.sol";
import "../interfaces/IFeeVault.sol";

contract FeeVaultTest is Test {
    address oracle = address(0xBEEF);
    address payable feeCollector = payable(address(0xCAFE));
    address user = address(0xABCD);
    FeeVault vault;

    function setUp() public {
        vm.deal(user, 100 ether);
        vm.deal(address(this), 100 ether);
        vault = new FeeVault(oracle, feeCollector);
    }

    function test_DepositAndBalance() public {
        vm.prank(user);
        vault.depositETH{value: 1 ether}(user);
        assertEq(vault.balanceOf(user), 1 ether);
    }

    function test_SpendFrom_OnlyOracle() public {
        vault.depositETH{value: 2 ether}(user);
        vm.expectRevert(FeeVault.NotOracle.selector);
        vault.spendFrom(user, 1 ether);

        uint256 beforeBal = feeCollector.balance;
        vm.prank(oracle);
        vault.spendFrom(user, 1 ether);
        assertEq(vault.balanceOf(user), 1 ether);
        assertEq(feeCollector.balance, beforeBal + 1 ether);
    }

    function test_Spend_Insufficient() public {
        vault.depositETH{value: 1 ether}(user);
        vm.prank(oracle);
        vm.expectRevert(FeeVault.InsufficientBalance.selector);
        vault.spendFrom(user, 2 ether);
    }

    function test_WithdrawUnused() public {
        vault.depositETH{value: 3 ether}(user);
        uint256 beforeUser = user.balance;
        vm.prank(user);
        vault.withdrawUnused();
        assertEq(vault.balanceOf(user), 0);
        assertEq(user.balance, beforeUser + 3 ether);
    }

    function test_RejectDirectReceive() public {
        (bool ok,) = address(vault).call{value: 1 ether}("");
        assertTrue(!ok, "should reject direct ETH");
    }
}
