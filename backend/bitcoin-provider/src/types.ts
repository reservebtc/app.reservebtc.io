export type UTXO = {
  txid: string;
  vout: number;
  address?: string;
  amountBtc: number;
  confirmations: number;
  spendable?: boolean;
  solvable?: boolean;
};

export interface BitcoinProvider {
  getBlockHeight(): Promise<number>;
  getBalance(minConf?: number): Promise<bigint>; // return in sats
  getNewAddress(): Promise<string>;
  generateBlocks(n: number, toAddress?: string): Promise<string[]>;
  sendToAddress(address: string, amountBtc: number): Promise<string>;
  getTransactionConfirmations(txid: string): Promise<number>;
  getRawMempool(): Promise<string[]>;
  listUnspent(minConf?: number, maxConf?: number, addresses?: string[]): Promise<UTXO[]>;
  createOrLoadWallet(name: string): Promise<void>;
}