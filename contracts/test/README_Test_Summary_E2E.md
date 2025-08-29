# E2E Test Suite — ReserveBTC Protocol

[![E2E Tests — ReserveBTC v0.1](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/e2e-tests.yml)
[![E2E Oracle Resilience — ReserveBTC v0.1](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/e2e-oracle-resilience.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/e2e-oracle-resilience.yml)

This folder contains a minimal but complete set of **end-to-end integration tests** for the ReserveBTC protocol components:

* `OracleAggregator`
* `FeePolicy`
* `FeeVault`
* `RBTCSynth`

Each scenario is isolated in its own file (`E2E_0X_*.t.sol`) for clarity and maintainability.
The suite validates both the **happy path flows** and **edge-case invariants**.

---

## Test Files

### 1. `E2E_01_RegisterAndPrepay.t.sol`

**Scenario:** A user is registered and the committee pre-pays into the FeeVault.
**Checks:**

* `registerAndPrepay` correctly records the user.
* Deposits to FeeVault are accounted per-user.
* No unexpected side-effects occur.

---

### 2. `E2E_02_SyncUp_FeeDeduction.t.sol`

**Scenario:** User mints rBTC via `sync(+Δ)` under the fee cap.
**Checks:**

* User balance and `totalSupply` both increase exactly by `Δ`.
* FeeVault balance decreases by the computed fee (`percentage + fixed`).
* Fee never exceeds `oracle.maxFeePerSyncWei()`.

---

### 3. `E2E_03_SyncDown_NoFee.t.sol`

**Scenario:** User burns rBTC via `sync(−Δ)`.
**Checks:**

* User balance and `totalSupply` both decrease by `burned`.
* No fee is charged on negative deltas.

---

### 4. `E2E_04_EmptyVault_Revert_Then_Deposit_Success.t.sol`

**Scenario:** FeeVault is empty when a positive sync is attempted.
**Checks:**

* First `sync(+Δ)` reverts due to insufficient prepaid fees.
* After `depositETH`, the sync succeeds.
* rBTC is minted and fee deducted as expected.

---

### 5. `E2E_05_MultiUser_Invariant.t.sol`

**Scenario:** Multiple users performing randomized sequences of `±Δ` syncs.
**Invariant:**

* At all times, `sum(user balances) == synth.totalSupply()`.
* Positive deltas respect the fee cap and deduct fees.
* Negative deltas burn supply without charging fees.

---

### 6. `E2E_06_OptionalEdges_Bundle.t.sol`

This bundle test covers additional optional edge scenarios:

- **Fee Cap Boundary**  
  Validates behavior when the percentage fee exactly matches the maximum fee cap.  
  Checks Δ where `fee == cap` and ensures Δ+1 results in revert or clamp.

- **Access Control**  
  Ensures that calls to `registerAndPrepay` or `sync` from non-committee addresses revert properly.

- **Gas Snapshot**  
  Captures gas usage for a full E2E scenario (`register → +Δ → −Δ`) for visibility in benchmarking.

- **Zero / Modified Fee Policy**  
  Validates that setting `PCT_BPS = 0` and `FIXED_WEI > 0` charges only the fixed leg as intended, and that no unintended fees occur on down-deltas.

---

### 7. `Oracle_Resilience_Unit.t.sol`

**File:** `test/Oracle_Resilience_Unit.t.sol`  
**Description:** Stress and timing scenarios to validate fee resilience under edge conditions.

- **Small noise (+1 / -1 deltas)**  
  Ensures that fees are charged only on positive deltas.  
  Zero deltas are treated as no-op, preserving balances without unnecessary deductions.  

- **Big spike delta**  
  Validates that fees are capped at `maxFeePerSyncWei`.  
  Large unexpected deltas trigger revert when exceeding cap.  

✅ **Status:** All resilience tests passed successfully. 

---

## How to Run

Run all tests:

```bash
forge clean && forge test -vv
```

Run a specific test:

```bash
forge clean && forge test -vv --match-path 'test/E2E_03_SyncDown_NoFee.t.sol'
```

---

## Summary

This suite provides:

* **Happy path coverage:** registration, mint, burn, fee deduction.
* **Boundary conditions:** empty vault, fee cap enforcement.
* **System invariants:** supply consistency across multiple users.

Together, these five scenarios form the **core E2E coverage** for ReserveBTC protocol v0.1.
