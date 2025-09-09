/**
 * Transaction Hash Cache Administration Component
 * Professional tool for monitoring and managing transaction hash cache
 */

'use client'

import { useState, useEffect } from 'react'
import { transactionHashCache } from '@/lib/transaction-hash-cache'

interface CacheStats {
  size: number
  maxEntries: number
  maxAge: number
}

export function TransactionHashAdmin() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadStats = () => {
    const cacheStats = transactionHashCache.getCacheStats()
    setStats(cacheStats)
  }

  const handleClearCache = () => {
    if (confirm('Clear transaction hash cache? This will remove all cached blockchain correlations.')) {
      transactionHashCache.clearCache()
      loadStats()
    }
  }

  const handleRefreshStats = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
    loadStats()
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (!stats) return null

  return (
    <div className="bg-card border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transaction Hash Cache</h3>
        <div className="text-xs text-muted-foreground">
          Professional Cache System
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Cached Entries</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.size}
          </div>
          <div className="text-xs text-muted-foreground">
            of {stats.maxEntries} max
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Cache Duration</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.maxAge}h
          </div>
          <div className="text-xs text-muted-foreground">
            Auto-refresh period
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Efficiency</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.size > 0 ? Math.round((stats.size / stats.maxEntries) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">
            Cache utilization
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleRefreshStats}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
        </button>
        
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          Clear Cache
        </button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div>💡 <strong>How it works:</strong></div>
        <div>• Correlates Oracle users with blockchain transactions by amount & timing</div>
        <div>• Caches results for 24h to minimize RPC calls</div>
        <div>• Falls back to Oracle identifiers when blockchain correlation fails</div>
        <div>• Automatically manages cache size and expiration</div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
          🎯 Long-term Solution
        </div>
        <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          For production scale, consider asking Oracle server team to add transaction hash endpoint: 
          <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">
            /api/user/{'{userId}'}/transactions
          </code>
        </div>
      </div>
    </div>
  )
}