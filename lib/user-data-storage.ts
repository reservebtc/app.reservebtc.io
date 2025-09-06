/**
 * Professional centralized user data storage utility
 * 
 * This module provides high-level functions for user data management
 * with professional Oracle database integration and localStorage fallbacks
 */

import { 
  getVerifiedAddressesFromOracle, 
  saveAddressToOracle,
  getUserTransactionHistory,
  requestOracleSync
} from './transaction-storage'

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
    
    // Fallback to localStorage for immediate functionality
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
      addr => addr.address === bitcoinAddress
    )
    
    if (existingIndex >= 0) {
      userData.verifiedAddresses[existingIndex] = verificationData
    } else {
      userData.verifiedAddresses.push(verificationData)
    }
    
    userData.lastSyncedAt = Date.now()
    
    // Save to localStorage cache
    const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
    localStorage.setItem(cacheKey, JSON.stringify(userData))
  }
}

/**
 * Get verified Bitcoin addresses using professional Oracle database
 */
export async function getVerifiedBitcoinAddresses(ethAddress: string): Promise<UserVerifiedAddress[]> {
  console.log('📋 Getting verified addresses professionally...')
  
  try {
    // Primary data source: Oracle database
    const oracleAddresses = await getVerifiedAddressesFromOracle(ethAddress)
    
    if (oracleAddresses.length > 0) {
      console.log('✅ Retrieved addresses from Oracle database:', oracleAddresses.length)
      
      // Convert Oracle format to our interface format
      const userAddresses: UserVerifiedAddress[] = oracleAddresses.map(addr => ({
        address: addr.address,
        verifiedAt: addr.verifiedAt,
        signature: addr.signature,
        ethAddress: ethAddress
      }))
      
      // Cache for offline access
      const userData: UserData = {
        verifiedAddresses: userAddresses,
        lastSyncedAt: Date.now()
      }
      
      const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
      localStorage.setItem(cacheKey, JSON.stringify(userData))
      
      // Update legacy localStorage for backward compatibility
      if (userAddresses.length > 0) {
        localStorage.setItem('verifiedBitcoinAddress', userAddresses[0].address)
      }
      
      return userAddresses
    }
    
    console.log('ℹ️ No addresses found in Oracle database')
  } catch (error) {
    console.warn('⚠️ Oracle database unavailable, using cached data:', error)
  }
  
  // Fallback to cached/localStorage data
  const userData = getUserData(ethAddress)
  
  // Also check legacy localStorage key and migrate if needed
  const legacyAddress = localStorage.getItem('verifiedBitcoinAddress')
  if (legacyAddress && userData.verifiedAddresses.length === 0) {
    console.log('🔄 Migrating legacy localStorage data')
    const legacyData: UserVerifiedAddress = {
      address: legacyAddress,
      verifiedAt: new Date().toISOString(),
      signature: '', // Not available in legacy data
      ethAddress
    }
    
    userData.verifiedAddresses.push(legacyData)
    
    // Save migrated data
    const cacheKey = `reservebtc_user_data_${ethAddress.toLowerCase()}`
    localStorage.setItem(cacheKey, JSON.stringify(userData))
  }
  
  console.log('📋 Using cached addresses:', userData.verifiedAddresses.length)
  return userData.verifiedAddresses
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