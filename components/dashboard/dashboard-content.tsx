'use client';

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { 
  Wallet, 
  Bitcoin, 
  ArrowRight, 
  History, 
  Shield,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  Activity,
  Scale,
  Trophy,
  DollarSign,
  Percent
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'
import { useRealtimeUserData, useRealtimeTransactions } from '@/lib/professional-realtime-hooks'
import { oracleService } from '@/lib/oracle-service'
import { mempoolService } from '@/lib/mempool-service'

// UI Badge component
interface BadgeProps {
  variant?: 'default' | 'outline'
  className?: string
  children: React.ReactNode
}

const Badge = ({ variant = 'default', className = '', children }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded'
  const variantClasses = variant === 'outline' 
    ? 'border border-muted text-muted-foreground bg-background'
    : 'bg-primary text-primary-foreground'
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  )
}

interface BitcoinAddress {
  bitcoin_address: string
  network: string
  verified_at: string
  is_monitoring: boolean
}

interface YieldScalesData {
  isParticipant: boolean
  participantType: 'bitcoin_holder' | 'trader' | null
  currentAPY: number
  scaleBalance: {
    rbtc: number
    usdt: number
  }
  yieldEarned: number
  yieldClaimed: number
  loyaltyTier: 'bronze' | 'silver' | 'gold'
  timeInSystem: number
  nextTierIn: number
  totalTVL: number
}

interface TransactionRecord {
  id?: string
  tx_hash?: string
  txHash?: string
  block_number?: number
  blockNumber?: number
  block_timestamp?: string
  blockTimestamp?: string
  user_address?: string
  userAddress?: string
  tx_type?: string
  txType?: string
  type?: string
  amount: string
  delta?: string
  fee_wei?: string
  feeWei?: string
  status: string
}

export function DashboardContent() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  
  // Real-time hooks
  const userData = useRealtimeUserData()
  const realtimeTransactions = useRealtimeTransactions(50)
  
  // 🔥 PRODUCTION: Real Bitcoin balance from blockchain (same as Mint page)
  const [realBitcoinBalance, setRealBitcoinBalance] = useState<number>(0)
  const [isBalanceLoading, setIsBalanceLoading] = useState(true)
  const [isBalanceRefreshing, setIsBalanceRefreshing] = useState(false)
  
  // Local state
  const [bitcoinAddresses, setBitcoinAddresses] = useState<BitcoinAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentlyMonitoredAddress, setCurrentlyMonitoredAddress] = useState<string | null>(null)
  
  // Supabase transactions
  const [supabaseTransactions, setSupabaseTransactions] = useState<TransactionRecord[]>([])
  const [loadingSupabaseTransactions, setLoadingSupabaseTransactions] = useState(false)
  
  // Yield Scales
  const [yieldScalesData, setYieldScalesData] = useState<YieldScalesData>({
    isParticipant: false,
    participantType: null,
    currentAPY: 0,
    scaleBalance: { rbtc: 0, usdt: 100 },
    yieldEarned: 0,
    yieldClaimed: 0,
    loyaltyTier: 'bronze',
    timeInSystem: 0,
    nextTierIn: 180,
    totalTVL: 0
  })

  // 🔥 PRODUCTION: Format balance from REAL blockchain data
  const formattedRBTCBalance = useMemo(() => {
    if (isBalanceLoading) {
      console.log('⏳ DASHBOARD: Balance loading...')
      return '0.00000000'
    }
    
    console.log('💰 DASHBOARD: Real balance:', realBitcoinBalance.toFixed(8), 'BTC')
    return realBitcoinBalance.toFixed(8)
  }, [realBitcoinBalance, isBalanceLoading])

  // 🔥 PRODUCTION: Load REAL balance from blockchain API (same as Mint page)
  const loadRealBalance = useCallback(async (): Promise<number> => {
    if (!address) {
      console.log('⚠️ DASHBOARD: No address')
      return 0
    }

    console.log('🔄 DASHBOARD: Loading REAL balance from blockchain API...')
    setIsBalanceRefreshing(true)
    
    try {
      // 🔥 USE SAME API as Mint page - NO CACHE
      const response = await fetch(`/api/blockchain/balance?address=${address}&_t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load balance')
      }
      
      const balanceInSats = Number(data.balance)
      const btcBalance = balanceInSats / 100000000
      
      console.log(`✅ DASHBOARD: Real balance loaded: ${balanceInSats} sats = ${btcBalance.toFixed(8)} BTC`)
      
      setRealBitcoinBalance(btcBalance)
      return btcBalance
      
    } catch (error) {
      console.error('❌ DASHBOARD: Failed to load balance:', error)
      setRealBitcoinBalance(0)
      return 0
    } finally {
      setIsBalanceRefreshing(false)
      setIsBalanceLoading(false)
    }
  }, [address])

  // Load transactions from Supabase
  const loadTransactionsFromSupabase = useCallback(async () => {
    if (!address) return
    
    console.log('📊 DASHBOARD: Loading transactions from Supabase...')
    setLoadingSupabaseTransactions(true)
    
    try {
      const response = await fetch(`/api/realtime/transactions?address=${address}&limit=50&_t=${Date.now()}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ DASHBOARD: Loaded ${data.length} transactions`)
        setSupabaseTransactions(data)
      } else {
        console.error('❌ DASHBOARD: Failed to load transactions:', response.status)
        setSupabaseTransactions([])
      }
    } catch (error) {
      console.error('❌ DASHBOARD: Transaction loading error:', error)
      setSupabaseTransactions([])
    } finally {
      setLoadingSupabaseTransactions(false)
    }
  }, [address])

  // Merge transactions
  const allTransactions = useMemo(() => {
    const txMap = new Map<string, TransactionRecord>()
    
    supabaseTransactions.forEach(tx => {
      const hash = tx.tx_hash || tx.txHash || `${tx.block_number}_${tx.amount}`
      txMap.set(hash, tx)
    })
    
    realtimeTransactions.transactions.forEach((tx: any) => {
      const hash = tx.tx_hash || tx.txHash || `${tx.blockNumber}_${tx.amount}`
      txMap.set(hash, tx)
    })
    
    return Array.from(txMap.values()).sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.blockTimestamp || 0).getTime()
      const timeB = new Date(b.block_timestamp || b.blockTimestamp || 0).getTime()
      return timeB - timeA
    })
  }, [supabaseTransactions, realtimeTransactions.transactions])

  // Load Yield Scales data
  const loadYieldScalesData = useCallback(async () => {
    if (!address) return
    
    console.log('⚖️ DASHBOARD: Loading Yield Scales data...')
    
    try {
      const participantResponse = await fetch(`/api/yield-scales/participant?address=${address}&_t=${Date.now()}`)
      if (participantResponse.ok) {
        const participantData = await participantResponse.json()
        
        const statsResponse = await fetch(`/api/yield-scales/stats?_t=${Date.now()}`)
        const statsData = await statsResponse.json()
        
        const loyaltyResponse = await fetch(`/api/yield-scales/loyalty?address=${address}&_t=${Date.now()}`)
        const loyaltyData = await loyaltyResponse.json()
        
        setYieldScalesData({
          isParticipant: participantData.isParticipant || false,
          participantType: participantData.participantType || null,
          currentAPY: statsData.currentYieldRate || 0,
          scaleBalance: {
            rbtc: statsData.scalesBalance?.rbtcScale || 0,
            usdt: statsData.scalesBalance?.usdtScale || 100
          },
          yieldEarned: participantData.yieldEarned || 0,
          yieldClaimed: participantData.yieldClaimed || 0,
          loyaltyTier: loyaltyData.tier || 'bronze',
          timeInSystem: loyaltyData.timeInSystem || 0,
          nextTierIn: loyaltyData.nextTierIn || 180,
          totalTVL: statsData.totalTVL || 0
        })
        
        console.log('✅ DASHBOARD: Yield Scales data loaded')
      }
    } catch (error) {
      console.error('❌ DASHBOARD: Failed to load Yield Scales data:', error)
    }
  }, [address])

  // 🔥 PRODUCTION: Load all data
  const loadAllData = useCallback(async () => {
    if (!address) return
    
    console.log('📊 DASHBOARD: Loading all data...')
    setIsLoading(true)
    
    try {
      // 🔥 STEP 1: Load REAL balance first
      const balance = await loadRealBalance()
      
      // 🔥 STEP 2: Get Bitcoin addresses from Supabase
      const addressesResponse = await fetch(`/api/supabase/bitcoin-addresses?eth_address=${address}&_t=${Date.now()}`)
      
      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json()
        
        if (addressesData.success && addressesData.addresses) {
          const btcAddrs: BitcoinAddress[] = addressesData.addresses.map((addr: any) => ({
            bitcoin_address: addr.bitcoin_address,
            network: addr.network,
            verified_at: addr.verified_at,
            is_monitoring: addr.is_monitoring
          }))
          
          setBitcoinAddresses(btcAddrs)
          
          // Find monitored address
          const monitoredAddr = btcAddrs.find(addr => addr.is_monitoring)
          if (monitoredAddr) {
            setCurrentlyMonitoredAddress(monitoredAddr.bitcoin_address)
            console.log(`✅ DASHBOARD: Monitored address: ${monitoredAddr.bitcoin_address}`)
          } else {
            setCurrentlyMonitoredAddress(null)
          }
          
          console.log(`✅ DASHBOARD: Loaded ${btcAddrs.length} Bitcoin addresses`)
        }
      }
      
      // 🔥 STEP 3: Load Yield Scales
      await loadYieldScalesData()
      
      // 🔥 STEP 4: Load transactions
      await loadTransactionsFromSupabase()
      
    } catch (error) {
      console.error('❌ DASHBOARD: Data loading error:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      console.log('✅ DASHBOARD: All data loaded')
    }
  }, [address, loadRealBalance, loadYieldScalesData, loadTransactionsFromSupabase])

  // Initial load
  useEffect(() => {
    if (address) {
      loadAllData()
    }
  }, [address, loadAllData])

  // Background refresh every 30 seconds
  useEffect(() => {
    if (!address) return

    const interval = setInterval(() => {
      console.log('🔄 DASHBOARD: Background refresh...')
      loadRealBalance()
    }, 30000)

    return () => clearInterval(interval)
  }, [address, loadRealBalance])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadAllData()
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get transaction type safely
  const getTransactionType = (tx: TransactionRecord): string => {
    return tx.tx_type || tx.txType || tx.type || 'UNKNOWN'
  }

  // Get transaction hash safely
  const getTransactionHash = (tx: TransactionRecord): string => {
    return tx.tx_hash || tx.txHash || 'unknown'
  }

  // Get transaction timestamp safely
  const getTransactionTimestamp = (tx: TransactionRecord): string => {
    return tx.block_timestamp || tx.blockTimestamp || new Date().toISOString()
  }

  // Get transaction style
  const getTransactionStyle = (type: string) => {
    const baseStyles = {
      'MINT': { bg: 'bg-green-500/10', prefix: '+', suffix: 'rBTC' },
      'BURN': { bg: 'bg-red-500/10', prefix: '-', suffix: 'rBTC' },
      'DEPOSIT': { bg: 'bg-blue-500/10', prefix: '+', suffix: 'ETH' },
      'WITHDRAW': { bg: 'bg-orange-500/10', prefix: '-', suffix: 'ETH' },
      'TEST': { bg: 'bg-gray-500/10', prefix: '~', suffix: 'TEST' }
    }
    
    const style = baseStyles[type as keyof typeof baseStyles] || baseStyles['TEST']
    
    return {
      icon: <span className="text-gray-400">{'🔄'}</span>,
      bg: style.bg,
      prefix: style.prefix,
      suffix: style.suffix
    }
  }

  // Format loyalty tier
  const getLoyaltyDisplay = (tier: string) => {
    const displays = {
      'bronze': { icon: '🥉', label: 'Bronze', color: 'text-orange-600' },
      'silver': { icon: '🥈', label: 'Silver', color: 'text-gray-500' },
      'gold': { icon: '🥇', label: 'Gold', color: 'text-yellow-500' }
    }
    return displays[tier as keyof typeof displays] || displays.bronze
  }

  if (!isConnected || !address) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your MetaMask wallet to view your dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading || isBalanceLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground mb-6">
            Fetching real-time data from blockchain...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your Bitcoin reserves and rBTC tokens</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-green-500" />
            Real-time
            {isBalanceRefreshing && (
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />
            )}
          </Badge>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isBalanceRefreshing}
            title="Refresh data"
            className="p-2 hover:bg-accent rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground hover:text-primary transition-colors ${(isRefreshing || isBalanceRefreshing) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* rBTC-SYNTH Balance - REAL from blockchain */}
        <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
          {isBalanceRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="font-medium">rBTC-SYNTH</span>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">Soulbound</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {formattedRBTCBalance}
            </div>
            {isBalanceRefreshing && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            = {Math.round(realBitcoinBalance * 100000000).toLocaleString()} sats
          </p>
        </div>

        {/* Oracle Status */}
        <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
          {(isRefreshing || isBalanceRefreshing) && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500/20 overflow-hidden">
              <div className="h-full bg-green-500 animate-pulse w-full" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="font-medium">Oracle Status</span>
            </div>
            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
              {realBitcoinBalance > 0 ? 'Synced' : 'Not Synced'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {formattedRBTCBalance} BTC
            </div>
            {(isRefreshing || isBalanceRefreshing) && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {currentlyMonitoredAddress ? 'Monitoring active' : 'No active monitoring'}
          </p>
        </div>

        {/* Yield APY */}
        <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
          {(isRefreshing || isBalanceRefreshing) && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500/20 overflow-hidden">
              <div className="h-full bg-green-500 animate-pulse w-full" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-500" />
              <span className="font-medium">Current APY</span>
            </div>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              Live
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {yieldScalesData.currentAPY.toFixed(2)}%
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            <Link href="/yield-scales" className="text-primary hover:underline">
              View Yield Scales
            </Link>
          </p>
        </div>

        {/* Total Transactions */}
        <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
          {(loadingSupabaseTransactions || realtimeTransactions.loading || isRefreshing) && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500/20 overflow-hidden">
              <div className="h-full bg-orange-500 animate-pulse w-full" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Transactions</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {allTransactions.length}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            Total operations
          </p>
        </div>
      </div>

      {/* Yield Scales Section */}
      {(yieldScalesData.isParticipant || realBitcoinBalance > 0) && (
        <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
          {(isRefreshing || isBalanceRefreshing) && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500/20 overflow-hidden">
              <div className="h-full bg-purple-500 animate-pulse w-full" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Yield Scales Protocol</h2>
            </div>
            {!yieldScalesData.isParticipant && (
              <Link
                href="/yield-scales"
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
              >
                Join Protocol
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scales Balance */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Scale Balance</span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">rBTC</div>
                  <div className="font-bold">{yieldScalesData.scaleBalance.rbtc.toFixed(1)}%</div>
                </div>
                <div className="text-muted-foreground">/</div>
                <div>
                  <div className="text-xs text-muted-foreground">USDT</div>
                  <div className="font-bold">{yieldScalesData.scaleBalance.usdt}%</div>
                </div>
              </div>
            </div>

            {/* Loyalty Status */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Loyalty Tier</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getLoyaltyDisplay(yieldScalesData.loyaltyTier).icon}</span>
                <span className={`font-bold ${getLoyaltyDisplay(yieldScalesData.loyaltyTier).color}`}>
                  {getLoyaltyDisplay(yieldScalesData.loyaltyTier).label}
                </span>
              </div>
              {yieldScalesData.nextTierIn > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Next tier in {yieldScalesData.nextTierIn} days
                </div>
              )}
            </div>

            {/* Yield Earned */}
            {yieldScalesData.isParticipant && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Yield Earned</span>
                </div>
                <div className="font-bold text-green-600">
                  ${yieldScalesData.yieldEarned.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Claimed: ${yieldScalesData.yieldClaimed.toFixed(2)}
                </div>
              </div>
            )}

            {/* TVL */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total TVL</span>
              </div>
              <div className="font-bold">
                ${(yieldScalesData.totalTVL / 1e6).toFixed(2)}M
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Protocol liquidity
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bitcoin Addresses */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Bitcoin Addresses</h2>
          </div>
          <button
            onClick={() => router.push('/verify')}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </button>
        </div>

        {/* Quantum Protection Warning */}
        {bitcoinAddresses.length > 0 && realBitcoinBalance === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  ⚠️ Balance Zero - Quantum Protection Active
                </h4>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  Bitcoin's quantum protection automatically moves ALL funds to new addresses after ANY outgoing transaction. Verify a fresh address to continue monitoring.
                </p>
                <Link 
                  href="/verify" 
                  className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium transition-all mt-2"
                >
                  <Shield className="h-3 w-3" />
                  Verify New Address
                </Link>
              </div>
            </div>
          </div>
        )}

        {bitcoinAddresses.length > 0 ? (
          <div className="space-y-3">
            {bitcoinAddresses.map((addr) => (
              <div key={addr.bitcoin_address} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-mono text-sm">
                      {addr.bitcoin_address.slice(0, 8)}...{addr.bitcoin_address.slice(-8)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {addr.network === 'testnet' ? 'Testnet' : 'Mainnet'}
                      {addr.is_monitoring && ' • ✅ Monitoring Active'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.open(`https://mempool.space/${addr.network === 'testnet' ? 'testnet/' : ''}address/${addr.bitcoin_address}`, '_blank')}
                  className="p-2 hover:bg-muted rounded transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bitcoin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No verified addresses yet</p>
            <button
              onClick={() => router.push('/verify')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded transition-colors"
            >
              Verify Your First Address
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
        {(loadingSupabaseTransactions || realtimeTransactions.loading || isRefreshing) && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/20 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse w-full" />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              Live
            </Badge>
          </div>
          {allTransactions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Total: {allTransactions.length}
              </span>
            </div>
          )}
        </div>

        {(loadingSupabaseTransactions || realtimeTransactions.loading) && allTransactions.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-20 h-4 bg-muted rounded"></div>
                    <div className="w-32 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : allTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-sm">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allTransactions.map((tx: any) => {
              const txType = getTransactionType(tx)
              const txHash = getTransactionHash(tx)
              const txTimestamp = getTransactionTimestamp(tx)
              const style = getTransactionStyle(txType)
              const amount = txType === 'DEPOSIT' || txType === 'WITHDRAW'
                ? (Number(tx.amount) / 1e18).toFixed(6)
                : (Number(tx.amount) / 1e8).toFixed(8)
              
              return (
                <div key={txHash} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{txType}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimestamp(txTimestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {style.prefix}{amount} {style.suffix}
                    </div>
                    
                    <a 
                      href={`https://www.megaexplorer.xyz/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 justify-end"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link 
          href="/verify"
          className="flex items-center justify-center gap-3 p-4 bg-card border rounded-xl hover:bg-accent transition-colors"
        >
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">Verify Address</span>
        </Link>
        
        <Link 
          href="/mint"
          className="flex items-center justify-center gap-3 p-4 bg-card border rounded-xl hover:bg-accent transition-colors"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-medium">Mint rBTC</span>
        </Link>
        
        <Link 
          href="/yield-scales"
          className="flex items-center justify-center gap-3 p-4 bg-card border rounded-xl hover:bg-accent transition-colors"
        >
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-medium">Yield Scales</span>
        </Link>
      </div>
    </div>
  )
}