// Event indexer for ReserveBTC protocol
import { ethers } from 'ethers';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/reservebtc'
});

// Contract ABIs
const ORACLE_ABI = [
  'event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'
];

const RBTC_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Contract addresses
const CONTRACTS = {
  ORACLE: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC'
};

class EventIndexer {
  private provider: ethers.Provider;
  private contracts: Record<string, ethers.Contract>;
  private lastProcessedBlock: number = 0;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://carrot.megaeth.com/rpc'
    );

    this.contracts = {
      oracle: new ethers.Contract(CONTRACTS.ORACLE, ORACLE_ABI, this.provider),
      rbtc: new ethers.Contract(CONTRACTS.RBTC_SYNTH, RBTC_ABI, this.provider)
    };
  }

  async start() {
    console.log('Starting event indexer...');
    
    try {
      // Test database connection
      await db.query('SELECT NOW()');
      console.log('Database connected successfully');
      
      // Get last processed block
      const result = await db.query(
        'SELECT MAX(block_number) as last_block FROM transactions'
      );
      this.lastProcessedBlock = result.rows[0]?.last_block || 16500000;
      console.log('Starting from block:', this.lastProcessedBlock);
      
      // Start indexing
      await this.indexEvents();
      
      // Schedule periodic updates
      cron.schedule('*/10 * * * * *', async () => {
        await this.indexEvents();
      });
      
    } catch (error) {
      console.error('Failed to start indexer:', error);
      process.exit(1);
    }
  }

  async indexEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock <= this.lastProcessedBlock) {
        return;
      }

      console.log(`Indexing blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`);
      
      const chunkSize = 100;
      for (let fromBlock = this.lastProcessedBlock + 1; fromBlock <= currentBlock; fromBlock += chunkSize) {
        const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
        
        await this.indexSyncedEvents(fromBlock, toBlock);
        await this.indexTransferEvents(fromBlock, toBlock);
        
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
      try {
        const block = await event.getBlock();
        const receipt = await event.getTransactionReceipt();
        const args = (event as any).args;
        
        const data = {
          tx_hash: event.transactionHash,
          block_number: event.blockNumber,
          block_timestamp: new Date(block.timestamp * 1000),
          user_address: args.user.toLowerCase(),
          tx_type: args.deltaSats > 0 ? 'MINT' : 'BURN',
          amount: args.newBalanceSats.toString(),
          delta: args.deltaSats.toString(),
          fee_wei: args.feeWei.toString(),
          gas_used: receipt.gasUsed.toString(),
          gas_price: receipt.gasPrice?.toString() || '0'
        };

        await this.saveTransaction(data);
      } catch (error) {
        console.error('Error processing event:', error);
      }
    }
  }

  async indexTransferEvents(fromBlock: number, toBlock: number) {
    const events = await this.contracts.rbtc.queryFilter(
      'Transfer',
      fromBlock,
      toBlock
    );

    for (const event of events) {
      try {
        const args = (event as any).args;
        const isMint = args.from === ethers.ZeroAddress;
        const isBurn = args.to === ethers.ZeroAddress;
        
        if (!isMint && !isBurn) continue;
        
        const block = await event.getBlock();
        
        const data = {
          tx_hash: event.transactionHash,
          block_number: event.blockNumber,
          block_timestamp: new Date(block.timestamp * 1000),
          user_address: (isMint ? args.to : args.from).toLowerCase(),
          tx_type: isMint ? 'MINT' : 'BURN',
          amount: args.value.toString(),
          delta: isMint ? args.value.toString() : `-${args.value}`,
          fee_wei: '0',
          gas_used: 0,
          gas_price: '0'
        };

        await this.saveTransaction(data);
      } catch (error) {
        console.error('Error processing transfer:', error);
      }
    }
  }

  async saveTransaction(data: any) {
    const query = `
      INSERT INTO transactions (
        tx_hash, block_number, block_timestamp, user_address,
        tx_type, amount, delta, fee_wei, gas_used, gas_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (tx_hash) DO NOTHING
    `;
    
    try {
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
        data.gas_price
      ]);
      console.log(`Saved transaction: ${data.tx_hash.slice(0, 10)}... (${data.tx_type})`);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }
}

// Start indexer
const indexer = new EventIndexer();
indexer.start().catch(console.error);