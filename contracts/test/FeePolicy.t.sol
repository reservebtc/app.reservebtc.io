// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeePolicy.sol";
import "../interfaces/IFeePolicy.sol";

contract FeePolicyTest is Test {
    // Helpers
    function _mk(uint256 pctBps, uint256 fixedWei, uint256 weiPerSat) internal returns (FeePolicy) {
        return new FeePolicy(pctBps, fixedWei, weiPerSat);
    }

    function test_FixedOnly_AppliesRegardlessOfDelta() public {
        // Fixed = 0.01 ETH, no percentage.
        FeePolicy p = _mk(0, 0.01 ether, 0);

        // +Δ
        assertEq(p.quoteFees(address(1), int64(100_000)), 0.01 ether);
        // -Δ
        assertEq(p.quoteFees(address(1), int64(-50_000)), 0.01 ether);
        // 0
        assertEq(p.quoteFees(address(1), int64(0)), 0.01 ether);
    }

    function test_PctOnly_PositiveDelta() public {
        // pct = 0.1% (10 bps), weiPerSat = 1 gwei, fixed = 0
        // fee = delta * 1e9 * 10 / 10_000 = delta * 1e9 / 1_000
        FeePolicy p = _mk(10, 0, 1_000_000_000);

        int64 delta = 100_000; // sats
        uint256 expected = (uint256(uint64(delta)) * 1_000_000_000 * 10) / 10_000;
        assertEq(p.quoteFees(address(1), delta), expected);

        // no pct on negative
        assertEq(p.quoteFees(address(1), -delta), 0);
        // no pct on zero
        assertEq(p.quoteFees(address(1), 0), 0);
    }

    function test_Hybrid_PctPlusFixed() public {
        // pct = 0.2% (20 bps), fixed = 5e14 wei, wps=2 gwei
        FeePolicy p = _mk(20, 5e14, 2_000_000_000);
        int64 delta = 250_000;

        uint256 pct = (uint256(uint64(delta)) * 2_000_000_000 * 20) / 10_000;
        uint256 expected = pct + 5e14;
        assertEq(p.quoteFees(address(1), delta), expected);

        // negative delta → только фикс
        assertEq(p.quoteFees(address(1), -delta), 5e14);
    }

    function test_ZeroEverywhere_YieldsZero() public {
        FeePolicy p = _mk(0, 0, 0);
        assertEq(p.quoteFees(address(1), 1), 0);
        assertEq(p.quoteFees(address(1), -1), 0);
        assertEq(p.quoteFees(address(1), 0), 0);
    }

    function test_ParamsAreImmutable() public {
        FeePolicy p = _mk(10, 123, 42);
        assertEq(p.pctBps(), 10);
        assertEq(p.fixedWei(), 123);
        assertEq(p.weiPerSat(), 42);
    }
}
