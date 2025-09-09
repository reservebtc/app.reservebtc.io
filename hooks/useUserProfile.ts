/**
 * Universal User Profile Hook
 * 
 * This React hook provides automatic user profile data distribution
 * across all frontend components. It handles:
 * - Automatic profile loading and decryption
 * - Real-time data synchronization
 * - Proper data placement in UI components
 * - Error handling and loading states
 * - Cache management for 10,000+ users
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { userProfileManager, UniversalUserProfile } from '@/lib/user-profile-manager'

export interface UserProfileHookState {
  // Profile Data
  profile: UniversalUserProfile | null
  isLoading: boolean
  error: string | null
  
  // Specific Data Getters (for easy component access)
  userIdentity: UniversalUserProfile['userIdentity'] | null
  transactionHistory: UniversalUserProfile['transactionHistory'] | null
  allTransactionHashes: UniversalUserProfile['allTransactionHashes'] | null
  walletInformation: UniversalUserProfile['walletInformation'] | null
  userStatistics: UniversalUserProfile['userStatistics'] | null
  
  // Balances (formatted for UI display)
  rBTCBalance: string
  wrBTCBalance: string
  bitcoinBalance: string
  totalBalance: string
  
  // Transaction Lists (for UI components)
  recentTransactions: any[]
  rBTCTransactions: any[]
  wrBTCTransactions: any[]
  oracleTransactions: any[]
  
  // Profile Status
  isVerified: boolean
  hasTransactions: boolean
  isActive: boolean
  dataCompletenessScore: number
  
  // Actions
  refreshProfile: () => Promise<void>
  clearCache: () => void
}

/**
 * Universal User Profile Hook
 * Used by all components that need user data
 */
export function useUserProfile(): UserProfileHookState {
  const { address, isConnected } = useAccount()
  
  // State
  const [profile, setProfile] = useState<UniversalUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLoadAddress, setLastLoadAddress] = useState<string | null>(null)

  /**
   * Load profile data
   */
  const loadProfile = useCallback(async (userAddress: string) => {
    if (!userAddress) return
    
    console.log(`👤 HOOK: Loading profile for ${userAddress.substring(0, 10)}...`)
    
    setIsLoading(true)
    setError(null)
    
    try {
      const loadedProfile = await userProfileManager.getUserProfile(userAddress)
      
      if (loadedProfile) {
        setProfile(loadedProfile)
        setLastLoadAddress(userAddress)
        console.log(`✅ HOOK: Profile loaded successfully for ${userAddress.substring(0, 10)}...`)
      } else {
        console.log(`⚠️  HOOK: No profile data found for ${userAddress.substring(0, 10)}...`)
        setProfile(null)
      }
      
    } catch (loadError: any) {
      console.error(`❌ HOOK: Profile loading failed:`, loadError)
      setError(loadError.message || 'Failed to load profile')
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    if (!address) return
    
    console.log(`🔄 HOOK: Refreshing profile for ${address.substring(0, 10)}...`)
    
    setIsLoading(true)
    setError(null)
    
    try {
      const refreshedProfile = await userProfileManager.refreshProfile(address)
      
      if (refreshedProfile) {
        setProfile(refreshedProfile)
        console.log(`✅ HOOK: Profile refreshed successfully`)
      }
      
    } catch (refreshError: any) {
      console.error(`❌ HOOK: Profile refresh failed:`, refreshError)
      setError(refreshError.message || 'Failed to refresh profile')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    if (!address) return
    
    console.log(`🗑️  HOOK: Clearing cache for ${address.substring(0, 10)}...`)
    userProfileManager.clearProfileCache(address)
    setProfile(null)
    setLastLoadAddress(null)
  }, [address])

  /**
   * Auto-load profile when address changes
   */
  useEffect(() => {
    if (isConnected && address && address !== lastLoadAddress) {
      console.log(`🔄 HOOK: Address changed, loading profile...`)
      loadProfile(address)
    } else if (!isConnected) {
      console.log(`🔌 HOOK: Wallet disconnected, clearing profile`)
      setProfile(null)
      setLastLoadAddress(null)
      setError(null)
    }
  }, [isConnected, address, lastLoadAddress, loadProfile])

  /**
   * Computed values for easy component access
   */
  const computedValues = useMemo(() => {
    if (!profile) {
      return {
        userIdentity: null,
        transactionHistory: null,
        allTransactionHashes: null,
        walletInformation: null,
        userStatistics: null,
        rBTCBalance: '0.00000000',
        wrBTCBalance: '0.00000000',
        bitcoinBalance: '0.00000000',
        totalBalance: '0.00000000',
        recentTransactions: [],
        rBTCTransactions: [],
        wrBTCTransactions: [],
        oracleTransactions: [],
        isVerified: false,
        hasTransactions: false,
        isActive: false,
        dataCompletenessScore: 0
      }
    }

    // Format balances for UI display
    const rBTCBalance = parseFloat(profile.transactionHistory.rBTCStats.currentBalance || '0') / 100000000 // Convert satoshis to BTC
    const wrBTCBalance = parseFloat(profile.transactionHistory.wrBTCStats.currentBalance || '0') / 100000000
    const totalBalance = rBTCBalance + wrBTCBalance

    // Get recent transactions (last 10 from all types)
    const allTransactions = [
      ...profile.transactionHistory.rBTCTransactions.map(tx => ({ ...tx, source: 'rBTC' })),
      ...profile.transactionHistory.wrBTCTransactions.map(tx => ({ ...tx, source: 'wrBTC' })),
      ...profile.transactionHistory.oracleTransactions.map(tx => ({ ...tx, source: 'oracle' }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)

    return {
      userIdentity: profile.userIdentity,
      transactionHistory: profile.transactionHistory,
      allTransactionHashes: profile.allTransactionHashes,
      walletInformation: profile.walletInformation,
      userStatistics: profile.userStatistics,
      
      rBTCBalance: rBTCBalance.toFixed(8),
      wrBTCBalance: wrBTCBalance.toFixed(8),
      bitcoinBalance: '0.00000000', // TODO: Get from Bitcoin API
      totalBalance: totalBalance.toFixed(8),
      
      recentTransactions: allTransactions,
      rBTCTransactions: profile.transactionHistory.rBTCTransactions,
      wrBTCTransactions: profile.transactionHistory.wrBTCTransactions,
      oracleTransactions: profile.transactionHistory.oracleTransactions,
      
      isVerified: profile.userIdentity.verificationType !== 'unknown' && profile.walletInformation.bitcoin.addresses.length > 0,
      hasTransactions: profile.userStatistics.totalTransactionCount > 0,
      isActive: profile.userIdentity.profileStatus === 'active',
      dataCompletenessScore: profile.systemMetadata.dataCompletenessScore
    }
  }, [profile])

  return {
    profile,
    isLoading,
    error,
    
    ...computedValues,
    
    refreshProfile,
    clearCache
  }
}

/**
 * Specialized hooks for specific data types
 * These hooks provide focused data for specific components
 */

/**
 * Hook for verification page components
 */
export function useUserVerification() {
  const { userIdentity, walletInformation, isVerified, isLoading, error, refreshProfile } = useUserProfile()
  
  return {
    bitcoinAddresses: walletInformation?.bitcoin.addresses || [],
    primaryBitcoinAddress: walletInformation?.bitcoin.primaryAddress,
    ethAddress: userIdentity?.ethAddress,
    isVerified,
    verificationType: userIdentity?.verificationType,
    profileCreatedAt: userIdentity?.profileCreatedAt,
    isLoading,
    error,
    refreshProfile
  }
}

/**
 * Hook for mint page components
 */
export function useUserMintData() {
  const { 
    rBTCBalance, 
    bitcoinBalance, 
    rBTCTransactions, 
    oracleTransactions,
    userStatistics,
    isLoading, 
    error, 
    refreshProfile 
  } = useUserProfile()
  
  const lastMintTransaction = rBTCTransactions.find(tx => tx.type === 'mint')
  const totalMinted = rBTCTransactions
    .filter(tx => tx.type === 'mint')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)
  
  return {
    rBTCBalance,
    bitcoinBalance,
    totalMinted: (totalMinted / 100000000).toFixed(8), // Convert to BTC
    mintTransactions: rBTCTransactions.filter(tx => tx.type === 'mint'),
    lastMintTransaction,
    totalTransactions: userStatistics?.totalTransactionCount || 0,
    isLoading,
    error,
    refreshProfile
  }
}

/**
 * Hook for wrap page components
 */
export function useUserWrapData() {
  const { 
    rBTCBalance, 
    wrBTCBalance, 
    rBTCTransactions,
    wrBTCTransactions,
    userStatistics,
    isLoading, 
    error, 
    refreshProfile 
  } = useUserProfile()
  
  const wrapTransactions = wrBTCTransactions.filter(tx => tx.type === 'wrapped')
  const unwrapTransactions = wrBTCTransactions.filter(tx => tx.type === 'redeemed')
  
  return {
    rBTCBalance,
    wrBTCBalance,
    wrapTransactions,
    unwrapTransactions,
    totalWrapped: wrapTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) / 100000000,
    totalUnwrapped: unwrapTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) / 100000000,
    lastWrapTransaction: wrapTransactions[wrapTransactions.length - 1],
    isLoading,
    error,
    refreshProfile
  }
}

/**
 * Hook for dashboard page components
 */
export function useUserDashboard() {
  const { 
    profile,
    rBTCBalance,
    wrBTCBalance,
    totalBalance,
    recentTransactions,
    userStatistics,
    allTransactionHashes,
    userIdentity,
    walletInformation,
    isVerified,
    hasTransactions,
    dataCompletenessScore,
    isLoading,
    error,
    refreshProfile
  } = useUserProfile()
  
  return {
    // Overview data
    totalBalance,
    rBTCBalance,
    wrBTCBalance,
    
    // Transaction data
    recentTransactions,
    totalTransactionCount: userStatistics?.totalTransactionCount || 0,
    lastTransactionHash: allTransactionHashes?.lastTxHash,
    
    // User info
    ethAddress: userIdentity?.ethAddress,
    bitcoinAddresses: walletInformation?.bitcoin.addresses || [],
    isVerified,
    hasTransactions,
    profileCreatedAt: userIdentity?.profileCreatedAt,
    lastActivityAt: userIdentity?.lastActivityAt,
    
    // Statistics
    firstTransactionDate: userStatistics?.firstTransactionDate,
    lastTransactionDate: userStatistics?.lastTransactionDate,
    mostActiveContract: userStatistics?.mostActiveContract,
    averageTransactionValue: userStatistics?.averageTransactionValue,
    dataCompletenessScore,
    
    // Full profile for advanced components
    fullProfile: profile,
    
    // Loading state
    isLoading,
    error,
    refreshProfile
  }
}

export default useUserProfile