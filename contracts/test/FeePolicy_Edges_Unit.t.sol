// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeePolicy.sol";

contract FeePolicy_Edges_Unit is Test {
    // int64 bounds for deltas
    int64 constant D_MIN = type(int64).min;
    int64 constant D_MAX = type(int64).max;

    address internal constant USER = address(0xA11CE);

    // --- factory: keep tests readable while respecting contract ctor order ---
    // Test code uses (_weiPerSat, _pctBps, _fixedWei) for readability,
    // but FeePolicy ctor is (pctBps, fixedWei, weiPerSat).
    function _mk(uint256 weiPerSat, uint256 pctBps, uint256 fixedWei) internal returns (FeePolicy) {
        return new FeePolicy(pctBps, fixedWei, weiPerSat);
    }

    function assertMonotoneIncreasing(uint256 a, uint256 b, string memory tag) internal pure {
        require(b >= a, string.concat("not monotone: ", tag));
    }

    function assertProportionalIncrements(
        FeePolicy fp,
        address user,
        int64 d1,
        int64 d2,
        int64 d3,
        string memory tag
    ) internal view {
        uint256 f1 = fp.quoteFees(user, d1);
        uint256 f2 = fp.quoteFees(user, d2);
        uint256 f3 = fp.quoteFees(user, d3);

        uint256 lhs = (f2 - f1) * uint64(uint64(d3 - d2));
        uint256 rhs = (f3 - f2) * uint64(uint64(d2 - d1));
        require(lhs == rhs, string.concat("non-linear increments: ", tag));
    }

    // --------------------------
    // 1) Fixed-only (pct == 0)
    // --------------------------
    function test_FixedOnly_ConstantAcrossAllDeltas() public {
        // was: new FeePolicy(1e9, 0, 3e9)
        FeePolicy fp = _mk(1e9, 0, 3e9);

        int64[5] memory deltas = [int64(0), int64(-1), int64(1), int64(123456), D_MAX];

        uint256 base = fp.quoteFees(USER, deltas[0]);
        for (uint256 i = 1; i < deltas.length; i++) {
            uint256 v = fp.quoteFees(USER, deltas[i]);
            require(v == base, "fixed-only must be constant across deltas");
        }
    }

    // --------------------------
    // 2) Pct-only (fixed == 0)
    // --------------------------
    function test_PctOnly_ZeroAndNegativeEqual_MonotoneLinearOnPositive() public {
        // was: new FeePolicy(5e9, 10_000, 0)
        FeePolicy fp = _mk(5e9, 10_000, 0);

        uint256 fNeg = fp.quoteFees(USER, -12345);
        uint256 fZero = fp.quoteFees(USER, 0);
        require(fNeg == fZero, "pct-only: fee(neg) must equal fee(0)");

        uint256 f1 = fp.quoteFees(USER, 1);
        uint256 f2 = fp.quoteFees(USER, 2);
        uint256 f3 = fp.quoteFees(USER, 3);
        assertMonotoneIncreasing(f1, f2, "pct-only 1->2");
        assertMonotoneIncreasing(f2, f3, "pct-only 2->3");

        assertProportionalIncrements(fp, USER, 1, 5, 100, "pct-only linearity");
    }

    // --------------------------
    // 3) Hybrid (fixed > 0 && pct > 0)
    // --------------------------
    function test_Hybrid_BaseOnZeroNeg_MonotoneAndLinearOnPositive() public {
        // was: new FeePolicy(1e10, 250, 21_000)
        FeePolicy fp = _mk(1e10, 250, 21_000);

        uint256 f0 = fp.quoteFees(USER, 0);
        uint256 fNeg = fp.quoteFees(USER, -42);
        require(f0 == fNeg, "hybrid: fee(0) must equal fee(neg)");

        uint256 f1 = fp.quoteFees(USER, 1);
        uint256 f10 = fp.quoteFees(USER, 10);
        uint256 f1000 = fp.quoteFees(USER, 1000);
        assertMonotoneIncreasing(f0, f1, "hybrid 0->1");
        assertMonotoneIncreasing(f1, f10, "hybrid 1->10");
        assertMonotoneIncreasing(f10, f1000, "hybrid 10->1000");

        assertProportionalIncrements(fp, USER, 1, 10, 1000, "hybrid linearity");
    }

    // --------------------------
    // 4) Big params & deltas
    // --------------------------
    function test_BigParams_And_Int64Boundaries_NoOverflow_NoWeirdness() public {
        // was: new FeePolicy(7e9, 9_999, 1 ether)
        FeePolicy fp = _mk(7e9, 9_999, 1 ether);

        uint256 fZero = fp.quoteFees(USER, 0);
        uint256 fNeg = fp.quoteFees(USER, -1);
        require(fZero == fNeg, "big: 0 vs neg mismatch");

        int64 d1 = 1;
        int64 d2 = 10_000;
        int64 d3 = D_MAX;

        uint256 v1 = fp.quoteFees(USER, d1);
        uint256 v2 = fp.quoteFees(USER, d2);
        uint256 v3 = fp.quoteFees(USER, d3);

        assertMonotoneIncreasing(v1, v2, "big monotone 1->10k");
        assertMonotoneIncreasing(v2, v3, "big monotone 10k->max");

        assertProportionalIncrements(fp, USER, d1, d2, int64(1_000_000), "big linear spaced");
    }

    function test_RandomPicks_AreConsistent() public {
        FeePolicy fp = _mk(1e9, 1234, 5e6);

        int64[6] memory D = [int64(-10_000), int64(0), int64(1), int64(2), int64(9999), int64(1_000_000)];
        uint256 prev = fp.quoteFees(USER, D[2]);
        for (uint256 i = 3; i < D.length; i++) {
            uint256 cur = fp.quoteFees(USER, D[i]);
            assertMonotoneIncreasing(prev, cur, "random monotone over positives");
            prev = cur;
        }

        require(fp.quoteFees(USER, D[0]) == fp.quoteFees(USER, D[1]), "random: neg vs zero");
    }
}