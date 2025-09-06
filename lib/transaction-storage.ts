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
    console.log('📊 Fetching transaction history from Oracle API:', userAddress)
    
    const queryParams = new URLSearchParams({
      force_refresh: forceRefresh.toString()
    })
    
    const response = await fetch(
      `${ORACLE_API_BASE}/users/${userAddress}/transactions?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Oracle API transaction data received:', data)
      
      // Cache the response locally for immediate UI updates
      const cacheKey = `rbtc_oracle_transactions_${userAddress.toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify({
        transactions: data.transactions || [],
        lastSyncedAt: Date.now(),
        source: 'oracle_api',
        version: '2.0'
      }))
      
      return data.transactions || []
    } else if (response.status === 404) {
      console.log('ℹ️ User not found in Oracle database - new user')
      return []
    } else {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`)
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
    
    const response = await fetch(`${ORACLE_API_BASE}/users/${userAddress}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      },
      body: JSON.stringify({
        force_sync: true,
        source: 'frontend_request'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Oracle sync completed:', result)
    } else {
      console.warn('⚠️ Oracle sync request failed:', response.statusText)
    }
  } catch (error) {
    console.warn('⚠️ Oracle sync request error:', error)
  }
}

/**
 * Get user's verified Bitcoin addresses from Oracle database with automatic decryption
 */
export async function getVerifiedAddressesFromOracle(
  userAddress: string
): Promise<{ address: string; verifiedAt: string; signature: string }[]> {
  try {
    console.log('🔍 Fetching verified addresses from Oracle:', userAddress)
    
    const response = await fetch(`${ORACLE_API_BASE}/users/${userAddress}/verified-addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Oracle verified addresses retrieved:', data.addresses?.length || 0)
      
      // Decrypt signatures automatically for backward compatibility
      if (data.addresses && data.addresses.length > 0) {
        const decryptedAddresses = await Promise.all(
          data.addresses.map(async (addr: any) => {
            try {
              // Decrypt signature if it's encrypted
              const decryptedSignature = await getDecryptedSignature(addr.signature, userAddress)
              return {
                address: addr.address,
                verifiedAt: addr.verifiedAt,
                signature: decryptedSignature
              }
            } catch (error) {
              console.warn('⚠️ Failed to decrypt signature for address:', addr.address.substring(0, 10) + '...')
              return {
                address: addr.address,
                verifiedAt: addr.verifiedAt,
                signature: addr.signature // Return as-is if decryption fails
              }
            }
          })
        )
        
        console.log('🔓 Signatures decrypted for', decryptedAddresses.length, 'addresses')
        return decryptedAddresses
      }
      
      return data.addresses || []
    } else if (response.status === 404) {
      console.log('ℹ️ No verified addresses found for user')
      return []
    } else {
      throw new Error(`Oracle API error: ${response.status}`)
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
    console.log('💾 Saving verified address to Oracle with encryption:', { userAddress, bitcoinAddress })
    
    // Encrypt the BIP-322 signature for security
    const encryptedSignature = await encryptSensitiveData(signature, userAddress)
    console.log('🔒 Signature encrypted for secure storage')
    
    const response = await fetch(`${ORACLE_API_BASE}/users/${userAddress}/verified-addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      },
      body: JSON.stringify({
        bitcoinAddress,
        signature: encryptedSignature, // Store encrypted signature
        verifiedAt: new Date().toISOString(),
        source: 'frontend',
        encrypted: true // Mark as encrypted for future reference
      })
    })

    if (response.ok) {
      console.log('✅ Address saved to Oracle successfully with encrypted signature')
    } else {
      throw new Error(`Oracle save failed: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ Oracle address save error:', error)
    throw error // Re-throw for fallback handling
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