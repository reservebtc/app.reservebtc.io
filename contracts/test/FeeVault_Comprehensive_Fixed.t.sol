// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeeVault.sol";
import "../interfaces/IFeeVault.sol";

/// @title Fixed Comprehensive Security Tests for FeeVault
contract FeeVaultComprehensiveFixedTest is Test {
    FeeVault public vault;
    
    address public oracle = address(0xBEEF);
    address payable public feeCollector = payable(address(0xCAFE));
    address public user1 = address(0xABC1);
    address public user2 = address(0xABC2);
    address public attacker = address(0xDEAD);
    
    event Deposited(address indexed user, uint256 amount);
    event Spent(address indexed user, uint256 amount, address indexed by);
    event Withdrawn(address indexed user, uint256 amount);

    function setUp() public {
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(attacker, 100 ether);
        vm.deal(address(this), 100 ether);
        
        // Deploy FeeVault
        vault = new FeeVault(oracle, feeCollector);
    }

    // === Constructor Tests ===
    
    function test_Constructor_ZeroOracleReverts() public {
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        new FeeVault(address(0), feeCollector);
    }

    function test_Constructor_ZeroFeeCollectorReverts() public {
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        new FeeVault(oracle, payable(address(0)));
    }

    function test_Constructor_SetsImmutableValues() public {
        assertEq(vault.oracle(), oracle);
        assertEq(vault.feeCollector(), feeCollector);
    }

    // === Deposit Tests ===

    function test_DepositETH_ZeroAddressReverts() public {
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        vault.depositETH{value: 1 ether}(address(0));
    }

    function test_DepositETH_ZeroValueReverts() public {
        vm.expectRevert(FeeVault.ZeroValue.selector);
        vault.depositETH{value: 0}(user1);
    }

    function test_DepositETH_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit Deposited(user1, 1 ether);
        
        vm.prank(user1);
        vault.depositETH{value: 1 ether}(user1);
    }

    function test_DepositETH_UpdatesBalance() public {
        vm.prank(user1);
        vault.depositETH{value: 1 ether}(user1);
        
        assertEq(vault.balanceOf(user1), 1 ether);
    }

    function test_DepositETH_AccumulatesBalance() public {
        vm.prank(user1);
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(user1);
        vault.depositETH{value: 2 ether}(user1);
        
        assertEq(vault.balanceOf(user1), 3 ether);
    }

    // === SpendFrom Tests ===

    function test_SpendFrom_OnlyOracleModifier() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(user1);
        vm.expectRevert(FeeVault.NotOracle.selector);
        vault.spendFrom(user1, 0.5 ether);
        
        vm.prank(attacker);
        vm.expectRevert(FeeVault.NotOracle.selector);
        vault.spendFrom(user1, 0.5 ether);
    }

    function test_SpendFrom_ZeroValueReverts() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(oracle);
        vm.expectRevert(FeeVault.ZeroValue.selector);
        vault.spendFrom(user1, 0);
    }

    function test_SpendFrom_InsufficientBalanceReverts() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(oracle);
        vm.expectRevert(FeeVault.InsufficientBalance.selector);
        vault.spendFrom(user1, 1.1 ether);
    }

    function test_SpendFrom_UpdatesBalance() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(oracle);
        vault.spendFrom(user1, 0.3 ether);
        
        assertEq(vault.balanceOf(user1), 0.7 ether);
    }

    function test_SpendFrom_TransfersToFeeCollector() public {
        vault.depositETH{value: 1 ether}(user1);
        uint256 beforeBalance = feeCollector.balance;
        
        vm.prank(oracle);
        vault.spendFrom(user1, 0.5 ether);
        
        assertEq(feeCollector.balance, beforeBalance + 0.5 ether);
    }

    // === WithdrawUnused Tests ===

    function test_WithdrawUnused_ZeroBalanceReverts() public {
        vm.prank(user1);
        vm.expectRevert(FeeVault.InsufficientBalance.selector);
        vault.withdrawUnused();
    }

    function test_WithdrawUnused_TransfersToSender() public {
        vault.depositETH{value: 1 ether}(user1);
        uint256 beforeBalance = user1.balance;
        
        vm.prank(user1);
        vault.withdrawUnused();
        
        assertEq(user1.balance, beforeBalance + 1 ether);
        assertEq(vault.balanceOf(user1), 0);
    }

    // === View Function Tests ===

    function test_BalanceOf_NewUserReturnsZero() public {
        assertEq(vault.balanceOf(user1), 0);
    }

    // === Fuzz Tests ===

    function testFuzz_DepositETH_RandomAmounts(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 100 ether);
        
        vm.deal(user1, amount);
        vm.prank(user1);
        vault.depositETH{value: amount}(user1);
        
        assertEq(vault.balanceOf(user1), amount);
    }

    function testFuzz_SpendFrom_RandomAmounts(uint256 depositAmount, uint256 spendAmount) public {
        vm.assume(depositAmount > 0 && depositAmount <= 100 ether);
        vm.assume(spendAmount > 0 && spendAmount <= depositAmount);
        
        vault.depositETH{value: depositAmount}(user1);
        
        vm.prank(oracle);
        vault.spendFrom(user1, spendAmount);
        
        assertEq(vault.balanceOf(user1), depositAmount - spendAmount);
    }
}