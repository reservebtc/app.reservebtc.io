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
        console.log('⚠️ VERIFIED CACHE: Oracle store unavailable, using localStorage')
      }
    } catch (oracleError) {
      console.log('⚠️ VERIFIED CACHE: Oracle store unavailable, using localStorage')
    }
    
    // Fallback: store in localStorage for immediate UI update
    // Note: This is temporary until user performs first blockchain transaction
    const cacheKey = 'verified_users_cache'
    const existingCache = localStorage.getItem(cacheKey)
    const cache: Record<string, VerifiedUser> = existingCache ? JSON.parse(existingCache) : {}
    
    cache[ethAddress.toLowerCase()] = verifiedUser
    localStorage.setItem(cacheKey, JSON.stringify(cache))
    
    console.log('✅ VERIFIED CACHE: User verification cached for dashboard display')
    
  } catch (error) {
    console.error('❌ VERIFIED CACHE: Failed to save verified user:', error)
    throw error
  }
}

/**
 * Get verified user from cache
 */
export function getVerifiedUserFromCache(ethAddress: string): VerifiedUser | null {
  try {
    const cacheKey = 'verified_users_cache'
    const existingCache = localStorage.getItem(cacheKey)
    
    if (!existingCache) {
      return null
    }
    
    const cache: Record<string, VerifiedUser> = JSON.parse(existingCache)
    return cache[ethAddress.toLowerCase()] || null
    
  } catch (error) {
    console.error('❌ VERIFIED CACHE: Failed to get verified user from cache:', error)
    return null
  }
}

/**
 * Remove user from cache (called when they appear in Oracle database)
 */
export function removeUserFromCache(ethAddress: string): void {
  try {
    const cacheKey = 'verified_users_cache'
    const existingCache = localStorage.getItem(cacheKey)
    
    if (!existingCache) {
      return
    }
    
    const cache: Record<string, VerifiedUser> = JSON.parse(existingCache)
    delete cache[ethAddress.toLowerCase()]
    localStorage.setItem(cacheKey, JSON.stringify(cache))
    
    console.log('✅ VERIFIED CACHE: User moved to Oracle database, removed from cache')
    
  } catch (error) {
    console.error('❌ VERIFIED CACHE: Failed to remove user from cache:', error)
  }
}

/**
 * Get user profile combining Oracle data and verification cache
 */
export async function getCombinedUserProfile(ethAddress: string) {
  // First try to get from Oracle (official source)
  const { getDecryptedOracleUsers } = await import('./oracle-decryption')
  
  try {
    const oracleUsers = await getDecryptedOracleUsers()
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
  
  // If not in Oracle, check verification cache
  const cachedUser = getVerifiedUserFromCache(ethAddress)
  if (cachedUser) {
    console.log('✅ COMBINED PROFILE: User found in verification cache')
    return {
      source: 'cache' as const,
      user: {
        ethAddress: cachedUser.ethAddress,
        btcAddress: cachedUser.bitcoinAddress,
        registeredAt: new Date(cachedUser.verifiedAt).toISOString(),
        lastSyncedBalance: 0,
        transactionCount: 0,
        lastSyncTime: cachedUser.verifiedAt,
        autoDetected: false,
        verificationSignature: cachedUser.signature
      },
      status: 'verified_pending' as const
    }
  }
  
  console.log('❌ COMBINED PROFILE: User not found in Oracle or cache')
  return null
}