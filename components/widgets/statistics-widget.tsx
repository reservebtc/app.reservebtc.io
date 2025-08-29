'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, Bitcoin } from 'lucide-react'

interface StatisticsData {
  totalRBTCMinted: number
  verifiedWallets: number
  lastSyncTimestamp: string
  totalValueLocked: number
}

export function StatisticsWidget() {
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const mockStats: StatisticsData = {
          totalRBTCMinted: 42.37128456,
          verifiedWallets: 1247,
          lastSyncTimestamp: new Date().toISOString(),
          totalValueLocked: 2847392.45
        }
        
        setStats(mockStats)
      } catch (err) {
        setError('Failed to load statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl p-8 space-y-6">
        <h3 className="text-xl font-semibold text-center">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="bg-muted animate-pulse h-8 w-full rounded" />
              <div className="bg-muted animate-pulse h-4 w-3/4 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Statistics</h3>
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  const formatBTC = (amount: number) => {
    return amount.toFixed(8).replace(/\.?0+$/, '')
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    return `${hours} hours ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border rounded-xl p-8 space-y-6"
    >
      <h3 className="text-xl font-semibold text-center">Live Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total rBTC Minted */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <Bitcoin className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {formatBTC(stats.totalRBTCMinted)}
          </div>
          <div className="text-sm text-muted-foreground">Total rBTC Minted</div>
        </motion.div>

        {/* Verified Wallets */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">
            {stats.verifiedWallets.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Verified Wallets</div>
        </motion.div>

        {/* Total Value Locked */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold">
            {formatUSD(stats.totalValueLocked)}
          </div>
          <div className="text-sm text-muted-foreground">Total Value Locked</div>
        </motion.div>

        {/* Last Sync */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-sm font-medium">
            {timeAgo(stats.lastSyncTimestamp)}
          </div>
          <div className="text-sm text-muted-foreground">Last Sync</div>
        </motion.div>
      </div>

      {/* Additional Metrics */}
      <div className="border-t pt-6 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Exchange Rate:</span>
          <span className="font-mono">1 BTC = 1 rBTC</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Network:</span>
          <span className="text-primary font-medium">MegaETH</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Status:</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-600">Active</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}