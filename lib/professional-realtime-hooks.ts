import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { realtimeAPI } from '@/lib/professional-realtime'

export interface UserData {
  address: string
  btcAddress?: string
  balance: string
  status: string
}

export interface TransactionData {
  hash: string
  type: string
  amount: string
  timestamp: number
  status: string
}

/**
 * Hook for real-time user data
 * Fetches and subscribes to user profile updates from Oracle server
 */
export function useRealtimeUserData() {
  const { address } = useAccount()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    setLoading(true)

    // Get initial data from Oracle server
    realtimeAPI.getUserData(address)
      .then(data => {
        setUserData(data as unknown as UserData)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Subscribe to real-time updates via WebSocket/polling
    const cleanup = realtimeAPI.subscribeToUser(address, (event: string, data: any) => {
      if (event === 'userDataUpdate') {
        setUserData(data)
      }
    })

    return cleanup
  }, [address])

  return { userData, loading }
}

/**
 * Hook for real-time balance data - OPTIMIZED UX VERSION
 * Fetches balance from /api/realtime/balances endpoint with silent background updates
 * Updates every 10 seconds WITHOUT showing loading spinner after initial load
 * 
 * Features:
 * - Initial load shows loading state
 * - Background updates are silent (no UI flicker)
 * - Optimistic UI - always shows last known balance
 * - Separate isRefreshing state for background updates
 * 
 * API Response format:
 * {
 *   success: boolean,
 *   balance: string,      // Balance in satoshis (string)
 *   oracleSats: number,   // Same balance as number
 *   btc: string,          // Formatted BTC value
 *   lastUpdate: string
 * }
 */
export function useRealtimeBalance() {
  const { address } = useAccount()
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(true)  // Only for INITIAL load
  const [isRefreshing, setIsRefreshing] = useState(false)  // For background updates
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)  // Track first load

  useEffect(() => {
    // Reset state if no wallet connected
    if (!address) {
      setBalance('0')
      setLoading(false)
      setIsInitialLoad(true)
      return
    }

    const fetchBalance = async (isBackground = false) => {
      console.log(`🔄 REALTIME HOOK: ${isBackground ? 'Background' : 'Initial'} fetch for`, address)
      
      // Only show main loading on FIRST load
      if (!isBackground && isInitialLoad) {
        setLoading(true)
      } else if (isBackground) {
        setIsRefreshing(true)  // Silent background indicator
      }
      
      setError(null)

      try {
        // Call the real-time balance API endpoint
        const response = await fetch(`/api/realtime/balances?address=${address}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        
        console.log(`✅ REALTIME HOOK: ${isBackground ? 'Background' : 'Initial'} data:`, data)
        
        // Extract balance from API response (in satoshis)
        // Try multiple fields for maximum compatibility
        if (data.success && data.balance) {
          setBalance(data.balance)
          console.log('💰 REALTIME HOOK: Balance updated to:', data.balance, 'sats')
        } else if (data.oracleSats !== undefined) {
          // Fallback to oracleSats field (your API uses this)
          setBalance(data.oracleSats.toString())
          console.log('💰 REALTIME HOOK: Balance from oracleSats:', data.oracleSats, 'sats')
        } else {
          console.warn('⚠️ REALTIME HOOK: No balance in response, keeping current value')
          // Don't set to '0' on refresh - keep existing balance
        }
        
        // Mark initial load as complete
        if (isInitialLoad) {
          setIsInitialLoad(false)
        }
        
      } catch (err) {
        console.error(`❌ REALTIME HOOK: ${isBackground ? 'Background' : 'Initial'} fetch error:`, err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        
        // On background error, keep existing balance
        // Only set to '0' on initial load error
        if (!isBackground) {
          setBalance('0')
        }
      } finally {
        if (!isBackground && isInitialLoad) {
          setLoading(false)
        }
        if (isBackground) {
          setIsRefreshing(false)
        }
      }
    }

    // Initial fetch on mount/address change
    fetchBalance(false)

    // Background refresh every 10 seconds (silent updates)
    const interval = setInterval(() => {
      fetchBalance(true)  // Pass true = background refresh
    }, 10000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [address])

  return { 
    balance, 
    loading,        // Only true during INITIAL load
    isRefreshing,   // True during background updates
    error 
  }
}

/**
 * Hook for real-time transactions
 * Fetches transaction history and subscribes to new transaction events
 */
export function useRealtimeTransactions(limit: number = 50) {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    setLoading(true)

    // Initialize with empty array - could fetch from API here if needed
    setTransactions([])
    setLoading(false)

    // Subscribe to transaction updates from Oracle server
    const cleanup = realtimeAPI.subscribeToUser(address, (event: string, data: any) => {
      if (event === 'transactionUpdate') {
        // Add new transaction to top of list, keep only recent transactions
        setTransactions(prev => [data, ...prev].slice(0, limit))
      }
    })

    return cleanup
  }, [address, limit])

  return { transactions, loading }
}

/**
 * Hook for formatted balance display
 * Converts raw balance to human-readable format with proper decimals
 */
export function useFormattedBalance() {
  const formatBalance = useCallback((balance: string | number, decimals: number = 8) => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance
    if (isNaN(num)) return '0'

    // Convert from satoshis/smallest unit to standard decimal format
    const formatted = num / Math.pow(10, decimals)
    return formatted.toFixed(8)
  }, [])

  return formatBalance
}

/**
 * Hook for transaction formatting
 * Transforms raw transaction data into user-friendly display format
 */
export function useTransactionFormatter() {
  const formatTx = useCallback((tx: TransactionData) => {
    return {
      ...tx,
      // Format amount to 8 decimal places
      formattedAmount: parseFloat(tx.amount).toFixed(8),
      // Convert Unix timestamp to readable date
      formattedTime: new Date(tx.timestamp * 1000).toLocaleDateString()
    }
  }, [])

  return formatTx
}