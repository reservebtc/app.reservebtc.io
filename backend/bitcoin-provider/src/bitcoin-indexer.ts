import { BitcoinRpc } from "./bitcoin-rpc";
import { CONFIG } from "./config";

export type NormalizedUtxo = {
  txid: string;
  vout: number;
  address?: string;
  amountBtc: number;
  confirmations: number;
};

export class BitcoinIndexer {
  constructor(private rpc = new BitcoinRpc()) {}

  async getUtxos(addresses?: string[]): Promise<NormalizedUtxo[]> {
    const utxos = await this.rpc.listUnspent(0, 9_999_999, addresses);
    return utxos.map(u => ({
      txid: u.txid,
      vout: u.vout,
      address: u.address,
      amountBtc: u.amount,
      confirmations: u.confirmations,
    }));
  }

  async getWalletHistory(limit = 100): Promise<{ txid: string; amountBtc: number; category: string }[]> {
    const txs = await this.rpc.listTransactions(limit, 0);
    return txs.map(t => ({
      txid: t.txid,
      amountBtc: t.amount,
      category: t.category,
    }));
  }

  /**
   * Poll-based mempool watcher.
   * To reliably catch very short add/remove bursts in tests, we take several
   * back-to-back samples *within the same loop* and emit a diff after EACH sample.
   *
   * Tuning (optional via CONFIG):
   * - mempoolPollMs: delay between loops (default 20ms)
   * - mempoolSamplesPerTick: how many consecutive samples per loop (default 6)
   */
  watchMempool(onDiff: (diff: { added: string[]; removed: string[] }) => void) {
    let prev = new Set<string>();
    let stopped = false;

    const pollMs =
      Number.isFinite((CONFIG as any).mempoolPollMs) ? (CONFIG as any).mempoolPollMs as number : 20;
    const samplesPerTick = Math.max(
      2,
      Number.isFinite((CONFIG as any).mempoolSamplesPerTick)
        ? (CONFIG as any).mempoolSamplesPerTick as number
        : 6
    );

    const sampleOnce = async (): Promise<Set<string>> => {
      try {
        // verbose=false => array of txids; verbose=true => object map
        const raw = await this.rpc.getRawMempool(false);
        if (Array.isArray(raw)) return new Set<string>(raw);
        return new Set<string>(Object.keys(raw ?? {}));
      } catch {
        // Keep previous state on transient RPC errors
        return new Set(prev);
      }
    };

    const emitAgainstPrev = (cur: Set<string>) => {
      const added: string[] = [];
      const removed: string[] = [];
      for (const x of cur) if (!prev.has(x)) added.push(x);
      for (const x of prev) if (!cur.has(x)) removed.push(x);
      if (added.length || removed.length) onDiff({ added, removed });
      prev = cur;
    };

    const loop = async () => {
      if (stopped) return;

      // Take N immediate samples; this lets us observe very fast A/B/C flips
      for (let i = 0; i < samplesPerTick && !stopped; i++) {
        const cur = await sampleOnce();
        emitAgainstPrev(cur);
      }

      if (!stopped) setTimeout(loop, pollMs);
    };

    loop();
    return () => { stopped = true; };
  }
}