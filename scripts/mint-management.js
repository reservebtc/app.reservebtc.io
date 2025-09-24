// scripts/mint-management.js
// Production mint management system for ReserveBTC

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const axios = require('axios');
const readline = require('readline');

// PRODUCTION configuration
const CONFIG = {
  USER_ADDRESS: '0xf45d5feefd7235d9872079d537f5796ba79b1e52',
  
  // Contracts
  ORACLE_AGGREGATOR: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
  FEE_VAULT: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f',
  RBTC_SYNTH: '0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58',
  
  // Network
  MEGAETH_RPC: 'https://carrot.megaeth.com/rpc',
  CHAIN_ID: 6342,
  
  // APIs
  API_BASE: 'https://app.reservebtc.io',
  ORACLE_BASE: 'https://oracle.reservebtc.io'
};

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Create blockchain client
function createClient() {
  return createPublicClient({
    chain: { 
      id: CONFIG.CHAIN_ID, 
      name: 'MegaETH', 
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [CONFIG.MEGAETH_RPC] } }
    },
    transport: http(CONFIG.MEGAETH_RPC)
  });
}

// Get current monitoring status
async function getCurrentStatus() {
  const client = createClient();
  
  console.log(`\n${colors.cyan}📊 FETCHING CURRENT STATUS...${colors.reset}\n`);
  
  try {
    // Get FeeVault balance
    const feeBalance = await client.readContract({
      address: CONFIG.FEE_VAULT,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'balanceOf',
      args: [CONFIG.USER_ADDRESS]
    });
    
    // Get current monitoring
    const lastSats = await client.readContract({
      address: CONFIG.ORACLE_AGGREGATOR,
      abi: [{
        name: 'lastSats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint64' }]
      }],
      functionName: 'lastSats',
      args: [CONFIG.USER_ADDRESS]
    });
    
    // Get rBTC balance
    const rbtcBalance = await client.readContract({
      address: CONFIG.RBTC_SYNTH,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'balanceOf',
      args: [CONFIG.USER_ADDRESS]
    });
    
    // Get Bitcoin addresses from API
    const response = await axios.get(
      `${CONFIG.API_BASE}/api/realtime/bitcoin-addresses?address=${CONFIG.USER_ADDRESS}`,
      { timeout: 5000 }
    );
    
    const bitcoinAddresses = response.data?.bitcoinAddresses || [];
    
    return {
      feeBalance: formatEther(feeBalance),
      lastSats: Number(lastSats),
      rbtcBalance: Number(rbtcBalance),
      bitcoinAddresses
    };
  } catch (error) {
    console.error(`${colors.red}Error fetching status:${colors.reset}`, error.message);
    return null;
  }
}

// Check if Bitcoin address is already being monitored
async function checkAddressStatus(btcAddress) {
  try {
    // Check via API
    const response = await axios.get(
      `${CONFIG.API_BASE}/api/realtime/bitcoin-addresses?address=${CONFIG.USER_ADDRESS}`,
      { timeout: 5000 }
    );
    
    const addresses = response.data?.bitcoinAddresses || [];
    const existing = addresses.find(a => a.bitcoin_address === btcAddress);
    
    if (existing && existing.is_monitoring) {
      return { isMonitored: true, address: existing };
    }
    
    // Check Bitcoin balance
    let btcBalance = 0;
    try {
      const btcResponse = await axios.get(
        `https://api.blockcypher.com/v1/btc/test3/addrs/${btcAddress}/balance`,
        { timeout: 5000 }
      );
      btcBalance = btcResponse.data.balance / 1e8;
    } catch (err) {
      // Try mempool as fallback
      try {
        const mempoolResponse = await axios.get(
          `https://mempool.space/testnet/api/address/${btcAddress}`,
          { timeout: 5000 }
        );
        const data = mempoolResponse.data;
        btcBalance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
      } catch (e) {
        console.log(`${colors.yellow}⚠️  Cannot verify Bitcoin balance${colors.reset}`);
      }
    }
    
    return { isMonitored: false, btcBalance };
  } catch (error) {
    console.error(`${colors.red}Error checking address:${colors.reset}`, error.message);
    return { isMonitored: false, btcBalance: 0 };
  }
}

// Display current status
function displayStatus(status) {
  console.log(`${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║         RESERVEBTC MINT MANAGEMENT SYSTEM            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.bright}WALLET STATUS:${colors.reset}`);
  console.log(`├─ Address: ${CONFIG.USER_ADDRESS}`);
  console.log(`├─ FeeVault: ${colors.green}${status.feeBalance} ETH${colors.reset}`);
  console.log(`├─ rBTC-SYNTH: ${colors.yellow}${status.rbtcBalance} sats${colors.reset} (${status.rbtcBalance/1e8} BTC)`);
  console.log(`└─ Oracle Monitoring: ${status.lastSats > 0 ? colors.green + 'ACTIVE' : colors.yellow + 'INACTIVE'}${colors.reset}\n`);
  
  if (status.lastSats > 0) {
    console.log(`${colors.bright}${colors.red}⚠️  MINT PROTECTION ACTIVE${colors.reset}`);
    console.log(`Currently monitoring: ${status.lastSats} sats (${status.lastSats/1e8} BTC)\n`);
  }
  
  if (status.bitcoinAddresses.length > 0) {
    console.log(`${colors.bright}BITCOIN ADDRESSES:${colors.reset}`);
    status.bitcoinAddresses.forEach((addr, i) => {
      const symbol = addr.is_monitoring ? '📡' : '⭕';
      const status = addr.is_monitoring ? colors.green + 'MONITORING' : colors.yellow + 'NOT MONITORING';
      console.log(`${i+1}. ${symbol} ${addr.bitcoin_address}`);
      console.log(`   Status: ${status}${colors.reset}`);
    });
    console.log('');
  }
}

// Main menu
async function showMenu(status) {
  console.log(`${colors.bright}AVAILABLE ACTIONS:${colors.reset}`);
  
  if (status.lastSats > 0) {
    console.log(`${colors.red}1. Cannot mint - address already being monitored${colors.reset}`);
    console.log(`2. View monitoring details`);
    console.log(`3. Check new Bitcoin address`);
    console.log(`4. Refresh status`);
    console.log(`5. Exit`);
  } else {
    console.log(`${colors.green}1. Mint with new Bitcoin address${colors.reset}`);
    console.log(`2. Check Bitcoin address`);
    console.log(`3. View all addresses`);
    console.log(`4. Refresh status`);
    console.log(`5. Exit`);
  }
  
  console.log('');
  const choice = await askQuestion(`${colors.cyan}Select option (1-5): ${colors.reset}`);
  
  return choice;
}

// Handle mint process
async function handleMint(status) {
  if (status.lastSats > 0) {
    console.log(`\n${colors.red}❌ CANNOT MINT${colors.reset}`);
    console.log(`You are already monitoring address with ${status.lastSats} sats`);
    console.log(`Wait for balance to reach zero before minting again\n`);
    return;
  }
  
  if (parseFloat(status.feeBalance) < 0.001) {
    console.log(`\n${colors.red}❌ INSUFFICIENT FEES${colors.reset}`);
    console.log(`You need at least 0.001 ETH in FeeVault`);
    console.log(`Current balance: ${status.feeBalance} ETH\n`);
    return;
  }
  
  console.log(`\n${colors.green}✅ READY TO MINT${colors.reset}`);
  const btcAddress = await askQuestion('Enter Bitcoin testnet address: ');
  
  if (!btcAddress || !btcAddress.startsWith('tb1')) {
    console.log(`${colors.red}Invalid address format${colors.reset}\n`);
    return;
  }
  
  // Check if address is already monitored
  console.log(`\n${colors.cyan}Checking address...${colors.reset}`);
  const addressStatus = await checkAddressStatus(btcAddress);
  
  if (addressStatus.isMonitored) {
    console.log(`${colors.red}❌ This address is already being monitored${colors.reset}\n`);
    return;
  }
  
  if (addressStatus.btcBalance === 0) {
    console.log(`${colors.yellow}⚠️  Warning: Address has zero balance${colors.reset}`);
    const proceed = await askQuestion('Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      return;
    }
  } else {
    console.log(`${colors.green}✅ Address balance: ${addressStatus.btcBalance} BTC${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}READY TO START MONITORING${colors.reset}`);
  console.log(`Address: ${btcAddress}`);
  console.log(`Balance: ${addressStatus.btcBalance || 0} BTC`);
  console.log(`\n${colors.cyan}To complete minting:${colors.reset}`);
  console.log(`1. Go to: ${colors.blue}https://app.reservebtc.io/mint${colors.reset}`);
  console.log(`2. Enter this address: ${colors.yellow}${btcAddress}${colors.reset}`);
  console.log(`3. Click "Start Monitoring"`);
  console.log(`4. Confirm transaction in MetaMask\n`);
}

// Check specific Bitcoin address
async function checkBitcoinAddress() {
  const btcAddress = await askQuestion('\nEnter Bitcoin address to check: ');
  
  if (!btcAddress) {
    console.log(`${colors.red}No address provided${colors.reset}\n`);
    return;
  }
  
  console.log(`\n${colors.cyan}Checking address...${colors.reset}`);
  const addressStatus = await checkAddressStatus(btcAddress);
  
  console.log(`\n${colors.bright}ADDRESS DETAILS:${colors.reset}`);
  console.log(`Address: ${btcAddress}`);
  console.log(`Monitoring: ${addressStatus.isMonitored ? colors.green + 'YES' : colors.yellow + 'NO'}${colors.reset}`);
  
  if (addressStatus.btcBalance !== undefined) {
    console.log(`Balance: ${addressStatus.btcBalance} BTC`);
  }
  
  if (addressStatus.isMonitored && addressStatus.address) {
    console.log(`Verified: ${addressStatus.address.verified_at}`);
  }
  
  console.log('');
}

// View monitoring details
async function viewMonitoringDetails(status) {
  console.log(`\n${colors.bright}MONITORING DETAILS:${colors.reset}`);
  console.log(`├─ Current Balance: ${status.lastSats} sats (${status.lastSats/1e8} BTC)`);
  console.log(`├─ rBTC-SYNTH Tokens: ${status.rbtcBalance} sats`);
  console.log(`├─ Status: ${colors.green}ACTIVE MONITORING${colors.reset}`);
  console.log(`└─ Oracle: Automatically syncing balance\n`);
  
  const monitoredAddress = status.bitcoinAddresses.find(a => a.is_monitoring);
  if (monitoredAddress) {
    console.log(`${colors.bright}MONITORED ADDRESS:${colors.reset}`);
    console.log(`Address: ${monitoredAddress.bitcoin_address}`);
    console.log(`Network: ${monitoredAddress.network}`);
    console.log(`Started: ${monitoredAddress.verified_at}\n`);
  }
  
  console.log(`${colors.cyan}INFO:${colors.reset} When Bitcoin balance reaches zero,`);
  console.log(`the Oracle will automatically burn your rBTC-SYNTH tokens`);
  console.log(`and stop monitoring, allowing you to mint a new address.\n`);
}

// Main application loop
async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.green}ReserveBTC Mint Management System v1.0${colors.reset}`);
  console.log(`${colors.cyan}Production Environment${colors.reset}\n`);
  
  let running = true;
  
  while (running) {
    const status = await getCurrentStatus();
    
    if (!status) {
      console.log(`${colors.red}Failed to fetch status. Please try again.${colors.reset}`);
      process.exit(1);
    }
    
    displayStatus(status);
    const choice = await showMenu(status);
    
    switch (choice) {
      case '1':
        if (status.lastSats > 0) {
          await viewMonitoringDetails(status);
        } else {
          await handleMint(status);
        }
        break;
        
      case '2':
        if (status.lastSats > 0) {
          await viewMonitoringDetails(status);
        } else {
          await checkBitcoinAddress();
        }
        break;
        
      case '3':
        if (status.lastSats > 0) {
          await checkBitcoinAddress();
        } else {
          // View all addresses
          console.log(`\n${colors.bright}ALL BITCOIN ADDRESSES:${colors.reset}`);
          if (status.bitcoinAddresses.length === 0) {
            console.log('No addresses registered yet\n');
          } else {
            status.bitcoinAddresses.forEach((addr, i) => {
              console.log(`${i+1}. ${addr.bitcoin_address}`);
              console.log(`   Status: ${addr.is_monitoring ? 'MONITORING' : 'NOT MONITORING'}`);
            });
            console.log('');
          }
        }
        break;
        
      case '4':
        console.log(`\n${colors.cyan}Refreshing status...${colors.reset}\n`);
        continue;
        
      case '5':
        running = false;
        break;
        
      default:
        console.log(`${colors.red}Invalid option${colors.reset}\n`);
    }
    
    if (running && choice !== '4') {
      await askQuestion(`Press Enter to continue...`);
      console.clear();
    }
  }
  
  console.log(`\n${colors.green}Thank you for using ReserveBTC!${colors.reset}\n`);
  rl.close();
  process.exit(0);
}

// Error handler
process.on('unhandledRejection', (error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});

// Run application
main().catch(error => {
  console.error(`\n${colors.red}Application error:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});