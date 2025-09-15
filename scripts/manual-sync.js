const fetch = require('node-fetch');

async function manualSync() {
  const userAddress = '0xd98e8199d4d7e74c97b488efd0176428952fab9d';
  const bitcoinAddress = 'tb1quvw6tuxy2japdjcjraptlqs6fz728n7ztn5q4v';
  
  // Get current Bitcoin balance from mempool
  const response = await fetch(`https://mempool.space/testnet/api/address/${bitcoinAddress}`);
  const data = await response.json();
  
  const currentBalance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  
  console.log('📊 Current Bitcoin balance:', currentBalance, 'sats');
  console.log('   That is:', currentBalance / 1e8, 'BTC');
  
  // Call Oracle to sync
  const syncResponse = await fetch('https://app.reservebtc.io/api/oracle/manual-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress,
      bitcoinAddress,
      newBalance: currentBalance
    })
  });
  
  const result = await syncResponse.json();
  console.log('🔄 Sync result:', result);
}

manualSync();