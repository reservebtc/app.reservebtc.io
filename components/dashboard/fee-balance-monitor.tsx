// components/dashboard/fee-balance-monitor.tsx
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, Clock, Zap, Shield, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { createPublicClient, http, formatEther } from 'viem'
import { megaeth } from '@/lib/chains/megaeth'

const FEE_VAULT_ADDRESS = '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1'
const FEE_VAULT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

export function FeeBalanceMonitor() {
  const { address } = useAccount()
  const [feeBalance, setFeeBalance] = useState(0)
  const [estimatedFees, setEstimatedFees] = useState(0.0001)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [syncHistory, setSyncHistory] = useState<any[]>([])

  useEffect(() => {
    if (!address) return

    const checkBalance = async () => {
      try {
        const client = createPublicClient({
          chain: megaeth,
          transport: http()
        })

        // Get fee balance
        const balance = await client.readContract({
          address: FEE_VAULT_ADDRESS,
          abi: FEE_VAULT_ABI,
          functionName: 'balanceOf',
          args: [address]
        })

        const balanceInEth = parseFloat(formatEther(balance as bigint))
        setFeeBalance(balanceInEth)

        // Estimate next fee
        const estimated = await getEstimatedNextFee()
        setEstimatedFees(estimated)

        // Calculate time remaining
        if (balanceInEth < estimated) {
          const syncsRemaining = Math.floor(balanceInEth / estimated)
          const timeLeft = syncsRemaining * 30 * 1000 // 30 seconds per sync
          setTimeRemaining(timeLeft)
        } else {
          setTimeRemaining(null)
        }

        // Get sync history
        const history = await getSyncHistory(address)
        setSyncHistory(history)

        setLoading(false)
      } catch (error) {
        console.error('Failed to load fee balance:', error)
        setLoading(false)
      }
    }

    checkBalance()

    if (autoRefresh) {
      const interval = setInterval(checkBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [address, autoRefresh])

  async function getEstimatedNextFee(): Promise<number> {
    // In production, calculate based on gas prices and complexity
    return 0.0001 // ~$0.50 at current prices
  }

  async function getSyncHistory(userAddress: string): Promise<any[]> {
    // Fetch from API
    try {
      const response = await fetch(`/api/fee-vault/history?address=${userAddress}`)
      const data = await response.json()
      return data.history || []
    } catch {
      return []
    }
  }

  function formatETH(value: number): string {
    if (value < 0.0001) return '<0.0001'
    return value.toFixed(4)
  }

  function formatDuration(ms: number): string {
    if (ms < 60000) return `${Math.floor(ms / 1000)} seconds`
    if (ms < 3600000) return `${Math.floor(ms / 60000)} minutes`
    if (ms < 86400000) return `${Math.floor(ms / 3600000)} hours`
    return `${Math.floor(ms / 86400000)} days`
  }

  function getStatusColor(balance: number, estimated: number) {
    const ratio = balance / estimated
    if (ratio >= 100) return 'text-green-500'
    if (ratio >= 50) return 'text-blue-500'
    if (ratio >= 10) return 'text-yellow-500'
    if (ratio >= 5) return 'text-orange-500'
    return 'text-red-500'
  }

  function getStatusLabel(balance: number, estimated: number) {
    const ratio = balance / estimated
    if (ratio >= 100) return { text: 'Excellent', icon: Shield }
    if (ratio >= 50) return { text: 'Good', icon: Shield }
    if (ratio >= 10) return { text: 'Monitor', icon: Clock }
    if (ratio >= 5) return { text: 'Low', icon: TrendingDown }
    return { text: 'Critical', icon: AlertTriangle }
  }

  async function topUpFees() {
    // Open top-up modal or redirect
    window.location.href = '/mint'
  }

  async function setupAutoTopUp() {
    alert('Auto top-up feature coming soon!')
  }

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

  // Critical warning for low balance
  if (timeRemaining && timeRemaining < 24 * 60 * 60 * 1000) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-500 dark:text-red-400 mb-2">
              🚨 Critical: Low Fee Balance
            </h3>
            <p className="text-sm mb-4">
              Your rBTC-SYNTH tokens will be automatically burned in{' '}
              <strong className="text-red-500">{formatDuration(timeRemaining)}</strong>{' '}
              if not topped up.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                <p className="font-bold text-red-500">{formatETH(feeBalance)} ETH</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Required</p>
                <p className="font-bold">{formatETH(estimatedFees)} ETH</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={topUpFees}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Top Up Now
              </button>
              <button 
                onClick={setupAutoTopUp}
                className="flex-1 bg-background hover:bg-muted border font-medium py-2 px-4 rounded-lg transition-colors"
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
    <div className="bg-card rounded-xl border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Fee Balance Monitor
          </h3>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border transition-colors ${
              autoRefresh ? 'bg-primary text-primary-foreground' : 'bg-background'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
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
              <p className={`text-3xl font-bold ${getStatusColor(feeBalance, estimatedFees)}`}>
                {formatETH(feeBalance)} ETH
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {Math.floor(feeBalance / estimatedFees)} syncs remaining
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
                <p className="text-xs text-muted-foreground mb-1">Next Fee</p>
                <p className="font-medium">{formatETH(estimatedFees)} ETH</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Sync Rate</p>
                <p className="font-medium">30s</p>
              </div>
            </div>

            {/* Action Buttons */}
            {feeBalance < estimatedFees * 10 && (
              <div className="flex gap-2">
                <button 
                  onClick={topUpFees}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add Funds
                </button>
                <button 
                  onClick={setupAutoTopUp}
                  className="flex-1 bg-background hover:bg-muted border font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Auto Top-Up
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Activity */}
      {syncHistory.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-medium mb-3">Recent Sync Activity</h4>
          <div className="space-y-2">
            {syncHistory.slice(0, 3).map((sync, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(sync.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-mono">-{formatETH(sync.fee)} ETH</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}