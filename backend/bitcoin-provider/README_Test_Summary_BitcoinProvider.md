# Bitcoin Provider — Summary

[![Backend — Bitcoin Provider Integration Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/backend-bitcoin-provider-tests.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/backend-bitcoin-provider-tests.yml)
[![Backend — Bitcoin Provider CI](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/backend-bitcoin-provider-ci.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/backend-bitcoin-provider-ci.yml)
[![Backend — Bitcoin Provider Unit Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/backend-bitcoin-provider-unit.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/backend-bitcoin-provider-unit.yml)

This file contains a short summary of the tests for `backend/bitcoin-provider`.

## Tests

### Integration (regtest bitcoind)
1. Reads block height.
2. Wallet balance increases after mining and sending funds.

### Unit (indexer)
1. Empty wallet returns empty UTXO list.
2. Invalid address handled gracefully.
3. Mempool watcher emits added/removed diffs, including quick add/remove bursts.
4. Wallet history maps fields consistently, including double-spend cases.


## How to run

```bash
cd backend/bitcoin-provider
npm ci
npm run dev:up
npm run test:int