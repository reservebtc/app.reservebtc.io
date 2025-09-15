// app/api/cron/indexer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/app/lib/contracts';

// Lazy initialization для Supabase
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 INDEXER: Started at', new Date().toISOString());
  
  try {
    // Initialize Supabase with lazy loading
    const supabase = getSupabaseClient();
    const provider = new ethers.JsonRpcProvider('https://carrot.megaeth.com/rpc');
    
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Current block: ${currentBlock}`);
    
    // Get last indexed block
    const { data: lastBlockData } = await supabase
      .from('transactions')
      .select('block_number')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();
    
    const lastIndexedBlock = lastBlockData?.block_number || (currentBlock - 500);
    
    if (lastIndexedBlock >= currentBlock) {
      return NextResponse.json({ 
        success: true,
        message: 'Already up to date',
        currentBlock,
        lastIndexedBlock
      });
    }
    
    const fromBlock = lastIndexedBlock + 1;
    const toBlock = Math.min(fromBlock + 49, currentBlock);
    
    console.log(`🔄 Indexing blocks ${fromBlock} to ${toBlock}`);
    
    // Create Oracle contract
    const oracleContract = new ethers.Contract(
      CONTRACTS.ORACLE_AGGREGATOR,
      ['event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'],
      provider
    );
    
    const transactions: any[] = [];
    const usersToAdd = new Set<string>();
    
    // Fetch Synced events
    const syncedEvents = await oracleContract.queryFilter(
      oracleContract.filters.Synced(),
      fromBlock,
      toBlock
    );
    
    console.log(`Found ${syncedEvents.length} Synced events`);
    
    for (const event of syncedEvents) {
      const block = await provider.getBlock(event.blockNumber);
      if (!block) continue;
      
      // Правильная типизация для ethers v6
      const eventWithArgs = event as ethers.EventLog;
      if (!eventWithArgs.args) continue;
      
      const userAddr = eventWithArgs.args[0].toLowerCase();
      const newBalance = eventWithArgs.args[1];
      const delta = eventWithArgs.args[2];
      
      usersToAdd.add(userAddr);
      
      // Determine transaction type
      let txType = 'SYNC';
      const deltaNum = Number(delta);
      if (deltaNum > 0) {
        txType = 'MINT';
      } else if (deltaNum < 0) {
        txType = 'BURN';
      }
      
      console.log(`${txType}: ${userAddr.slice(0,10)}... delta=${deltaNum}`);
      
      transactions.push({
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_timestamp: new Date(block.timestamp * 1000).toISOString(),
        user_address: userAddr,
        tx_type: txType,
        amount: Math.abs(deltaNum).toString(),
        delta: deltaNum.toString(),
        fee_wei: eventWithArgs.args[3]?.toString() || '0',
        status: 'confirmed',
        metadata: {
          newBalanceSats: newBalance.toString(),
          height: eventWithArgs.args[4]?.toString() || '0',
          oracleTimestamp: eventWithArgs.args[5]?.toString() || block.timestamp.toString()
        }
      });
    }
    
    // Insert users
    if (usersToAdd.size > 0) {
      const users = Array.from(usersToAdd).map(addr => ({ eth_address: addr }));
      await supabase.from('users').upsert(users, { onConflict: 'eth_address' });
      console.log(`Added ${users.length} users`);
    }
    
    // Insert transactions
    if (transactions.length > 0) {
      await supabase.from('transactions').upsert(transactions, { onConflict: 'tx_hash' });
      console.log(`Added ${transactions.length} transactions`);
      
      const types = transactions.reduce((acc, tx) => {
        acc[tx.tx_type] = (acc[tx.tx_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Transaction types:', types);
    }
    
    // Insert balance snapshots
    const balanceSnapshots = transactions
      .filter(tx => tx.tx_type === 'MINT' || tx.tx_type === 'BURN')
      .map(tx => ({
        user_address: tx.user_address,
        block_number: tx.block_number,
        last_sats: tx.metadata?.newBalanceSats || '0',
        rbtc_balance: tx.metadata?.newBalanceSats || '0',
        snapshot_timestamp: tx.block_timestamp
      }));
    
    if (balanceSnapshots.length > 0) {
      await supabase.from('balance_snapshots').upsert(balanceSnapshots, {
        onConflict: 'user_address,block_number',
        ignoreDuplicates: true
      });
      console.log(`Added ${balanceSnapshots.length} balance snapshots`);
    }
    
    return NextResponse.json({ 
      success: true,
      indexed: `${fromBlock}-${toBlock}`,
      transactions: transactions.length,
      snapshots: balanceSnapshots.length,
      users: usersToAdd.size,
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}