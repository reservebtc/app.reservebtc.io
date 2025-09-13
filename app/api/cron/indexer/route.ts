// app/api/cron/indexer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/app/lib/contracts';

export const maxDuration = 10;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for server-side
);

// Contract ABIs for event parsing
const ORACLE_ABI = [
  'event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)',
  'event NeedsTopUp(address indexed user)'
];

const RBTC_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const FEE_VAULT_ABI = [
  'event Deposited(address indexed user, uint256 amount)',
  'event Spent(address indexed user, uint256 amount, address indexed spender)',
  'event Withdrawn(address indexed user, uint256 amount)'
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 INDEXER: Starting blockchain indexing...');
    
    // Verify cron authenticity (optional)
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel') || 
                        process.env.VERCEL === '1';
    
    if (!isVercelCron && cronSecret) {
      const url = new URL(request.url);
      const secret = url.searchParams.get('secret');
      if (secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://carrot.megaeth.com/rpc'
    );
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 INDEXER: Current block: ${currentBlock}`);
    
    // Get last indexed block from transactions table
    const { data: lastBlockData, error: dbError } = await supabase
      .from('transactions')
      .select('block_number')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ INDEXER: Database error:', dbError);
    }
    
    const lastIndexedBlock = lastBlockData?.block_number || 16500000; // Default start block
    console.log(`📊 INDEXER: Last indexed block: ${lastIndexedBlock}`);
    
    // Don't index if we're already up to date
    if (lastIndexedBlock >= currentBlock) {
      console.log('✅ INDEXER: Already up to date');
      return NextResponse.json({ 
        message: 'Already up to date',
        currentBlock,
        lastIndexedBlock,
        duration: Date.now() - startTime
      });
    }
    
    // Limit blocks per run to avoid timeout
    const MAX_BLOCKS = 100;
    const toBlock = Math.min(lastIndexedBlock + MAX_BLOCKS, currentBlock);
    
    console.log(`🔄 INDEXER: Indexing blocks ${lastIndexedBlock + 1} to ${toBlock}`);
    
    // Create contract instances
    const oracleContract = new ethers.Contract(
      CONTRACTS.ORACLE_AGGREGATOR,
      ORACLE_ABI,
      provider
    );
    
    const rbtcContract = new ethers.Contract(
      CONTRACTS.RBTC_SYNTH,
      RBTC_ABI,
      provider
    );
    
    const feeVaultContract = new ethers.Contract(
      CONTRACTS.FEE_VAULT,
      FEE_VAULT_ABI,
      provider
    );
    
    // Arrays to store data for batch insert
    const transactions: any[] = [];
    const balanceSnapshots: any[] = [];
    const usersToAdd = new Set<string>();
    
    // Fetch Oracle Synced events
    const syncedEvents = await oracleContract.queryFilter(
      oracleContract.filters.Synced(),
      lastIndexedBlock + 1,
      toBlock
    );
    
    console.log(`📊 INDEXER: Found ${syncedEvents.length} Synced events`);
    
    for (const event of syncedEvents) {
      const block = await provider.getBlock(event.blockNumber);
      const userAddress = (event as any).args![0].toLowerCase();
      
      usersToAdd.add(userAddress);
      
      // Add transaction record
      transactions.push({
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_timestamp: new Date(block!.timestamp * 1000).toISOString(),
        user_address: userAddress,
        tx_type: (event as any).args![2] > 0 ? 'MINT' : 'BURN',
        amount: (event as any).args![1].toString(),
        delta: (event as any).args![2].toString(),
        fee_wei: (event as any).args![3].toString(),
        status: 'confirmed',
        metadata: {
          height: (event as any).args![4],
          oracleTimestamp: (event as any).args![5]
        }
      });
      
      // Add balance snapshot
      balanceSnapshots.push({
        user_address: userAddress,
        block_number: event.blockNumber,
        last_sats: (event as any).args![1].toString(),
        rbtc_balance: (event as any).args![1].toString(),
        snapshot_timestamp: new Date(block!.timestamp * 1000).toISOString()
      });
    }
    
    // Fetch FeeVault Deposited events
    const depositEvents = await feeVaultContract.queryFilter(
      feeVaultContract.filters.Deposited(),
      lastIndexedBlock + 1,
      toBlock
    );
    
    console.log(`📊 INDEXER: Found ${depositEvents.length} Deposit events`);
    
    for (const event of depositEvents) {
      const block = await provider.getBlock(event.blockNumber);
      const userAddress = (event as any).args![0].toLowerCase();
      
      usersToAdd.add(userAddress);
      
      transactions.push({
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_timestamp: new Date(block!.timestamp * 1000).toISOString(),
        user_address: userAddress,
        tx_type: 'DEPOSIT',
        amount: (event as any).args![1].toString(),
        status: 'confirmed'
      });
    }
    
    // Fetch FeeVault Spent events
    const spentEvents = await feeVaultContract.queryFilter(
      feeVaultContract.filters.Spent(),
      lastIndexedBlock + 1,
      toBlock
    );
    
    console.log(`📊 INDEXER: Found ${spentEvents.length} Spent events`);
    
    for (const event of spentEvents) {
      const block = await provider.getBlock(event.blockNumber);
      const userAddress = (event as any).args![0].toLowerCase();
      
      usersToAdd.add(userAddress);
      
      transactions.push({
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_timestamp: new Date(block!.timestamp * 1000).toISOString(),
        user_address: userAddress,
        tx_type: 'FEE_SPENT',
        amount: (event as any).args![1].toString(),
        status: 'confirmed',
        metadata: {
          spender: (event as any).args![2]
        }
      });
    }
    
    // Insert new users
    if (usersToAdd.size > 0) {
      const userRecords = Array.from(usersToAdd).map(address => ({
        eth_address: address
      }));
      
      const { error: userError } = await supabase
        .from('users')
        .upsert(userRecords, { onConflict: 'eth_address' });
      
      if (userError) {
        console.error('❌ INDEXER: Failed to insert users:', userError);
      } else {
        console.log(`✅ INDEXER: Upserted ${userRecords.length} users`);
      }
    }
    
    // Insert transactions
    if (transactions.length > 0) {
      const { error: txError } = await supabase
        .from('transactions')
        .upsert(transactions, { onConflict: 'tx_hash' });
      
      if (txError) {
        console.error('❌ INDEXER: Failed to insert transactions:', txError);
      } else {
        console.log(`✅ INDEXER: Inserted ${transactions.length} transactions`);
      }
    }
    
    // Insert balance snapshots
    if (balanceSnapshots.length > 0) {
      const { error: snapshotError } = await supabase
        .from('balance_snapshots')
        .upsert(balanceSnapshots, { 
          onConflict: 'user_address,block_number',
          ignoreDuplicates: true 
        });
      
      if (snapshotError) {
        console.error('❌ INDEXER: Failed to insert snapshots:', snapshotError);
      } else {
        console.log(`✅ INDEXER: Inserted ${balanceSnapshots.length} balance snapshots`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ INDEXER: Completed in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true,
      indexed: `Blocks ${lastIndexedBlock + 1} to ${toBlock}`,
      stats: {
        transactions: transactions.length,
        snapshots: balanceSnapshots.length,
        users: usersToAdd.size,
        depositEvents: depositEvents.length,
        spentEvents: spentEvents.length,
        syncedEvents: syncedEvents.length
      },
      currentBlock,
      duration
    });
    
  } catch (error) {
    console.error('❌ INDEXER: Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}