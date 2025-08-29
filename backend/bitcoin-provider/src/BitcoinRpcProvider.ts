import 'dotenv/config';
import { BitcoinProvider, UTXO } from './types.js';

type RpcResponse<T> = { result: T; error: { code: number; message: string } | null; id: string | number };

export class BitcoinRpcProvider implements BitcoinProvider {
  private url: string;
  private user: string;
  private pass: string;
  private wallet?: string;

  constructor(opts?: { url?: string; user?: string; pass?: string; wallet?: string }) {
    this.url = opts?.url ?? process.env.BITCOIN_RPC_URL ?? 'http://127.0.0.1:18443';
    this.user = opts?.user ?? process.env.BITCOIN_RPC_USER ?? 'rpcuser';
    this.pass = opts?.pass ?? process.env.BITCOIN_RPC_PASS ?? 'rpcpass';
    this.wallet = opts?.wallet ?? process.env.BITCOIN_RPC_WALLET ?? undefined;
  }

  private endpoint(): string {
    if (this.wallet) {
      // wallet-scoped endpoint
      const base = this.url.replace(/\/+$/, '');
      return `${base}/wallet/${encodeURIComponent(this.wallet)}`;
    }
    return this.url;
  }

  private async call<T>(method: string, params: any[] = []): Promise<T> {
    const res = await fetch(this.endpoint(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Basic ' + Buffer.from(`${this.user}:${this.pass}`).toString('base64')
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`RPC HTTP ${res.status}: ${txt}`);
    }

    const json = (await res.json()) as RpcResponse<T>;
    if (json.error) {
      throw new Error(`RPC ${method} error ${json.error.code}: ${json.error.message}`);
    }
    return json.result;
  }

  async createOrLoadWallet(name: string): Promise<void> {
    // try createwallet, if exists -> loadwallet
    try {
      await this.call('createwallet', [name, false, false, '', false, true, true]);
      this.wallet = name;
      return;
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      // -4: Wallet already exists.
      if (!msg.includes('already exists')) throw e;
    }
    await this.call('loadwallet', [name]).catch(() => {});
    this.wallet = name;
  }

  async getBlockHeight(): Promise<number> {
    return this.call<number>('getblockcount');
  }

  async getBalance(minConf: number = 1): Promise<bigint> {
    // getbalance "*" minconf
    const btc = await this.call<number>('getbalance', ['*', minConf, false]);
    return BigInt(Math.round(btc * 1e8));
  }

  async getNewAddress(): Promise<string> {
    return this.call<string>('getnewaddress', ['', 'bech32'] as any);
  }

  async generateBlocks(n: number, toAddress?: string): Promise<string[]> {
    const addr = toAddress ?? (await this.getNewAddress());
    // returns block hashes
    return this.call<string[]>('generatetoaddress', [n, addr]);
  }

  async sendToAddress(address: string, amountBtc: number): Promise<string> {
    // ensure fallbackfee enabled in node or set -fallbackfee in compose
    return this.call<string>('sendtoaddress', [address, amountBtc, '', '', false, true, null, 'unset']);
  }

  async getTransactionConfirmations(txid: string): Promise<number> {
    // gettransaction works for wallet tx; returns confirmations
    const tx = await this.call<any>('gettransaction', [txid]);
    return tx.confirmations ?? 0;
  }

  async getRawMempool(): Promise<string[]> {
    return this.call<string[]>('getrawmempool', [false]);
  }

  async listUnspent(minConf: number = 0, maxConf: number = 9999999, addresses?: string[]): Promise<UTXO[]> {
    const res = await this.call<any[]>('listunspent', [minConf, maxConf, addresses ?? []]);
    return res.map(u => ({
      txid: u.txid,
      vout: u.vout,
      address: u.address,
      amountBtc: u.amount,
      confirmations: u.confirmations,
      spendable: u.spendable,
      solvable: u.solvable
    }));
  }
}