#!/usr/bin/env node

const axios = require('axios');
const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// MegaETH chain config
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
    public: { http: ['https://carrot.megaeth.com/rpc'] },
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  },
  testnet: true,
};

const BASE_URL = 'https://app.reservebtc.io';
const CONTRACTS = {
  FEE_VAULT: '0x298b3746B593df83E5bB2122cb80d17bdE2AB5fF',
  ORACLE_AGGREGATOR: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
  RBTC_SYNTH: '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB'
};

async function testAPI() {
  console.log('🧪 Testing ReserveBTC Production APIs...\n');
  
  const results = {
    passed: [],
    failed: []
  };

  // Test 1: Oracle GET endpoint
  try {
    console.log('1. Testing Oracle GET endpoint...');
    const response = await axios.get(`${BASE_URL}/api/oracle/sync`);
    if (response.data.success && response.data.data.committee) {
      console.log('✅ Oracle GET endpoint working');
      console.log(`   Committee: ${response.data.data.committee}`);
      results.passed.push('Oracle GET endpoint');
    }
  } catch (error) {
    console.log('❌ Oracle GET endpoint failed:', error.message);
    results.failed.push('Oracle GET endpoint');
  }

  // Test 2: Oracle POST endpoint
  try {
    console.log('\n2. Testing Oracle POST endpoint...');
    const response = await axios.post(`${BASE_URL}/api/oracle/sync`, {
      userAddress: '0x1234567890123456789012345678901234567890',
      btcBalance: '0.1',
      blockHeight: 800000
    });
    if (response.data.success) {
      console.log('✅ Oracle POST endpoint working');
      results.passed.push('Oracle POST endpoint');
    }
  } catch (error) {
    if (error.response?.data?.error?.includes('Restricted')) {
      console.log('⚠️  Oracle POST endpoint returned expected restriction (needs proper Oracle key)');
      results.passed.push('Oracle POST endpoint (restricted as expected)');
    } else if (error.response?.data?.error?.includes('ORACLE_PRIVATE_KEY')) {
      console.log('❌ Oracle POST endpoint: ORACLE_PRIVATE_KEY not configured in production');
      results.failed.push('Oracle POST endpoint - missing env var');
    } else {
      console.log('❌ Oracle POST endpoint failed:', error.response?.data?.error || error.message);
      results.failed.push('Oracle POST endpoint');
    }
  }

  // Test 3: Wallet verification endpoint
  try {
    console.log('\n3. Testing wallet verification endpoint...');
    const response = await axios.post(`${BASE_URL}/api/verify-wallet`, {
      bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ethereumAddress: '0x1234567890123456789012345678901234567890',
      message: 'ReserveBTC Verification',
      signature: 'IOS5r2LF+kUn+EdY8LWBK+SJ+zO/TuTL7XqVkZfZaBhtMEJv3gTlr1z5xQVxLoqJ7l0UJAm6g0ppPeZH+UqydPA='
    });
    console.log('✅ Wallet verification endpoint working (validation passed)');
    results.passed.push('Wallet verification endpoint');
  } catch (error) {
    if (error.response?.data?.details) {
      const details = error.response.data.details;
      if (details.some(d => d.message === 'Invalid BIP-322 signature format')) {
        console.log('⚠️  Wallet verification endpoint working (proper validation)');
        results.passed.push('Wallet verification endpoint');
      } else {
        console.log('❌ Wallet verification endpoint validation error:', JSON.stringify(details));
        results.failed.push('Wallet verification endpoint');
      }
    } else {
      console.log('❌ Wallet verification endpoint failed:', error.message);
      results.failed.push('Wallet verification endpoint');
    }
  }

  // Test 4: Mint endpoint
  try {
    console.log('\n4. Testing mint-rbtc endpoint...');
    const response = await axios.post(`${BASE_URL}/api/mint-rbtc`, {
      amount: '0.001',
      bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ethereumAddress: '0x1234567890123456789012345678901234567890',
      amountSatoshis: 100000
    });
    if (response.data.success && response.data.txHash) {
      console.log('✅ Mint endpoint working (mock response)');
      console.log(`   Mock txHash: ${response.data.txHash}`);
      results.passed.push('Mint endpoint');
    }
  } catch (error) {
    console.log('❌ Mint endpoint failed:', error.response?.data?.error || error.message);
    results.failed.push('Mint endpoint');
  }

  // Test 5: Oracle server status
  try {
    console.log('\n5. Testing Oracle server...');
    const response = await axios.get('https://oracle.reservebtc.io/status');
    if (response.data.status === 'online') {
      console.log('✅ Oracle server is online');
      console.log(`   Tracked users: ${response.data.trackedUsers}`);
      console.log(`   Uptime: ${Math.floor(response.data.uptime / 60)} minutes`);
      results.passed.push('Oracle server');
    }
  } catch (error) {
    console.log('❌ Oracle server failed:', error.message);
    results.failed.push('Oracle server');
  }

  // Test 6: Check smart contracts on chain
  try {
    console.log('\n6. Testing smart contracts on MegaETH...');
    const publicClient = createPublicClient({
      chain: megaeth,
      transport: http(),
    });

    // Check FeeVault
    const feeVaultCode = await publicClient.getBytecode({ 
      address: CONTRACTS.FEE_VAULT 
    });
    if (feeVaultCode && feeVaultCode !== '0x') {
      console.log('✅ FeeVault contract deployed');
      results.passed.push('FeeVault contract');
    } else {
      console.log('❌ FeeVault contract not found');
      results.failed.push('FeeVault contract');
    }

    // Check Oracle Aggregator
    const oracleCode = await publicClient.getBytecode({ 
      address: CONTRACTS.ORACLE_AGGREGATOR 
    });
    if (oracleCode && oracleCode !== '0x') {
      console.log('✅ OracleAggregator contract deployed');
      results.passed.push('OracleAggregator contract');
    } else {
      console.log('❌ OracleAggregator contract not found');
      results.failed.push('OracleAggregator contract');
    }

    // Check RBTC Synth
    const rbtcCode = await publicClient.getBytecode({ 
      address: CONTRACTS.RBTC_SYNTH 
    });
    if (rbtcCode && rbtcCode !== '0x') {
      console.log('✅ RBTC Synth contract deployed');
      results.passed.push('RBTC Synth contract');
    } else {
      console.log('❌ RBTC Synth contract not found');
      results.failed.push('RBTC Synth contract');
    }
  } catch (error) {
    console.log('❌ Smart contract check failed:', error.message);
    results.failed.push('Smart contract check');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n🔴 Failed tests:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (results.passed.length > 0) {
    console.log('\n🟢 Passed tests:');
    results.passed.forEach(test => console.log(`   - ${test}`));
  }

  // Critical issues
  console.log('\n' + '='.repeat(50));
  console.log('⚠️  CRITICAL ISSUES TO FIX:');
  console.log('='.repeat(50));
  if (results.failed.includes('Oracle POST endpoint - missing env var')) {
    console.log('1. ORACLE_PRIVATE_KEY not set in Vercel environment variables');
    console.log('   Solution: Add ORACLE_PRIVATE_KEY to Vercel project settings');
  }
  
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('1. Set ORACLE_PRIVATE_KEY in Vercel environment variables');
  console.log('2. Ensure Oracle server has the same private key');
  console.log('3. Test full mint flow with connected wallet');
  console.log('4. Monitor gas costs on MegaETH testnet');
}

// Run tests
testAPI().catch(console.error);