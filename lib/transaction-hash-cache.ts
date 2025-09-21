/**
 * Professional Transaction Hash Cache System
 * Efficiently correlates Oracle users with blockchain transaction hashes
 * Caches results to minimize RPC calls and improve performance
 */

interface TransactionHashMapping {
  oracleUserHash: string;
  blockchainTxHash: string;
  amount: string;
  timestamp: string;
  blockNumber: number;
  cached: number; // Cache timestamp
}

interface CacheConfig {
  maxAge: number; // Cache duration in milliseconds
  maxEntries: number; // Maximum cached entries
  rpcUrl: string;
}

class TransactionHashCache {
  private cache = new Map<string, TransactionHashMapping>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 1000,
      rpcUrl: 'https://carrot.megaeth.com/rpc',
      ...config
    };
  }

  /**
   * Get transaction hash for Oracle user with intelligent caching
   */
  async getTransactionHashForUser(
    oracleUserHash: string,
    oracleUserData: any,
    ethAddress?: string
  ): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(oracleUserHash);
    if (cached && this.isCacheValid(cached)) {
      console.log(`✅ Cache hit for user ${oracleUserHash}: ${cached.blockchainTxHash}`);
      return cached.blockchainTxHash;
    }

    // Try correlation with blockchain
    const txHash = await this.correlateWithBlockchain(oracleUserHash, oracleUserData, ethAddress);
    
    if (txHash) {
      // Cache the successful correlation
      this.cacheMapping(oracleUserHash, {
        oracleUserHash,
        blockchainTxHash: txHash,
        amount: (oracleUserData.lastSyncedBalance / 100000000).toString(),
        timestamp: oracleUserData.registeredAt,
        blockNumber: 0, // Could be populated if needed
        cached: Date.now()
      });
    }

    return txHash;
  }

  /**
   * Correlate Oracle user with blockchain transactions
   */
  private async correlateWithBlockchain(
    oracleUserHash: string,
    oracleUserData: any,
    ethAddress?: string
  ): Promise<string | null> {
    if (!oracleUserData.transactionCount || oracleUserData.transactionCount === 0) {
      return null;
    }

    console.log(`🔍 Correlating user ${oracleUserHash} with blockchain...`);

    try {
      const latestBlock = await this.getLatestBlockNumber();
      if (!latestBlock) return null;

      // Calculate search range based on user registration time
      const registrationTime = new Date(oracleUserData.registeredAt).getTime();
      const currentTime = Date.now();
      const timeDiffHours = Math.min((currentTime - registrationTime) / (1000 * 60 * 60), 24 * 7); // Max 7 days back
      
      // Estimate blocks to search (MegaETH ~2 second blocks)
      const blocksToSearch = Math.min(Math.ceil(timeDiffHours * 30 * 60), 50000); // Max 50k blocks
      const fromBlock = Math.max(latestBlock - blocksToSearch, 0);

      console.log(`   Searching ${blocksToSearch} blocks from ${fromBlock} to ${latestBlock}`);

      // Search for mint transactions in rBTC-SYNTH contract
      const mintTxs = await this.searchMintTransactions(fromBlock, latestBlock);
      
      if (mintTxs.length === 0) {
        console.log(`   ❌ No mint transactions found in search range`);
        return null;
      }

      console.log(`   ✅ Found ${mintTxs.length} mint transactions`);

      // Strategy 1: Match by amount if balance is unique
      if (oracleUserData.lastSyncedBalance > 0) {
        const expectedAmount = oracleUserData.lastSyncedBalance;
        
        for (const tx of mintTxs) {
          if (tx.amount === expectedAmount) {
            console.log(`   ✅ Amount match found: ${tx.hash} (${expectedAmount} sats)`);
            return tx.hash;
          }
        }
      }

      // Strategy 2: Match by timing proximity
      const targetTime = registrationTime;
      let bestMatch = null;
      let bestTimeDiff = Infinity;

      for (const tx of mintTxs) {
        const txTime = tx.timestamp * 1000; // Convert to milliseconds
        const timeDiff = Math.abs(txTime - targetTime);
        
        if (timeDiff < 10 * 60 * 1000 && timeDiff < bestTimeDiff) { // Within 10 minutes
          bestMatch = tx;
          bestTimeDiff = timeDiff;
        }
      }

      if (bestMatch) {
        console.log(`   ✅ Time correlation found: ${bestMatch.hash} (${bestTimeDiff / 1000}s difference)`);
        return bestMatch.hash;
      }

      // Strategy 3: Return most recent transaction as fallback
      if (mintTxs.length > 0) {
        const mostRecent = mintTxs[mintTxs.length - 1];
        console.log(`   ⚠️ Using most recent transaction as fallback: ${mostRecent.hash}`);
        return mostRecent.hash;
      }

    } catch (error) {
      console.error(`   ❌ Blockchain correlation failed:`, error);
    }

    return null;
  }

  /**
   * Search for sync transactions in OracleAggregator contract
   */
  private async searchMintTransactions(fromBlock: number, toBlock: number) {
    const contractAddress = '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc'; // OracleAggregator
    
    const response = await this.makeRpcRequest('eth_getLogs', [{
      address: contractAddress,
      fromBlock: `0x${fromBlock.toString(16)}`,
      toBlock: `0x${toBlock.toString(16)}`,
      topics: [
        '0xbd74477ace0e09075451becb82bdae1c9a11698b13f8488ab67f55722444eb84' // Synced event from OracleAggregator
      ]
    }]);

    const logs = response.result || [];
    const transactions = [];

    for (const log of logs.slice(-20)) { // Process last 20 mint transactions
      try {
        const txDetails = await this.makeRpcRequest('eth_getTransactionByHash', [log.transactionHash]);
        const blockDetails = await this.makeRpcRequest('eth_getBlockByNumber', [log.blockNumber, false]);
        
        if (txDetails.result && blockDetails.result) {
          // Parse Synced event data: (address user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)
          const userAddress = `0x${log.topics[1].slice(26)}`; // Extract user address from indexed topic
          
          // Parse data field to extract amounts
          const data = log.data.slice(2); // Remove 0x prefix
          const newBalanceSats = parseInt(data.slice(0, 16), 16); // First 8 bytes (uint64)
          const deltaSats = parseInt(data.slice(16, 32), 16); // Next 8 bytes (int64)
          
          transactions.push({
            hash: log.transactionHash,
            amount: newBalanceSats,
            timestamp: parseInt(blockDetails.result.timestamp, 16),
            blockNumber: parseInt(log.blockNumber, 16),
            to: userAddress
          });
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    }

    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Make RPC request to blockchain
   */
  private async makeRpcRequest(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.config.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get latest block number
   */
  private async getLatestBlockNumber(): Promise<number | null> {
    try {
      const response = await this.makeRpcRequest('eth_blockNumber');
      return response.result ? parseInt(response.result as string, 16) : null;
    } catch (error) {
      console.error('Error getting latest block:', error);
      return null;
    }
  }

  /**
   * Cache management
   */
  private isCacheValid(cached: TransactionHashMapping): boolean {
    return (Date.now() - cached.cached) < this.config.maxAge;
  }

  private cacheMapping(key: string, mapping: TransactionHashMapping) {
    // Clean old entries if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, mapping);
    console.log(`💾 Cached transaction mapping: ${key} -> ${mapping.blockchainTxHash}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      maxAge: this.config.maxAge / (1000 * 60 * 60) // in hours
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Transaction hash cache cleared');
  }
}

// Export singleton instance
export const transactionHashCache = new TransactionHashCache();

/**
 * Convenience function for dashboard use
 */
export async function getTransactionHashForOracleUser(
  oracleUserHash: string,
  oracleUserData: any,
  ethAddress?: string
): Promise<string | null> {
  return transactionHashCache.getTransactionHashForUser(oracleUserHash, oracleUserData, ethAddress);
}