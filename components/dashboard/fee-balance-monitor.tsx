'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, TrendingDown, Clock, Zap, Shield, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { createPublicClient, http, formatEther, parseAbi } from 'viem'
import { megaeth } from '@/lib/chains/megaeth'

// 🔥 PRODUCTION: Contract addresses from deployment
const FEE_VAULT_ADDRESS = '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f'
const ORACLE_CONTRACT = '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc'

// 🔒 PRODUCTION: Use private MegaETH RPC
const PRIVATE_RPC = process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 
                    'https://carrot.megaeth.com/rpc'

// Contract ABIs for reading blockchain data
const FEE_VAULT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

const ORACLE_ABI = parseAbi([
  'event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'
])

// TypeScript interfaces for type safety
interface SyncHistoryEntry {
  timestamp: string
  fee: number
  txHash: string
  action: 'MINT' | 'BURN'
  deltaSats: number
}

export function FeeBalanceMonitor() {
  const { address } = useAccount()
  
  // State management
  const [feeBalance, setFeeBalance] = useState(0)
  const [estimatedFees, setEstimatedFees] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([])
  const [gasPrice, setGasPrice] = useState<bigint>(BigInt(0))

  // 🔥 PRODUCTION: HTTP-only client (no WebSocket)
  const publicClient = createPublicClient({
    chain: megaeth,
    transport: http(PRIVATE_RPC, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000
    })
  })

  // 🔥 PRODUCTION: Load real fee balance from blockchain
  const checkBalance = useCallback(async () => {
    if (!address) return
    
    try {
      console.log('💰 FEE MONITOR: Checking fee balance for:', address)
      setRefreshing(true)

      // Get real fee balance from FeeVault contract
      const balance = await publicClient.readContract({
        address: FEE_VAULT_ADDRESS,
        abi: FEE_VAULT_ABI,
        functionName: 'balanceOf',
        args: [address]
      })

      const balanceInEth = parseFloat(formatEther(balance as bigint))
      setFeeBalance(balanceInEth)
      console.log(`✅ FEE MONITOR: Balance loaded: ${balanceInEth.toFixed(6)} ETH`)

      // Get real gas price for accurate fee estimation
      const currentGasPrice = await publicClient.getGasPrice()
      setGasPrice(currentGasPrice)
      
      // Calculate real estimated fee based on current gas price
      const estimatedGas = BigInt(150000) // Typical sync operation gas usage
      const feeInWei = currentGasPrice * estimatedGas
      const estimated = parseFloat(formatEther(feeInWei))
      setEstimatedFees(estimated)

      // Calculate time remaining until balance runs out
      if (balanceInEth > 0 && estimated > 0) {
        const syncsRemaining = Math.floor(balanceInEth / estimated)
        const timeLeft = syncsRemaining * 30 * 1000 // 30 seconds per sync
        setTimeRemaining(timeLeft)
        console.log(`⏱️ FEE MONITOR: ~${syncsRemaining} syncs remaining (${Math.floor(timeLeft / 60000)} minutes)`)
      } else {
        setTimeRemaining(null)
      }

      // Get real sync history from blockchain events
      try {
        // Fix: Calculate fromBlock correctly with BigInt
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlockNumber = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0)
        
        const logs = await publicClient.getLogs({
          address: ORACLE_CONTRACT,
          event: ORACLE_ABI[0],
          args: { user: address },
          fromBlock: fromBlockNumber, // Last ~10k blocks
          toBlock: 'latest'
        })

        const history = logs.slice(-10).reverse().map((log: any) => ({
          timestamp: new Date(Number(log.args?.timestamp || 0) * 1000).toISOString(),
          fee: parseFloat(formatEther(log.args?.feeWei || BigInt(0))),
          txHash: log.transactionHash,
          action: (log.args?.deltaSats > 0 ? 'MINT' : 'BURN') as 'MINT' | 'BURN',
          deltaSats: Number(log.args?.deltaSats || 0)
        }))

        setSyncHistory(history)
        console.log(`📊 FEE MONITOR: Loaded ${history.length} sync history entries`)
      } catch (error) {
        console.warn('⚠️ FEE MONITOR: Could not load sync history:', error)
        setSyncHistory([])
      }

      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('❌ FEE MONITOR: Failed to load fee balance:', error)
      setLoading(false)
      setRefreshing(false)
    }
  }, [address, publicClient])

  // Initial load on mount
  useEffect(() => {
    if (address) {
      checkBalance()
    }
  }, [address, checkBalance])

  // Auto refresh interval (every 30 seconds)
  useEffect(() => {
    if (!address || !autoRefresh) return

    const interval = setInterval(() => {
      console.log('🔄 FEE MONITOR: Auto-refresh...')
      checkBalance()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [address, autoRefresh, checkBalance])

  // Format ETH value for display
  function formatETH(value: number): string {
    if (value < 0.0001) return '<0.0001'
    return value.toFixed(6)
  }

  // Format duration for display
  function formatDuration(ms: number): string {
    if (ms < 60000) return `${Math.floor(ms / 1000)} seconds`
    if (ms < 3600000) return `${Math.floor(ms / 60000)} minutes`
    if (ms < 86400000) return `${Math.floor(ms / 3600000)} hours`
    return `${Math.floor(ms / 86400000)} days`
  }

  // Get status color based on balance ratio
  function getStatusColor(balance: number, estimated: number) {
    if (estimated === 0) return 'text-muted-foreground'
    const ratio = balance / estimated
    if (ratio >= 100) return 'text-green-500'
    if (ratio >= 50) return 'text-blue-500'
    if (ratio >= 10) return 'text-yellow-500'
    if (ratio >= 5) return 'text-orange-500'
    return 'text-red-500'
  }

  // Get status label and icon
  function getStatusLabel(balance: number, estimated: number) {
    if (estimated === 0) return { text: 'Unknown', icon: Clock }
    const ratio = balance / estimated
    if (ratio >= 100) return { text: 'Excellent', icon: Shield }
    if (ratio >= 50) return { text: 'Good', icon: Shield }
    if (ratio >= 10) return { text: 'Monitor', icon: Clock }
    if (ratio >= 5) return { text: 'Low', icon: TrendingDown }
    return { text: 'Critical', icon: AlertTriangle }
  }

  // Action handlers
  async function topUpFees() {
    window.location.href = '/mint'
  }

  async function setupAutoTopUp() {
    alert('Auto top-up feature coming soon! This will automatically deposit ETH when balance is low.')
  }

  // Manual refresh handler
  const handleManualRefresh = () => {
    checkBalance()
  }

  // Wallet not connected state
  if (!address) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <p className="text-center text-muted-foreground">
          Connect wallet to monitor fee balance
        </p>
      </div>
    )
  }

  const status = getStatusLabel(feeBalance, estimatedFees)
  const StatusIcon = status.icon

  // 🚨 CRITICAL WARNING: Low balance (less than 24 hours remaining)
  if (timeRemaining && timeRemaining < 24 * 60 * 60 * 1000) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/20">
            <div className="h-full bg-red-500 animate-pulse w-full" />
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-500 dark:text-red-400 mb-2">
              🚨 Critical: Low Fee Balance
            </h3>
            <p className="text-sm mb-4">
              Your rBTC-SYNTH balance monitoring will stop in{' '}
              <strong className="text-red-500">{formatDuration(timeRemaining)}</strong>{' '}
              if not topped up. Add ETH to Fee Vault to continue.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                <p className="font-bold text-red-500">{formatETH(feeBalance)} ETH</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Est. Fee/Sync</p>
                <p className="font-bold">{formatETH(estimatedFees)} ETH</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={topUpFees}
                disabled={refreshing}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Top Up Now
              </button>
              <button 
                onClick={setupAutoTopUp}
                disabled={refreshing}
                className="flex-1 bg-background hover:bg-muted disabled:opacity-50 border font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Setup Auto Top-Up
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal status display
  return (
    <div className="bg-card rounded-xl border relative overflow-hidden">
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}
      
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Fee Balance Monitor
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh balance"
              className="p-2 hover:bg-accent rounded-lg border transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              className={`p-2 rounded-lg border transition-colors ${
                autoRefresh ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-10 bg-muted rounded-lg" />
          </div>
        ) : (
          <>
            {/* Main Balance Display */}
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Fee Vault Balance</span>
                <StatusIcon className={`w-5 h-5 ${getStatusColor(feeBalance, estimatedFees)}`} />
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${getStatusColor(feeBalance, estimatedFees)}`}>
                  {formatETH(feeBalance)} ETH
                </p>
                {refreshing && (
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {estimatedFees > 0 ? (
                  `≈ ${Math.floor(feeBalance / estimatedFees)} syncs remaining`
                ) : (
                  'Calculating...'
                )}
              </p>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className={`font-medium ${getStatusColor(feeBalance, estimatedFees)}`}>
                  {status.text}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Est. Fee</p>
                <p className="font-medium">{formatETH(estimatedFees)} ETH</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Gas Price</p>
                <p className="font-medium">
                  {gasPrice > 0 ? `${Math.round(Number(gasPrice) / 1e9)} gwei` : '...'}
                </p>
              </div>
            </div>

            {/* Action Buttons - Show if balance is low */}
            {feeBalance < estimatedFees * 10 && (
              <div className="flex gap-2">
                <button 
                  onClick={topUpFees}
                  disabled={refreshing}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add Funds
                </button>
                <button 
                  onClick={setupAutoTopUp}
                  disabled={refreshing}
                  className="flex-1 bg-background hover:bg-muted disabled:opacity-50 border font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Auto Top-Up
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Real Transaction History from Blockchain */}
      {syncHistory.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-medium mb-3">Recent Sync Activity</h4>
          <div className="space-y-2">
            {syncHistory.slice(0, 5).map((sync, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {new Date(sync.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    sync.action === 'MINT' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {sync.action}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">-{formatETH(sync.fee)} ETH</span>
                  <a 
                    href={`https://www.megaexplorer.xyz/tx/${sync.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No history message */}
      {syncHistory.length === 0 && !loading && (
        <div className="p-6 text-center text-muted-foreground text-sm">
          No sync activity yet
        </div>
      )}
    </div>
  )
}