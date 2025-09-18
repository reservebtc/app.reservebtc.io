// app/api/cron/indexer/route.ts
// Updated indexer to work with unified real-time system

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';

const MEGAETH_RPC = 'https://carrot.megaeth.com/rpc';
const SUPABASE_URL = 'https://qoudozwmecstoxrqopqf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdWRvendtZWNzdG94cnFvcHFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTUxOTc1OCwiZXhwIjoyMDU3MDk1NzU4fQ.WXjRfrYXnJZZguYc8thlGbdIfUG2z6Ws06UbPg8AIrQ';

const client = createPublicClient({
  transport: http(MEGAETH_RPC),
});

// Contract addresses and event signatures
const ORACLE_CONTRACT = '0x74E64267a4d19357dd03A0178b5edEC79936c643' as `0x${string}`;

// Only process historical data that unified system might have missed
async function processHistoricalData() {
  try {
    console.log('📊 CRON: Checking for missed historical data...');
    
    // Get the latest processed block from Supabase
    const latestResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?order=block_number.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const latestRecords = await latestResponse.json();
    const latestProcessedBlock = Array.isArray(latestRecords) && latestRecords.length > 0 
      ? BigInt(latestRecords[0].block_number)
      : BigInt(16500000); // Start block
    
    const currentBlock = await client.getBlockNumber();
    const scanFromBlock = latestProcessedBlock + BigInt(1);
    
    // Only scan if there's a significant gap (more than 100 blocks)
    if (currentBlock - scanFromBlock < BigInt(100)) {
      console.log('📊 CRON: No historical gap detected, skipping');
      return { processed: 0, message: 'No historical gap' };
    }
    
    console.log(`📊 CRON: Scanning historical gap from ${scanFromBlock} to ${currentBlock}`);
    
    // Scan for missed Oracle events in batches
    const batchSize = BigInt(1000);
    let totalProcessed = 0;
    
    for (let fromBlock = scanFromBlock; fromBlock < currentBlock; fromBlock += batchSize) {
      const toBlock = fromBlock + batchSize - BigInt(1) > currentBlock ? currentBlock : fromBlock + batchSize - BigInt(1);
      
      const logs = await client.getLogs({
        address: ORACLE_CONTRACT,
        fromBlock,
        toBlock
      });
      
      // Process missed events
      for (const log of logs) {
        // Filter for Synced events only
        if (log.topics[0] !== '0xbd74477ace0e09075451becb82bdae1c9a11698b13f8488ab67f55722444eb84') {
          continue;
        }
        
        // Check if already processed
        const existingResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/transactions?tx_hash=eq.${log.transactionHash}&select=tx_hash`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        
        const existing = await existingResponse.json();
        if (Array.isArray(existing) && existing.length > 0) continue; // Already processed
        
        // Process missed transaction
        if ('args' in log && log.args) {
          const args = log.args as any;
          const userAddress = (args.user as string).toLowerCase();
          const deltaSats = Number(args.deltaSats);
          
          const transaction = {
            tx_hash: log.transactionHash,
            block_number: Number(log.blockNumber),
            block_timestamp: new Date().toISOString(),
            user_address: userAddress,
            tx_type: deltaSats > 0 ? 'MINT' : 'BURN',
            amount: Math.abs(deltaSats).toString(),
            delta: deltaSats.toString(),
            fee_wei: args.feeWei?.toString() || '0',
            status: 'confirmed',
            indexed_by: 'cron_historical'
          };
          
          // Write missed transaction
          const writeResponse = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(transaction)
          });
          
          if (writeResponse.ok) {
            totalProcessed++;
            console.log(`📊 CRON: Processed missed tx ${log.transactionHash.slice(0,10)}...`);
          }
        }
      }
    }
    
    return { 
      processed: totalProcessed, 
      message: `Processed ${totalProcessed} missed historical transactions` 
    };
    
  } catch (error) {
    console.error('❌ CRON: Historical processing error:', error);
    throw error;
  }
}

// Health check and cleanup
async function performMaintenance() {
  try {
    console.log('🔧 CRON: Performing maintenance tasks...');
    
    // Clean up old test transactions
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/transactions?tx_type=eq.TEST`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    // Update any pending transactions older than 1 hour to failed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/transactions?status=eq.pending&block_timestamp=lt.${oneHourAgo}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'failed' })
    });
    
    console.log('✅ CRON: Maintenance completed');
    return { 
      maintenance: 'completed',
      deletedTests: deleteResponse.ok,
      updatedPending: updateResponse.ok
    };
    
  } catch (error) {
    console.error('❌ CRON: Maintenance error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('⏰ CRON: Starting compatible indexer job...');
    
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Run tasks
    const [historicalResult, maintenanceResult] = await Promise.all([
      processHistoricalData(),
      performMaintenance()
    ]);
    
    const result = {
      timestamp: new Date().toISOString(),
      historical: historicalResult,
      maintenance: maintenanceResult,
      status: 'success',
      note: 'Real-time processing handled by unified system'
    };
    
    console.log('✅ CRON: Compatible indexer completed', result);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ CRON: Job failed:', error);
    return NextResponse.json(
      { error: 'Indexer job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}