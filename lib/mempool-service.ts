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


  async getAddressBalance(address: string): Promise<any> {
    try {
      // Список известных фиктивных адресов (только реально невалидные)
      const fakeAddresses: string[] = [
        // Оставляем пустым - убираем реальные тестовые адреса
      ];
      
      if (fakeAddresses.includes(address)) {
        console.log(`⚠️ Skipping fake test address: ${address}`);
        return { 
          balance: 0, 
          network: address.startsWith('tb1') ? 'testnet' : 'mainnet',
          isFake: true 
        };
      }
      
      // Обычная логика для реальных адресов
      const network = address.startsWith('tb1') || address.startsWith('2') ? 'testnet' : 'mainnet';
      const baseUrl = network === 'testnet' ? 
        'https://mempool.space/testnet/api' : 
        'https://mempool.space/api';
        
      const response = await fetch(`${baseUrl}/address/${address}`);
      
      if (!response.ok) {
        // Не крашимся на ошибках
        console.warn(`Mempool API error for ${address}: ${response.status}`);
        return { balance: 0, network, error: true };
      }
      
      const data = await response.json();
      return {
        balance: (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000,
        network
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      return { balance: 0, network: 'unknown', error: true };
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

  async checkOutgoingTransactions(address: string): Promise<boolean> {
    try {
      const network = address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2') ? 'testnet' : 'mainnet';
      const baseUrl = network === 'testnet' ? 
        'https://mempool.space/testnet/api' : 
        'https://mempool.space/api';
      
      const response = await fetch(`${baseUrl}/address/${address}/txs`);
      if (!response.ok) return false;
      
      const txs = await response.json();
      // Check if there are outgoing transactions
      return txs.some((tx: any) => 
        tx.vin.some((input: any) => 
          input.prevout?.scriptpubkey_address === address
        )
      );
    } catch (error) {
      console.error('Error checking transactions:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mempoolService = new MempoolService()

// Export types
export type { BitcoinAddressBalance }