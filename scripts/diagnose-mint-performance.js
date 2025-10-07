const https = require('https');

const TEST_ETH_ADDRESS = '0xc381f1927257fa20782a65005a2cb094637d75e1';
const TEST_BTC_ADDRESS = 'tb1qvy3w5thmp2fgqvly330q0254j3j6l2hl89p4v6';

console.log('MINT PAGE PERFORMANCE DIAGNOSTIC');
console.log('==================================================\n');

const timings = {};

function startTimer(name) {
  timings[name] = { start: Date.now() };
}

function endTimer(name) {
  if (timings[name]) {
    timings[name].duration = Date.now() - timings[name].start;
  }
}

function printTimings() {
  console.log('\nPERFORMANCE SUMMARY:');
  console.log('==================================================');
  Object.entries(timings).forEach(([name, timing]) => {
    const duration = timing.duration || 0;
    const status = duration < 1000 ? 'FAST' : duration < 3000 ? 'SLOW' : 'VERY SLOW';
    console.log(status + ' ' + name.padEnd(40) + ' ' + duration + 'ms');
  });
  console.log('==================================================\n');
}

function testAPI(name, url) {
  return new Promise((resolve) => {
    startTimer(name);
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        endTimer(name);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => {
      endTimer(name);
      resolve(null);
    });
  });
}

function testMempoolBalance(btcAddress) {
  return new Promise((resolve) => {
    startTimer('Mempool Balance API');
    const isTestnet = btcAddress.startsWith('tb1');
    const host = 'mempool.space';
    const path = isTestnet ? '/testnet/api/address/' + btcAddress : '/api/address/' + btcAddress;
    
    https.get('https://' + host + path, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        endTimer('Mempool Balance API');
        try {
          const json = JSON.parse(data);
          const balance = (json.chain_stats.funded_txo_sum || 0) / 100000000;
          resolve(balance);
        } catch (e) {
          resolve(0);
        }
      });
    }).on('error', () => {
      endTimer('Mempool Balance API');
      resolve(0);
    });
  });
}

async function runDiagnostic() {
  console.log('Step 1: Testing Real-time APIs...\n');
  
  const balancesData = await testAPI(
    'API: /api/realtime/balances',
    'https://app.reservebtc.io/api/realtime/balances?address=' + TEST_ETH_ADDRESS
  );
  console.log('Balances:', balancesData);
  
  const btcAddressesData = await testAPI(
    'API: /api/realtime/bitcoin-addresses',
    'https://app.reservebtc.io/api/realtime/bitcoin-addresses?address=' + TEST_ETH_ADDRESS
  );
  console.log('Bitcoin Addresses:', btcAddressesData);
  
  const oracleData = await testAPI(
    'Oracle Server',
    'https://oracle.reservebtc.io/user/' + TEST_ETH_ADDRESS
  );
  console.log('Oracle Data:', oracleData ? 'Encrypted data received' : 'No data');
  
  console.log('\nStep 2: Testing Mempool API (may be slow)...\n');
  const mempoolBalance = await testMempoolBalance(TEST_BTC_ADDRESS);
  console.log('Mempool Balance:', mempoolBalance, 'BTC');
  
  printTimings();
  
  console.log('\nANALYSIS:\n');
  
  if (timings['Mempool Balance API'] && timings['Mempool Balance API'].duration > 5000) {
    console.log('PROBLEM: Mempool API is VERY slow (>5s) - THIS IS THE BOTTLENECK!');
    console.log('Solution: Use real-time data first, mempool as fallback');
  }
  
  console.log('\nRECOMMENDATIONS:\n');
  
  if (balancesData && Number(balancesData.rbtc) > 0) {
    console.log('SUCCESS: Real-time balance available: ' + balancesData.rbtc + ' sats');
    console.log('Should display instantly without waiting for mempool!');
  } else {
    console.log('WARNING: No real-time balance available');
    console.log('Must wait for mempool API (slow)');
  }
  
  if (!btcAddressesData || btcAddressesData.count === 0) {
    console.log('ERROR: No Bitcoin addresses found in API');
  } else {
    console.log('SUCCESS: Bitcoin addresses API working: ' + btcAddressesData.count + ' addresses');
  }
}

runDiagnostic().catch(console.error);