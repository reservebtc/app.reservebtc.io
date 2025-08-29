# FeePolicy — Edges (Deterministic Property Tests)

[![FeePolicy Edges Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/feepolicy-edges-tests.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/feepolicy-edges-tests.yml)

**Suite:** `test/FeePolicy_Edges_Unit.t.sol:FeePolicy_Edges_Unit`
**Command:**

```bash
forge test -vv --match-path 'test/FeePolicy_Edges_Unit.t.sol'
```

**Compiler:** `solc 0.8.24`
**Status:** ✅ All green (5 / 5)

---

## Summary

| # | Test                                                           |     Gas |
| - | -------------------------------------------------------------- | ------: |
| 1 | `test_BigParams_And_Int64Boundaries_NoOverflow_NoWeirdness()`  | 182,920 |
| 2 | `test_FixedOnly_ConstantAcrossAllDeltas()`                     | 176,937 |
| 3 | `test_Hybrid_BaseOnZeroNeg_MonotoneAndLinearOnPositive()`      | 183,331 |
| 4 | `test_PctOnly_ZeroAndNegativeEqual_MonotoneLinearOnPositive()` | 182,895 |
| 5 | `test_RandomPicks_AreConsistent()`                             | 180,136 |

**Result:** `ok. 5 passed; 0 failed; 0 skipped`.

---

## What These Tests Verify

* **Fixed-only mode** (`pct == 0`): fee remains constant across all deltas (negative, zero, positive).
* **Pct-only mode** (`fixed == 0`): `fee(neg) == fee(0)`, and for `Δ > 0` the fee increases monotonically and linearly.
* **Hybrid mode** (`fixed > 0 && pct > 0`): `fee(neg) == fee(0)` as the baseline, and for `Δ > 0` the fee grows monotonically and linearly.
* **Big parameters / int64 boundaries**: no overflow, no revert, monotonic and linear even at boundary values.
* **Random picks**: consistent monotonicity for positive deltas, equality of `fee(neg)` and `fee(0)`.

> Note: these tests intentionally avoid depending on constructor argument ordering or fee formula internals — only high-level invariants are checked.

---

## How to Reproduce Locally

```bash
forge clean && forge test -vv --match-path 'test/FeePolicy_Edges_Unit.t.sol'
```
