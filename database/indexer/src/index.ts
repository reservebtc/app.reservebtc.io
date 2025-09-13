// Event indexer for ReserveBTC protocol
import { ethers } from 'ethers';
import { Pool } from 'pg';
import * as cron from 'node-cron';

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'reservebtc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Contract ABIs (simplified)
const ORACLE_ABI = [
  'event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'
];

const RBTC_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Contract addresses
const CONTRACTS = {
  ORACLE: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC',
  VAULT_WRBTC: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87'
};

class EventIndexer {
  private provider: ethers.Provider;
  private contracts: Record<string, ethers.Contract>;
  private lastProcessedBlock: number = 0;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://carrot.megaeth.com/rpc'
    );

    // Initialize contracts
    this.contracts = {
      oracle: new ethers.Contract(CONTRACTS.ORACLE, ORACLE_ABI, this.provider),
      rbtc: new ethers.Contract(CONTRACTS.RBTC_SYNTH, RBTC_ABI, this.provider)
    };
  }

  async start() {
    console.log('Starting event indexer...');
    
    // Get last processed block from database
    const result = await db.query(
      'SELECT MAX(block_number) as last_block FROM transactions'
    );
    this.lastProcessedBlock = result.rows[0]?.last_block || 16500000; // Starting block
    
    // Start indexing
    await this.indexEvents();
    
    // Schedule periodic updates every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
      await this.indexEvents();
    });
  }

  async indexEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock <= this.lastProcessedBlock) {
        return; // No new blocks
      }

      console.log(`Indexing blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`);
      
      // Process in chunks to avoid RPC limits
      const chunkSize = 100;
      for (let fromBlock = this.lastProcessedBlock + 1; fromBlock <= currentBlock; fromBlock += chunkSize) {
        const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
        
        // Index Synced events from Oracle
        await this.indexSyncedEvents(fromBlock, toBlock);
        
        // Index Transfer events from RBTCSynth
        await this.indexTransferEvents(fromBlock, toBlock);
        
        // Update last processed block
        this.lastProcessedBlock = toBlock;
      }
      
    } catch (error) {
      console.error('Indexing error:', error);
    }
  }

  async indexSyncedEvents(fromBlock: number, toBlock: number) {
    const events = await this.contracts.oracle.queryFilter(
      'Synced',
      fromBlock,
      toBlock
    );

    for (const event of events) {
      const block = await event.getBlock();
      const receipt = await event.getTransactionReceipt();
      
      const data = {
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_timestamp: new Date(block.timestamp * 1000),
        user_address: (event as any).args!.user.toLowerCase(),
        tx_type: (event as any).args!.deltaSats > 0 ? 'MINT' : 'BURN',
        amount: (event as any).args!.newBalanceSats.toString(),
        delta: (event as any).args!.deltaSats.toString(),
        fee_wei: (event as any).args!.feeWei.toString(),
        gas_used: receipt.gasUsed.toString(),
        gas_price: receipt.gasPrice?.toString() || '0',
        metadata: {
          height: (event as any).args!.height,
          eventTimestamp: (event as any).args!.timestamp
        }
      };

      // Insert transaction
      await this.saveTransaction(data);
      
      // Update balance snapshot
      await this.updateBalanceSnapshot(
        data.user_address,
        data.block_number,
        block.timestamp
      );
    }
  }

  async indexTransferEvents(fromBlock: number, toBlock: number) {
    const events = await this.contracts.rbtc.queryFilter(
      'Transfer',
      fromBlock,
      toBlock
    );

    for (const event of events) {
      // Only process mints (from = 0x0) and burns (to = 0x0)
      const isMint = (event as any).args!.from === ethers.ZeroAddress;
      const isBurn = (event as any).args!.to === ethers.ZeroAddress;
      
      if (!isMint && !isBurn) continue;
      
      const block = await event.getBlock();
      
      const data = {
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_timestamp: new Date(block.timestamp * 1000),
        user_address: (isMint ? (event as any).args!.to : (event as any).args!.from).toLowerCase(),
        tx_type: isMint ? 'MINT' : 'BURN',
        amount: (event as any).args!.value.toString(),
        delta: isMint ? (event as any).args!.value.toString() : `-${(event as any).args!.value}`,
        fee_wei: '0',
        gas_used: 0,
        gas_price: '0'
      };

      await this.saveTransaction(data);
    }
  }

  async saveTransaction(data: any) {
    const query = `
      INSERT INTO transactions (
        tx_hash, block_number, block_timestamp, user_address,
        tx_type, amount, delta, fee_wei, gas_used, gas_price, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (tx_hash) DO NOTHING
    `;
    
    await db.query(query, [
      data.tx_hash,
      data.block_number,
      data.block_timestamp,
      data.user_address,
      data.tx_type,
      data.amount,
      data.delta,
      data.fee_wei,
      data.gas_used,
      data.gas_price,
      JSON.stringify(data.metadata || {})
    ]);
  }

  async updateBalanceSnapshot(userAddress: string, blockNumber: number, timestamp: number) {
    // Get current balances from contracts
    const [rbtcBalance, lastSats] = await Promise.all([
      this.contracts.rbtc.balanceOf(userAddress),
      this.contracts.oracle.lastSats(userAddress)
    ]);

    const query = `
      INSERT INTO balance_snapshots (
        user_address, block_number, rbtc_balance, 
        last_sats, snapshot_timestamp
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_address, block_number) 
      DO UPDATE SET 
        rbtc_balance = EXCLUDED.rbtc_balance,
        last_sats = EXCLUDED.last_sats
    `;

    await db.query(query, [
      userAddress,
      blockNumber,
      rbtcBalance.toString(),
      lastSats.toString(),
      new Date(timestamp * 1000)
    ]);
  }
}

// Start indexer
const indexer = new EventIndexer();
indexer.start().catch(console.error);