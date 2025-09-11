/**
 * Mempool.space Bitcoin Balance Service
 * Professional Bitcoin balance fetching with caching and error handling
 * Supports both Mainnet and Testnet addresses
 */

interface BitcoinAddressBalance {
  address: string
  balance: number // in BTC
  network: 'mainnet' | 'testnet'
  funded_txo_count: number
  funded_txo_sum: number
  spent_txo_count: number
  spent_txo_sum: number
  tx_count: number
  unconfirmed_balance: number
  lastUpdated: number
}

interface MempoolAddressStats {
  address: string
  funded_txo_count: number
  funded_txo_sum: number
  spent_txo_count: number
  spent_txo_sum: number
  tx_count: number
  unconfirmed_tx_count?: number
}

class MempoolService {
  private cache: Map<string, { data: BitcoinAddressBalance; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 15000 // 15 seconds for frequent updates
  private readonly MAINNET_BASE_URL = 'https://mempool.space/api'
  private readonly TESTNET_BASE_URL = 'https://mempool.space/testnet/api'

  /**
   * Determine network type from Bitcoin address
   */
  private getNetworkFromAddress(address: string): 'mainnet' | 'testnet' {
    if (address.startsWith('tb1') || address.startsWith('2') || 
        address.startsWith('m') || address.startsWith('n')) {
      return 'testnet'
    }
    return 'mainnet'
  }

  /**
   * Get the appropriate API base URL for the network
   */
  private getBaseUrl(network: 'mainnet' | 'testnet'): string {
    return network === 'testnet' ? this.TESTNET_BASE_URL : this.MAINNET_BASE_URL
  }

  /**
   * Fetch Bitcoin balance for a specific address
   */
  async getAddressBalance(address: string): Promise<BitcoinAddressBalance | null> {
    const cacheKey = address
    const cached = this.cache.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log(`📋 MEMPOOL: Using cached balance for ${address.substring(0, 8)}...`)
      return cached.data
    }

    try {
      const network = this.getNetworkFromAddress(address)
      const baseUrl = this.getBaseUrl(network)
      
      console.log(`🔍 MEMPOOL: Fetching ${network} balance for ${address.substring(0, 8)}...`)
      
      const response = await fetch(`${baseUrl}/address/${address}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`💰 MEMPOOL: Address ${address.substring(0, 8)}... not found - assuming zero balance`)
          return {
            address,
            balance: 0,
            network,
            funded_txo_count: 0,
            funded_txo_sum: 0,
            spent_txo_count: 0,
            spent_txo_sum: 0,
            tx_count: 0,
            unconfirmed_balance: 0,
            lastUpdated: Date.now()
          }
        }
        throw new Error(`Mempool API error: ${response.status}`)
      }

      const stats: MempoolAddressStats = await response.json()
      
      // Calculate balance: funded - spent (in satoshis, convert to BTC)
      const balanceSatoshis = stats.funded_txo_sum - stats.spent_txo_sum
      const balanceBTC = balanceSatoshis / 100000000 // Convert satoshis to BTC
      
      const balanceData: BitcoinAddressBalance = {
        address,
        balance: balanceBTC,
        network,
        funded_txo_count: stats.funded_txo_count,
        funded_txo_sum: stats.funded_txo_sum,
        spent_txo_count: stats.spent_txo_count,
        spent_txo_sum: stats.spent_txo_sum,
        tx_count: stats.tx_count,
        unconfirmed_balance: 0, // Mempool.space doesn't provide this in basic endpoint
        lastUpdated: Date.now()
      }
      
      this.cache.set(cacheKey, { data: balanceData, timestamp: Date.now() })
      
      console.log(`✅ MEMPOOL: Balance fetched for ${address.substring(0, 8)}... = ${balanceBTC} BTC`)
      
      return balanceData
    } catch (error) {
      console.error(`❌ MEMPOOL: Failed to fetch balance for ${address.substring(0, 8)}...`, error)
      return null
    }
  }

  /**
   * Get aggregated balance for multiple addresses
   */
  async getAggregatedBalance(addresses: string[]): Promise<{
    totalBalance: number
    balancesByAddress: Record<string, number>
    networks: { mainnet: number; testnet: number }
    totalAddresses: number
    successfulFetches: number
  }> {
    if (addresses.length === 0) {
      return {
        totalBalance: 0,
        balancesByAddress: {},
        networks: { mainnet: 0, testnet: 0 },
        totalAddresses: 0,
        successfulFetches: 0
      }
    }

    console.log(`📊 MEMPOOL: Fetching aggregated balance for ${addresses.length} addresses`)
    
    const results = await Promise.allSettled(
      addresses.map(addr => this.getAddressBalance(addr))
    )

    let totalBalance = 0
    const balancesByAddress: Record<string, number> = {}
    const networks = { mainnet: 0, testnet: 0 }
    let successfulFetches = 0

    results.forEach((result, index) => {
      const address = addresses[index]
      
      if (result.status === 'fulfilled' && result.value) {
        const balance = result.value.balance
        const network = result.value.network
        
        totalBalance += balance
        balancesByAddress[address] = balance
        networks[network] += balance
        successfulFetches++
      } else {
        console.warn(`⚠️ MEMPOOL: Failed to fetch balance for ${address.substring(0, 8)}...`)
        balancesByAddress[address] = 0
      }
    })

    console.log(`✅ MEMPOOL: Aggregated ${successfulFetches}/${addresses.length} balances = ${totalBalance} BTC`)
    
    return {
      totalBalance,
      balancesByAddress,
      networks,
      totalAddresses: addresses.length,
      successfulFetches
    }
  }

  /**
   * Check if address has spent any coins (has outgoing transactions)
   */
  async hasSpentCoins(address: string): Promise<boolean> {
    try {
      const balance = await this.getAddressBalance(address)
      if (!balance) return false
      
      return balance.spent_txo_count > 0
    } catch (error) {
      console.error(`❌ MEMPOOL: Error checking spent coins for ${address.substring(0, 8)}...`, error)
      return false
    }
  }

  /**
   * Get transaction count for address
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      const balance = await this.getAddressBalance(address)
      return balance?.tx_count || 0
    } catch (error) {
      console.error(`❌ MEMPOOL: Error getting tx count for ${address.substring(0, 8)}...`, error)
      return 0
    }
  }

  /**
   * Clear cache for specific address or all addresses
   */
  clearCache(address?: string): void {
    if (address) {
      this.cache.delete(address)
      console.log(`🗑️ MEMPOOL: Cache cleared for ${address.substring(0, 8)}...`)
    } else {
      this.cache.clear()
      console.log('🗑️ MEMPOOL: All cache cleared')
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; addresses: string[] } {
    return {
      size: this.cache.size,
      addresses: Array.from(this.cache.keys()).map(addr => addr.substring(0, 8) + '...')
    }
  }
}

// Export singleton instance
export const mempoolService = new MempoolService()

// Export types
export type { BitcoinAddressBalance }