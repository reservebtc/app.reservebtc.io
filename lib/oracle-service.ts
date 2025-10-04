import { decryptOracleData, UserData } from './oracle-decryption'

interface EncryptedOracleResponse {
  encrypted: boolean
  data: string
  iv: string
  authTag?: string
  algorithm: string
  timestamp: string
  additionalData?: string
}

// Performance monitoring utility
class PerformanceMonitor {
  private static requestQueue: Map<string, Promise<any>> = new Map()
  
  static async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!
    }
    
    const promise = fn().finally(() => {
      setTimeout(() => this.requestQueue.delete(key), 100)
    })
    
    this.requestQueue.set(key, promise)
    return promise
  }
  
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallbackValue: T
  ): Promise<T> {
    const timeout = new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallbackValue), timeoutMs)
    )
    
    return Promise.race([promise, timeout])
  }
}

class OracleService {
  private baseUrl: string
  private apiKey: string
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30000 // 30 seconds

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'
    this.apiKey = process.env.NEXT_PUBLIC_ORACLE_API_KEY || ''
  }

  /**
   * Get decrypted user data from Professional Oracle with performance optimization
   */
  async getDecryptedUsers(): Promise<UserData[] | null> {
    const cacheKey = 'all_users'
    
    // Use performance deduplicate for parallel requests
    return PerformanceMonitor.deduplicate(cacheKey, async () => {
      const cached = this.cache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
        console.log('🔐 DEBUG: Using cached Oracle data')
        return cached.data
      }

      try {
        console.log('🔐 ORACLE SERVICE: Fetching encrypted user data...')
        
        const fetchPromise = fetch(`${this.baseUrl}/users`, {
          headers: {
            'x-api-key': this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'ReserveBTC-Frontend/1.0'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        const response = await PerformanceMonitor.withTimeout(
          fetchPromise,
          5000,
          null as any
        )

        if (!response || !response.ok) {
          console.error('❌ ORACLE SERVICE: API response not OK')
          return null
        }

        const encryptedResponse: EncryptedOracleResponse = await response.json()
        
        if (!encryptedResponse.encrypted) {
          console.warn('❌ ORACLE SERVICE: Response is not encrypted')
          return null
        }

        const decryptedData = await decryptOracleData(encryptedResponse)
        
        if (decryptedData) {
          this.cache.set(cacheKey, { data: decryptedData, timestamp: Date.now() })
          console.log('✅ ORACLE SERVICE: Data ready')
        }
        
        return decryptedData
      } catch (error) {
        console.error('❌ ORACLE SERVICE: Failed to get decrypted users:', error)
        return null
      }
    })
  }

  /**
   * Get specific user by ETH address with performance optimization
   */
  async getUserByAddress(ethAddress: string): Promise<UserData | null> {
    const userCacheKey = `user_${ethAddress.toLowerCase()}`
    
    return PerformanceMonitor.deduplicate(userCacheKey, async () => {
      // Check user-specific cache first
      const cached = this.cache.get(userCacheKey)
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
        return cached.data
      }

      try {
        console.log('🔍 ORACLE SERVICE: Getting user by address:', ethAddress.slice(0, 8) + '...')
        
        const allUsers = await this.getDecryptedUsers()
        
        if (!allUsers) {
          console.log('❌ ORACLE SERVICE: No users data available')
          return null
        }
        
        const normalizedAddress = ethAddress.toLowerCase()
        const originalAddress = ethAddress
        
        const user = allUsers.find((u: UserData) => {
          if (!u.ethAddress) return false
          
          return u.ethAddress.toLowerCase() === normalizedAddress ||
                 u.ethAddress === originalAddress ||
                 u.ethAddress === ethAddress
        })
        
        if (user) {
          const userDataAny = user as any
          
          const bitcoinAddresses = [
            ...(user.btcAddresses || []),
            ...(userDataAny.bitcoinAddresses || []),
            ...(userDataAny.bitcoin_addresses || []),
            ...(user.btcAddress ? [user.btcAddress] : []),
            ...(user.bitcoinAddress ? [user.bitcoinAddress] : [])
          ].filter(Boolean).filter((addr, index, array) => array.indexOf(addr) === index)
          
          const enhancedUser = {
            ...user,
            processedBitcoinAddresses: bitcoinAddresses,
            allBitcoinAddresses: bitcoinAddresses
          } as UserData & { processedBitcoinAddresses: string[], allBitcoinAddresses: string[] }
          
          // Cache the specific user
          this.cache.set(userCacheKey, { data: enhancedUser, timestamp: Date.now() })
          
          console.log('✅ ORACLE SERVICE: User found with', Object.keys(user).length, 'fields')
          return enhancedUser
        } else {
          console.log('⚠️ ORACLE SERVICE: User not found in Oracle data')
          return null
        }
      } catch (error) {
        console.error('❌ ORACLE SERVICE: Failed to get user:', error)
        return null
      }
    })
  }

  // Keep all other methods as they are...
  async findUserByBitcoinAddress(bitcoinAddress: string): Promise<UserData | null> {
    const allUsers = await this.getDecryptedUsers()
    
    if (!allUsers) return null

    return allUsers.find(user => {
      const userDataAny = user as any
      const addresses = [
        user.btcAddress,
        user.bitcoinAddress,
        ...(user.btcAddresses || []),
        ...(userDataAny.bitcoinAddresses || []),
        ...(userDataAny.bitcoin_addresses || [])
      ].filter(Boolean).flat()
      
      return addresses.some(addr => 
        addr?.toLowerCase() === bitcoinAddress.toLowerCase()
      )
    }) || null
  }

  async findUserByCorrelation(ethAddress: string): Promise<UserData | null> {
    const allUsers = await this.getDecryptedUsers()
    
    if (!allUsers) return null

    return allUsers.find(user => {
      if (user.ethAddress?.toLowerCase() === ethAddress.toLowerCase()) return true
      
      return false
    }) || null
  }

  async isBitcoinAddressUsed(bitcoinAddress: string, excludeEthAddress?: string): Promise<boolean> {
    const allUsers = await this.getDecryptedUsers()
    
    if (!allUsers) return false

    return allUsers.some(user => {
      if (excludeEthAddress && user.ethAddress?.toLowerCase() === excludeEthAddress.toLowerCase()) {
        return false
      }
      
      if (user.bitcoinAddress === bitcoinAddress) return true
      if (user.btcAddress === bitcoinAddress) return true
      if (user.btcAddresses?.includes(bitcoinAddress)) return true
      
      const userDataAny = user as any
      if (userDataAny.bitcoin_address === bitcoinAddress) return true
      if (userDataAny.BTC_ADDRESS === bitcoinAddress) return true
      
      return false
    })
  }

  async getStatus(): Promise<any> {
    try {
      const response = await PerformanceMonitor.withTimeout(
        fetch(`${this.baseUrl}/status`, {
          headers: {
            'User-Agent': 'ReserveBTC-Frontend/1.0'
          },
          signal: AbortSignal.timeout(3000)
        }),
        3000,
        null
      )
      
      if (!response) return null
      return await response.json()
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to get status:', error)
      return null
    }
  }

  getUserBitcoinAddresses(user: any): string[] {
    if (!user) return []
    
    if (user.bitcoinAddresses && Array.isArray(user.bitcoinAddresses)) {
      return user.bitcoinAddresses
    }
    
    if (user.btcAddresses && Array.isArray(user.btcAddresses)) {
      return user.btcAddresses
    }
    
    if (user.bitcoin_addresses && Array.isArray(user.bitcoin_addresses)) {
      return user.bitcoin_addresses
    }
    
    if (user.processedBitcoinAddresses && Array.isArray(user.processedBitcoinAddresses)) {
      return user.processedBitcoinAddresses
    }
    
    if (user.allBitcoinAddresses && Array.isArray(user.allBitcoinAddresses)) {
      return user.allBitcoinAddresses
    }
    
    if (user.bitcoinAddress) {
      return [user.bitcoinAddress]
    }
    
    if (user.btcAddress) {
      return [user.btcAddress]
    }
    
    return []
  }

  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ ORACLE SERVICE: Cache cleared')
  }

  async createUserProfile(ethAddress: string, bitcoinAddress?: string, signature?: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      console.log('🔧 ORACLE SERVICE: Creating profile with ARRAY support...')
      console.log(`   ETH: ${ethAddress}`)
      console.log(`   BTC: ${bitcoinAddress}`)
      
      const { registerUserViaOracleVerification } = await import('./professional-oracle-integration')
      const result = await registerUserViaOracleVerification(ethAddress, bitcoinAddress, signature, 'website')
      
      if (result.success) {
        this.clearCache()
        console.log('✅ ORACLE SERVICE: Profile created, cache cleared for fresh data')
      }
      
      return result
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to create user profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async addBitcoinAddressToExistingUser(ethAddress: string, newBitcoinAddress: string, signature?: string): Promise<{ success: boolean; totalAddresses?: number; error?: string }> {
    try {
      console.log('🔗 ORACLE SERVICE: Adding additional Bitcoin address...')
      console.log(`   ETH: ${ethAddress}`)
      console.log(`   New BTC: ${newBitcoinAddress}`)
      
      const { addBitcoinAddressToUser } = await import('./professional-oracle-integration')
      const result = await addBitcoinAddressToUser(ethAddress, newBitcoinAddress, signature)
      
      if (result.success) {
        this.clearCache()
        console.log('✅ ORACLE SERVICE: Bitcoin address added, cache cleared for fresh data')
      }
      
      return result
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to add Bitcoin address:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async checkVerificationStatus(
    ethereumAddress: string, 
    bitcoinAddress: string
  ): Promise<{
    isVerified: boolean
    canVerify: boolean
    message: string
  }> {
    try {
      const users = await this.getDecryptedUsers()
      
      if (!users) {
        return {
          isVerified: false,
          canVerify: true,
          message: "Unable to fetch user data"
        }
      }
      
      const addressUsedByOther = users.find(user => {
        if (user.ethAddress?.toLowerCase() === ethereumAddress.toLowerCase()) {
          return false
        }
        
        const userDataAny = user as any
        const userAddresses = [
          user.btcAddress,
          user.bitcoinAddress,
          ...(user.btcAddresses || []),
          ...(userDataAny.bitcoinAddresses || []),
          ...(userDataAny.bitcoin_addresses || [])
        ].filter(Boolean)
        
        return userAddresses.includes(bitcoinAddress)
      })
      
      if (addressUsedByOther) {
        return {
          isVerified: false,
          canVerify: false,
          message: "This Bitcoin address has already been verified by another user"
        }
      }
      
      const currentUserVerified = users.find(user => {
        if (user.ethAddress?.toLowerCase() !== ethereumAddress.toLowerCase()) {
          return false
        }
        
        const userDataAny = user as any
        const userAddresses = [
          user.btcAddress,
          user.bitcoinAddress,
          ...(user.btcAddresses || []),
          ...(userDataAny.bitcoinAddresses || []),
          ...(userDataAny.bitcoin_addresses || [])
        ].filter(Boolean)
        
        return userAddresses.includes(bitcoinAddress)
      })
      
      if (currentUserVerified) {
        return {
          isVerified: true,
          canVerify: false,
          message: "You have already verified this Bitcoin address"
        }
      }
      
      return {
        isVerified: false,
        canVerify: true,
        message: "Bitcoin address is available for verification"
      }
      
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Check verification status failed:', error)
      return {
        isVerified: false,
        canVerify: true,
        message: "Unable to check verification status"
      }
    }
  }

  async updateVerificationStatus(
    ethereumAddress: string,
    bitcoinAddress: string
  ): Promise<boolean> {
    try {
      this.clearCache()
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const users = await this.getDecryptedUsers()
      const user = users?.find(u => u.ethAddress.toLowerCase() === ethereumAddress.toLowerCase())
      
      if (user && user.btcAddress === bitcoinAddress) {
        console.log(`✅ ORACLE SERVICE: Verification status updated for ${ethereumAddress.slice(0, 8)}...`)
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Update verification status failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const oracleService = new OracleService()

// Export for convenience
export { OracleService, type UserData, type EncryptedOracleResponse }