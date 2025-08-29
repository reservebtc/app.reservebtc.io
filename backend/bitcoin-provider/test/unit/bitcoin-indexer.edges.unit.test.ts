import { describe, it, expect, vi } from "vitest";
import { BitcoinIndexer } from "../../src/bitcoin-indexer";
import { BitcoinRpc } from "../../src/bitcoin-rpc";

describe("BitcoinIndexer edge cases", () => {
  it("listUnspent: empty wallet returns []", async () => {
    const rpc = new BitcoinRpc();
    vi.spyOn(rpc, "listUnspent").mockResolvedValueOnce([]);
    const idx = new BitcoinIndexer(rpc);
    const utxos = await idx.getUtxos();
    expect(utxos).toEqual([]);
  });

  it("listUnspent: invalid address is gracefully handled", async () => {
    const rpc = new BitcoinRpc();
    vi.spyOn(rpc, "listUnspent").mockRejectedValueOnce(new Error("Invalid address"));
    const idx = new BitcoinIndexer(rpc);
    await expect(idx.getUtxos("not-a-real-address")).rejects.toThrow(/Invalid address/);
  });

  it("mempool watcher: quick add/remove bursts still emit diffs", async () => {
    const rpc = new BitcoinRpc();
    const spy = vi.spyOn(rpc, "getRawMempool");
    spy
      .mockResolvedValueOnce([])                // t0
      .mockResolvedValueOnce(["txA", "txB"])   // t1: +A,+B
      .mockResolvedValueOnce(["txB", "txC"])   // t2: -A,+C
      .mockResolvedValueOnce(["txC"])          // t3: -B
      .mockResolvedValueOnce([]);              // t4: -C

    const idx = new BitcoinIndexer(rpc);
    const diffs: Array<{ added?: string[]; removed?: string[] }> = [];
    const stop = idx.watchMempool((d) => diffs.push(d), { intervalMs: 5 });

    await new Promise((r) => setTimeout(r, 50));
    stop();

    const added = new Set(diffs.flatMap(d => d.added ?? []));
    const removed = new Set(diffs.flatMap(d => d.removed ?? []));
    expect(added.has("txA")).toBe(true);
    expect(added.has("txB")).toBe(true);
    expect(added.has("txC")).toBe(true);
    expect(removed.has("txA")).toBe(true);
    expect(removed.has("txB")).toBe(true);
    expect(removed.has("txC")).toBe(true);
  });

  it("wallet history: double-spend-ish sequence maps consistently", async () => {
    const rpc = new BitcoinRpc();
    vi.spyOn(rpc, "listTransactions").mockResolvedValueOnce([
      { txid: "dsp", amount: -0.1,  category: "send"    },
      { txid: "dsp", amount:  0.1,  category: "receive" }
    ] as any);
    const idx = new BitcoinIndexer(rpc);
    const hx = await idx.getWalletHistory(10);
    expect(hx.find(x => x.txid === "dsp")).toBeTruthy();
  });
});