// app/yield-scales/stats/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, BarChart3, RefreshCw } from 'lucide-react'

export default function YieldScalesStatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadStats()
    
    if (autoRefresh) {
      const interval = setInterval(loadStats, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function loadStats() {
    try {
      const response = await fetch('/api/yield-scales/stats')
      const data = await response.json()
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load stats')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Yield Scales Statistics
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time protocol metrics and performance data
          </p>
        </div>

        {/* Auto-refresh toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh ? 'bg-primary text-primary-foreground' : 'bg-card'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card rounded-xl border p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Current APY"
                value={`${stats?.currentYieldRate || 0}%`}
                icon={TrendingUp}
                color="text-green-500"
                change={stats?.performance?.last24h}
              />
              <StatCard
                title="Total TVL"
                value={`$${(stats?.totalTVL || 0).toLocaleString()}`}
                icon={DollarSign}
                color="text-blue-500"
              />
              <StatCard
                title="USDT Scale"
                value={`${stats?.scalesBalance?.usdtScale || 0}%`}
                icon={Activity}
                color="text-purple-500"
              />
              <StatCard
                title="rBTC Scale"
                value={`${stats?.scalesBalance?.rbtcScale || 0}%`}
                icon={Activity}
                color="text-orange-500"
              />
            </div>

            {/* Scales Visualization */}
            <div className="bg-card rounded-xl border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Balance Scales</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">USDT Scale</span>
                    <span className="font-medium">{stats?.scalesBalance?.usdtScale || 0}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000"
                      style={{ width: `${stats?.scalesBalance?.usdtScale || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">rBTC Scale</span>
                    <span className="font-medium">{stats?.scalesBalance?.rbtcScale || 0}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                      style={{ width: `${Math.min(100, stats?.scalesBalance?.rbtcScale || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <PerformanceCard
                period="24h"
                value={stats?.performance?.last24h}
              />
              <PerformanceCard
                period="7d"
                value={stats?.performance?.last7d}
              />
              <PerformanceCard
                period="30d"
                value={stats?.performance?.last30d}
              />
            </div>

            {/* Breakdown */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Protocol Breakdown</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total rBTC-SYNTH</p>
                  <p className="text-2xl font-bold">
                    {((stats?.breakdown?.totalRBTC || 0) / 100000000).toFixed(4)} BTC
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total USDT</p>
                  <p className="text-2xl font-bold">
                    ${(stats?.breakdown?.totalUSDT || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">BTC Price</p>
                  <p className="text-2xl font-bold">
                    ${(stats?.breakdown?.btcPrice || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-500 dark:text-amber-400">
                🔒 Participant count encrypted for privacy. Individual positions not disclosed.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, change }: any) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        {change && (
          <span className={`text-xs ${parseFloat(change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{title}</p>
    </div>
  )
}

// Performance Card Component  
function PerformanceCard({ period, value }: any) {
  const isPositive = parseFloat(value) >= 0
  
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{period} Performance</span>
        {isPositive ? 
          <TrendingUp className="w-4 h-4 text-green-500" /> : 
          <TrendingDown className="w-4 h-4 text-red-500" />
        }
      </div>
      <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{value}%
      </p>
    </div>
  )
}