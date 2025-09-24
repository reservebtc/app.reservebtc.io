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
 */
export function useRealtimeUserData() {
  const { address } = useAccount()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    setLoading(true)

    // Get initial data
    realtimeAPI.getUserData(address)
      .then(data => {
        setUserData(data as unknown as UserData)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Subscribe to real-time updates
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
 * Hook for real-time balance data
 */
export function useRealtimeBalance() {
  const { address } = useAccount()
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    setLoading(true)

    // Get initial balance
    realtimeAPI.getUserData(address)
      .then(data => {
        const userData = data as unknown as UserData
        setBalance(userData.balance || '0')
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Subscribe to balance updates
    const cleanup = realtimeAPI.subscribeToUser(address, (event: string, data: any) => {
      if (event === 'balanceUpdate') {
        setBalance(data.balance || '0')
      }
    })

    return cleanup
  }, [address])

  return { balance, loading }
}

/**
 * Hook for real-time transactions
 */
export function useRealtimeTransactions(limit: number = 50) {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    setLoading(true)

    // Initialize with empty array for now
    setTransactions([])
    setLoading(false)

    // Subscribe to transaction updates
    const cleanup = realtimeAPI.subscribeToUser(address, (event: string, data: any) => {
      if (event === 'transactionUpdate') {
        setTransactions(prev => [data, ...prev].slice(0, limit))
      }
    })

    return cleanup
  }, [address, limit])

  return { transactions, loading }
}

/**
 * Hook for formatted balance display
 */
export function useFormattedBalance() {
  const formatBalance = useCallback((balance: string | number, decimals: number = 8) => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance
    if (isNaN(num)) return '0'

    // Convert from wei/smallest unit if needed
    const formatted = num / Math.pow(10, decimals)
    return formatted.toFixed(8)
  }, [])

  return formatBalance
}

/**
 * Hook for transaction formatting
 */
export function useTransactionFormatter() {
  const formatTx = useCallback((tx: TransactionData) => {
    return {
      ...tx,
      formattedAmount: parseFloat(tx.amount).toFixed(8),
      formattedTime: new Date(tx.timestamp * 1000).toLocaleDateString()
    }
  }, [])

  return formatTx
}