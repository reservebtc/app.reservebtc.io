// Centralized runtime config for bitcoin-provider
export const CONFIG = {
  rpcUrl: process.env.BITCOIN_RPC_URL ?? "http://127.0.0.1:18443",
  rpcUser: process.env.BITCOIN_RPC_USER ?? "rpcuser",
  rpcPass: process.env.BITCOIN_RPC_PASS ?? "rpcpass",
  network: process.env.BITCOIN_NETWORK ?? "regtest",
  // polling interval for mempool watching (ms)
  mempoolPollMs: Number(process.env.MEMPOOL_POLL_MS ?? "1500"),
};