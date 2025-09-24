// lib/user-profile-hooks.ts
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface UserProfile {
  address: string
  bitcoinAddresses: string[]
  isVerified: boolean
  hasActiveMonitoring: boolean
  rbtcBalance: string
  wrbtcBalance: string
}

export function useUserVerification() {
  const { address } = useAccount()
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bitcoinAddresses, setBitcoinAddresses] = useState<string[]>([])

  useEffect(() => {
    if (!address) {
      setIsVerified(false)
      setBitcoinAddresses([])
      return
    }

    checkVerificationStatus()
  }, [address])

  const checkVerificationStatus = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // Check if user has verified Bitcoin addresses
      const response = await fetch(`/api/oracle/user-data?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setIsVerified(data.isVerified || false)
        setBitcoinAddresses(data.bitcoinAddresses || [])
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isVerified,
    isLoading,
    bitcoinAddresses,
    checkVerificationStatus,
    address
  }
}

export function useUserProfile() {
  const { address } = useAccount()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setProfile(null)
      return
    }

    loadProfile()
  }, [address])

  const loadProfile = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const [balanceRes, oracleRes] = await Promise.all([
        fetch(`/api/realtime/balances?address=${address}`),
        fetch(`/api/oracle/user-data?address=${address}`)
      ])

      const balanceData = await balanceRes.json()
      const oracleData = await oracleRes.json()

      setProfile({
        address,
        bitcoinAddresses: oracleData.bitcoinAddresses || [],
        isVerified: oracleData.isVerified || false,
        hasActiveMonitoring: oracleData.hasActiveMonitoring || false,
        rbtcBalance: balanceData.rbtc || '0',
        wrbtcBalance: balanceData.wrbtc || '0'
      })
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    profile,
    isLoading,
    refetch: loadProfile
  }
}