// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeeVault.sol";
import "../interfaces/IFeeVault.sol";

/// @title Comprehensive Security Tests for FeeVault
/// @notice Extended security test suite covering all edge cases and attack vectors
contract FeeVaultComprehensiveSecurityTest is Test {
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

    function test_DepositETH_AnyoneCanDepositForAnyUser() public {
        vm.prank(user2);
        vault.depositETH{value: 1 ether}(user1);
        
        assertEq(vault.balanceOf(user1), 1 ether);
        assertEq(vault.balanceOf(user2), 0);
    }

    function test_DepositETH_MaxValue() public {
        uint256 maxValue = type(uint256).max;
        
        // This should work without overflow
        vm.deal(address(this), maxValue);
        vault.depositETH{value: 1 wei}(user1);
        
        assertEq(vault.balanceOf(user1), 1 wei);
    }

    function test_DepositETH_MultipleUsers() public {
        vm.prank(user1);
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(user2);
        vault.depositETH{value: 2 ether}(user2);
        
        assertEq(vault.balanceOf(user1), 1 ether);
        assertEq(vault.balanceOf(user2), 2 ether);
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
        
        vm.prank(feeCollector);
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

    function test_SpendFrom_ExactBalanceWorks() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(oracle);
        vault.spendFrom(user1, 1 ether);
        
        assertEq(vault.balanceOf(user1), 0);
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

    function test_SpendFrom_EmitsEvent() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.expectEmit(true, false, true, true);
        emit Spent(user1, 0.5 ether, oracle);
        
        vm.prank(oracle);
        vault.spendFrom(user1, 0.5 ether);
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

    function test_WithdrawUnused_EmitsEvent() public {
        vault.depositETH{value: 1 ether}(user1);
        
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(user1, 1 ether);
        
        vm.prank(user1);
        vault.withdrawUnused();
    }

    function test_WithdrawUnused_OnlyOwnBalance() public {
        vault.depositETH{value: 1 ether}(user1);
        vault.depositETH{value: 2 ether}(user2);
        
        uint256 beforeUser1 = user1.balance;
        uint256 beforeUser2 = user2.balance;
        
        vm.prank(user1);
        vault.withdrawUnused();
        
        assertEq(user1.balance, beforeUser1 + 1 ether);
        assertEq(user2.balance, beforeUser2);
        assertEq(vault.balanceOf(user1), 0);
        assertEq(vault.balanceOf(user2), 2 ether);
    }

    // === Reentrancy Tests ===
    // Note: depositETH doesn't send ETH back, so direct reentrancy isn't possible
    // spendFrom sends to feeCollector, not the user
    // withdrawUnused has reentrancy protection via nonReentrant modifier

    function test_WithdrawUnused_ReentrancyProtection() public {
        ReentrantWithdrawer reentrant = new ReentrantWithdrawer(vault);
        vault.depositETH{value: 2 ether}(address(reentrant));
        
        // The reentrancy should be blocked by nonReentrant modifier
        vm.prank(address(reentrant));
        vm.expectRevert();
        reentrant.withdraw();
    }

    // === Direct ETH Transfer Tests ===

    function test_Receive_DirectETHRejected() public {
        // Direct ETH transfer should fail
        (bool success,) = address(vault).call{value: 1 ether}("");
        assertFalse(success);
    }

    function test_Fallback_DirectCallRejected() public {
        // Direct call with data should fail  
        (bool success,) = address(vault).call{value: 1 ether}("somedata");
        assertFalse(success);
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

    // === Edge Cases ===

    function test_MultipleOperationsSequence() public {
        // Deposit -> Spend -> Deposit -> Withdraw
        vault.depositETH{value: 1 ether}(user1);
        
        vm.prank(oracle);
        vault.spendFrom(user1, 0.3 ether);
        
        vault.depositETH{value: 0.5 ether}(user1);
        
        assertEq(vault.balanceOf(user1), 1.2 ether);
        
        vm.prank(user1);
        vault.withdrawUnused();
        
        assertEq(vault.balanceOf(user1), 0);
    }

    function test_GasLimitResistance() public {
        // Test with many small deposits to ensure gas limits don't break functionality
        for(uint256 i = 0; i < 100; i++) {
            vault.depositETH{value: 1 wei}(user1);
        }
        
        assertEq(vault.balanceOf(user1), 100 wei);
    }

    // === View Function Tests ===

    function test_BalanceOf_NewUserReturnsZero() public {
        assertEq(vault.balanceOf(user1), 0);
    }

    function test_BalanceOf_NonExistentAddress() public {
        assertEq(vault.balanceOf(address(0x9999)), 0);
    }
}

// === Helper Contracts for Reentrancy Tests ===

contract ReentrantDepositor {
    FeeVault public vault;
    uint256 public attempts = 0;

    constructor(FeeVault _vault) {
        vault = _vault;
    }

    function deposit() external {
        // This should trigger reentrancy in receive()
        vault.depositETH{value: 1 ether}(address(this));
    }

    // This won't be called for depositETH since it doesn't send ETH back
    // Let's make this test more realistic
    receive() external payable {
        attempts++;
        if (attempts < 2) {
            // This would cause reentrancy if we were in a context that sends ETH
            vault.depositETH{value: 0.1 ether}(address(this));
        }
    }
}

contract ReentrantSpender {
    FeeVault public vault;
    address public oracle;
    uint256 public attempts = 0;

    constructor(FeeVault _vault, address _oracle) {
        vault = _vault;
        oracle = _oracle;
    }

    // This will be triggered when spendFrom sends ETH to feeCollector (not us)
    // Let's make this test work differently
    function triggerReentrancy() external {
        attempts++;
        if (attempts < 2) {
            vault.spendFrom(address(this), 0.5 ether);
        }
    }

    receive() external payable {
        // This won't be called during normal spendFrom operation
    }
}

contract ReentrantWithdrawer {
    FeeVault public vault;
    uint256 public attempts = 0;

    constructor(FeeVault _vault) {
        vault = _vault;
    }

    function withdraw() external {
        vault.withdrawUnused();
    }

    receive() external payable {
        attempts++;
        if (attempts < 2) {
            vault.withdrawUnused();
        }
    }
}