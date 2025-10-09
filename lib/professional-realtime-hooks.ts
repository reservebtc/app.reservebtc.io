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
 * Hook for real-time balance data - FIXED VERSION
 * Fetches balance from /api/realtime/balance endpoint with proper error handling
 * Updates every 10 seconds for real-time synchronization
 */
export function useRealtimeBalance() {
  const { address } = useAccount()
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state if no wallet connected
    if (!address) {
      setBalance('0')
      setLoading(false)
      return
    }

    const fetchBalance = async () => {
      console.log('🔄 REALTIME HOOK: Fetching balance for', address)
      setLoading(true)
      setError(null)

      try {
        // Call the real-time balance API endpoint
        const response = await fetch(`/api/realtime/balance?address=${address}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        
        console.log('✅ REALTIME HOOK: Received data:', data)
        
        // Extract balance from API response (in satoshis)
        if (data.success && data.balance) {
          setBalance(data.balance)
          console.log('💰 REALTIME HOOK: Balance set to:', data.balance, 'sats')
        } else {
          console.warn('⚠️ REALTIME HOOK: No balance in response, using 0')
          setBalance('0')
        }
      } catch (err) {
        console.error('❌ REALTIME HOOK: Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setBalance('0')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch on mount/address change
    fetchBalance()

    // Refresh balance every 10 seconds for real-time updates
    const interval = setInterval(fetchBalance, 10000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [address])

  return { balance, loading, error }
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