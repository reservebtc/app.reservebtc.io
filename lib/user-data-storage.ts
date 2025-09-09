/**
 * Professional centralized user data storage utility
 * 
 * This module provides high-level functions for user data management
 * with centralized Oracle database integration only (no localStorage dependencies)
 */

import { 
  getVerifiedAddressesFromOracle, 
  saveAddressToOracle,
  requestOracleSync
} from './transaction-storage'

interface UserVerifiedAddress {
  address: string
  verifiedAt: string
  signature: string
  ethAddress: string
}

// UserData interface removed - no localStorage caching needed

/**
 * Save verified Bitcoin address with professional Oracle database sync
 */
export async function saveVerifiedBitcoinAddress(
  ethAddress: string,
  bitcoinAddress: string,
  signature: string
): Promise<void> {
  console.log('💾 Saving verified Bitcoin address to centralized Oracle database...')
  
  try {
    // Primary save to Oracle database (ONLY storage - no localStorage fallback)
    await saveAddressToOracle(ethAddress, bitcoinAddress, signature)
    console.log('✅ Address saved to Oracle database successfully')
    
    // Also trigger Oracle sync to update user data
    await requestOracleSync(ethAddress)
    console.log('✅ Oracle sync requested successfully')
    
  } catch (error) {
    console.error('❌ Oracle save failed:', error)
    throw error // Re-throw error to let caller know verification failed
  }
  
  // NO localStorage fallback - system uses automatic browser cleanup
  // All data must be retrieved from centralized Oracle server
  console.log('✅ Verification completed - user card created in Oracle database')
}

/**
 * Get verified Bitcoin addresses from centralized Oracle database only
 * No localStorage dependencies - system uses automatic browser cleanup
 */
export async function getVerifiedBitcoinAddresses(ethAddress: string): Promise<UserVerifiedAddress[]> {
  console.log('📋 Getting verified addresses from Oracle database for:', ethAddress)
  
  // Get addresses directly from Oracle database (ONLY source of truth)
  try {
    const oracleData = await getVerifiedAddressesFromOracle(ethAddress)
    console.log('🔍 DEBUG: Oracle data received:', oracleData)
    
    if (oracleData.length > 0) {
      console.log('✅ Retrieved addresses from Oracle database:', oracleData.length)
      
      // Convert Oracle format to our interface format
      const oracleAddresses = oracleData.map(addr => ({
        address: addr.address,
        verifiedAt: addr.verifiedAt,
        signature: addr.signature,
        ethAddress: ethAddress
      }))
      
      return oracleAddresses
    } else {
      console.log('ℹ️ No addresses found in Oracle database')
      return []
    }
  } catch (error) {
    console.error('❌ Oracle database unavailable:', error)
    return [] // Return empty array if Oracle is unavailable
  }
}

// All localStorage functions removed - system uses centralized Oracle database only
// With automatic browser cleanup, no local storage or recovery functions needed