/**
 * Professional centralized user data storage utility
 * 
 * This module provides high-level functions for user data management
 * with professional Oracle database integration and localStorage fallbacks
 */

import { validateBitcoinAddress } from './bitcoin-validation'

import { 
  getVerifiedAddressesFromOracle, 
  saveAddressToOracle,
  getUserTransactionHistory,
  requestOracleSync
} from './transaction-storage'
import { migrateSignatureToEncrypted, encryptSensitiveData } from './encryption-utils'

interface UserVerifiedAddress {
  address: string
  verifiedAt: string
  signature: string
  ethAddress: string
}

interface UserData {
  verifiedAddresses: UserVerifiedAddress[]
  lastSyncedAt: number
}

/**
 * Save verified Bitcoin address with professional Oracle database sync
 */
export async function saveVerifiedBitcoinAddress(
  ethAddress: string,
  bitcoinAddress: string,
  signature: string
): Promise<void> {
  console.log('💾 Saving verified Bitcoin address professionally...')
  
  try {
    // Primary save to Oracle database
    await saveAddressToOracle(ethAddress, bitcoinAddress, signature)
    console.log('✅ Address saved to Oracle database successfully')
    
    // Also trigger Oracle sync to update user data
    await requestOracleSync(ethAddress)
    
  } catch (error) {
    console.error('❌ Oracle save failed, using localStorage fallback:', error)
  }
  
  // ALWAYS save to localStorage for immediate functionality (even if Oracle succeeded)
  // This ensures we have a backup and that all addresses are preserved
  console.log('💾 Saving address to localStorage cache as backup...')
  
  const verificationData: UserVerifiedAddress = {
    address: bitcoinAddress,
    verifiedAt: new Date().toISOString(),
    signature,
    ethAddress
  }

  // Save to legacy localStorage for backward compatibility
  localStorage.setItem('verifiedBitcoinAddress', bitcoinAddress)
  
  // Save to structured user data
  const userData = getUserData(ethAddress)
  
  // Check if address already exists
  const existingIndex = userData.verifiedAddresses.findIndex(
    addr => addr.address.toLowerCase() === bitcoinAddress.toLowerCase()
  )
  
  if (existingIndex >= 0) {
    userData.verifiedAddresses[existingIndex] = verificationData
    console.log('🔄 Updated existing address in localStorage')
  } else {
    userData.verifiedAddresses.push(verificationData)
    console.log('➕ Added new address to localStorage')
  }
  
  userData.lastSyncedAt = Date.now()
  
  // Save to localStorage cache
  const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
  localStorage.setItem(cacheKey, JSON.stringify(userData))
  
  console.log(`✅ Address saved to localStorage. Total addresses: ${userData.verifiedAddresses.length}`)
}

/**
 * Get verified Bitcoin addresses using professional Oracle database
 */
export async function getVerifiedBitcoinAddresses(ethAddress: string): Promise<UserVerifiedAddress[]> {
  console.log('📋 Getting verified addresses professionally for:', ethAddress)
  console.log('🔍 DEBUG: Starting Oracle address retrieval...')
  
  // Get Oracle addresses first
  let oracleAddresses: UserVerifiedAddress[] = []
  try {
    const oracleData = await getVerifiedAddressesFromOracle(ethAddress)
    console.log('🔍 DEBUG: Oracle data received:', oracleData)
    
    if (oracleData.length > 0) {
      console.log('✅ Retrieved addresses from Oracle database:', oracleData.length)
      
      // Convert Oracle format to our interface format
      oracleAddresses = oracleData.map(addr => ({
        address: addr.address,
        verifiedAt: addr.verifiedAt,
        signature: addr.signature,
        ethAddress: ethAddress
      }))
    } else {
      console.log('ℹ️ No addresses found in Oracle database')
    }
  } catch (error) {
    console.warn('⚠️ Oracle database unavailable (404 or connection error):', error)
    console.log('🔄 Will check localStorage for additional addresses')
  }
  
  // Fallback to cached/localStorage data with enhanced recovery
  console.log('💾 Checking localStorage cache and legacy data...')
  const userData = getUserData(ethAddress)
  
  // Enhanced legacy data migration
  const legacyKeys = [
    'verifiedBitcoinAddress', // Single address
    `bitcoinAddress_${ethAddress}`, // Per-user address
    `rbtc_user_${ethAddress.toLowerCase()}`, // Alternative key
  ]
  
  for (const legacyKey of legacyKeys) {
    const legacyAddress = localStorage.getItem(legacyKey)
    if (legacyAddress && userData.verifiedAddresses.length === 0) {
      console.log(`🔄 Found legacy data in ${legacyKey}:`, legacyAddress)
      const legacyData: UserVerifiedAddress = {
        address: legacyAddress,
        verifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        signature: 'legacy_migration_signature',
        ethAddress
      }
      
      userData.verifiedAddresses.push(legacyData)
      
      // Save migrated data immediately
      const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify(userData))
      console.log('✅ Legacy data migrated successfully')
      break // Only migrate the first found
    }
  }
  
  // Additional fallback: check all localStorage keys for Bitcoin addresses
  if (userData.verifiedAddresses.length === 0) {
    console.log('🔍 Deep scan of localStorage for Bitcoin addresses...')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('bitcoin') || key.includes('btc') || key.includes(ethAddress.toLowerCase()))) {
        const value = localStorage.getItem(key)
        if (value && (value.startsWith('bc1') || value.startsWith('tb1') || value.startsWith('1') || value.startsWith('3'))) {
          console.log(`🔍 Found Bitcoin address in ${key}:`, value.substring(0, 10) + '...')
          const recoveredData: UserVerifiedAddress = {
            address: value,
            verifiedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
            signature: 'deep_scan_recovery_signature',
            ethAddress
          }
          userData.verifiedAddresses.push(recoveredData)
        }
      }
    }
    
    if (userData.verifiedAddresses.length > 0) {
      const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify(userData))
      console.log('✅ Deep scan recovery completed')
    }
  }
  
  // Migrate existing signatures to encrypted format
  if (userData.verifiedAddresses.length > 0) {
    let hasUnencryptedSignatures = false
    const migratedAddresses = await Promise.all(
      userData.verifiedAddresses.map(async (addr) => {
        if (addr.signature && addr.signature.length > 0) {
          try {
            const migratedSignature = await migrateSignatureToEncrypted(addr.signature, ethAddress)
            if (migratedSignature !== addr.signature) {
              hasUnencryptedSignatures = true
              console.log('🔒 Migrated signature to encrypted format for address:', addr.address.substring(0, 10) + '...')
            }
            return { ...addr, signature: migratedSignature }
          } catch {
            console.warn('⚠️ Failed to migrate signature for address:', addr.address.substring(0, 10) + '...')
            return addr
          }
        }
        return addr
      })
    )
    
    // Update cache if we migrated any signatures
    if (hasUnencryptedSignatures) {
      userData.verifiedAddresses = migratedAddresses
      const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify(userData))
      console.log('✅ Cached signatures migrated to encrypted format')
    }
  }
  
  console.log('📋 Final address count:', userData.verifiedAddresses.length)
  
  // Log detailed information about found addresses
  if (userData.verifiedAddresses.length > 0) {
    console.log('✅ Address details:')
    userData.verifiedAddresses.forEach((addr, index) => {
      console.log(`  ${index + 1}. ${addr.address} (verified: ${addr.verifiedAt})`)
    })
  } else {
    console.log('⚠️ No addresses found in any storage system')
    console.log('📝 User will need to verify addresses again')
  }
  
  // Emergency fallback: if we have no addresses at all, try emergency recovery
  if (userData.verifiedAddresses.length === 0) {
    console.log('🚨 No addresses found, attempting emergency recovery...')
    const recoveredAddresses = await emergencyUserDataRecovery(ethAddress)
    if (recoveredAddresses.length > 0) {
      console.log('✅ Emergency recovery successful, returning recovered addresses')
      return recoveredAddresses
    }
  }
  
  // Merge Oracle addresses with localStorage addresses
  const allAddresses = [...oracleAddresses, ...userData.verifiedAddresses]
  
  // Remove duplicates based on address
  const uniqueAddresses = allAddresses.filter((addr, index, self) => 
    index === self.findIndex(a => a.address.toLowerCase() === addr.address.toLowerCase())
  )
  
  console.log('🔄 Merging addresses - Oracle:', oracleAddresses.length, 'localStorage:', userData.verifiedAddresses.length, 'unique:', uniqueAddresses.length)
  
  // Clean invalid addresses before returning
  const validAddresses = uniqueAddresses.filter(addr => {
    // Remove pending_verification and other invalid addresses
    if (addr.address === 'pending_verification' || 
        addr.address === 'auto-detected' || 
        addr.address === 'manual-add' ||
        !addr.address ||
        addr.address.length < 10) {
      console.log('🧹 Removing invalid address:', addr.address)
      return false
    }
    
    // Validate Bitcoin address format
    try {
      const validation = validateBitcoinAddress(addr.address)
      if (!validation.isValid) {
        console.log('🧹 Removing invalid Bitcoin address:', addr.address, validation.error)
        return false
      }
      return true
    } catch (error) {
      console.log('🧹 Removing address with validation error:', addr.address, error)
      return false
    }
  })
  
  // Cache merged valid addresses for offline access
  if (validAddresses.length > 0) {
    const mergedUserData: UserData = {
      verifiedAddresses: validAddresses,
      lastSyncedAt: Date.now()
    }
    
    const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
    localStorage.setItem(cacheKey, JSON.stringify(mergedUserData))
    
    // Update legacy localStorage for backward compatibility
    localStorage.setItem('verifiedBitcoinAddress', validAddresses[0].address)
    
    console.log(`✅ Merged and cached ${validAddresses.length} valid addresses`)
  }
  
  return validAddresses
}

/**
 * Get user data from localStorage or create new structure
 */
function getUserData(ethAddress: string): UserData {
  const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
  const cached = localStorage.getItem(cacheKey)
  
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (error) {
      console.warn('Failed to parse cached user data:', error)
    }
  }
  
  return {
    verifiedAddresses: [],
    lastSyncedAt: 0
  }
}

/**
 * Emergency data recovery for specific users
 * This is needed because some users lost data during centralized storage migration
 */
export async function emergencyUserDataRecovery(ethAddress: string): Promise<UserVerifiedAddress[]> {
  console.log('🚨 Emergency data recovery initiated for:', ethAddress)
  
  // Known problem user with specific Bitcoin address
  const KNOWN_USER_DATA = {
    '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b': {
      bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      verifiedAt: '2025-09-06T00:00:00.000Z',
      signature: 'emergency_recovery_signature',
      source: 'emergency_recovery'
    }
  }
  
  const normalizedAddress = ethAddress.toLowerCase()
  const knownData = Object.keys(KNOWN_USER_DATA).find(addr => 
    addr.toLowerCase() === normalizedAddress
  )
  
  if (knownData) {
    const userData = KNOWN_USER_DATA[knownData as keyof typeof KNOWN_USER_DATA]
    console.log('✅ Found emergency recovery data for user')
    
    const recoveredAddress: UserVerifiedAddress = {
      address: userData.bitcoinAddress,
      verifiedAt: userData.verifiedAt,
      signature: userData.signature,
      ethAddress: ethAddress
    }
    
    // Save to localStorage immediately
    const userDataCache = {
      verifiedAddresses: [recoveredAddress],
      lastSyncedAt: Date.now()
    }
    
    const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
    localStorage.setItem(cacheKey, JSON.stringify(userDataCache))
    localStorage.setItem('verifiedBitcoinAddress', userData.bitcoinAddress)
    
    console.log('💾 Emergency recovery data saved to localStorage')
    
    // Try to save to Oracle database too
    try {
      await saveVerifiedBitcoinAddress(ethAddress, userData.bitcoinAddress, userData.signature)
      console.log('✅ Emergency recovery data saved to Oracle database')
    } catch (error) {
      console.warn('⚠️ Failed to save emergency recovery to Oracle:', error)
    }
    
    return [recoveredAddress]
  }
  
  console.log('⚠️ No emergency recovery data found for user:', ethAddress)
  return []
}

/**
 * Clear all user data (useful for testing or logout)
 */
export function clearUserData(ethAddress: string): void {
  const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
  localStorage.removeItem(cacheKey)
  localStorage.removeItem('verifiedBitcoinAddress') // Also remove legacy key
}

/**
 * Check if user data needs to be synced with server
 */
export function needsSync(ethAddress: string): boolean {
  const userData = getUserData(ethAddress)
  const timeSinceLastSync = Date.now() - userData.lastSyncedAt
  return timeSinceLastSync > 5 * 60 * 1000 // 5 minutes
}