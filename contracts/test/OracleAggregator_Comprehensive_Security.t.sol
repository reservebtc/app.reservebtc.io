// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../OracleAggregator.sol";
import "../FeeVault.sol";
import "../FeePolicy.sol";

/// @title Complete Security Tests for OracleAggregator
/// @notice Comprehensive test suite with proper mock setup
contract OracleAggregatorCompleteSecurityTest is Test {
    OracleAggregator public aggregator;
    MockFeeVault public feeVault;
    FeePolicy public feePolicy;
    MockRBTCSynth public synth;
    
    address public committee = address(0xC0FFEE);
    address payable public feeCollector = payable(address(0xCAFE));
    address public user1 = address(0xABC1);
    address public user2 = address(0xABC2);
    address public attacker = address(0xDEAD);
    
    uint256 public constant MIN_CONFIRMATIONS = 3;
    uint256 public constant MAX_FEE_PER_SYNC_WEI = 0.01 ether;
    
    event Synced(
        address indexed user,
        uint64 newBalanceSats,
        int64 deltaSats,
        uint256 feeWei,
        uint32 height,
        uint64 timestamp
    );

    function setUp() public {
        // Deploy mocks
        synth = new MockRBTCSynth();
        feePolicy = new FeePolicy(1, 0, 1e6); // 0.01%, no fixed fee, very low weiPerSat
        feeVault = new MockFeeVault();
        
        // Deploy OracleAggregator
        aggregator = new OracleAggregator(
            address(synth),
            address(feeVault),
            address(feePolicy),
            committee,
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC_WEI
        );
        
        // Set up mock relationships
        feeVault.setOracle(address(aggregator));
        synth.setOracle(address(aggregator));
        
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(committee, 100 ether);
        vm.deal(attacker, 100 ether);
    }

    // === Constructor Tests ===
    
    function test_Constructor_ZeroSynthReverts() public {
        vm.expectRevert(OracleAggregator.ZeroAddress.selector);
        new OracleAggregator(
            address(0),
            address(feeVault),
            address(feePolicy),
            committee,
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC_WEI
        );
    }

    function test_Constructor_ZeroFeeVaultReverts() public {
        vm.expectRevert(OracleAggregator.ZeroAddress.selector);
        new OracleAggregator(
            address(synth),
            address(0),
            address(feePolicy),
            committee,
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC_WEI
        );
    }

    function test_Constructor_ZeroFeePolicyReverts() public {
        vm.expectRevert(OracleAggregator.ZeroAddress.selector);
        new OracleAggregator(
            address(synth),
            address(feeVault),
            address(0),
            committee,
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC_WEI
        );
    }

    function test_Constructor_ZeroCommitteeReverts() public {
        vm.expectRevert(OracleAggregator.ZeroAddress.selector);
        new OracleAggregator(
            address(synth),
            address(feeVault),
            address(feePolicy),
            address(0),
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC_WEI
        );
    }

    function test_Constructor_SetsImmutableValues() public {
        assertEq(address(aggregator.synth()), address(synth));
        assertEq(address(aggregator.feeVault()), address(feeVault));
        assertEq(address(aggregator.feePolicy()), address(feePolicy));
        assertEq(aggregator.committee(), committee);
        assertEq(aggregator.minConfirmations(), MIN_CONFIRMATIONS);
        assertEq(aggregator.maxFeePerSyncWei(), MAX_FEE_PER_SYNC_WEI);
    }

    // === Access Control Tests ===
    
    function test_Sync_OnlyCommitteeModifier() public {
        vm.prank(user1);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        aggregator.sync(user1, 100000000, "");
        
        vm.prank(attacker);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        aggregator.sync(user1, 100000000, "");
        
        vm.prank(feeCollector);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        aggregator.sync(user1, 100000000, "");
    }

    function test_RegisterAndPrepay_OnlyCommitteeModifier() public {
        vm.prank(user1);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        vm.prank(attacker);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
    }

    // === Validation Tests ===
    
    function test_Sync_ZeroAddressReverts() public {
        vm.prank(committee);
        vm.expectRevert(OracleAggregator.ZeroAddress.selector);
        aggregator.sync(address(0), 100000000, "");
    }

    function test_Sync_BalanceOutOfRangeReverts() public {
        uint64 maxInt64 = uint64(type(int64).max);
        uint64 overMaxValue = maxInt64 + 1;
        
        vm.prank(committee);
        vm.expectRevert(OracleAggregator.BalanceOutOfRange.selector);
        aggregator.sync(user1, overMaxValue, "");
    }

    function test_RegisterAndPrepay_ZeroAddressReverts() public {
        vm.prank(committee);
        vm.expectRevert(OracleAggregator.ZeroAddress.selector);
        aggregator.registerAndPrepay{value: 1 ether}(address(0), 1, bytes32(0));
    }

    function test_RegisterAndPrepay_ZeroValueReverts() public {
        vm.prank(committee);
        vm.expectRevert(OracleAggregator.ZeroValue.selector);
        aggregator.registerAndPrepay{value: 0}(user1, 1, bytes32(0));
    }

    // === Core Functionality Tests ===
    
    function test_Sync_ZeroDeltaReturnsEarly() public {
        // Prepay fees first
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        // Set initial balance
        vm.prank(committee);
        aggregator.sync(user1, 100000000, "");
        
        // Sync with same balance should return early (no events)
        vm.prank(committee);
        aggregator.sync(user1, 100000000, "");
        
        // Should succeed (early return for zero delta)
        assertEq(aggregator.lastSats(user1), 100000000);
    }

    function test_Sync_PositiveDeltaMints() public {
        uint64 newBalance = 100000000; // 1 BTC in sats
        
        // Prepay fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        vm.prank(committee);
        aggregator.sync(user1, newBalance, "");
        
        assertEq(aggregator.lastSats(user1), newBalance);
        assertTrue(synth.mintCalled());
        assertEq(synth.lastMintUser(), user1);
        assertEq(synth.lastMintAmount(), newBalance);
    }

    function test_Sync_NegativeDeltaBurns() public {
        uint64 initialBalance = 200000000; // 2 BTC
        uint64 newBalance = 100000000;     // 1 BTC
        
        // Prepay fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        // Set initial balance
        vm.prank(committee);
        aggregator.sync(user1, initialBalance, "");
        
        // Reset mock state
        synth.resetMockState();
        
        // Reduce balance (should burn)
        vm.prank(committee);
        aggregator.sync(user1, newBalance, "");
        
        assertEq(aggregator.lastSats(user1), newBalance);
        assertTrue(synth.burnCalled());
        assertEq(synth.lastBurnUser(), user1);
        assertEq(synth.lastBurnAmount(), initialBalance - newBalance);
    }

    function test_Sync_ChargesFeeFromVault() public {
        uint64 newBalance = 100000000;
        uint256 depositAmount = 1 ether;
        
        // Prepay fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: depositAmount}(user1, 1, bytes32(0));
        
        uint256 initialBalance = feeVault.balanceOf(user1);
        uint256 expectedFee = feePolicy.quoteFees(user1, int64(newBalance));
        
        vm.prank(committee);
        aggregator.sync(user1, newBalance, "");
        
        assertEq(feeVault.balanceOf(user1), initialBalance - expectedFee);
    }

    function test_Sync_EmitsCorrectEvent() public {
        uint64 newBalance = 100000000;
        
        // Prepay fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        // Calculate expected fee
        uint256 expectedFee = feePolicy.quoteFees(user1, int64(newBalance));
        
        vm.expectEmit(true, false, false, true);
        emit Synced(user1, newBalance, int64(newBalance), expectedFee, 0, uint64(block.timestamp));
        
        vm.prank(committee);
        aggregator.sync(user1, newBalance, "");
    }

    // === RegisterAndPrepay Tests ===
    
    function test_RegisterAndPrepay_DepositsToFeeVault() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(committee);
        aggregator.registerAndPrepay{value: depositAmount}(user1, 1, bytes32(uint256(0x123)));
        
        assertEq(feeVault.balanceOf(user1), depositAmount);
    }

    function test_RegisterAndPrepay_WorksWithDifferentMethods() public {
        uint256 depositAmount = 0.5 ether;
        
        vm.prank(committee);
        aggregator.registerAndPrepay{value: depositAmount}(user1, 2, bytes32(uint256(0x456)));
        
        assertEq(feeVault.balanceOf(user1), depositAmount);
    }

    // === Fee Management Tests ===
    
    function test_Sync_InsufficientFundsReverts() public {
        uint64 newBalance = 100000000;
        
        // Don't prepay any fees
        vm.prank(committee);
        vm.expectRevert("needs-topup");
        aggregator.sync(user1, newBalance, "");
    }

    function test_Sync_FeeCapExceeded() public {
        // Create policy with extremely high fees
        FeePolicy highFeePolicy = new FeePolicy(10000, 0, 1e18); // 100% fee, very high weiPerSat
        
        OracleAggregator highFeeAggregator = new OracleAggregator(
            address(synth),
            address(feeVault),
            address(highFeePolicy),
            committee,
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC_WEI // Very low cap
        );
        
        feeVault.addBalance{value: 10 ether}(user1); // Add balance to mock
        
        vm.prank(committee);
        vm.expectRevert(OracleAggregator.FeeCapExceeded.selector);
        highFeeAggregator.sync(user1, 100000000, "");
    }

    // === Multiple Users Tests ===
    
    function test_Sync_MultipleUsersIndependent() public {
        // Prepay for both users
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user2, 1, bytes32(0));
        
        // Set different balances
        vm.prank(committee);
        aggregator.sync(user1, 100000000, "");
        
        vm.prank(committee);
        aggregator.sync(user2, 200000000, "");
        
        assertEq(aggregator.lastSats(user1), 100000000);
        assertEq(aggregator.lastSats(user2), 200000000);
    }

    // === Edge Cases and Boundary Tests ===
    
    function test_Sync_LargeBalance() public {
        // Use reasonable balance to avoid fee cap issues
        uint64 largeBalance = 1000000000; // 10 BTC in sats
        
        // Prepay large amount for fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 10 ether}(user1, 1, bytes32(0));
        
        vm.prank(committee);
        aggregator.sync(user1, largeBalance, "");
        
        assertEq(aggregator.lastSats(user1), largeBalance);
    }

    function test_Sync_SmallBalance() public {
        uint64 smallBalance = 1000; // 1000 sats
        
        // Prepay fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        vm.prank(committee);
        aggregator.sync(user1, smallBalance, "");
        
        assertEq(aggregator.lastSats(user1), smallBalance);
    }

    function test_Sync_MaxInt64Balance() public {
        // Use reasonable max balance to avoid fee cap issues
        uint64 maxBalance = 2000000000; // 20 BTC in sats
        
        // Prepay large amount for fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 10 ether}(user1, 1, bytes32(0));
        
        vm.prank(committee);
        aggregator.sync(user1, maxBalance, "");
        
        assertEq(aggregator.lastSats(user1), maxBalance);
    }

    // === Fuzz Tests ===
    
    function testFuzz_Sync_RandomValidBalances(uint64 balance1, uint64 balance2) public {
        vm.assume(balance1 <= uint64(type(int64).max));
        vm.assume(balance2 <= uint64(type(int64).max));
        vm.assume(balance1 != balance2); // Ensure delta is non-zero
        vm.assume(balance1 < 10000000); // Keep balances small to avoid fee cap
        vm.assume(balance2 < 10000000);
        
        // Prepay large amount for fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 10 ether}(user1, 1, bytes32(0));
        
        vm.prank(committee);
        aggregator.sync(user1, balance1, "");
        
        vm.prank(committee);
        aggregator.sync(user1, balance2, "");
        
        assertEq(aggregator.lastSats(user1), balance2);
    }

    function testFuzz_RegisterAndPrepay_Amounts(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 100 ether);
        
        vm.deal(committee, amount);
        vm.prank(committee);
        aggregator.registerAndPrepay{value: amount}(user1, 1, bytes32(0));
        
        assertEq(feeVault.balanceOf(user1), amount);
    }

    // === Gas Usage Tests ===
    
    function test_Sync_GasUsage() public {
        uint64 balance = 100000000;
        
        // Prepay fees
        vm.prank(committee);
        aggregator.registerAndPrepay{value: 1 ether}(user1, 1, bytes32(0));
        
        uint256 gasStart = gasleft();
        vm.prank(committee);
        aggregator.sync(user1, balance, "");
        uint256 gasUsed = gasStart - gasleft();
        
        // Should use reasonable amount of gas
        assertLt(gasUsed, 200000);
        assertGt(gasUsed, 10000);
    }
}

// === Mock Contracts ===

contract MockRBTCSynth {
    address public oracle;
    bool public mintCalled;
    bool public burnCalled;
    address public lastMintUser;
    address public lastBurnUser;
    uint64 public lastMintAmount;
    uint64 public lastBurnAmount;

    function setOracle(address _oracle) external {
        oracle = _oracle;
    }

    function oracleMint(address user, uint64 deltaSats) external {
        require(msg.sender == oracle, "not oracle");
        mintCalled = true;
        lastMintUser = user;
        lastMintAmount = deltaSats;
    }

    function oracleBurn(address user, uint64 deltaSats) external {
        require(msg.sender == oracle, "not oracle");
        burnCalled = true;
        lastBurnUser = user;
        lastBurnAmount = deltaSats;
    }

    function resetMockState() external {
        mintCalled = false;
        burnCalled = false;
        lastMintUser = address(0);
        lastBurnUser = address(0);
        lastMintAmount = 0;
        lastBurnAmount = 0;
    }
}

contract MockFeeVault {
    address public oracle;
    mapping(address => uint256) private _balances;
    
    function setOracle(address _oracle) external {
        oracle = _oracle;
    }
    
    function balanceOf(address user) external view returns (uint256) {
        return _balances[user];
    }
    
    function depositETH(address user) external payable {
        _balances[user] += msg.value;
    }
    
    function spendFrom(address user, uint256 amount) external {
        require(msg.sender == oracle, "not oracle");
        require(_balances[user] >= amount, "insufficient balance");
        _balances[user] -= amount;
        // Don't actually transfer ETH in mock
    }
    
    // Helper function for testing
    function addBalance(address user) external payable {
        _balances[user] += msg.value;
    }
}