/**
 * Centralized Oracle Service for Professional Oracle Integration
 * Handles all Oracle API calls and data decryption in one place
 */

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
   * Get decrypted user data from Professional Oracle
   */
  async getDecryptedUsers(): Promise<UserData[] | null> {
    const cacheKey = 'all_users'
    const cached = this.cache.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log('🔐 DEBUG: Using cached Oracle data:', cached.data?.length || 0, 'users')
      return cached.data
    }

    try {
      console.log('🔐 ORACLE SERVICE: Fetching encrypted user data...')
      console.log('🔐 DEBUG: Oracle URL:', this.baseUrl)
      console.log('🔐 DEBUG: API Key present:', !!this.apiKey)
      
      const response = await fetch(`${this.baseUrl}/users`, {
        headers: {
          'x-api-key': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      })

      console.log('🔐 DEBUG: Oracle response status:', response.status)

      if (!response.ok) {
        console.error('❌ ORACLE SERVICE: API response not OK:', response.status, response.statusText)
        throw new Error(`Oracle API error: ${response.status}`)
      }

      const encryptedResponse: EncryptedOracleResponse = await response.json()
      console.log('🔐 DEBUG: Encrypted response keys:', Object.keys(encryptedResponse))
      
      if (!encryptedResponse.encrypted) {
        console.warn('❌ ORACLE SERVICE: Response is not encrypted')
        return null
      }

      const decryptedData = await decryptOracleData(encryptedResponse)
      console.log('🔐 DEBUG: Decrypted data structure:', decryptedData?.map(u => ({
        ethAddress: u.ethAddress,
        bitcoinAddress: u.bitcoinAddress,
        btcAddress: u.btcAddress,
        btcAddresses: u.btcAddresses
      })))
      
      if (decryptedData) {
        this.cache.set(cacheKey, { data: decryptedData, timestamp: Date.now() })
        console.log(`✅ ORACLE SERVICE: Decrypted data for ${decryptedData.length} users`)
      }
      
      return decryptedData
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to get decrypted users:', error)
      return null
    }
  }

  /**
   * Get specific user by ETH address - ИСПРАВЛЕНО: использует /users endpoint
   */
  async getUserByAddress(ethAddress: string): Promise<UserData | null> {
    try {
      console.log('🔍 ORACLE SERVICE: Getting user by address:', ethAddress.slice(0, 8) + '...')
      
      // ИСПРАВЛЕНИЕ: Используем правильный endpoint - /users вместо /user/{address}
      const allUsers = await this.getDecryptedUsers()
      console.log('🔍 RAW ORACLE RESPONSE (ALL USERS):', allUsers?.length || 0, 'users found')
      
      if (!allUsers) {
        console.log('❌ ORACLE SERVICE: No users data available')
        return null
      }
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Нормализация ETH адреса для поиска
      const normalizedAddress = ethAddress.toLowerCase()
      const originalAddress = ethAddress
      
      // Найдем конкретного пользователя по ETH адресу - проверяем все варианты
      const user = allUsers.find((u: UserData) => {
        if (!u.ethAddress) return false
        
        return u.ethAddress.toLowerCase() === normalizedAddress ||
               u.ethAddress === originalAddress ||
               u.ethAddress === ethAddress
      })
      
      console.log('🔍 FOUND USER:', user ? 'YES' : 'NO')
      console.log('🔍 DEBUG: Search criteria - Looking for ETH:', normalizedAddress)
      console.log('🔍 DEBUG: Available users ETH addresses:', allUsers.map(u => u.ethAddress).filter(Boolean))
      
      if (user) {
        const userDataAny = user as any
        console.log('🔍 USER BITCOIN FIELDS:')
        console.log('  - bitcoinAddress:', user.bitcoinAddress)
        console.log('  - btcAddress:', user.btcAddress) 
        console.log('  - btcAddresses:', user.btcAddresses)
        console.log('  - bitcoinAddresses:', userDataAny.bitcoinAddresses)
        console.log('  - bitcoin_addresses:', userDataAny.bitcoin_addresses)
        console.log('  - ALL FIELDS:', Object.keys(user))
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Универсальная обработка Bitcoin адресов
        const bitcoinAddresses = [
          ...(user.btcAddresses || []),
          ...(userDataAny.bitcoinAddresses || []),
          ...(userDataAny.bitcoin_addresses || []),
          ...(user.btcAddress ? [user.btcAddress] : []),
          ...(user.bitcoinAddress ? [user.bitcoinAddress] : [])
        ].filter(Boolean).filter((addr, index, array) => array.indexOf(addr) === index) // Remove duplicates
        
        console.log('🔍 PROCESSED BITCOIN ADDRESSES:', bitcoinAddresses)
        
        // Add processed addresses to user object for components to use
        const enhancedUser = {
          ...user,
          processedBitcoinAddresses: bitcoinAddresses,
          // Also add individual fields for backward compatibility
          allBitcoinAddresses: bitcoinAddresses
        } as UserData & { processedBitcoinAddresses: string[], allBitcoinAddresses: string[] }
        
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
  }

  /**
   * Find user by Bitcoin address correlation
   */
  async findUserByBitcoinAddress(bitcoinAddress: string): Promise<UserData | null> {
    const allUsers = await this.getDecryptedUsers()
    
    if (!allUsers) return null

    return allUsers.find(user => {
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обработка ВСЕХ форматов Bitcoin адресов
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

  /**
   * Find user by ETH address correlation (for mint page)
   */
  async findUserByCorrelation(ethAddress: string): Promise<UserData | null> {
    const allUsers = await this.getDecryptedUsers()
    
    if (!allUsers) return null

    return allUsers.find(user => {
      // Check ethAddress
      if (user.ethAddress?.toLowerCase() === ethAddress.toLowerCase()) return true
      
      return false
    }) || null
  }

  /**
   * Check if Bitcoin address is already used
   */
  async isBitcoinAddressUsed(bitcoinAddress: string, excludeEthAddress?: string): Promise<boolean> {
    const allUsers = await this.getDecryptedUsers()
    
    if (!allUsers) return false

    return allUsers.some(user => {
      // Skip the user we're excluding
      if (excludeEthAddress && user.ethAddress?.toLowerCase() === excludeEthAddress.toLowerCase()) {
        return false
      }
      
      // ИСПРАВЛЕНИЕ: Check ALL possible Bitcoin address fields
      // Professional Oracle uses 'bitcoinAddress' field
      if (user.bitcoinAddress === bitcoinAddress) return true
      
      // Legacy Oracle uses 'btcAddress' field
      if (user.btcAddress === bitcoinAddress) return true
      
      // Array format 'btcAddresses'
      if (user.btcAddresses?.includes(bitcoinAddress)) return true
      
      // Additional fields for compatibility
      const userDataAny = user as any
      if (userDataAny.bitcoin_address === bitcoinAddress) return true
      if (userDataAny.BTC_ADDRESS === bitcoinAddress) return true
      
      return false
    })
  }

  /**
   * Get Oracle server status
   */
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: {
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      })
      return await response.json()
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to get status:', error)
      return null
    }
  }

  /**
   * Get Bitcoin addresses as array for Oracle 2.1.0 compatibility
   */
  getUserBitcoinAddresses(user: any): string[] {
    if (!user) return []
    
    // Oracle 2.1.0 поддерживает массивы
    if (user.bitcoinAddresses && Array.isArray(user.bitcoinAddresses)) {
      return user.bitcoinAddresses
    }
    
    // Check other array formats
    if (user.btcAddresses && Array.isArray(user.btcAddresses)) {
      return user.btcAddresses
    }
    
    if (user.bitcoin_addresses && Array.isArray(user.bitcoin_addresses)) {
      return user.bitcoin_addresses
    }
    
    // Use processed addresses if available
    if (user.processedBitcoinAddresses && Array.isArray(user.processedBitcoinAddresses)) {
      return user.processedBitcoinAddresses
    }
    
    if (user.allBitcoinAddresses && Array.isArray(user.allBitcoinAddresses)) {
      return user.allBitcoinAddresses
    }
    
    // Fallback для старых записей
    if (user.bitcoinAddress) {
      return [user.bitcoinAddress]
    }
    
    if (user.btcAddress) {
      return [user.btcAddress]
    }
    
    return []
  }

  /**
   * Clear cache (useful for forcing refresh)
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ ORACLE SERVICE: Cache cleared')
  }

  /**
   * Create user profile via Professional Oracle - ОБНОВЛЕНО для массивов адресов
   */
  async createUserProfile(ethAddress: string, bitcoinAddress?: string, signature?: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      console.log('🔧 ORACLE SERVICE: Creating profile with ARRAY support...')
      console.log(`   ETH: ${ethAddress}`)
      console.log(`   BTC: ${bitcoinAddress}`)
      
      const { registerUserViaOracleVerification } = await import('./professional-oracle-integration')
      const result = await registerUserViaOracleVerification(ethAddress, bitcoinAddress, signature, 'website')
      
      if (result.success) {
        // Очистим кэш после успешного создания профиля
        this.clearCache()
        console.log('✅ ORACLE SERVICE: Profile created, cache cleared for fresh data')
      }
      
      return result
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to create user profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * НОВАЯ ФУНКЦИЯ: Добавить дополнительный Bitcoin адрес к пользователю
   */
  async addBitcoinAddressToExistingUser(ethAddress: string, newBitcoinAddress: string, signature?: string): Promise<{ success: boolean; totalAddresses?: number; error?: string }> {
    try {
      console.log('🔗 ORACLE SERVICE: Adding additional Bitcoin address...')
      console.log(`   ETH: ${ethAddress}`)
      console.log(`   New BTC: ${newBitcoinAddress}`)
      
      const { addBitcoinAddressToUser } = await import('./professional-oracle-integration')
      const result = await addBitcoinAddressToUser(ethAddress, newBitcoinAddress, signature)
      
      if (result.success) {
        // Очистим кэш после успешного добавления адреса
        this.clearCache()
        console.log('✅ ORACLE SERVICE: Bitcoin address added, cache cleared for fresh data')
      }
      
      return result
    } catch (error) {
      console.error('❌ ORACLE SERVICE: Failed to add Bitcoin address:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Метод для проверки статуса верификации
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
      
      // ИСПРАВЛЕНИЕ: Проверяем есть ли уже такой Bitcoin адрес у другого пользователя
      // Учитываем все возможные поля Bitcoin адресов (массивы и одиночные)
      const addressUsedByOther = users.find(user => {
        if (user.ethAddress?.toLowerCase() === ethereumAddress.toLowerCase()) {
          return false // Skip current user
        }
        
        // Check all possible Bitcoin address fields
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
      
      // ИСПРАВЛЕНИЕ: Проверяем уже ли верифицирован текущий пользователь с этим адресом
      // Учитываем все возможные поля Bitcoin адресов
      const currentUserVerified = users.find(user => {
        if (user.ethAddress?.toLowerCase() !== ethereumAddress.toLowerCase()) {
          return false
        }
        
        // Check all possible Bitcoin address fields for current user
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

  // Метод для обновления статуса верификации
  async updateVerificationStatus(
    ethereumAddress: string,
    bitcoinAddress: string
  ): Promise<boolean> {
    try {
      // Принудительно очищаем кэш
      this.clearCache()
      
      // Ждем немного для Oracle server sync
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Проверяем что данные сохранились
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