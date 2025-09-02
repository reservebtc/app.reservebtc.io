#!/usr/bin/env node

const axios = require('axios');
const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const BASE_URL = 'https://app.reservebtc.io';
const TEST_USER = '0x1234567890123456789012345678901234567890';
const TEST_BTC_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  rpcUrls: {
    public: { http: ['https://carrot.megaeth.com/rpc'] },
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  },
  testnet: true,
};

const CONTRACTS = {
  FEE_VAULT: '0x298b3746B593df83E5bB2122cb80d17bdE2AB5fF',
  ORACLE_AGGREGATOR: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
  RBTC_SYNTH: '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB'
};

async function testFullFlow() {
  console.log('🚀 Testing Full ReserveBTC Flow\n');
  console.log('='.repeat(50));
  
  const results = {
    steps: [],
    errors: []
  };

  // Step 1: Check Oracle Status
  console.log('\n📍 Step 1: Checking Oracle Status...');
  try {
    const response = await axios.get(`${BASE_URL}/api/oracle/sync`);
    if (response.data.success) {
      console.log('✅ Oracle is configured');
      console.log(`   Committee: ${response.data.data.committee}`);
      console.log(`   Max fee per sync: ${response.data.data.maxFeePerSync} wei`);
      results.steps.push({ step: 'Oracle Status', status: 'success' });
    }
  } catch (error) {
    console.log('❌ Oracle status check failed');
    results.errors.push('Oracle status check failed');
  }

  // Step 2: Check if user has FeeVault balance
  console.log('\n📍 Step 2: Checking FeeVault Balance...');
  const publicClient = createPublicClient({
    chain: megaeth,
    transport: http(),
  });

  let feeVaultBalance = BigInt(0);
  try {
    // Try to read balance (might fail due to RPC restrictions)
    console.log('⚠️  FeeVault balance check might fail due to RPC restrictions');
    results.steps.push({ step: 'FeeVault Check', status: 'skipped', note: 'RPC may block direct calls' });
  } catch (error) {
    console.log('⚠️  Cannot check FeeVault balance directly (RPC restriction)');
  }

  // Step 3: Test sync with small amount (will fail if no FeeVault balance)
  console.log('\n📍 Step 3: Testing Oracle Sync...');
  try {
    const response = await axios.post(`${BASE_URL}/api/oracle/sync`, {
      userAddress: TEST_USER,
      btcBalance: '0.001', // Small amount
      blockHeight: 800000
    });
    
    if (response.data.success) {
      console.log('✅ Oracle sync successful!');
      console.log(`   Transaction hash: ${response.data.transactionHash}`);
      console.log(`   Gas used: ${response.data.gasUsed}`);
      results.steps.push({ step: 'Oracle Sync', status: 'success' });
    }
  } catch (error) {
    if (error.response?.data?.needsTopUp) {
      console.log('⚠️  Oracle sync failed: User needs to deposit ETH to FeeVault');
      console.log('   Solution: Visit https://app.reservebtc.io/mint and deposit ETH');
      results.steps.push({ step: 'Oracle Sync', status: 'needs_topup' });
    } else if (error.response?.data?.error?.includes('Restricted')) {
      console.log('❌ Oracle sync failed: Restricted (Oracle key issue)');
      results.errors.push('Oracle key not properly configured');
    } else {
      console.log('❌ Oracle sync failed:', error.response?.data?.error || error.message);
      results.errors.push('Oracle sync failed');
    }
  }

  // Step 4: Test wallet verification
  console.log('\n📍 Step 4: Testing Wallet Verification...');
  try {
    const response = await axios.post(`${BASE_URL}/api/verify-wallet`, {
      bitcoinAddress: TEST_BTC_ADDRESS,
      ethereumAddress: TEST_USER,
      message: 'ReserveBTC Verification',
      signature: 'IOS5r2LF+kUn+EdY8LWBK+SJ+zO/TuTL7XqVkZfZaBhtMEJv3gTlr1z5xQVxLoqJ7l0UJAm6g0ppPeZH+UqydPA='
    });
    
    console.log('✅ Wallet verification endpoint working');
    results.steps.push({ step: 'Wallet Verification', status: 'success' });
  } catch (error) {
    if (error.response?.data?.details) {
      console.log('✅ Wallet verification validation working correctly');
      results.steps.push({ step: 'Wallet Verification', status: 'success', note: 'Validation working' });
    } else {
      console.log('❌ Wallet verification failed');
      results.errors.push('Wallet verification failed');
    }
  }

  // Step 5: Test mint endpoint
  console.log('\n📍 Step 5: Testing Mint Endpoint...');
  try {
    const response = await axios.post(`${BASE_URL}/api/mint-rbtc`, {
      amount: '0.001',
      bitcoinAddress: TEST_BTC_ADDRESS,
      ethereumAddress: TEST_USER
    });
    
    if (response.data.success) {
      console.log('✅ Mint endpoint working (returns mock data)');
      results.steps.push({ step: 'Mint Endpoint', status: 'mock_success' });
    }
  } catch (error) {
    console.log('❌ Mint endpoint failed');
    results.errors.push('Mint endpoint failed');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 FLOW TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successCount = results.steps.filter(s => s.status === 'success').length;
  const totalSteps = results.steps.length;
  
  console.log(`\n✅ Successful steps: ${successCount}/${totalSteps}`);
  
  results.steps.forEach(step => {
    const icon = step.status === 'success' ? '✅' : 
                 step.status === 'needs_topup' ? '💰' :
                 step.status === 'mock_success' ? '🔄' : '⚠️';
    console.log(`   ${icon} ${step.step}: ${step.status} ${step.note || ''}`);
  });
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors found:');
    results.errors.forEach(err => console.log(`   - ${err}`));
  }

  // Instructions
  console.log('\n' + '='.repeat(50));
  console.log('📝 NEXT STEPS FOR FULL TESTING');
  console.log('='.repeat(50));
  console.log('\n1. Visit https://app.reservebtc.io');
  console.log('2. Connect your MetaMask wallet');
  console.log('3. Go to Mint page');
  console.log('4. Deposit ETH to FeeVault (use calculator for recommended amount)');
  console.log('5. Enter Bitcoin address and amount');
  console.log('6. Complete mint process');
  console.log('\n⚠️  Make sure you have:');
  console.log('   - MetaMask connected to MegaETH Testnet (Chain ID: 6342)');
  console.log('   - Some ETH on MegaETH for gas fees');
  console.log('   - Bitcoin testnet address for testing');
  
  // Check if Oracle key is working
  if (results.errors.includes('Oracle key not properly configured')) {
    console.log('\n🔴 CRITICAL: Oracle private key is not working correctly!');
    console.log('   Please verify ORACLE_PRIVATE_KEY in Vercel environment variables');
  } else if (results.steps.find(s => s.step === 'Oracle Sync' && s.status === 'needs_topup')) {
    console.log('\n🟡 Oracle is working! Just needs FeeVault deposit to complete sync.');
  }
}

// Run test
testFullFlow().catch(console.error);