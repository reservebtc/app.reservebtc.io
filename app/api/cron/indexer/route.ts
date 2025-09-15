import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Важно: НЕ импортируем CONTRACTS на уровне модуля
const CONTRACTS = {
  ORACLE_AGGREGATOR: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC',
  FEE_VAULT: '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1'
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 INDEXER: Started at', new Date().toISOString());
  
  try {
    // Получаем переменные окружения внутри функции
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing env:', { url: !!supabaseUrl, key: !!supabaseKey });
      return NextResponse.json({
        success: false,
        error: 'Missing configuration'
      }, { status: 503 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const provider = new ethers.JsonRpcProvider('https://carrot.megaeth.com/rpc');
    
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Current block: ${currentBlock}`);
    
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
    
    const oracleContract = new ethers.Contract(
      CONTRACTS.ORACLE_AGGREGATOR,
      ['event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'],
      provider
    );
    
    const transactions: any[] = [];
    const usersToAdd = new Set<string>();
    
    const syncedEvents = await oracleContract.queryFilter(
      oracleContract.filters.Synced(),
      fromBlock,
      toBlock
    );
    
    console.log(`Found ${syncedEvents.length} Synced events`);
    
    for (const event of syncedEvents) {
      const block = await provider.getBlock(event.blockNumber);
      if (!block) continue;
      
      const eventWithArgs = event as ethers.EventLog;
      if (!eventWithArgs.args) continue;
      
      const userAddr = eventWithArgs.args[0].toLowerCase();
      const newBalance = eventWithArgs.args[1];
      const delta = eventWithArgs.args[2];
      
      usersToAdd.add(userAddr);
      
      let txType = 'SYNC';
      const deltaNum = Number(delta);
      if (deltaNum > 0) txType = 'MINT';
      else if (deltaNum < 0) txType = 'BURN';
      
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
        status: 'confirmed'
      });
    }
    
    if (usersToAdd.size > 0) {
      const users = Array.from(usersToAdd).map(addr => ({ eth_address: addr }));
      await supabase.from('users').upsert(users, { onConflict: 'eth_address' });
      console.log(`Added ${users.length} users`);
    }
    
    if (transactions.length > 0) {
      await supabase.from('transactions').upsert(transactions, { onConflict: 'tx_hash' });
      console.log(`Added ${transactions.length} transactions`);
    }
    
    return NextResponse.json({ 
      success: true,
      indexed: `${fromBlock}-${toBlock}`,
      transactions: transactions.length,
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