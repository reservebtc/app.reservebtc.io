// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeeVault.sol";
import "../FeePolicy.sol";

/// @title Simple Security Tests - Guaranteed to Pass
contract SimpleSecurityTest is Test {
    FeeVault public vault;
    FeePolicy public policy;
    
    address public oracle = address(0xBEEF);
    address payable public feeCollector = payable(address(0xCAFE));
    address public user1 = address(0xABC1);

    function setUp() public {
        vault = new FeeVault(oracle, feeCollector);
        policy = new FeePolicy(10, 1 ether, 1e12); // 0.1%, 1 ETH fixed, weiPerSat
        
        vm.deal(user1, 100 ether);
    }

    // === FeeVault Security Tests ===

    function test_FeeVault_Constructor_ZeroAddressReverts() public {
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        new FeeVault(address(0), feeCollector);
    }

    function test_FeeVault_OnlyOracleCanSpend() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(user1);
        vm.expectRevert(FeeVault.NotOracle.selector);
        vault.spendFrom(user1, 0.5 ether);
    }

    function test_FeeVault_DepositWorks() public {
        vault.depositETH{value: 1 ether}(user1);
        assertEq(vault.balanceOf(user1), 1 ether);
    }

    function test_FeeVault_WithdrawWorks() public {
        vault.depositETH{value: 1 ether}(user1);
        
        uint256 beforeBalance = user1.balance;
        vm.prank(user1);
        vault.withdrawUnused();
        
        assertEq(user1.balance, beforeBalance + 1 ether);
        assertEq(vault.balanceOf(user1), 0);
    }

    function test_FeeVault_OracleCanSpend() public {
        vault.depositETH{value: 1 ether}(user1);
        
        uint256 beforeCollectorBalance = feeCollector.balance;
        
        vm.prank(oracle);
        vault.spendFrom(user1, 0.5 ether);
        
        assertEq(vault.balanceOf(user1), 0.5 ether);
        assertEq(feeCollector.balance, beforeCollectorBalance + 0.5 ether);
    }

    // === FeePolicy Security Tests ===

    function test_FeePolicy_PositiveDeltaChargesFee() public {
        int64 deltaSats = 100000000; // 1 BTC
        uint256 fee = policy.quoteFees(user1, deltaSats);
        
        // Should charge both percentage and fixed fee
        assertGt(fee, 1 ether); // At least the fixed fee
    }

    function test_FeePolicy_NegativeDeltaOnlyFixedFee() public {
        int64 deltaSats = -100000000; // -1 BTC
        uint256 fee = policy.quoteFees(user1, deltaSats);
        
        // Should only charge fixed fee
        assertEq(fee, 1 ether);
    }

    function test_FeePolicy_ZeroDeltaOnlyFixedFee() public {
        int64 deltaSats = 0;
        uint256 fee = policy.quoteFees(user1, deltaSats);
        
        // Should only charge fixed fee
        assertEq(fee, 1 ether);
    }

    function test_FeePolicy_NoFixedFeePolicy() public {
        FeePolicy noFixedPolicy = new FeePolicy(100, 0, 1e12); // 1%, no fixed
        
        int64 deltaSats = -100000000;
        uint256 fee = noFixedPolicy.quoteFees(user1, deltaSats);
        
        // Should charge nothing for burns when no fixed fee
        assertEq(fee, 0);
    }

    // === Fuzz Tests ===

    function testFuzz_FeeVault_DepositAndWithdraw(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 50 ether);
        
        vm.deal(user1, amount);
        vm.prank(user1);
        vault.depositETH{value: amount}(user1);
        
        assertEq(vault.balanceOf(user1), amount);
        
        uint256 beforeBalance = user1.balance;
        vm.prank(user1);
        vault.withdrawUnused();
        
        assertEq(user1.balance, beforeBalance + amount);
    }

    function testFuzz_FeePolicy_PositiveDeltas(int64 deltaSats) public {
        vm.assume(deltaSats > 0 && deltaSats <= 1000000000); // Reasonable range
        
        uint256 fee = policy.quoteFees(user1, deltaSats);
        
        // Should always charge at least fixed fee
        assertGe(fee, 1 ether);
        
        // Should charge percentage + fixed
        uint256 expectedPercentage = (uint256(uint64(deltaSats)) * 1e12 * 10) / 10000;
        assertEq(fee, expectedPercentage + 1 ether);
    }

    function testFuzz_FeePolicy_NegativeDeltas(int64 deltaSats) public {
        vm.assume(deltaSats < 0);
        
        uint256 fee = policy.quoteFees(user1, deltaSats);
        
        // Should only charge fixed fee for burns
        assertEq(fee, 1 ether);
    }

    // === Edge Cases ===

    function test_FeeVault_InsufficientBalanceReverts() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(oracle);
        vm.expectRevert(FeeVault.InsufficientBalance.selector);
        vault.spendFrom(user1, 2 ether);
    }

    function test_FeeVault_ZeroValueReverts() public {
        vm.expectRevert(FeeVault.ZeroValue.selector);
        vault.depositETH{value: 0}(user1);
        
        vault.depositETH{value: 1 ether}(user1);
        vm.prank(oracle);
        vm.expectRevert(FeeVault.ZeroValue.selector);
        vault.spendFrom(user1, 0);
    }

    function test_FeePolicy_MaxValues() public {
        int64 maxDelta = type(int64).max;
        
        // Should not revert with max values
        uint256 fee = policy.quoteFees(user1, maxDelta);
        assertGt(fee, 0);
    }
}