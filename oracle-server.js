#!/usr/bin/env node

/**
 * Simple Oracle Server for ReserveBTC on MegaETH Testnet
 * 
 * This server monitors Bitcoin addresses and synchronizes balances
 * to the ReserveBTC protocol on MegaETH.
 * 
 * Usage:
 *   node oracle-server.js
 * 
 * Environment Variables:
 *   - ORACLE_PRIVATE_KEY: Private key for oracle committee member
 *   - BITCOIN_RPC_URL: Bitcoin node RPC URL (optional, uses public APIs)
 *   - SYNC_INTERVAL: Sync interval in seconds (default: 300 = 5 minutes)
 */

const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  ORACLE_PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY || '0xeec1cf19d9890a45fa92cd97a6311752350403036b03a7f325541851a53b9abb',
  MEGAETH_RPC: 'https://carrot.megaeth.com/rpc',
  SYNC_INTERVAL: parseInt(process.env.SYNC_INTERVAL) || 300, // 5 minutes
  CONTRACT_ADDRESS: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
};

// MegaETH Chain Configuration
const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [CONFIG.MEGAETH_RPC] },
    public: { http: [CONFIG.MEGAETH_RPC] },
  },
  blockExplorers: {
    default: { name: 'MegaExplorer', url: 'https://megaexplorer.xyz' },
  },
  testnet: true,
};

// Contract ABI (minimal)
const ORACLE_ABI = [
  {
    type: 'function',
    name: 'sync',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'newBalanceSats', type: 'uint64' },
      { name: 'height', type: 'uint32' },
      { name: 'timestamp', type: 'uint64' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'lastSats',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'committee',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'Synced',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'newBalanceSats', type: 'uint64', indexed: false },
      { name: 'deltaSats', type: 'int64', indexed: false },
      { name: 'feeWei', type: 'uint256', indexed: false },
      { name: 'height', type: 'uint32', indexed: false },
      { name: 'timestamp', type: 'uint64', indexed: false }
    ]
  }
];

// Initialize clients
const account = privateKeyToAccount(CONFIG.ORACLE_PRIVATE_KEY);
const publicClient = createPublicClient({ chain: megaeth, transport: http() });
const walletClient = createWalletClient({ account, chain: megaeth, transport: http() });

console.log('🔮 ReserveBTC Oracle Server Starting...');
console.log('Oracle Address:', account.address);
console.log('Contract Address:', CONFIG.CONTRACT_ADDRESS);
console.log('Sync Interval:', CONFIG.SYNC_INTERVAL, 'seconds');

// Tracked users database (in production, use a real database)
const USERS_FILE = path.join(__dirname, 'oracle-users.json');
let trackedUsers = {};

// Load tracked users from file
function loadTrackedUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      trackedUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      console.log(`📊 Loaded ${Object.keys(trackedUsers).length} tracked users`);
    }
  } catch (error) {
    console.error('Failed to load tracked users:', error);
    trackedUsers = {};
  }
}

// Save tracked users to file
function saveTrackedUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(trackedUsers, null, 2));
  } catch (error) {
    console.error('Failed to save tracked users:', error);
  }
}

// Get Bitcoin balance for an address (using public API)
async function getBitcoinBalance(btcAddress) {
  try {
    // Using BlockCypher API (free tier)
    const response = await fetch(`https://api.blockcypher.com/v1/btc/test3/addrs/${btcAddress}/balance`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      balance: data.balance || 0, // in satoshis
      unconfirmed: data.unconfirmed_balance || 0,
      blockHeight: data.final_block_height || 0,
    };
  } catch (error) {
    console.error(`Failed to get balance for ${btcAddress}:`, error.message);
    return { balance: 0, unconfirmed: 0, blockHeight: 0 };
  }
}

// Get current Bitcoin block height
async function getCurrentBlockHeight() {
  try {
    const response = await fetch('https://api.blockcypher.com/v1/btc/test3');
    const data = await response.json();
    return data.height || 0;
  } catch (error) {
    console.error('Failed to get current block height:', error.message);
    return 0;
  }
}

// Sync user balance to MegaETH
async function syncUserBalance(ethAddress, btcAddress) {
  try {
    console.log(`🔄 Syncing balance for ${ethAddress} (BTC: ${btcAddress})`);
    
    // Get current BTC balance
    const { balance: newBalanceSats, blockHeight } = await getBitcoinBalance(btcAddress);
    
    // Get last synced balance from contract
    const lastSyncedSats = await publicClient.readContract({
      address: CONFIG.CONTRACT_ADDRESS,
      abi: ORACLE_ABI,
      functionName: 'lastSats',
      args: [ethAddress],
    });
    
    const lastSyncedBalance = Number(lastSyncedSats);
    
    // Check if balance has changed
    if (newBalanceSats === lastSyncedBalance) {
      console.log(`✅ No change in balance for ${ethAddress}: ${newBalanceSats / 1e8} BTC`);
      return;
    }
    
    console.log(`📈 Balance change detected for ${ethAddress}:`);
    console.log(`   Previous: ${lastSyncedBalance / 1e8} BTC`);
    console.log(`   New:      ${newBalanceSats / 1e8} BTC`);
    console.log(`   Delta:    ${(newBalanceSats - lastSyncedBalance) / 1e8} BTC`);
    
    // Execute sync transaction
    const hash = await walletClient.writeContract({
      address: CONFIG.CONTRACT_ADDRESS,
      abi: ORACLE_ABI,
      functionName: 'sync',
      args: [
        ethAddress,
        BigInt(newBalanceSats),
        blockHeight,
        BigInt(Math.floor(Date.now() / 1000)),
      ],
    });
    
    console.log(`⛓️  Sync transaction sent: ${hash}`);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    
    if (receipt.status === 'success') {
      console.log(`✅ Balance synced successfully for ${ethAddress}`);
      console.log(`   Gas used: ${receipt.gasUsed}`);
      
      // Update tracked user
      trackedUsers[ethAddress] = {
        ...trackedUsers[ethAddress],
        lastSyncedBalance: newBalanceSats,
        lastSyncTime: Date.now(),
        lastTxHash: hash,
      };
    } else {
      console.error(`❌ Sync transaction failed for ${ethAddress}`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to sync balance for ${ethAddress}:`, error.message);
  }
}

// Add a new user to track
function addUser(ethAddress, btcAddress) {
  if (!ethAddress || !btcAddress) {
    console.error('Both ETH and BTC addresses are required');
    return;
  }
  
  trackedUsers[ethAddress] = {
    btcAddress,
    addedTime: Date.now(),
    lastSyncedBalance: 0,
    lastSyncTime: 0,
    lastTxHash: null,
  };
  
  saveTrackedUsers();
  console.log(`👤 Added user ${ethAddress} -> ${btcAddress}`);
}

// Remove a user from tracking
function removeUser(ethAddress) {
  if (trackedUsers[ethAddress]) {
    delete trackedUsers[ethAddress];
    saveTrackedUsers();
    console.log(`❌ Removed user ${ethAddress}`);
  }
}

// Main sync loop
async function syncLoop() {
  const users = Object.keys(trackedUsers);
  
  if (users.length === 0) {
    console.log('📭 No users to sync');
    return;
  }
  
  console.log(`🔄 Starting sync cycle for ${users.length} users...`);
  
  for (const ethAddress of users) {
    const user = trackedUsers[ethAddress];
    await syncUserBalance(ethAddress, user.btcAddress);
    
    // Small delay between syncs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  saveTrackedUsers();
  console.log('✅ Sync cycle completed');
}

// CLI Commands
function handleCommand(command, args) {
  switch (command) {
    case 'add':
      if (args.length >= 2) {
        addUser(args[0], args[1]);
      } else {
        console.log('Usage: add <eth_address> <btc_address>');
      }
      break;
      
    case 'remove':
      if (args.length >= 1) {
        removeUser(args[0]);
      } else {
        console.log('Usage: remove <eth_address>');
      }
      break;
      
    case 'list':
      console.log('👥 Tracked Users:');
      Object.entries(trackedUsers).forEach(([ethAddr, user]) => {
        console.log(`   ${ethAddr} -> ${user.btcAddress} (${user.lastSyncedBalance / 1e8} BTC)`);
      });
      break;
      
    case 'sync':
      console.log('🔄 Manual sync triggered...');
      syncLoop();
      break;
      
    case 'status':
      console.log('📊 Oracle Status:');
      console.log(`   Oracle Address: ${account.address}`);
      console.log(`   Tracked Users: ${Object.keys(trackedUsers).length}`);
      console.log(`   Sync Interval: ${CONFIG.SYNC_INTERVAL}s`);
      break;
      
    case 'help':
      console.log(`
📚 Oracle Server Commands:
  add <eth_address> <btc_address>  - Add user to track
  remove <eth_address>             - Remove user from tracking  
  list                             - List all tracked users
  sync                             - Trigger manual sync
  status                           - Show oracle status
  help                             - Show this help
  exit                             - Stop oracle server
      `);
      break;
      
    case 'exit':
      console.log('👋 Shutting down oracle server...');
      process.exit(0);
      break;
      
    default:
      console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
  }
}

// Initialize
async function initialize() {
  loadTrackedUsers();
  
  // Verify oracle is authorized
  try {
    const committeeAddress = await publicClient.readContract({
      address: CONFIG.CONTRACT_ADDRESS,
      abi: ORACLE_ABI,
      functionName: 'committee',
    });
    
    if (committeeAddress.toLowerCase() !== account.address.toLowerCase()) {
      console.error('❌ This oracle is not authorized as committee member');
      console.error(`   Expected: ${committeeAddress}`);
      console.error(`   Got:      ${account.address}`);
      process.exit(1);
    }
    
    console.log('✅ Oracle authorization verified');
  } catch (error) {
    console.error('❌ Failed to verify oracle authorization:', error.message);
    process.exit(1);
  }
  
  // Start sync timer
  setInterval(syncLoop, CONFIG.SYNC_INTERVAL * 1000);
  
  console.log('');
  console.log('🎯 Oracle server is ready!');
  console.log('   Type "help" for available commands');
  console.log('   Type "add <eth_address> <btc_address>" to start tracking a user');
  console.log('');
}

// Handle CLI input
if (require.main === module) {
  // Start server
  initialize();
  
  // Handle CLI commands
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'oracle> '
  });
  
  rl.prompt();
  
  rl.on('line', (input) => {
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (command) {
      handleCommand(command, args);
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log('\n👋 Oracle server stopped');
    process.exit(0);
  });
}

module.exports = {
  addUser,
  removeUser,
  syncUserBalance,
  syncLoop,
  CONFIG,
};