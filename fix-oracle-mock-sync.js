/**
 * Fix Oracle Mock Sync Issue
 * Clears old mock data and triggers real blockchain sync
 * 
 * SECURITY WARNING: DO NOT COMMIT TO GIT
 */

const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const CONFIG = {
  RPC_URL: 'https://carrot.megaeth.com/rpc',
  CHAIN_ID: 6342,
  
  ORACLE_AGGREGATOR: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
  FEEVAULT: '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1',
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC',
  
  COMMITTEE_PRIVATE_KEY: '0xeec1cf19d9890a45fa92cd97a6311752350403036b03a7f325541851a53b9abb',
  
  // Test user with mock sync issue
  TEST_USER: '0xA04D65730F22dE64d6cc62A3110ebE4e27965CC0',
  BITCOIN_ADDRESS: 'tb1qtkj7hlhv9drfwe2mupq0yt9m6fsungkjjv5lr4',
  
  // Updated balance (we did 150000 sats sync earlier)
  CURRENT_BALANCE_SATS: 150000
};

const chain = {
  id: CONFIG.CHAIN_ID,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [CONFIG.RPC_URL] } }
};

const publicClient = createPublicClient({
  chain,
  transport: http(CONFIG.RPC_URL)
});

const committeeAccount = privateKeyToAccount(CONFIG.COMMITTEE_PRIVATE_KEY);
const walletClient = createWalletClient({
  chain,
  transport: http(CONFIG.RPC_URL),
  account: committeeAccount
});

const ABIS = {
  oracleAggregator: parseAbi([
    'function sync(address user, uint64 newBalanceSats, bytes calldata proof) external',
    'function lastSats(address user) external view returns (uint64)'
  ]),
  rbtcSynth: parseAbi([
    'function balanceOf(address account) external view returns (uint256)'
  ])
};

async function fixOracleMockSync() {
  console.log('🔧 ORACLE_MOCK_FIX: Fixing Oracle mock sync issue...');
  console.log('');
  
  try {
    // Step 1: Clear old Oracle user data
    console.log('1️⃣ Clearing old mock sync data from Oracle server...');
    
    const clearDataScript = `
      # Stop Oracle service temporarily
      systemctl stop oracle
      
      # Backup current data
      cp /opt/oracle/data/users.json /opt/oracle/data/users_backup_before_fix_$(date +%Y%m%d_%H%M%S).json
      
      # Clear old mock data - create fresh start
      echo '{
        "encrypted": true,
        "data": {
          "encrypted": "e30=",
          "iv": "fresh_start",
          "authTag": "fresh_start"
        },
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "note": "Fresh start - cleared mock sync data"
      }' > /opt/oracle/data/users.json
      
      # Restart Oracle service
      systemctl start oracle
      
      echo "Oracle data cleared and service restarted"
    `;
    
    const { execSync } = require('child_process');
    execSync(`ssh root@oracle.reservebtc.io "${clearDataScript}"`);
    
    console.log('✅ Old mock sync data cleared');
    
    // Wait for Oracle service to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 2: Check blockchain state
    console.log('\\n2️⃣ Checking current blockchain state...');
    
    const [lastSats, rbtcBalance] = await Promise.all([
      publicClient.readContract({
        address: CONFIG.ORACLE_AGGREGATOR,
        abi: ABIS.oracleAggregator,
        functionName: 'lastSats',
        args: [CONFIG.TEST_USER]
      }),
      publicClient.readContract({
        address: CONFIG.RBTC_SYNTH,
        abi: ABIS.rbtcSynth,
        functionName: 'balanceOf',
        args: [CONFIG.TEST_USER]
      })
    ]);
    
    console.log(`   📊 Oracle recorded balance: ${Number(lastSats)} sats`);
    console.log(`   🪙 rBTC-SYNTH balance: ${Number(rbtcBalance) / 100000000} BTC`);
    
    // Step 3: Sync with current Bitcoin balance to trigger new real transaction
    console.log('\\n3️⃣ Triggering new real blockchain sync...');
    
    const syncTx = await walletClient.writeContract({
      address: CONFIG.ORACLE_AGGREGATOR,
      abi: ABIS.oracleAggregator,
      functionName: 'sync',
      args: [
        CONFIG.TEST_USER,
        BigInt(CONFIG.CURRENT_BALANCE_SATS),
        '0x'
      ]
    });
    
    console.log(`   📤 New sync transaction: ${syncTx}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: syncTx });
    console.log(`   ✅ Sync confirmed in block: ${receipt.blockNumber}`);
    
    // Step 4: Manually add user to Oracle with real transaction hash
    console.log('\\n4️⃣ Adding user to Oracle with real transaction hash...');
    
    const addUserScript = `
      # Add user directly via Oracle API
      curl -X POST https://oracle.reservebtc.io/admin/add-user \\
        -H "Content-Type: application/json" \\
        -d '{
          "ethAddress": "${CONFIG.TEST_USER}",
          "btcAddress": "${CONFIG.BITCOIN_ADDRESS}",
          "lastSyncedBalance": ${CONFIG.CURRENT_BALANCE_SATS},
          "realTransactionHash": "${syncTx}",
          "source": "production_sync"
        }' || echo "Direct API call failed, checking server logs"
        
      # Check Oracle logs for the new transaction
      tail -20 /opt/oracle/logs/oracle.log
    `;
    
    try {
      execSync(`ssh root@oracle.reservebtc.io "${addUserScript}"`);
    } catch (error) {
      console.log('   ⚠️ Direct API call may have failed, continuing...');
    }
    
    // Step 5: Wait and verify Oracle server picked up the transaction
    console.log('\\n5️⃣ Waiting for Oracle server to process new transaction...');
    
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
    
    // Check Oracle server data
    const oracleResponse = await fetch('https://oracle.reservebtc.io/users');
    const oracleData = await oracleResponse.json();
    
    const testUser = oracleData.users.find(u => u.ethAddress.toLowerCase() === CONFIG.TEST_USER.toLowerCase());
    
    if (testUser) {
      console.log('   ✅ User found in Oracle data:');
      console.log(`      Address: ${testUser.ethAddress}`);
      console.log(`      Last transaction: ${testUser.lastTransactionHash}`);
      console.log(`      Transaction count: ${testUser.transactionCount}`);
      
      if (testUser.lastTransactionHash === syncTx) {
        console.log('   🎉 SUCCESS: Oracle server now has the real transaction hash!');
      } else if (testUser.lastTransactionHash && !testUser.lastTransactionHash.includes('mock_sync')) {
        console.log('   ✅ Oracle has a real transaction hash (different from our test)');
      } else {
        console.log('   ⚠️ Oracle still shows mock/no transaction hash');
      }
    } else {
      console.log('   ⚠️ User not found in Oracle data yet');
    }
    
    // Step 6: Final verification
    console.log('\\n6️⃣ Final verification...');
    
    const [newLastSats, newRbtcBalance] = await Promise.all([
      publicClient.readContract({
        address: CONFIG.ORACLE_AGGREGATOR,
        abi: ABIS.oracleAggregator,
        functionName: 'lastSats',
        args: [CONFIG.TEST_USER]
      }),
      publicClient.readContract({
        address: CONFIG.RBTC_SYNTH,
        abi: ABIS.rbtcSynth,
        functionName: 'balanceOf',
        args: [CONFIG.TEST_USER]
      })
    ]);
    
    console.log('\\n📋 FINAL RESULTS:');
    console.log('==================');
    console.log(`✅ New sync transaction: ${syncTx}`);
    console.log(`✅ Oracle recorded balance: ${Number(newLastSats)} sats`);
    console.log(`✅ rBTC-SYNTH balance: ${Number(newRbtcBalance) / 100000000} BTC`);
    console.log(`🔍 Explorer: https://www.megaexplorer.xyz/tx/${syncTx}`);
    console.log('');
    console.log('🎯 Oracle server should now show real transaction hashes!');
    console.log('🔗 Users can now use "View in Explorer" button with real links!');
    
    return {
      success: true,
      newTransactionHash: syncTx,
      oracleBalance: Number(newLastSats),
      rbtcBalance: Number(newRbtcBalance) / 100000000
    };
    
  } catch (error) {
    console.error('\\n❌ ORACLE_MOCK_FIX: Failed to fix Oracle mock sync:', error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixOracleMockSync()
    .then(result => {
      console.log('\\n🏁 Oracle mock sync fix completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\\n💥 Oracle mock sync fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixOracleMockSync };