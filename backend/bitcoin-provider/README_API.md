# Bitcoin Provider — API (minimal)

## Methods

### `getBlockCount(): Promise<number>`
Returns current regtest block height.

### `listUnspent(address?: string): Promise<Array<{
  txid: string; vout: number; amount: number; address?: string;
}>>`
Returns UTXOs; optionally filtered by address.

### `listTransactions(count?: number): Promise<Array<{
  txid: string; amount: number; category: "send" | "receive";
}>>`
Wallet history (last N entries).

### `getRawMempool(): Promise<string[]>`
Returns txids currently in mempool.

---

## Indexer helpers

### `getUtxos(address?: string)`
Thin wrapper over `listUnspent`, normalized.

### `getWalletHistory(limit: number)`
Maps `listTransactions` to `{ txid, amountBtc, category }`.

### `watchMempool(onDiff, { intervalMs = 100 } = {})`
Polls mempool and calls `onDiff({ added, removed })`.
Returns `stop()` function.