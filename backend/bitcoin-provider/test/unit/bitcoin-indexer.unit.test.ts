import { describe, it, expect, vi, afterEach } from "vitest";
import { BitcoinIndexer } from "../../src/bitcoin-indexer";
import { BitcoinRpc } from "../../src/bitcoin-rpc";

afterEach(() => {
  // Always restore real timers and spies between tests
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("BitcoinIndexer unit edges", () => {
  it("returns empty UTXO list for empty wallet", async () => {
    const rpc = new BitcoinRpc();
    vi.spyOn(rpc, "listUnspent").mockResolvedValueOnce([]);
    const idx = new BitcoinIndexer(rpc);
    const utxos = await idx.getUtxos();
    expect(utxos).toEqual([]);
  });

  it("mempool watcher emits added/removed diffs", async () => {
    // Make polling deterministic: use fake timers and advance them manually.
    vi.useFakeTimers();

    const rpc = new BitcoinRpc();

    // Sequence of mempool snapshots we want the indexer to observe:
    //   [] -> ["txA","txB"] -> ["txB"] -> ["txB","txC"]
    const snapshots: string[][] = [
      [],
      ["txA", "txB"],
      ["txB"],
      ["txB", "txC"],
    ];

    // Mock getRawMempool to return the sequence above; after it's exhausted,
    // keep returning the last known snapshot to avoid undefined results.
    vi.spyOn(rpc, "getRawMempool").mockImplementation(async () => {
      if (snapshots.length > 1) {
        return snapshots.shift()!;
      }
      return snapshots[0] ?? [];
    });

    // If your BitcoinIndexer supports a poll interval option, you can pass a tiny one here.
    // Otherwise we will just advance timers far enough below to cover several ticks.
    const idx = new BitcoinIndexer(rpc);

    const diffs: Array<{ added?: string[]; removed?: string[] }> = [];
    const stop = idx.watchMempool((d) => diffs.push(d));

    // Advance timers enough to trigger >= 4 polling cycles regardless of default poll interval.
    // Using fake timers means this runs instantly without real delays.
    await vi.advanceTimersByTimeAsync(10_000);

    // Stop the watcher and evaluate collected diffs.
    stop();

    // Flatten all observed additions/removals.
    const addedAll = new Set<string>();
    const removedAll = new Set<string>();
    for (const d of diffs) {
      for (const tx of d.added ?? []) addedAll.add(tx);
      for (const tx of d.removed ?? []) removedAll.add(tx);
    }

    // We expect that A and B appeared as additions at some point…
    expect(addedAll.has("txA")).toBe(true);
    expect(addedAll.has("txB")).toBe(true);
    // …and A was removed at some point.
    expect(removedAll.has("txA")).toBe(true);
  });

  it("wallet history maps basic fields", async () => {
    const rpc = new BitcoinRpc();
    vi.spyOn(rpc, "listTransactions").mockResolvedValueOnce([
      { txid: "x", amount: 0.1, category: "receive" },
      { txid: "y", amount: -0.05, category: "send" },
    ] as any);
    const idx = new BitcoinIndexer(rpc);
    const hx = await idx.getWalletHistory(10);
    expect(hx).toEqual([
      { txid: "x", amountBtc: 0.1, category: "receive" },
      { txid: "y", amountBtc: -0.05, category: "send" },
    ]);
  });
});