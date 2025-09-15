import { createPublicClient, http } from 'viem';
import { CONTRACTS } from '@/app/lib/contracts';
import { megaeth } from '@/lib/chains/megaeth';

// Create public client for blockchain interaction
const publicClient = createPublicClient({
  chain: megaeth,
  transport: http()
});

export async function syncBlockchainEvents() {
  console.log('🔄 Starting blockchain event sync...');
  
  // Watch for Synced events from Oracle
  const unwatch = publicClient.watchContractEvent({
    address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
    abi: [{
      type: 'event',
      name: 'Synced',
      inputs: [
        { name: 'user', type: 'address', indexed: true },
        { name: 'newBalanceSats', type: 'uint64' },
        { name: 'deltaSats', type: 'int64' },
        { name: 'feeWei', type: 'uint256' },
        { name: 'height', type: 'uint32' },
        { name: 'timestamp', type: 'uint64' }
      ]
    }],
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { user, newBalanceSats, deltaSats } = log.args as any;
        
        // Sync to Supabase
        try {
          await fetch('/api/sync-to-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: Number(deltaSats) > 0 ? 'MINT' : 'BURN',
              userAddress: user,
              transactionData: {
                tx_hash: log.transactionHash,
                block_number: Number(log.blockNumber),
                amount: newBalanceSats.toString(),
                delta: deltaSats.toString()
              }
            })
          });
          console.log(`✅ Synced ${Number(deltaSats) > 0 ? 'MINT' : 'BURN'} event for ${user}`);
        } catch (error) {
          console.error('❌ Failed to sync event to Supabase:', error);
        }
      }
    }
  });
  
  return unwatch;
}