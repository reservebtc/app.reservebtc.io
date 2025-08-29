# Security Canary Tests — Summary

[![Security Canary — ReserveBTC v0.1](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-canary-tests.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-canary-tests.yml)

This document summarizes the security "canary" checks that assert safe behavior under edge conditions and misconfigurations.

## Scope

- Ensure constructors revert on zero-address inputs where applicable.
- Verify that fee-collector failure modes (including `selfdestruct` behavior post–EIP-6780) do not corrupt the system state.

---

## ✅ test_FeeCollector_SelfDestruct_SyncDoesNotCorruptState()

**Goal**
- Prove that even if the fee collector contract “self-destructs” (per EIP-6780 semantics where code remains but balance may transfer), subsequent oracle `sync` calls neither corrupt state nor break accounting.

**Setup**
- Deploy a canary fee collector (`BoomVault`) compatible with `IFeeVault`.
- Fund user allowance and perform a positive `sync` to exercise fee spending.
- Call `boom()` on the fee collector to trigger `selfdestruct`.
- Repeat `sync` operations and compare balances, supply, and vault behavior.

**Expected**
- No state corruption.
- No unexpected reverts in `sync`.
- rBTC `totalSupply()` continues to match the sum of user balances implied by oracle state transitions.

**Notes**
- EIP-6780 changed `SELFDESTRUCT` semantics, so the canary checks for modern behavior (code persists; only balance may transfer in most cases).

---

## ✅ test_OracleAggregator_Constructor_ZeroAddresses_Revert()

**Goal**
- Ensure `OracleAggregator` rejects invalid constructor arguments (zero addresses for required collaborators).

**Setup**
- Attempt deployments with one or more zero addresses for synth, fee vault, fee policy, or committee.

**Expected**
- Deployment reverts with a clear error (constructor guards enforce nonzero addresses).