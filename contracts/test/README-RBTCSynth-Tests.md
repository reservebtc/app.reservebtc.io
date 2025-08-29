# RBTCSynth – Test Report

[![RBTCSynth Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/rbtcsynth-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/rbtcsynth-tests.yml)

This document summarizes the unit tests for the **RBTCSynth** contract.

---

## ✅ Covered Scenarios

### 1. Metadata and Supply
- `decimals()` fixed at **8** (satoshis).
- `name()` and `symbol()` are non-empty.
- `oracleMint` → emits `Transfer(0x0, user, amount)` and increases `totalSupply`.
- `oracleBurn` → emits `Transfer(user, 0x0, amount)` and decreases `totalSupply`.

### 2. Oracle Permissions
- Only the **oracle address** can call `oracleMint` and `oracleBurn`.
- Any other caller reverts with `Restricted()`.

### 3. Soulbound Enforcement
- `transfer`, `transferFrom`, `approve`, `increaseAllowance`, `decreaseAllowance` → all revert.
- No allowances are ever granted.

### 4. Allowance Consistency
- Minting or burning tokens does **not** modify allowances.
- `allowance(user, other)` always remains **zero**.

---

## 🧪 Test File

- [`test/RBTCSynth_Core_Soulbound_Unit.t.sol`](./RBTCSynth_Core_Soulbound_Unit.t.sol)

---