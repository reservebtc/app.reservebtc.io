import { CONFIG } from "./config";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/**
 * Thin JSON-RPC client for regtest bitcoind.
 * - Reads connection settings from CONFIG by default.
 * - You can override url/user/pass via constructor arguments (useful in tests).
 */
export class BitcoinRpc {
  private readonly url: string;
  private readonly user: string;
  private readonly pass: string;

  constructor(url?: string, user?: string, pass?: string) {
    // Prefer explicit args, otherwise fall back to CONFIG.
    this.url  = url  ?? CONFIG.rpcUrl;
    this.user = user ?? CONFIG.rpcUser;
    this.pass = pass ?? CONFIG.rpcPass;

    // Fail fast if required settings are missing.
    if (!this.url) throw new Error("CONFIG.rpcUrl is required");
    if (this.user == null || this.pass == null) {
      throw new Error("CONFIG.rpcUser and CONFIG.rpcPass are required");
    }
  }

  /** Low-level JSON-RPC call wrapper */
  private async call<T = any>(method: string, params: Json[] = []): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${this.user}:${this.pass}`).toString("base64"),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });

    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);

    const j = await res.json();
    if (j.error) throw new Error(j.error.message ?? "RPC error");
    return j.result as T;
  }

  // ---------- Basic ----------
  getBlockCount() {
    return this.call<number>("getblockcount");
  }

  getBalance() {
    // For wallet: account="*", minconf=0, include_watchonly=true
    return this.call<number>("getbalance", ["*", 0, true]);
  }

  // ---------- UTXO ----------
  listUnspent(minConf = 0, maxConf = 9999999, addresses?: string[]) {
    const params: Json[] = [minConf, maxConf];
    if (addresses && addresses.length) params.push(addresses);
    return this.call<Array<{
      txid: string;
      vout: number;
      address?: string;
      amount: number;
      confirmations: number;
    }>>("listunspent", params);
  }

  // ---------- Wallet history ----------
  listTransactions(count = 100, skip = 0) {
    return this.call<Array<{
      address?: string;
      category: string;
      amount: number;
      confirmations?: number;
      txid: string;
      time?: number;
    }>>("listtransactions", ["*", count, skip, true]);
  }

  // ---------- Mempool ----------
  getRawMempool(verbose = true) {
    return this.call<any>("getrawmempool", [verbose]);
  }

  getMempoolEntry(txid: string) {
    return this.call<any>("getmempoolentry", [txid]);
  }

  // ---------- Transaction details ----------
  getRawTransaction(txid: string, verbose = false) {
    return this.call<any>("getrawtransaction", [txid, verbose]);
  }

  // ---------- Broadcast / mining helpers (regtest) ----------
  sendToAddress(address: string, amountBtc: number) {
    return this.call<string>("sendtoaddress", [address, amountBtc]);
  }

  generateBlocks(n = 1, address?: string) {
    // On modern images use generatetoaddress; some still support generate.
    if (address) return this.call<string[]>("generatetoaddress", [n, address]);
    return this.call<string[]>("generate", [n]);
  }

  getNewAddress(label = "", addrType = "bech32") {
    return this.call<string>("getnewaddress", [label, addrType]);
  }
}