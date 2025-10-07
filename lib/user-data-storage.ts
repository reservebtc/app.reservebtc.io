/**
 * Professional centralized user data storage utility
 * 
 * This module provides high-level functions for user data management
 * with centralized Oracle database integration only (no localStorage dependencies)
 */

// Transaction storage removed - now using Supabase real-time system only

interface UserVerifiedAddress {
  address: string
  verifiedAt: string
  signature: string
  ethAddress: string
}

/**
 * Save verified Bitcoin address with professional Oracle database sync
 */
export async function saveVerifiedBitcoinAddress(
  ethAddress: string,
  bitcoinAddress: string,
  signature: string
): Promise<void> {
  console.log('💾 USER_DATA: Saving verified Bitcoin address to centralized system...')
  
  try {
    // Save to Oracle via API endpoint
    const response = await fetch('/api/verify-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bitcoinAddress,
        ethereumAddress: ethAddress,
        signature,
        network: bitcoinAddress.startsWith('tb1') || 
                 bitcoinAddress.startsWith('2') || 
                 bitcoinAddress.startsWith('m') || 
                 bitcoinAddress.startsWith('n') ? 'testnet' : 'mainnet'
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to save to database')
    }
    
    console.log('✅ USER_DATA: Address saved to centralized system successfully')
    
  } catch (error) {
    console.error('❌ USER_DATA: Save failed:', error)
    throw error // Re-throw error to let caller know verification failed
  }
  
  console.log('✅ USER_DATA: Verification completed - user card created in database')
}

/**
 * Get verified Bitcoin addresses from centralized database via real-time hooks
 * No localStorage dependencies - system uses Supabase real-time system
 */
export async function getVerifiedBitcoinAddresses(ethAddress: string): Promise<UserVerifiedAddress[]> {
  console.log('📋 USER_DATA: Getting verified addresses for user:', ethAddress.substring(0, 10) + '...')
  
  try {
    // Get addresses from Supabase via Oracle service
    const { oracleService } = await import('./oracle-service')
    const userData = await oracleService.getUserByAddress(ethAddress)
    
    if (userData) {
      // Get all Bitcoin addresses from user data
      const addresses: string[] = []
      
      // Check all possible fields
      if (userData.bitcoinAddress) addresses.push(userData.bitcoinAddress)
      if ((userData as any).btcAddresses && Array.isArray((userData as any).btcAddresses)) {
        addresses.push(...(userData as any).btcAddresses)
      }
      if ((userData as any).bitcoinAddresses && Array.isArray((userData as any).bitcoinAddresses)) {
        addresses.push(...(userData as any).bitcoinAddresses)
      }
      
      // Convert to UserVerifiedAddress format
      const verifiedAddresses = addresses.map((addr: string) => ({
        address: addr,
        verifiedAt: userData.registeredAt || new Date().toISOString(),
        signature: userData.signature || '',
        ethAddress: ethAddress
      }))
      
      console.log('✅ USER_DATA: Retrieved addresses from database:', verifiedAddresses.length)
      return verifiedAddresses
    } else {
      console.log('ℹ️ USER_DATA: No addresses found in database')
      return []
    }
  } catch (error) {
    console.error('❌ USER_DATA: Database check failed:', error)
    return [] // Return empty array if database is unavailable
  }
}

// All localStorage functions removed - system uses centralized database with Supabase real-time sync
// With automatic browser cleanup, no local storage or recovery functions needed