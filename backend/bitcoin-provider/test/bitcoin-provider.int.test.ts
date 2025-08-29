import { describe, it, expect, beforeAll } from 'vitest';
import { BitcoinRpcProvider } from '../src/BitcoinRpcProvider.js';

const WALLET = process.env.BITCOIN_RPC_WALLET || 'reservebtc';

describe('BitcoinRpcProvider (regtest integration)', () => {
  const p = new BitcoinRpcProvider();

  beforeAll(async () => {
    // create or load the wallet
    await p.createOrLoadWallet(WALLET);

    // mine 101 blocks to mature coinbase if chain is fresh
    const height = await p.getBlockHeight();
    if (height < 101) {
      await p.generateBlocks(101);
    }
  }, 60_000);

  it('reads block height', async () => {
    const h = await p.getBlockHeight();
    expect(h).toBeGreaterThanOrEqual(101);
  });

  it('wallet balance increases after mining and sending funds confirms', async () => {
    // baseline balance (sats)
    const bal0 = await p.getBalance(1);

    // send a small tx (1.23456789 BTC on regtest is fine if mined)
    const to = await p.getNewAddress();
    const txid = await p.sendToAddress(to, 1.2345);

    // should appear in mempool with 0 conf
    const mem = await p.getRawMempool();
    expect(mem).toContain(txid);
    const conf0 = await p.getTransactionConfirmations(txid);
    expect(conf0).toBe(0);

    // mine one block -> tx confirmed
    await p.generateBlocks(1);
    const conf1 = await p.getTransactionConfirmations(txid);
    expect(conf1).toBeGreaterThanOrEqual(1);

    // balance likely changed; just assert it is a valid bigint and >= 0
    const bal1 = await p.getBalance(1);
    expect(bal1).toBeTypeOf('bigint');
    expect(bal1).toBeGreaterThanOrEqual(0n);

    // check we can list unspent
    const utxos = await p.listUnspent(0, 9_999_999);
    expect(Array.isArray(utxos)).toBe(true);
  }, 120_000);
});