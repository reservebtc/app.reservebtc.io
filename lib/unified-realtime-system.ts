// lib/unified-realtime-system.ts
// Unified real-time system that handles both events and Supabase writes

import { createPublicClient, http, webSocket } from 'viem';
import { EventEmitter } from 'events';

interface TransactionRecord {
  tx_hash: string;
  block_number: number;
  block_timestamp: string;
  user_address: string;
  tx_type: string;
  amount: string;
  delta: string;
  fee_wei?: string;
  status: string;
  gas_used?: string;
  gas_price?: string;
}

class UnifiedRealtimeSystem extends EventEmitter {
  private wsClient: any;
  private httpClient: any;
  private isConnected = false;
  private processedTxs = new Set<string>();

  // Contract addresses
  private readonly contracts = {
    oracle: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
    rbtcSynth: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC',
    wrbtc: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
    feeVault: '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1'
  };

  // Supabase config
  private readonly supabase = {
    url: 'https://qoudozwmecstoxrqopqf.supabase.co',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };

  constructor() {
    super();
    this.setupClients();
    this.startUnifiedMonitoring();
  }

  private setupClients() {
    const megaeth = {
      id: 6342,
      name: 'MegaETH Testnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { 
          http: ['https://carrot.megaeth.com/rpc'],
          webSocket: ['wss://carrot.megaeth.com/ws']
        }
      }
    };

    this.wsClient = createPublicClient({
      chain: megaeth,
      transport: webSocket('wss://carrot.megaeth.com/ws')
    });

    this.httpClient = createPublicClient({
      chain: megaeth,
      transport: http('https://carrot.megaeth.com/rpc')
    });
  }

  private async startUnifiedMonitoring() {
    console.log('🚀 Starting Unified Real-time System...');
    
    // Monitor Oracle Synced events
    this.wsClient.watchContractEvent({
      address: this.contracts.oracle,
      abi: [{
        name: 'Synced',
        type: 'event',
        inputs: [
          { name: 'user', type: 'address', indexed: true },
          { name: 'newBalanceSats', type: 'uint64', indexed: false },
          { name: 'deltaSats', type: 'int64', indexed: false },
          { name: 'feeWei', type: 'uint256', indexed: false },
          { name: 'height', type: 'uint32', indexed: false },
          { name: 'timestamp', type: 'uint64', indexed: false }
        ]
      }],
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.processOracleSync(log);
        }
      }
    });

    // Monitor other contract events...
    this.monitorRBTCEvents();
    this.monitorWRBTCEvents();
    this.monitorFeeVaultEvents();

    this.isConnected = true;
    this.emit('connected');
    console.log('✅ Unified system active');
  }

  private async processOracleSync(log: any) {
    const txKey = `${log.transactionHash}-${log.logIndex}`;
    
    // Prevent duplicate processing
    if (this.processedTxs.has(txKey)) return;
    this.processedTxs.add(txKey);

    try {
      const { args } = log;
      const userAddress = args.user.toLowerCase();
      const newBalance = Number(args.newBalanceSats);
      const delta = Number(args.deltaSats);
      const feeWei = args.feeWei.toString();

      console.log(`🔄 Processing Oracle Sync: ${userAddress.slice(0,10)}... ${delta > 0 ? '+' : ''}${delta} sats`);

      // Create transaction record
      const transaction: TransactionRecord = {
        tx_hash: log.transactionHash,
        block_number: Number(log.blockNumber),
        block_timestamp: new Date().toISOString(),
        user_address: userAddress,
        tx_type: delta > 0 ? 'MINT' : 'BURN',
        amount: Math.abs(delta).toString(),
        delta: delta.toString(),
        fee_wei: feeWei,
        status: 'confirmed'
      };

      // 1. Write to Supabase FIRST (single source of truth)
      await this.writeToSupabase(transaction);

      // 2. Emit real-time event AFTER successful write
      this.emit('newTransaction', transaction);
      this.emit('balanceUpdate', {
        userAddress,
        rbtcBalance: newBalance,
        lastSats: newBalance,
        lastUpdate: Date.now(),
        blockNumber: Number(log.blockNumber)
      });

      console.log(`✅ Processed and stored: ${log.transactionHash.slice(0,10)}...`);

    } catch (error) {
      console.error(`❌ Error processing Oracle sync:`, error);
    }
  }

  private async writeToSupabase(transaction: TransactionRecord) {
    try {
      const response = await fetch(`${this.supabase.url}/rest/v1/transactions`, {
        method: 'POST',
        headers: {
          'apikey': this.supabase.key,
          'Authorization': `Bearer ${this.supabase.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(transaction)
      });

      if (!response.ok) {
        throw new Error(`Supabase write failed: ${response.status}`);
      }

      console.log(`💾 Supabase write success: ${transaction.tx_hash.slice(0,10)}...`);
      
    } catch (error) {
      console.error(`❌ Supabase write error:`, error);
      throw error;
    }
  }

  private monitorRBTCEvents() {
    this.wsClient.watchContractEvent({
      address: this.contracts.rbtcSynth,
      abi: [{
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      }],
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.processRBTCTransfer(log);
        }
      }
    });
  }

  private async processRBTCTransfer(log: any) {
    const { args } = log;
    const from = args.from.toLowerCase();
    const to = args.to.toLowerCase();
    
    // Only process mint/burn (from/to zero address)
    if (from === '0x0000000000000000000000000000000000000000' || 
        to === '0x0000000000000000000000000000000000000000') {
      // This is handled by Oracle sync, skip to avoid duplication
      return;
    }
  }

  private monitorWRBTCEvents() {
    this.wsClient.watchContractEvent({
      address: this.contracts.wrbtc,
      abi: [
        {
          name: 'Wrapped',
          type: 'event',
          inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        },
        {
          name: 'Redeemed',
          type: 'event',
          inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        }
      ],
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.processWRBTCEvent(log);
        }
      }
    });
  }

  private async processWRBTCEvent(log: any) {
    const txKey = `${log.transactionHash}-${log.logIndex}`;
    if (this.processedTxs.has(txKey)) return;
    this.processedTxs.add(txKey);

    try {
      const { args } = log;
      const userAddress = args.user.toLowerCase();
      const amount = Number(args.amount);
      
      // Determine event type
      const isWrap = log.topics[0] === '0x4700c1726b4198077cd40320a32c45265a1910521eb0ef713dd1d8412413d7fc';
      const txType = isWrap ? 'WRAP' : 'UNWRAP';

      const transaction: TransactionRecord = {
        tx_hash: log.transactionHash,
        block_number: Number(log.blockNumber),
        block_timestamp: new Date().toISOString(),
        user_address: userAddress,
        tx_type: txType,
        amount: amount.toString(),
        delta: isWrap ? amount.toString() : (-amount).toString(),
        status: 'confirmed'
      };

      await this.writeToSupabase(transaction);
      this.emit('newTransaction', transaction);

      console.log(`✅ Processed ${txType}: ${userAddress.slice(0,10)}... ${amount} tokens`);

    } catch (error) {
      console.error(`❌ Error processing wrBTC event:`, error);
    }
  }

  private monitorFeeVaultEvents() {
    this.wsClient.watchContractEvent({
      address: this.contracts.feeVault,
      abi: [
        {
          name: 'Deposited',
          type: 'event',
          inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        },
        {
          name: 'Withdrawn',
          type: 'event',
          inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        }
      ],
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.processFeeVaultEvent(log);
        }
      }
    });
  }

  private async processFeeVaultEvent(log: any) {
    const txKey = `${log.transactionHash}-${log.logIndex}`;
    if (this.processedTxs.has(txKey)) return;
    this.processedTxs.add(txKey);

    try {
      const { args } = log;
      const userAddress = args.user.toLowerCase();
      const amount = args.amount.toString();
      
      const isDeposit = log.topics[0] === '0x2da466a7b24304f47e87fa2e1e5a81b9831ce54fec19055ce277ca2f39ba42c4';
      const txType = isDeposit ? 'DEPOSIT' : 'WITHDRAW';

      const transaction: TransactionRecord = {
        tx_hash: log.transactionHash,
        block_number: Number(log.blockNumber),
        block_timestamp: new Date().toISOString(),
        user_address: userAddress,
        tx_type: txType,
        amount: amount,
        delta: isDeposit ? amount : `-${amount}`,
        status: 'confirmed'
      };

      await this.writeToSupabase(transaction);
      this.emit('newTransaction', transaction);

      console.log(`✅ Processed Fee ${txType}: ${userAddress.slice(0,10)}...`);

    } catch (error) {
      console.error(`❌ Error processing FeeVault event:`, error);
    }
  }

  // Public API methods
  async getUserData(userAddress: string) {
    try {
      // Read from Supabase (single source of truth)
      const response = await fetch(
        `${this.supabase.url}/rest/v1/transactions?user_address=eq.${userAddress.toLowerCase()}&order=block_timestamp.desc&limit=50`,
        {
          headers: {
            'apikey': this.supabase.key,
            'Authorization': `Bearer ${this.supabase.key}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const transactions = await response.json();

      // Calculate current balances from transactions
      let rbtcBalance = 0;
      let wrbtcBalance = 0;

      for (const tx of transactions) {
        if (tx.tx_type === 'MINT') rbtcBalance += parseInt(tx.amount);
        if (tx.tx_type === 'BURN') rbtcBalance -= parseInt(tx.amount);
        if (tx.tx_type === 'WRAP') {
          rbtcBalance -= parseInt(tx.amount);
          wrbtcBalance += parseInt(tx.amount);
        }
        if (tx.tx_type === 'UNWRAP') {
          rbtcBalance += parseInt(tx.amount);
          wrbtcBalance -= parseInt(tx.amount);
        }
      }

      return {
        user: {
          address: userAddress.toLowerCase(),
          rbtcBalance,
          wrbtcBalance,
          lastSats: rbtcBalance,
          lastUpdate: Date.now()
        },
        transactions
      };

    } catch (error) {
      console.error(`❌ Error getting user data:`, error);
      return { user: null, transactions: [] };
    }
  }

  subscribeToUser(userAddress: string, callback: (event: string, data: any) => void) {
    const balanceHandler = (data: any) => {
      if (data.userAddress === userAddress.toLowerCase()) {
        callback('balanceUpdate', data);
      }
    };

    const transactionHandler = (data: any) => {
      if (data.user_address === userAddress.toLowerCase()) {
        callback('newTransaction', data);
      }
    };

    this.on('balanceUpdate', balanceHandler);
    this.on('newTransaction', transactionHandler);

    return () => {
      this.off('balanceUpdate', balanceHandler);
      this.off('newTransaction', transactionHandler);
    };
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      processedTransactions: this.processedTxs.size,
      uptime: Date.now()
    };
  }
}

// Global instance
export const unifiedRealtimeSystem = new UnifiedRealtimeSystem();

// Export API
export const unifiedAPI = {
  getUserData: (address: string) => unifiedRealtimeSystem.getUserData(address),
  subscribeToUser: (address: string, callback: (event: string, data: any) => void) =>
    unifiedRealtimeSystem.subscribeToUser(address, callback),
  getStatus: () => unifiedRealtimeSystem.getStatus()
};