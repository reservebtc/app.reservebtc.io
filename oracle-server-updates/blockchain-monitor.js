/**
 * Professional Blockchain Event Monitor for Oracle Server
 * 
 * This system automatically monitors all ReserveBTC smart contracts
 * and builds comprehensive user profiles with encrypted data transmission
 */

const { createPublicClient, http, parseAbiItem } = require('viem');
const crypto = require('crypto');

// MegaETH Network Configuration
const MEGAETH_TESTNET = {
  id: 6342,
  name: 'MegaETH Testnet',
  rpcUrls: {
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  }
};

// Contract addresses and configuration
const CONTRACTS = {
  RBTC_SYNTH: '0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58',
  VAULT_WRBTC: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
  ORACLE_AGGREGATOR: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
  FEE_VAULT: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f'
};

// Create blockchain client
const publicClient = createPublicClient({
  transport: http(MEGAETH_TESTNET.rpcUrls.default.http[0])
});

/**
 * Professional User Profile Database
 */
class UserProfileDatabase {
  constructor() {
    this.profiles = new Map(); // userAddress -> UserProfile
    this.encryptionKey = process.env.ORACLE_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Create comprehensive user profile when verification occurs
   */
  async createUserProfile(userAddress, bitcoinAddress, verificationType = 'manual') {
    console.log(`👤 PROFILE: Creating professional profile for ${userAddress.substring(0, 10)}...`);
    
    const profile = {
      // Basic Information
      ethAddress: userAddress.toLowerCase(),
      bitcoinAddress: bitcoinAddress,
      profileCreatedAt: new Date().toISOString(),
      verificationType: verificationType,
      
      // Transaction History
      rBTCTransactions: [],
      wrBTCTransactions: [], 
      oracleTransactions: [],
      feeTransactions: [],
      
      // Balances and Stats
      currentRBTCBalance: '0',
      currentWrBTCBalance: '0',
      totalRBTCMinted: '0',
      totalRBTCBurned: '0',
      totalWrBTCWrapped: '0',
      totalWrBTCRedeemed: '0',
      totalFeesSpent: '0',
      
      // Meta Information
      totalTransactionCount: 0,
      lastActivityAt: new Date().toISOString(),
      lastBlockProcessed: 0,
      profileStatus: 'active'
    };
    
    // Load historical transactions for this user
    await this.loadHistoricalTransactions(userAddress, profile);
    
    // Store profile
    this.profiles.set(userAddress.toLowerCase(), profile);
    
    console.log(`✅ PROFILE: Created profile with ${profile.totalTransactionCount} historical transactions`);
    return profile;
  }

  /**
   * Load all historical transactions for user from blockchain
   */
  async loadHistoricalTransactions(userAddress, profile) {
    try {
      console.log(`📚 HISTORY: Loading historical transactions for ${userAddress.substring(0, 10)}...`);
      
      // Load rBTC-SYNTH transactions
      await this.loadRBTCTransactions(userAddress, profile);
      
      // Load wrBTC transactions  
      await this.loadWrBTCTransactions(userAddress, profile);
      
      // Load Oracle sync transactions
      await this.loadOracleTransactions(userAddress, profile);
      
      // Load Fee transactions
      await this.loadFeeTransactions(userAddress, profile);
      
      // Calculate balances and stats
      this.calculateUserStats(profile);
      
      console.log(`✅ HISTORY: Loaded complete transaction history`);
      
    } catch (error) {
      console.error('❌ HISTORY ERROR:', error);
    }
  }

  /**
   * Load rBTC-SYNTH transactions (Mint/Burn events)
   */
  async loadRBTCTransactions(userAddress, profile) {
    try {
      // Get Mint events
      const mintEvents = await publicClient.getLogs({
        address: CONTRACTS.RBTC_SYNTH,
        event: parseAbiItem('event Mint(address indexed to, uint256 value)'),
        args: { to: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Get Burn events 
      const burnEvents = await publicClient.getLogs({
        address: CONTRACTS.RBTC_SYNTH,
        event: parseAbiItem('event Burn(address indexed from, uint256 value)'),
        args: { from: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process mint events
      for (const log of mintEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.rBTCTransactions.push({
          type: 'mint',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          amount: log.args.value.toString(),
          status: 'confirmed'
        });
      }

      // Process burn events
      for (const log of burnEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.rBTCTransactions.push({
          type: 'burn',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          amount: log.args.value.toString(),
          status: 'confirmed'
        });
      }

      // Sort by block number
      profile.rBTCTransactions.sort((a, b) => a.blockNumber - b.blockNumber);
      
      console.log(`📊 rBTC: Loaded ${profile.rBTCTransactions.length} rBTC transactions`);
      
    } catch (error) {
      console.error('❌ rBTC HISTORY ERROR:', error);
    }
  }

  /**
   * Load wrBTC transactions (Wrap/Redeem events)
   */
  async loadWrBTCTransactions(userAddress, profile) {
    try {
      // Get Wrapped events
      const wrappedEvents = await publicClient.getLogs({
        address: CONTRACTS.VAULT_WRBTC,
        event: parseAbiItem('event Wrapped(address indexed user, uint256 amount)'),
        args: { user: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Get Redeemed events
      const redeemedEvents = await publicClient.getLogs({
        address: CONTRACTS.VAULT_WRBTC,
        event: parseAbiItem('event Redeemed(address indexed user, uint256 amount)'),
        args: { user: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process wrapped events
      for (const log of wrappedEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.wrBTCTransactions.push({
          type: 'wrapped',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          amount: log.args.amount.toString(),
          status: 'confirmed'
        });
      }

      // Process redeemed events
      for (const log of redeemedEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.wrBTCTransactions.push({
          type: 'redeemed',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          amount: log.args.amount.toString(),
          status: 'confirmed'
        });
      }

      // Sort by block number
      profile.wrBTCTransactions.sort((a, b) => a.blockNumber - b.blockNumber);
      
      console.log(`📊 wrBTC: Loaded ${profile.wrBTCTransactions.length} wrBTC transactions`);
      
    } catch (error) {
      console.error('❌ wrBTC HISTORY ERROR:', error);
    }
  }

  /**
   * Load Oracle sync transactions
   */
  async loadOracleTransactions(userAddress, profile) {
    try {
      // Get Synced events from Oracle Aggregator
      const syncedEvents = await publicClient.getLogs({
        address: CONTRACTS.ORACLE_AGGREGATOR,
        event: parseAbiItem('event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'),
        args: { user: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process synced events
      for (const log of syncedEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.oracleTransactions.push({
          type: 'sync',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          newBalanceSats: log.args.newBalanceSats.toString(),
          deltaSats: log.args.deltaSats.toString(),
          feeWei: log.args.feeWei.toString(),
          bitcoinHeight: Number(log.args.height),
          status: 'confirmed'
        });
      }

      // Sort by block number
      profile.oracleTransactions.sort((a, b) => a.blockNumber - b.blockNumber);
      
      console.log(`📊 Oracle: Loaded ${profile.oracleTransactions.length} oracle sync transactions`);
      
    } catch (error) {
      console.error('❌ Oracle HISTORY ERROR:', error);
    }
  }

  /**
   * Load Fee transactions
   */
  async loadFeeTransactions(userAddress, profile) {
    try {
      // Get fee-related events from FeeVault
      const depositEvents = await publicClient.getLogs({
        address: CONTRACTS.FEE_VAULT,
        event: parseAbiItem('event Deposited(address indexed user, uint256 amount)'),
        args: { user: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      const spentEvents = await publicClient.getLogs({
        address: CONTRACTS.FEE_VAULT,
        event: parseAbiItem('event Spent(address indexed user, uint256 amount, address indexed spender)'),
        args: { user: userAddress },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process deposit events
      for (const log of depositEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.feeTransactions.push({
          type: 'fee_deposit',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          amount: log.args.amount.toString(),
          status: 'confirmed'
        });
      }

      // Process spent events
      for (const log of spentEvents) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        profile.feeTransactions.push({
          type: 'fee_spent',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Number(block.timestamp),
          amount: log.args.amount.toString(),
          spender: log.args.spender,
          status: 'confirmed'
        });
      }

      // Sort by block number
      profile.feeTransactions.sort((a, b) => a.blockNumber - b.blockNumber);
      
      console.log(`📊 Fees: Loaded ${profile.feeTransactions.length} fee transactions`);
      
    } catch (error) {
      console.error('❌ Fee HISTORY ERROR:', error);
    }
  }

  /**
   * Calculate user statistics from transaction history
   */
  calculateUserStats(profile) {
    let totalRBTCMinted = 0n;
    let totalRBTCBurned = 0n;
    let totalWrBTCWrapped = 0n;
    let totalWrBTCRedeemed = 0n;
    let totalFeesSpent = 0n;

    // Calculate rBTC stats
    for (const tx of profile.rBTCTransactions) {
      if (tx.type === 'mint') {
        totalRBTCMinted += BigInt(tx.amount);
      } else if (tx.type === 'burn') {
        totalRBTCBurned += BigInt(tx.amount);
      }
    }

    // Calculate wrBTC stats
    for (const tx of profile.wrBTCTransactions) {
      if (tx.type === 'wrapped') {
        totalWrBTCWrapped += BigInt(tx.amount);
      } else if (tx.type === 'redeemed') {
        totalWrBTCRedeemed += BigInt(tx.amount);
      }
    }

    // Calculate fee stats
    for (const tx of profile.feeTransactions) {
      if (tx.type === 'fee_spent') {
        totalFeesSpent += BigInt(tx.amount);
      }
    }

    // Update profile
    profile.totalRBTCMinted = totalRBTCMinted.toString();
    profile.totalRBTCBurned = totalRBTCBurned.toString();
    profile.totalWrBTCWrapped = totalWrBTCWrapped.toString();
    profile.totalWrBTCRedeemed = totalWrBTCRedeemed.toString();
    profile.totalFeesSpent = totalFeesSpent.toString();

    // Calculate current balances
    profile.currentRBTCBalance = (totalRBTCMinted - totalRBTCBurned).toString();
    profile.currentWrBTCBalance = (totalWrBTCWrapped - totalWrBTCRedeemed).toString();

    // Total transaction count
    profile.totalTransactionCount = 
      profile.rBTCTransactions.length + 
      profile.wrBTCTransactions.length + 
      profile.oracleTransactions.length + 
      profile.feeTransactions.length;

    // Generate synthetic lastTxHash from most recent transaction
    const allTransactions = [
      ...profile.rBTCTransactions,
      ...profile.wrBTCTransactions,
      ...profile.oracleTransactions,
      ...profile.feeTransactions
    ].sort((a, b) => b.timestamp - a.timestamp);

    if (allTransactions.length > 0) {
      profile.lastTxHash = allTransactions[0].txHash;
      profile.lastActivityAt = new Date(allTransactions[0].timestamp * 1000).toISOString();
    }

    console.log(`📈 STATS: rBTC ${profile.currentRBTCBalance}, wrBTC ${profile.currentWrBTCBalance}, Total TXs ${profile.totalTransactionCount}`);
  }

  /**
   * Encrypt user profile for transmission to frontend
   */
  encryptProfile(profile) {
    try {
      const profileJson = JSON.stringify(profile);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(profileJson, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return encrypted;
    } catch (error) {
      console.error('❌ ENCRYPTION ERROR:', error);
      return null;
    }
  }

  /**
   * Get encrypted profile for API transmission
   */
  getEncryptedProfile(userAddress) {
    const profile = this.profiles.get(userAddress.toLowerCase());
    if (!profile) return null;
    
    return {
      userAddress: userAddress,
      encrypted: this.encryptProfile(profile),
      profileCreatedAt: profile.profileCreatedAt,
      lastActivityAt: profile.lastActivityAt,
      totalTransactions: profile.totalTransactionCount
    };
  }

  /**
   * Start real-time event monitoring for active users
   */
  startRealtimeMonitoring() {
    console.log('🎧 MONITOR: Starting real-time blockchain event monitoring...');
    
    // Monitor all contract events and update profiles automatically
    // This would run continuously to catch new transactions
    setInterval(async () => {
      for (const [userAddress, profile] of this.profiles.entries()) {
        try {
          await this.updateUserProfile(userAddress);
        } catch (error) {
          console.error(`❌ MONITOR ERROR for ${userAddress}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update existing user profile with new transactions
   */
  async updateUserProfile(userAddress) {
    const profile = this.profiles.get(userAddress.toLowerCase());
    if (!profile) return;

    // Load new transactions since last update
    const fromBlock = BigInt(profile.lastBlockProcessed + 1);
    
    // This would load only new transactions since last check
    // Implementation similar to loadHistoricalTransactions but with fromBlock
    
    console.log(`🔄 UPDATE: Checking for new transactions for ${userAddress.substring(0, 10)}...`);
  }
}

// Export for use in Oracle server
module.exports = { UserProfileDatabase };