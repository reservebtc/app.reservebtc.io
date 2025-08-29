# Oracle Aggregator Test Coverage

[![Oracle Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle.yml)
[![Oracle (All Unit)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-all.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-all.yml)
[![Oracle Gas Report](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-gas.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-gas.yml)
[![Oracle (Boundary + Fuzz + Gas)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-boundary.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-boundary.yml)
[![Oracle (Boundary & Fuzz)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-boundary-fuzz.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-boundary-fuzz.yml)
[![Oracle (Negative Delta)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-negative-delta.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/oracle-negative-delta.yml)

This document summarizes the complete set of tests implemented for the **OracleAggregator** module, including both the planned unit tests and the additional fuzz/invariant/gas tests we added for extended coverage.

---

## ✅ Core Unit Tests

1. **Monotonicity & Idempotency** (`test/Oracle_Sync_Monotonic_And_Idempotent_Unit.t.sol`)

   * Repeated `sync()` with identical arguments is a clean no-op.
   * Sequence: up → up (same value) → down correctly preserves monotonicity of `lastSats`.

2. **Event Formatting** (`test/Oracle_Events_Unit.t.sol`)

   * Ensures `Synced` and `NeedsTopUp` events contain correct fields (`feeWei`, signed `deltaSats`, accurate `timestamp`).

3. **Bounds & Limits** (`test/Oracle_Bounds_Unit.t.sol`)

   * `maxFeePerSyncWei` at boundary (==) passes.
   * `maxFeePerSyncWei - 1` reverts with `FeeCapExceeded`.
   * Very large `newBalanceSats` (just below 2^63-1) accepted without overflow.

4. **Access Control** (`test/Oracle_Access_Control_Unit.t.sol`)

   * Only the committee can call `sync` and `registerAndPrepay`.
   * Any other address reverts with `Restricted`.

5. **Reentrancy Regression** (`test/Oracle_Reentrancy_Regression_Unit.t.sol`)

   * Mocks with reentrant `spendFrom`, `oracleMint`, `oracleBurn` revert without committing state.
   * Guarantees `lastSats` is unchanged on external failure.

6. **Merkle Proof Skeleton** (`test/Oracle_Merkle_Unit.t.sol`)

   * Proof bytes are passed through API correctly.
   * Storage/validation deferred to later integration.

7. **Fork Canary Simulation** (`test/Oracle_Fork_Canary_Simulation.t.sol`)

   * Models lightweight "reorg": `sync` below `minConfirmations` threshold → aggregator does not publish.

---

## ✅ Extended Tests

8. **All-in-One Scenario Tests** (`test/Oracle_All_Unit.t.sol`)

   * Consolidated multi-case suite combining AccessControl, Bounds, Events, ForkCanary, Proof passthrough, and Reentrancy checks.
   * Ensures cross-feature correctness without duplicating isolated unit tests.

9. **Boundary & Fuzz Invariants** (`test/Oracle_BoundaryFuzz_Invariants.t.sol`)

   * Fuzzing across `int64/uint64` boundary:

     * Values > int64.max revert with `BalanceOutOfRange`.
     * Values ≤ int64.max accepted and persist in state.
   * Focused fuzz around `int64.max ± 5`.
   * Multi-user invariant: independent state per user, all values ≤ int64.max.
   * Gas snapshot for up → no-op → down sequence.

10. **Negative Delta (No Fee Policy)** (`test/Oracle_NegativeDelta_NoFee_Unit.t.sol`)

    * Ensures negative delta syncs (burns) work without charging fees.
    * Gas snapshot for simple negative delta path.

---

## ✅ Invariants

11. **System Invariant** (`test/invariants/SystemInvariant.t.sol`)

    * `lastSats` is always consistent across repeated fuzz runs and revert paths.

---

## 🔍 Gas Reporting

* Gas snapshots are integrated into fuzz and negative-delta tests.
* Dedicated workflows produce `gas-report.txt` artifacts and CI badges.

---

## 📊 Summary

* **12 test suites total.**
* **48+ tests implemented.**
* Coverage includes **monotonicity, idempotency, access control, bounds, events, reentrancy, proofs, fork scenarios, fuzz/invariants, and gas snapshots**.

This ensures the OracleAggregator is validated against both functional correctness and performance regressions.
