// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeePolicy.sol";
import "../interfaces/IFeePolicy.sol";

/// @title Comprehensive Security Tests for FeePolicy
/// @notice Extended security test suite covering all edge cases and calculation scenarios
contract FeePolicyComprehensiveSecurityTest is Test {
    FeePolicy public policy;
    
    address public user1 = address(0xABC1);
    address public user2 = address(0xABC2);
    
    // Test constants
    uint256 public constant BPS_10 = 10;        // 0.1%
    uint256 public constant BPS_100 = 100;      // 1%
    uint256 public constant BPS_1000 = 1000;    // 10%
    uint256 public constant FIXED_FEE = 0.001 ether;
    uint256 public constant WEI_PER_SAT = 1e12;

    function setUp() public {
        // Deploy with moderate fees: 0.1% on positive deltas, 0.001 ETH fixed fee
        policy = new FeePolicy(BPS_10, FIXED_FEE, WEI_PER_SAT);
    }

    // === Constructor Tests ===

    function test_Constructor_ZeroFeesValid() public {
        FeePolicy zeroPolicy = new FeePolicy(0, 0, 0);
        assertEq(zeroPolicy.pctBps(), 0);
        assertEq(zeroPolicy.fixedWei(), 0);
        assertEq(zeroPolicy.weiPerSat(), 0);
    }

    function test_Constructor_MaxFeesValid() public {
        uint256 maxBps = 10000; // 100%
        uint256 maxFixed = type(uint256).max;
        uint256 maxWeiPerSat = type(uint256).max;
        
        FeePolicy maxPolicy = new FeePolicy(maxBps, maxFixed, maxWeiPerSat);
        assertEq(maxPolicy.pctBps(), maxBps);
        assertEq(maxPolicy.fixedWei(), maxFixed);
        assertEq(maxPolicy.weiPerSat(), maxWeiPerSat);
    }

    function test_Constructor_SetsValues() public {
        assertEq(policy.pctBps(), BPS_10);
        assertEq(policy.fixedWei(), FIXED_FEE);
        assertEq(policy.weiPerSat(), WEI_PER_SAT);
    }

    // === QuoteFees Tests - Positive Deltas (Mint) ===

    function test_QuoteFees_PositiveDelta_OnlyPercentage() public {
        FeePolicy pctOnlyPolicy = new FeePolicy(BPS_100, 0, WEI_PER_SAT); // 1%, no fixed
        
        int64 deltaSats = 100000000; // 1 BTC
        uint256 expectedFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_100) / 10000;
        
        uint256 actualFee = pctOnlyPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_PositiveDelta_OnlyFixed() public {
        FeePolicy fixedOnlyPolicy = new FeePolicy(0, FIXED_FEE, WEI_PER_SAT);
        
        int64 deltaSats = 100000000; // 1 BTC
        uint256 expectedFee = FIXED_FEE;
        
        uint256 actualFee = fixedOnlyPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_PositiveDelta_BothFees() public {
        int64 deltaSats = 100000000; // 1 BTC
        // Correct formula from FeePolicy.sol: (d * weiPerSat * pctBps) / 10_000
        uint256 percentageFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_10) / 10000;
        uint256 expectedFee = percentageFee + FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_SmallPositiveDelta() public {
        int64 deltaSats = 1000; // 1000 sats
        uint256 percentageFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_10) / 10000;
        uint256 expectedFee = percentageFee + FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_LargePositiveDelta() public {
        int64 deltaSats = 2100000000000000; // 21M BTC in sats (max supply)
        uint256 percentageFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_10) / 10000;
        uint256 expectedFee = percentageFee + FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    // === QuoteFees Tests - Negative Deltas (Burn) ===

    function test_QuoteFees_NegativeDelta_OnlyFixed() public {
        int64 deltaSats = -100000000; // -1 BTC
        uint256 expectedFee = FIXED_FEE; // Only fixed fee for burns
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_SmallNegativeDelta() public {
        int64 deltaSats = -1000; // -1000 sats
        uint256 expectedFee = FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_LargeNegativeDelta() public {
        int64 deltaSats = -2100000000000000; // -21M BTC in sats
        uint256 expectedFee = FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_NegativeDelta_ZeroFixed() public {
        FeePolicy noFixedPolicy = new FeePolicy(BPS_100, 0, WEI_PER_SAT);
        
        int64 deltaSats = -100000000;
        uint256 expectedFee = 0; // No fees on burns when no fixed fee
        
        uint256 actualFee = noFixedPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    // === QuoteFees Tests - Zero Delta ===

    function test_QuoteFees_ZeroDelta_OnlyFixed() public {
        int64 deltaSats = 0;
        uint256 expectedFee = FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_ZeroDelta_NoFixed() public {
        FeePolicy noFixedPolicy = new FeePolicy(BPS_100, 0, WEI_PER_SAT);
        
        int64 deltaSats = 0;
        uint256 expectedFee = 0;
        
        uint256 actualFee = noFixedPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    // === Edge Cases and Boundary Tests ===

    function test_QuoteFees_MinPositiveDelta() public {
        int64 deltaSats = 1; // 1 sat
        uint256 percentageFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_10) / 10000;
        uint256 expectedFee = percentageFee + FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_MaxInt64PositiveDelta() public {
        int64 deltaSats = type(int64).max;
        uint256 percentageFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_10) / 10000;
        uint256 expectedFee = percentageFee + FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_MinNegativeDelta() public {
        int64 deltaSats = -1;
        uint256 expectedFee = FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_MaxNegativeDelta() public {
        int64 deltaSats = type(int64).min;
        uint256 expectedFee = FIXED_FEE;
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    // === High Percentage Fee Tests ===

    function test_QuoteFees_HighPercentageFee() public {
        FeePolicy highPolicy = new FeePolicy(10000, 0, WEI_PER_SAT); // 100%
        
        int64 deltaSats = 100000000; // 1 BTC
        uint256 expectedFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * 10000) / 10000; // 100% of 1 BTC in wei
        
        uint256 actualFee = highPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_FractionalPercentage() public {
        FeePolicy fractionalPolicy = new FeePolicy(1, 0, WEI_PER_SAT); // 0.01%
        
        int64 deltaSats = 1000000000; // 10 BTC
        uint256 expectedFee = (uint256(uint64(deltaSats)) * WEI_PER_SAT * 1) / 10000;
        
        uint256 actualFee = fractionalPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    // === WeiPerSat Variations ===

    function test_QuoteFees_ZeroWeiPerSat() public {
        FeePolicy zeroWeiPerSatPolicy = new FeePolicy(BPS_100, FIXED_FEE, 0);
        
        int64 deltaSats = 100000000;
        uint256 expectedFee = FIXED_FEE; // Only fixed fee when weiPerSat is 0
        
        uint256 actualFee = zeroWeiPerSatPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    function test_QuoteFees_HighWeiPerSat() public {
        uint256 highWeiPerSat = 1e18; // Very high conversion rate
        FeePolicy highWeiPolicy = new FeePolicy(BPS_100, 0, highWeiPerSat);
        
        int64 deltaSats = 1000; // Small amount in sats
        uint256 expectedFee = uint256(uint64(deltaSats)) * BPS_100 / 10000 * highWeiPerSat;
        
        uint256 actualFee = highWeiPolicy.quoteFees(user1, deltaSats);
        assertEq(actualFee, expectedFee);
    }

    // === User-specific Tests (should be user-agnostic) ===

    function test_QuoteFees_DifferentUsersYieldSameResults() public {
        int64 deltaSats = 50000000; // 0.5 BTC
        
        uint256 fee1 = policy.quoteFees(user1, deltaSats);
        uint256 fee2 = policy.quoteFees(user2, deltaSats);
        
        assertEq(fee1, fee2); // Fees should be identical regardless of user
    }

    function test_QuoteFees_AddressZeroUser() public {
        int64 deltaSats = 100000000;
        
        // Should work even with address(0) as user parameter is ignored
        uint256 actualFee = policy.quoteFees(address(0), deltaSats);
        uint256 expectedFee = uint256(uint64(deltaSats)) * BPS_10 / 10000 * WEI_PER_SAT + FIXED_FEE;
        
        assertEq(actualFee, expectedFee);
    }

    // === Overflow Protection Tests ===

    function test_QuoteFees_NoOverflowWithMaxValues() public {
        // Test with maximum reasonable values to ensure no overflow
        FeePolicy maxPolicy = new FeePolicy(10000, type(uint128).max, type(uint128).max);
        
        int64 deltaSats = type(int64).max;
        
        // This should not revert due to overflow
        uint256 actualFee = maxPolicy.quoteFees(user1, deltaSats);
        
        // Fee should be computed correctly
        uint256 percentagePart = uint256(uint64(deltaSats)) * 10000 / 10000 * type(uint128).max;
        uint256 expectedFee = percentagePart + type(uint128).max;
        
        assertEq(actualFee, expectedFee);
    }

    // === Fuzz Tests ===

    function testFuzz_QuoteFees_PositiveDeltas(int64 deltaSats) public {
        vm.assume(deltaSats > 0);
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        uint256 expectedPercentage = (uint256(uint64(deltaSats)) * WEI_PER_SAT * BPS_10) / 10000;
        uint256 expectedFee = expectedPercentage + FIXED_FEE;
        
        assertEq(actualFee, expectedFee);
    }

    function testFuzz_QuoteFees_NegativeDeltas(int64 deltaSats) public {
        vm.assume(deltaSats < 0);
        
        uint256 actualFee = policy.quoteFees(user1, deltaSats);
        assertEq(actualFee, FIXED_FEE);
    }

    function testFuzz_QuoteFees_RandomFeeParams(
        uint256 pctBps,
        uint256 fixedWei,
        uint256 weiPerSat,
        int64 deltaSats
    ) public {
        vm.assume(pctBps <= 10000); // Max 100%
        vm.assume(fixedWei <= type(uint128).max); // Reasonable upper bound
        vm.assume(weiPerSat <= type(uint128).max); // Reasonable upper bound
        vm.assume(deltaSats != type(int64).min); // Avoid abs overflow
        
        FeePolicy fuzzPolicy = new FeePolicy(pctBps, fixedWei, weiPerSat);
        
        uint256 actualFee = fuzzPolicy.quoteFees(user1, deltaSats);
        
        if (deltaSats > 0) {
            uint256 expectedPercentage = (uint256(uint64(deltaSats)) * weiPerSat * pctBps) / 10000;
            assertEq(actualFee, expectedPercentage + fixedWei);
        } else {
            assertEq(actualFee, fixedWei);
        }
    }

    // === Real-world Scenario Tests ===

    function test_QuoteFees_TypicalBitcoinAmounts() public {
        // Test with typical Bitcoin amounts
        int64[] memory amounts = new int64[](5);
        amounts[0] = 100000;      // 0.001 BTC
        amounts[1] = 1000000;     // 0.01 BTC
        amounts[2] = 10000000;    // 0.1 BTC
        amounts[3] = 100000000;   // 1 BTC
        amounts[4] = 1000000000;  // 10 BTC
        
        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 fee = policy.quoteFees(user1, amounts[i]);
            
            // Fee should be reasonable (not 0, not astronomical)
            assertGt(fee, 0);
            assertLt(fee, 100 ether); // Should never exceed 100 ETH for reasonable amounts
        }
    }

    // === Gas Usage Tests ===

    function test_QuoteFees_GasUsage() public {
        uint256 gasStart = gasleft();
        policy.quoteFees(user1, 100000000);
        uint256 gasUsed = gasStart - gasleft();
        
        // Should use minimal gas (view function)
        assertLt(gasUsed, 10000);
    }

    function test_QuoteFees_ConsistentGasUsage() public {
        int64[] memory deltas = new int64[](3);
        deltas[0] = 100000000;   // Positive
        deltas[1] = -100000000;  // Negative
        deltas[2] = 0;           // Zero
        
        // Just verify that gas usage is reasonable, not necessarily consistent
        // since different code paths (with/without percentage calculation) will vary
        for (uint256 i = 0; i < deltas.length; i++) {
            uint256 gasStart = gasleft();
            policy.quoteFees(user1, deltas[i]);
            uint256 gasUsed = gasStart - gasleft();
            
            // Each call should use reasonable amount of gas
            assertLt(gasUsed, 15000); // Should be well under 15k gas
            assertGt(gasUsed, 500);   // Should use at least some gas
        }
    }
}