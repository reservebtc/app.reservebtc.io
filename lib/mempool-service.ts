/**
 * Mempool.space Bitcoin Balance Service
 * Professional Bitcoin balance fetching with caching and error handling
 * Supports both Mainnet and Testnet addresses
 */

import { professionalLogger } from './professional-logger'

export interface AddressBalance {
  address: string
  balance: number // в BTC
  network: 'mainnet' | 'testnet'
  transactions: number
  lastUpdated: string
}

interface MempoolAddressInfo {
  address: string
  chain_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
  mempool_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
}

// Legacy interface for backward compatibility
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

class MempoolService {
  private cache = new Map<string, { data: AddressBalance; timestamp: number }>()
  private readonly CACHE_TTL = 30000 // 30 секунд
  private readonly MAINNET_URL = 'https://mempool.space/api'
  private readonly TESTNET_URL = 'https://mempool.space/testnet/api'

  private detectNetwork(address: string): 'mainnet' | 'testnet' {
    if (address.startsWith('tb1') || address.startsWith('2') || 
        address.startsWith('m') || address.startsWith('n')) {
      return 'testnet'
    }
    return 'mainnet'
  }

  // ИСПРАВЛЕНИЕ: Добавить валидацию Bitcoin адресов
  private validateBitcoinAddress(address: string): boolean {
    // Базовая валидация формата
    if (!address || typeof address !== 'string') {
      return false
    }
    
    // Testnet адреса
    if (address.startsWith('tb1')) {
      // Bech32 testnet должен быть 42 символа для обычных адресов
      return address.length >= 42 && address.length <= 62 && /^tb1[ac-hj-np-z02-9]{39,59}$/.test(address)
    }
    
    // Mainnet bech32
    if (address.startsWith('bc1')) {
      return address.length >= 42 && address.length <= 62 && /^bc1[ac-hj-np-z02-9]{39,59}$/.test(address)
    }
    
    // Legacy адреса (P2PKH, P2SH)
    if (/^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
      return true
    }
    
    return false
  }

  private getApiUrl(network: 'mainnet' | 'testnet'): string {
    return network === 'testnet' ? this.TESTNET_URL : this.MAINNET_URL
  }


  private satoshiToBtc(satoshi: number): number {
    return satoshi / 100000000
  }


  async getAddressBalance(address: string): Promise<AddressBalance> {
    // ИСПРАВЛЕНИЕ: Валидация адреса перед API вызовами
    if (!this.validateBitcoinAddress(address)) {
      professionalLogger.error('MEMPOOL', 'INVALID_ADDRESS', new Error(`Invalid Bitcoin address format: ${address}`))
      return {
        address,
        balance: 0,
        network: this.detectNetwork(address),
        transactions: 0,
        lastUpdated: new Date().toISOString()
      }
    }

    const cacheKey = `balance_${address}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      professionalLogger.mempool('CACHE_HIT', 'SUCCESS', `Cached balance for ${address.slice(0, 8)}...`)
      return cached.data
    }

    const network = this.detectNetwork(address)
    const apiUrl = this.getApiUrl(network)
    const startTime = performance.now()
    
    // ИСПРАВЛЕНИЕ: Использовать только Mempool.space API
    try {
      professionalLogger.mempool('FETCH_BALANCE', 'INFO', `Fetching ${network} balance for ${address.slice(0, 8)}... from Mempool.space`)
      
      const response = await fetch(`${apiUrl}/address/${address}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ReserveBTC-Frontend/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        // ИСПРАВЛЕНИЕ: Детальное логирование 400 ошибок
        if (response.status === 400) {
          const errorText = await response.text().catch(() => 'Unable to read error text')
          professionalLogger.error('MEMPOOL', 'BAD_REQUEST', new Error(`Mempool API 400 error for ${address}: ${errorText}`), undefined, { address, network, status: 400, errorText })
          
          // Возвращаем нулевой баланс при 400 ошибке
          return {
            address,
            balance: 0,
            network,
            transactions: 0,
            lastUpdated: new Date().toISOString()
          }
        }
        
        throw new Error(`Mempool API error: ${response.status} ${response.statusText}`)
      }

      const data: MempoolAddressInfo = await response.json()
      
      // Исправленный расчет баланса
      const fundedSum = (data.chain_stats?.funded_txo_sum || 0) + (data.mempool_stats?.funded_txo_sum || 0)
      const spentSum = (data.chain_stats?.spent_txo_sum || 0) + (data.mempool_stats?.spent_txo_sum || 0)
      const balanceSatoshi = fundedSum - spentSum
      const balanceBtc = this.satoshiToBtc(balanceSatoshi)
      
      const totalTransactions = (data.chain_stats?.tx_count || 0) + (data.mempool_stats?.tx_count || 0)
      
      const balance: AddressBalance = {
        address,
        balance: Math.max(0, balanceBtc), // Убеждаемся что баланс не отрицательный
        network,
        transactions: totalTransactions,
        lastUpdated: new Date().toISOString()
      }

      // Кэшируем результат
      this.cache.set(cacheKey, { data: balance, timestamp: Date.now() })
      
      const duration = Math.round(performance.now() - startTime)
      professionalLogger.mempool('FETCH_BALANCE', 'SUCCESS', 
        `Balance fetched for ${address.slice(0, 8)}... = ${balanceBtc} BTC from Mempool.space`, undefined, duration)
      
      return balance

    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      professionalLogger.error('MEMPOOL', 'FETCH_BALANCE_FAILED', error instanceof Error ? error : new Error(String(error)), undefined, { address, network, duration })
      
      // Возвращаем нулевой баланс при ошибке
      return {
        address,
        balance: 0,
        network,
        transactions: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  async getAggregatedBalance(addresses: string[]): Promise<{
    mainnet: number
    testnet: number
    total: number
    addressCount: { mainnet: number; testnet: number }
  }> {
    if (addresses.length === 0) {
      return { mainnet: 0, testnet: 0, total: 0, addressCount: { mainnet: 0, testnet: 0 } }
    }

    const startTime = performance.now()
    
    try {
      const balances = await Promise.all(
        addresses.map(address => this.getAddressBalance(address))
      )

      const aggregated = balances.reduce(
        (acc, balance) => {
          if (balance.network === 'mainnet') {
            acc.mainnet += balance.balance
            acc.addressCount.mainnet++
          } else {
            acc.testnet += balance.balance
            acc.addressCount.testnet++
          }
          return acc
        },
        { mainnet: 0, testnet: 0, total: 0, addressCount: { mainnet: 0, testnet: 0 } }
      )

      aggregated.total = aggregated.mainnet + aggregated.testnet
      
      const duration = Math.round(performance.now() - startTime)
      professionalLogger.mempool('AGGREGATE_BALANCE', 'SUCCESS', 
        `Aggregated balance for ${addresses.length} addresses`, undefined, duration)
      
      return aggregated
      
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      professionalLogger.error('MEMPOOL', 'AGGREGATE_BALANCE_FAILED', error instanceof Error ? error : new Error(String(error)), undefined, { addressCount: addresses.length, duration })
      
      return { mainnet: 0, testnet: 0, total: 0, addressCount: { mainnet: 0, testnet: 0 } }
    }
  }

  clearCache(): void {
    this.cache.clear()
    professionalLogger.mempool('CACHE_CLEAR', 'SUCCESS', 'Mempool service cache cleared')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // Legacy methods for backward compatibility
  async hasSpentCoins(address: string): Promise<boolean> {
    try {
      const balance = await this.getAddressBalance(address)
      return balance.transactions > 0
    } catch (error) {
      professionalLogger.error('MEMPOOL', 'HAS_SPENT_COINS_FAILED', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  async getTransactionCount(address: string): Promise<number> {
    try {
      const balance = await this.getAddressBalance(address)
      return balance?.transactions || 0
    } catch (error) {
      professionalLogger.error('MEMPOOL', 'GET_TX_COUNT_FAILED', error instanceof Error ? error : new Error(String(error)))
      return 0
    }
  }
}

// Export singleton instance
export const mempoolService = new MempoolService()

// Export types
export type { BitcoinAddressBalance }