const { createPublicClient, http } = require('viem');

const CONTRACTS = {
  ORACLE_AGGREGATOR: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC'
};

const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  network: 'megaeth-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  },
};

const client = createPublicClient({
  chain: megaeth,
  transport: http('https://carrot.megaeth.com/rpc')
});

async function checkStatus() {
  const userAddress = '0xd98e8199d4d7e74c97b488efd0176428952fab9d';
  
  try {
    const lastSats = await client.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{
        name: 'lastSats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint64' }]
      }],
      functionName: 'lastSats',
      args: [userAddress]
    });
    
    const rbtcBalance = await client.readContract({
      address: CONTRACTS.RBTC_SYNTH,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'balanceOf',
      args: [userAddress]
    });
    
    console.log('🔍 Oracle Status Check:');
    console.log(`   User: ${userAddress}`);
    console.log(`   Last Sats in Oracle: ${lastSats} (${Number(lastSats) / 1e8} BTC)`);
    console.log(`   rBTC Balance: ${rbtcBalance} (${Number(rbtcBalance) / 1e8} BTC)`);
    console.log(`   Status: ${Number(lastSats) === Number(rbtcBalance) ? '✅ Synced' : '⚠️ Out of sync'}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatus();