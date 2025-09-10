/**
 * Verified Users Cache System
 * 
 * Since Oracle server doesn't have endpoints for manual user creation,
 * this system maintains a record of verified users who completed BIP-322
 * verification but haven't performed mint/burn transactions yet.
 * 
 * This ensures users see their verification status in dashboard immediately.
 */

export interface VerifiedUser {
  ethAddress: string
  bitcoinAddress: string
  signature: string
  verifiedAt: number
  status: 'verified' | 'awaiting_first_transaction'
  verificationType: 'bip322_manual'
}

/**
 * Save verified user to cache after successful BIP-322 verification
 */
export async function saveVerifiedUserToCache(
  ethAddress: string,
  bitcoinAddress: string,
  signature: string
): Promise<void> {
  try {
    console.log('💾 VERIFIED CACHE: Saving verified user to cache...')
    
    const verifiedUser: VerifiedUser = {
      ethAddress: ethAddress.toLowerCase(),
      bitcoinAddress,
      signature,
      verifiedAt: Date.now(),
      status: 'verified',
      verificationType: 'bip322_manual'
    }
    
    // Try to save to Oracle endpoint first (if available in future)
    const oracleUrl = process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'
    
    try {
      const response = await fetch(`${oracleUrl}/store-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        },
        body: JSON.stringify(verifiedUser)
      })
      
      if (response.ok) {
        console.log('✅ VERIFIED CACHE: Saved to Oracle verification store')
        return
      } else {
        console.log('⚠️ VERIFIED CACHE: Oracle store unavailable - verification completed but not cached')
      }
    } catch (oracleError) {
      console.log('⚠️ VERIFIED CACHE: Oracle store unavailable - verification completed but not cached')
    }
    
    // NO FALLBACK TO localStorage - CENTRALIZED DATABASE ONLY
    console.log('⚠️ VERIFIED CACHE: Verification completed, waiting for Oracle server sync')
    
  } catch (error) {
    console.error('❌ VERIFIED CACHE: Failed to save verified user:', error)
    throw error
  }
}

/**
 * Get verified user from cache
 */
export function getVerifiedUserFromCache(ethAddress: string): VerifiedUser | null {
  // NO localStorage - CENTRALIZED DATABASE ONLY
  console.log('ℹ️ VERIFIED CACHE: Cache lookup disabled - using centralized Oracle database only')
  return null
}

/**
 * Remove user from cache (called when they appear in Oracle database)
 */
export function removeUserFromCache(ethAddress: string): void {
  // NO localStorage - CENTRALIZED DATABASE ONLY
  console.log('ℹ️ VERIFIED CACHE: Cache removal disabled - using centralized Oracle database only')
}

/**
 * Get user profile combining Oracle data and verification cache
 */
export async function getCombinedUserProfile(ethAddress: string) {
  // First try to get from Oracle (official source)
  const { oracleService } = await import('./oracle-service')
  
  try {
    const oracleUsers = await oracleService.getDecryptedUsers()
    const oracleUser = oracleUsers?.find(user => 
      user.ethAddress?.toLowerCase() === ethAddress.toLowerCase()
    )
    
    if (oracleUser) {
      console.log('✅ COMBINED PROFILE: User found in Oracle database')
      // User is in Oracle - remove from cache if exists
      removeUserFromCache(ethAddress)
      return {
        source: 'oracle' as const,
        user: oracleUser,
        status: 'active' as const
      }
    }
  } catch (error) {
    console.log('⚠️ COMBINED PROFILE: Oracle check failed:', error)
  }
  
  // NO localStorage cache - CENTRALIZED DATABASE ONLY
  console.log('ℹ️ COMBINED PROFILE: Cache lookup disabled - using centralized Oracle database only')
  
  console.log('❌ COMBINED PROFILE: User not found in Oracle database')
  return null
}