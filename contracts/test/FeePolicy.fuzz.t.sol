// ============================================================================
// File: test/FeePolicy.fuzz.t.sol
// ============================================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeePolicy.sol";
import "../interfaces/IFeePolicy.sol";

contract FeePolicyFuzzTest is Test {
    function _mk(uint256 pctBps, uint256 fixedWei, uint256 weiPerSat) internal returns (FeePolicy) {
        return new FeePolicy(pctBps, fixedWei, weiPerSat);
    }

    function testFuzz_NoOverflow_PositiveDelta(uint256 pctBps, uint256 fixedWei, uint256 weiPerSat, uint64 d) public {
        // Keep within ranges that cannot overflow fee = delta * weiPerSat * pctBps / 10_000
        pctBps = bound(pctBps, 0, 10_000); // 0..100%
        fixedWei = bound(fixedWei, 0, 1e24); // up to ~1,000,000 ETH
        weiPerSat = bound(weiPerSat, 0, 1e12); // <= 1e12 wei/sat

        // Bound delta so product stays far from 2^256
        uint64 delta = uint64(bound(uint256(d), 0, 1e12)); // <= 1e12 sats

        FeePolicy p = new FeePolicy(pctBps, fixedWei, weiPerSat);

        uint256 feePos = p.quoteFees(address(this), int64(delta));
        uint256 feeNeg = p.quoteFees(address(this), -int64(delta));

        // Negative delta: only fixed leg applies
        assertEq(feeNeg, fixedWei);

        // Positive delta: fee >= fixed
        if (delta == 0) {
            assertEq(feePos, fixedWei);
        } else {
            assertGe(feePos, fixedWei);
        }
    }

    function test_Deterministic_ZeroEverywhere() public {
        FeePolicy p = _mk(0, 0, 0);
        assertEq(p.quoteFees(address(this), 1), 0);
        assertEq(p.quoteFees(address(this), -1), 0);
        assertEq(p.quoteFees(address(this), 0), 0);
    }

    function test_Deterministic_PctOnly_Positive() public {
        // pct=0.1% (10 bps), fixed=0, weiPerSat=1 gwei
        FeePolicy p = _mk(10, 0, 1_000_000_000);
        int64 delta = 100_000;
        uint256 expected = (uint256(uint64(delta)) * 1_000_000_000 * 10) / 10_000;
        assertEq(p.quoteFees(address(this), delta), expected);
        assertEq(p.quoteFees(address(this), -delta), 0);
        assertEq(p.quoteFees(address(this), 0), 0);
    }

    function test_Immutable_Params() public {
        FeePolicy p = _mk(25, 123, 42);
        assertEq(p.pctBps(), 25);
        assertEq(p.fixedWei(), 123);
        assertEq(p.weiPerSat(), 42);
    }
}
