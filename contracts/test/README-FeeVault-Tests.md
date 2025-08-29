# FeeVault Test Suites ✅

[![FeeVault (Edges Unit)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vault-edges.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vault-edges.yml)
[![FeeVault (Conservation Invariant)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vault-conservation.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vault-conservation.yml)
[![VaultWrBTC ERC20+Redeem+Slash+Reentrancy](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vaultwrbtc-erc20.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/vaultwrbtc-erc20.yml)

This document summarizes all FeeVault test coverage in `contracts/test/`.

---

## 1. FeeVault.t.sol — Unit Tests
✔️ **Deposit & Balance**: deposits credited correctly.  
✔️ **Reject Direct Receive**: plain ETH transfer → revert.  
✔️ **SpendFrom Only Oracle**: only oracle can debit balances.  
✔️ **Insufficient Balance**: reverts on overspend.  
✔️ **WithdrawUnused**: users withdraw remaining balances.

---

## 2. FeeVault.security.t.sol — Security Tests
✔️ **Reentrancy Guard**: blocks recursive calls on spend/withdraw.  
✔️ **Direct ETH Transfer Reverts**: both `receive()` and `fallback()` revert.  
✔️ **Checks-Effects-Interactions (CEI)**: events emitted before external calls.  
✔️ **Only Oracle Guard**: enforced for spend operations.  
✔️ **Zero Guards**: prevents zero-value operations.

---

## 3. FeeVault_Edges_Unit.t.sol — Edge Cases
✔️ **Deposit 1 wei & Spend to Zero**.  
✔️ **Large Deposits** and **Tiny Sequential Spends** until exact zero.  
✔️ **Receive() and Fallback() revert** as expected.

---

## 4. FeeVault_Conservation_Invariant.t.sol — Invariant
✔️ **ETH Conservation Law**:  
`Total Inflow == Out to Collector + Out to Users + Internal Balances`.  
✔️ **Model vs On-Chain Balances**: internal accounting matches user balances.

---

## 5. VaultWrBTC_ERC20_Unit.t.sol — ERC20 wrapper compatibility (wrBTC)
✔️ Covered: metadata, onWrap (onlyToken), ERC20 transfers/allowances (incl. MAX), redeem burn + unwrap callback,
onlyOracle slash + events, and redeem reentrancy protection. All tests passed.

---

✅ All existing FeeVault tests (unit, security, edges, invariant) **passed successfully**.  
These tests collectively provide strong guarantees on correctness, edge-safety, and ETH conservation.