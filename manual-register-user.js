// Manual user registration via committee (simulates Oracle server behavior)
// This script will register the user and mint tokens using committee powers

const { createPublicClient, createWalletClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// User to register
const USER_ADDRESS = '0x44dB868F99a42A5ABC7A1492E64db9bCFb946b09';
const USER_BTC_ADDRESS = 'tb1q47a3eq5fm4pdhczm33qkd3u7rqlkhwlwmykdnhq5mdgr9xvwu09s44004';

// Committee credentials (we need the committee private key to act as Oracle)
const COMMITTEE_PRIVATE_KEY = '0xeec1cf19d9890a45fa92cd97a6311752350403036b03a7f325541851a53b9abb'; // This is the committee key
const COMMITTEE_ADDRESS = '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b';

// Contract addresses
const CONTRACTS = {
  ORACLE_AGGREGATOR: '0x74E64267a4d19357dd03A0178b5edEC79936c643',
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC',
  FEE_VAULT: '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1'
};

const chain = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } }
};

async function manualRegisterUser() {
  console.log('🔧 Manual User Registration via Committee...');
  console.log(`👤 User to register: ${USER_ADDRESS}`);
  console.log(`₿ Bitcoin address: ${USER_BTC_ADDRESS}`);
  console.log(`👥 Acting as committee: ${COMMITTEE_ADDRESS}`);
  
  // Setup committee client
  const committeeAccount = privateKeyToAccount(COMMITTEE_PRIVATE_KEY);
  const publicClient = createPublicClient({
    transport: http(chain.rpcUrls.default.http[0]),
    chain
  });
  const committeeWalletClient = createWalletClient({
    account: committeeAccount,
    transport: http(chain.rpcUrls.default.http[0]),
    chain
  });
  
  console.log(`✅ Committee account: ${committeeAccount.address}`);
  console.log(`🔍 Committee matches expected: ${committeeAccount.address.toLowerCase() === COMMITTEE_ADDRESS.toLowerCase()}`);
  
  try {
    // Step 1: Verify committee has enough ETH
    const committeeEthBalance = await publicClient.getBalance({ address: COMMITTEE_ADDRESS });
    console.log(`💰 Committee ETH: ${Number(committeeEthBalance) / 1e18} ETH`);
    
    if (committeeEthBalance < parseEther('0.01')) {
      throw new Error('Committee has insufficient ETH for gas');
    }
    
    // Step 2: Verify user has FeeVault balance
    const userFeeVaultBalance = await publicClient.readContract({
      address: CONTRACTS.FEE_VAULT,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
      functionName: 'balanceOf',
      args: [USER_ADDRESS]
    });
    
    const feeVaultEth = Number(userFeeVaultBalance) / 1e18;
    console.log(`🏦 User FeeVault: ${feeVaultEth} ETH`);
    
    if (feeVaultEth < 0.01) {
      throw new Error('User has insufficient FeeVault balance');
    }
    
    // Step 3: Check current Oracle status
    const initialLastSats = await publicClient.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{ name: 'lastSats', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint64' }] }],
      functionName: 'lastSats',
      args: [USER_ADDRESS]
    });
    
    console.log(`₿ Initial Oracle LastSats: ${initialLastSats}`);
    
    const initialRbtcBalance = await publicClient.readContract({
      address: CONTRACTS.RBTC_SYNTH,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
      functionName: 'balanceOf',
      args: [USER_ADDRESS]
    });
    
    console.log(`🪙 Initial rBTC Balance: ${initialRbtcBalance.toString()} sats`);
    
    // Step 4: Get Bitcoin balance
    console.log('🌐 Fetching Bitcoin balance...');
    const bitcoinResponse = await fetch(`https://blockstream.info/testnet/api/address/${USER_BTC_ADDRESS}`);
    if (!bitcoinResponse.ok) {
      throw new Error(`Bitcoin API failed: ${bitcoinResponse.status}`);
    }
    
    const bitcoinData = await bitcoinResponse.json();
    const balanceInSats = bitcoinData.chain_stats?.funded_txo_sum || 0;
    const spentInSats = bitcoinData.chain_stats?.spent_txo_sum || 0;
    const currentBalanceInSats = balanceInSats - spentInSats;
    
    console.log(`₿ Bitcoin Balance: ${currentBalanceInSats} sats`);
    
    if (currentBalanceInSats <= 0) {
      throw new Error('No Bitcoin balance found');
    }
    
    // Step 5: Register user if not already registered
    if (initialLastSats === 0n) {
      console.log('📞 Step 5a: Calling registerAndPrepay...');
      
      const checksum = '0x' + Buffer.from(`${USER_ADDRESS}_${USER_BTC_ADDRESS}_${currentBalanceInSats}`).toString('hex').substring(0, 64).padEnd(64, '0');
      
      const registerTx = await committeeWalletClient.writeContract({
        address: CONTRACTS.ORACLE_AGGREGATOR,
        abi: [{
          name: 'registerAndPrepay',
          type: 'function',
          stateMutability: 'payable',
          inputs: [
            { name: 'user', type: 'address' },
            { name: 'method', type: 'uint8' },
            { name: 'checksum', type: 'bytes32' }
          ]
        }],
        functionName: 'registerAndPrepay',
        args: [USER_ADDRESS, 1, checksum],
        value: parseEther('0.001')
      });
      
      console.log(`📝 RegisterAndPrepay tx: ${registerTx}`);
      
      const registerReceipt = await publicClient.waitForTransactionReceipt({ hash: registerTx });
      console.log(`✅ RegisterAndPrepay status: ${registerReceipt.status}`);
      
      if (registerReceipt.status !== 'success') {
        throw new Error('RegisterAndPrepay transaction failed');
      }
    } else {
      console.log('✅ User already registered, skipping registerAndPrepay');
    }
    
    // Step 6: Call sync to mint tokens
    console.log('🔄 Step 6: Calling sync to mint tokens...');
    
    const syncTx = await committeeWalletClient.writeContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{
        name: 'sync',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'user', type: 'address' },
          { name: 'newBalanceSats', type: 'uint64' },
          { name: 'proof', type: 'bytes' }
        ]
      }],
      functionName: 'sync',
      args: [USER_ADDRESS, BigInt(currentBalanceInSats), '0x']
    });
    
    console.log(`📝 Sync tx: ${syncTx}`);
    
    const syncReceipt = await publicClient.waitForTransactionReceipt({ hash: syncTx });
    console.log(`✅ Sync status: ${syncReceipt.status}`);
    
    if (syncReceipt.status !== 'success') {
      throw new Error('Sync transaction failed');
    }
    
    // Step 7: Verify results
    console.log('🔍 Step 7: Verifying results...');
    
    const finalLastSats = await publicClient.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{ name: 'lastSats', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint64' }] }],
      functionName: 'lastSats',
      args: [USER_ADDRESS]
    });
    
    const finalRbtcBalance = await publicClient.readContract({
      address: CONTRACTS.RBTC_SYNTH,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
      functionName: 'balanceOf',
      args: [USER_ADDRESS]
    });
    
    console.log(`₿ Final Oracle LastSats: ${finalLastSats}`);
    console.log(`🪙 Final rBTC Balance: ${finalRbtcBalance.toString()} sats`);
    
    // Step 8: Check Oracle users API
    console.log('🌐 Step 8: Checking Oracle users API...');
    
    // Wait a moment for Oracle to update
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const oracleResponse = await fetch('https://oracle.reservebtc.io/users');
      if (oracleResponse.ok) {
        const oracleUsers = await oracleResponse.json();
        const userInOracle = oracleUsers[USER_ADDRESS.toLowerCase()] || oracleUsers[USER_ADDRESS];
        console.log(`🔍 User in Oracle API: ${userInOracle ? 'YES' : 'NO'}`);
        if (userInOracle) {
          console.log('✅ Oracle API data:', userInOracle);
        }
      }
    } catch (error) {
      console.log('⚠️ Oracle API check failed:', error.message);
    }
    
    // Summary
    console.log('\n🎯 REGISTRATION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`User: ${USER_ADDRESS}`);
    console.log(`Bitcoin Address: ${USER_BTC_ADDRESS}`);
    console.log(`Bitcoin Balance: ${currentBalanceInSats} sats`);
    console.log(`Initial Oracle LastSats: ${initialLastSats}`);
    console.log(`Final Oracle LastSats: ${finalLastSats}`);
    console.log(`Initial rBTC Balance: ${initialRbtcBalance.toString()} sats`);
    console.log(`Final rBTC Balance: ${finalRbtcBalance.toString()} sats`);
    console.log(`Registration Success: ${finalLastSats > 0n ? 'YES' : 'NO'}`);
    console.log(`Tokens Minted: ${finalRbtcBalance > initialRbtcBalance ? 'YES' : 'NO'}`);
    
    return {
      success: finalLastSats > 0n && finalRbtcBalance > initialRbtcBalance,
      finalLastSats: finalLastSats.toString(),
      finalRbtcBalance: finalRbtcBalance.toString(),
      bitcoinBalance: currentBalanceInSats,
      registerTxHash: registerTx,
      syncTxHash: syncTx
    };
    
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

if (require.main === module) {
  manualRegisterUser()
    .then(result => {
      console.log('\n🏁 FINAL RESULT:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 USER SUCCESSFULLY REGISTERED AND TOKENS MINTED!');
        console.log('📊 Dashboard should now show the user data and tokens');
      } else {
        console.log('\n❌ REGISTRATION FAILED');
      }
    })
    .catch(console.error);
}

module.exports = { manualRegisterUser };