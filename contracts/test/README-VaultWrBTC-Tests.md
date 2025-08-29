# VaultWrBTC — ERC20 Compatibility Test Summary ✅

[![VaultWrBTC ERC20+Redeem+Slash+Reentrancy](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vaultwrbtc-erc20.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vaultwrbtc-erc20.yml)

This document summarizes coverage for the `VaultWrBTC` wrapper (ERC20‑style token with wrap/redeem and oracle slash).

Source under test: `contracts/VaultWrBTC.sol`  
Test suite: `contracts/test/VaultWrBTC_ERC20_Unit.t.sol`

---

## What’s covered

### 1) Metadata & Initial State
- `name() == "Wrapped Reserve BTC"`, `symbol() == "wrBTC"`, `decimals() == 8`
- `totalSupply == 0`, user balances start at zero

### 2) onWrap (mint path) — onlyToken, events, balances
- Non‑token caller → `OnlyToken` revert  
- Valid token (mock synth) → mints to user  
- Emits `Transfer(0x0 → user, amount)` and `Wrapped(user, amount)`

### 3) ERC20 Transfers & Allowances (incl. MAX allowance)
- `transfer` moves balances and emits `Transfer`
- `approve` sets allowance and emits `Approval`
- `transferFrom` decrements allowance
- When `allowance == type(uint256).max`, it **does not** decrement
- Reverts:
  - `InsufficientBalance` on not enough balance
  - `InsufficientAllowance` on not enough allowance

### 4) redeem — burn & unwrap callback
- Burns user balance → emits `Transfer(user → 0x0, amount)` and `Redeemed(user, amount)`
- Calls `unwrapFromVault(user, amount)` on the linked synth (mock records receiver/amount)
- Reverts with `InsufficientBalance` if over‑redeem

### 5) slashFromOracle — onlyOracle & burn
- Non‑oracle caller → `OnlyOracle` revert
- Oracle burns from user → emits `Transfer(user → 0x0, amount)` and `Slashed(user, amount)`
- Reverts with `InsufficientBalance` on over‑slash

### 6) Reentrancy protection (redeem)
- Malicious synth tries to reenter `redeem` from `unwrapFromVault`  
- `redeem` is protected (nonReentrant) → the attempt reverts and state remains unchanged

---

## Status
All tests in `VaultWrBTC_ERC20_Unit.t.sol` **passed**.

> These tests ensure ERC20‑level correctness for transfers/allowances, strict role‑gating (`onlyToken`, `onlyOracle`), correct event emission, safe wrap/redeem flows, and reentrancy hardening for `redeem`.