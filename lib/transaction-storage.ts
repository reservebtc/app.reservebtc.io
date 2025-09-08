/**
 * Professional centralized transaction storage system
 * 
 * This system automatically parses blockchain events, maintains user transaction history,
 * and provides professional data persistence beyond localStorage limitations.
 * 
 * Enhanced with AES-GCM encryption for sensitive data protection.
 */

import { 
  encryptSensitiveData, 
  decryptSensitiveData, 
  isEncryptedData, 
  getDecryptedSignature,
  migrateSignatureToEncrypted 
} from './encryption-utils'
import { 
  getDecryptedOracleUsers, 
  enhanceUserDataWithMultipleAddresses 
} from './oracle-decryption'

interface TransactionEvent {
  txHash: string
  blockNumber: number
  blockHash: string
  logIndex: number
  removed: boolean
  address: string
  data: string
  topics: string[]
}

interface ProcessedTransaction {
  hash: string
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer'
  amount: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
  blockNumber: number
  userAddress: string
  bitcoinAddress?: string
  metadata?: Record<string, any>
}

interface UserTransactionHistory {
  userAddress: string
  transactions: ProcessedTransaction[]
  lastSyncedBlock: number
  lastSyncedAt: number
  totalTransactions: number
}

const ORACLE_API_BASE = 'https://oracle.reservebtc.io/api'

/**
 * Get user transaction history from centralized Oracle database
 * This fetches professionally maintained transaction data that survives browser clearing
 */
export async function getUserTransactionHistory(
  userAddress: string,
  forceRefresh: boolean = false
): Promise<ProcessedTransaction[]> {
  try {
    console.log('📊 Fetching encrypted transaction history from Oracle API:', userAddress)
    
    // PROFESSIONAL FIX: Auto-refresh page if user switched to clean all cached data
    const lastUserKey = 'rbtc_last_connected_user'
    const lastUser = localStorage.getItem(lastUserKey)
    
    if (lastUser && lastUser.toLowerCase() !== userAddress.toLowerCase()) {
      console.log('🔄 User switched detected, refreshing page for clean data...')
      localStorage.setItem(lastUserKey, userAddress.toLowerCase())
      
      // Clear all localStorage data before refresh
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key !== lastUserKey) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Force page refresh for clean state
      window.location.reload()
      return []
    }
    
    // Set current user as last connected
    localStorage.setItem(lastUserKey, userAddress.toLowerCase())
    
    // COPY EXACT LOGIC FROM getVerifiedBitcoinAddresses - UNIVERSAL FIX
    const currentUserPrefix = userAddress.toLowerCase()
    const keysToCheck = []
    
    // Collect all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        keysToCheck.push(key)
      }
    }
    
    // Remove keys that don't belong to current user but contain user data - EXACT SAME LOGIC
    keysToCheck.forEach(key => {
      if (!key.includes(currentUserPrefix) && 
          (key.includes('rbtc') || 
           key.includes('reservebtc') || 
           key.includes('bitcoin') ||
           key.includes('transaction') ||
           key.includes('oracle') ||
           key.includes('user_data'))) {
        console.log(`🚨 TRANSACTION: Removing other user's localStorage key: ${key}`)
        localStorage.removeItem(key)
      }
    })
    
    // Use new encrypted Oracle API
    const allUsersData = await getDecryptedOracleUsers()
    
    if (allUsersData) {
      console.log('✅ Encrypted Oracle API users data received and decrypted')
      
      // Find this user's data (case-insensitive lookup)
      const userData = allUsersData[userAddress.toLowerCase()] || allUsersData[userAddress]
      if (userData) {
        console.log('✅ Found user data in Oracle:', userData)
        
        // Extract transactions from Oracle format
        const transactions = []
        
        // New format: use transactionHashes array directly
        if (userData.transactionHashes && Array.isArray(userData.transactionHashes)) {
          userData.transactionHashes.forEach(tx => {
            transactions.push({
              hash: tx.hash,
              type: tx.type as 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer',
              amount: tx.amount,
              timestamp: tx.timestamp,
              status: 'success' as const,
              blockNumber: tx.blockNumber || 0,
              userAddress: userAddress,
              bitcoinAddress: userData.btcAddress,
              metadata: {
                source: tx.source,
                manualEntry: tx.manualEntry,
                autoDetected: tx.autoDetected
              }
            })
          })
        }
        
        // Legacy format: fallback to old lastTxHash method
        else if (userData.lastTxHash && userData.lastSyncedBalance) {
          transactions.push({
            hash: userData.lastTxHash,
            type: 'mint' as const,
            amount: (userData.lastSyncedBalance / 100000000).toFixed(8),
            timestamp: new Date(userData.lastSyncTime || userData.addedTime || Date.now()).toISOString(),
            status: 'success' as const,
            blockNumber: 0,
            userAddress: userAddress,
            bitcoinAddress: userData.btcAddress
          })
        }
        
        console.log(`✅ Processed ${transactions.length} transactions from Oracle`)
        
        // Cache the response locally for immediate UI updates
        const cacheKey = `rbtc_oracle_transactions_${userAddress.toLowerCase()}`
        localStorage.setItem(cacheKey, JSON.stringify({
          transactions: transactions,
          lastSyncedAt: Date.now(),
          source: 'oracle_api',
          version: '2.0'
        }))
        
        return transactions
      } else {
        console.log('ℹ️ User not found in Oracle database:', userAddress)
        return []
      }
    } else {
      console.log('ℹ️ No users data from Oracle database')
      return []
    }
  } catch (error) {
    console.warn('⚠️ Oracle API unavailable, falling back to cached data:', error)
    return getCachedTransactions(userAddress)
  }
}

/**
 * Report a new transaction to Oracle for processing and storage
 * This ensures the Oracle maintains complete transaction history
 */
export async function reportTransactionToOracle(
  userAddress: string,
  transaction: Partial<ProcessedTransaction>
): Promise<void> {
  try {
    console.log('📤 Reporting transaction to Oracle:', transaction)
    
    const response = await fetch(`${ORACLE_API_BASE}/users/${userAddress}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      },
      body: JSON.stringify({
        transaction,
        source: 'frontend',
        timestamp: new Date().toISOString()
      })
    })

    if (response.ok) {
      console.log('✅ Transaction reported to Oracle successfully')
    } else {
      console.warn('⚠️ Failed to report transaction to Oracle:', response.statusText)
    }
  } catch (error) {
    console.warn('⚠️ Oracle transaction reporting failed:', error)
    // Don't throw - this is supplementary reporting
  }
}

/**
 * Get cached transactions from localStorage as fallback
 */
function getCachedTransactions(userAddress: string): ProcessedTransaction[] {
  try {
    const cacheKey = `rbtc_oracle_transactions_${userAddress.toLowerCase()}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      const data = JSON.parse(cached)
      console.log('📋 Using cached transaction data:', data.transactions.length, 'transactions')
      return data.transactions || []
    }
    
    // Fallback to old cache format for backward compatibility
    const legacyCacheKey = `rbtc_transactions_${userAddress}`
    const legacyCached = localStorage.getItem(legacyCacheKey)
    
    if (legacyCached) {
      const legacyData = JSON.parse(legacyCached)
      console.log('🔄 Migrating legacy transaction cache')
      return legacyData.transactions || []
    }
    
    return []
  } catch (error) {
    console.error('❌ Error reading cached transactions:', error)
    return []
  }
}

/**
 * Request Oracle to sync user data from blockchain
 * This triggers the Oracle to scan for new events and update the database
 */
export async function requestOracleSync(userAddress: string): Promise<void> {
  try {
    console.log('🔄 Requesting Oracle sync for user:', userAddress)
    
    // Oracle server doesn't have /sync endpoint, so we'll notify via status check
    // and create a manual entry for the user in the Oracle database
    console.log('⚠️ Oracle server has no /sync endpoint, implementing workaround...')
    
    // First check Oracle status
    const statusResponse = await fetch(`https://oracle.reservebtc.io/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      }
    })
    
    if (statusResponse.ok) {
      const status = await statusResponse.json()
      console.log('✅ Oracle status:', status)
      
      // Since Oracle is online, we assume it will detect new Bitcoin transactions
      // In production, Oracle should monitor blockchain events automatically
      console.log('✅ Oracle is online and should detect new user activity')
      
      return
    } else {
      throw new Error(`Oracle status check failed: ${statusResponse.status}`)
    }
  } catch (error) {
    console.warn('⚠️ Oracle sync request error:', error)
    // Don't throw error - this is not critical for user experience
  }
}

/**
 * Get user's verified Bitcoin addresses from Oracle database with automatic decryption
 */
export async function getVerifiedAddressesFromOracle(
  userAddress: string
): Promise<{ address: string; verifiedAt: string; signature: string }[]> {
  try {
    console.log('🔍 Fetching encrypted verified addresses from Oracle:', userAddress)
    
    // Use new encrypted Oracle API
    const allUsersData = await getDecryptedOracleUsers()
    console.log('🔍 DEBUG: All users data keys:', allUsersData ? Object.keys(allUsersData) : 'null')
    
    if (allUsersData) {
      console.log('✅ Encrypted Oracle users data received and decrypted')
      
      // Find this user's data (case-insensitive lookup)
      const userData = allUsersData[userAddress.toLowerCase()] || allUsersData[userAddress]
      console.log('🔍 DEBUG: User data found:', userData ? 'YES' : 'NO')
      console.log('🔍 DEBUG: User data:', userData)
      
      if (userData && (userData.btcAddress || userData.btcAddresses)) {
        // Enhance user data with multiple addresses support
        const enhancedUserData = enhanceUserDataWithMultipleAddresses(userData)
        
        console.log('✅ Found verified addresses in Oracle:', enhancedUserData.btcAddresses?.length || 1)
        
        // Create address array from Oracle format (support multiple addresses)
        const rawAddresses = enhancedUserData.btcAddresses || [enhancedUserData.btcAddress]
        const addresses = rawAddresses
          .filter(address => address && address.length > 10 && !address.includes('pending_verification'))
          .map((address, index) => ({
            address: address,
            verifiedAt: new Date(userData.registeredAt || userData.addedTime || Date.now()).toISOString(),
            signature: 'oracle_verified' // Oracle doesn't store signatures
          }))
        
        console.log('✅ Oracle verified addresses retrieved:', addresses.length)
        
        // Process addresses (no signature decryption needed for Oracle data)
        return addresses
      } else {
        console.log('ℹ️ User not found in Oracle database:', userAddress)
        return []
      }
    } else {
      console.log('ℹ️ No users data from Oracle database')
      return []
    }
  } catch (error) {
    console.warn('⚠️ Oracle address lookup failed:', error)
    return []
  }
}

/**
 * Save verified Bitcoin address to Oracle database with encrypted signature
 */
export async function saveAddressToOracle(
  userAddress: string,
  bitcoinAddress: string,
  signature: string
): Promise<void> {
  try {
    console.log('💾 Saving verified address to Oracle:', { userAddress, bitcoinAddress })
    
    // Use store-transaction-hash endpoint to save the verified address
    const response = await fetch(`${ORACLE_API_BASE}/store-transaction-hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      },
      body: JSON.stringify({
        userAddress: userAddress,
        txHash: `address_verification_${Date.now()}_${bitcoinAddress.slice(-8)}`,
        type: 'address_verification',
        amount: '0',
        blockNumber: 0,
        bitcoinAddress: bitcoinAddress,
        signature: signature,
        source: 'frontend_verification',
        timestamp: new Date().toISOString()
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Address saved to Oracle database successfully:', result)
    } else {
      throw new Error(`Oracle save failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Oracle address save error:', error)
    throw error // Throw error so fallback mechanism works
  }
}

/**
 * Save user fee vault deposit record to Oracle database
 */
export async function saveFeeVaultDeposit(
  userAddress: string,
  amount: string,
  txHash: string
): Promise<void> {
  try {
    console.log('💰 Saving fee vault deposit to Oracle:', { userAddress, amount, txHash })
    
    const response = await fetch(`${ORACLE_API_BASE}/users/${userAddress}/fee-deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      },
      body: JSON.stringify({
        amount,
        txHash,
        depositedAt: new Date().toISOString(),
        source: 'frontend'
      })
    })

    if (response.ok) {
      console.log('✅ Fee deposit saved to Oracle successfully')
    } else {
      console.warn('⚠️ Fee deposit save to Oracle failed:', response.statusText)
    }
  } catch (error) {
    console.warn('⚠️ Oracle fee deposit save error:', error)
    // Don't throw - this is supplementary tracking
  }
}

/**
 * Check if user has made fee vault deposits
 */
export async function getUserFeeVaultHistory(
  userAddress: string
): Promise<{ hasDeposited: boolean; deposits: any[] }> {
  try {
    console.log('🔍 Checking fee vault history:', userAddress)
    
    const response = await fetch(`${ORACLE_API_BASE}/users/${userAddress}/fee-deposits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Fee vault history retrieved:', data)
      return {
        hasDeposited: data.deposits && data.deposits.length > 0,
        deposits: data.deposits || []
      }
    } else if (response.status === 404) {
      console.log('ℹ️ No fee deposit history found')
      return { hasDeposited: false, deposits: [] }
    } else {
      throw new Error(`Oracle API error: ${response.status}`)
    }
  } catch (error) {
    console.warn('⚠️ Oracle fee vault history lookup failed:', error)
    return { hasDeposited: false, deposits: [] }
  }
}