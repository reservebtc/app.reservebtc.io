// app/api-explorer/oracle/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Activity, TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react'

export default function OracleOperationsExplorer() {
  const [operations, setOperations] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadOperations()
    
    if (autoRefresh) {
      const interval = setInterval(loadOperations, 10000)
      return () => clearInterval(interval)
    }
  }, [pagination.offset, filter, autoRefresh])

  async function loadOperations() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        filter
      })
      
      const response = await fetch(`/api/oracle/operations?${params}`)
      const data = await response.json()
      
      setOperations(data.operations)
      setStats(data.stats)
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }))
    } catch (error) {
      console.error('Failed to load operations')
    } finally {
      setLoading(false)
    }
  }

  const nextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }))
    }
  }

  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Oracle Operations Explorer
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Oracle operations with privacy protection
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Ops</span>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Mints</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.mints}</p>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Burns</span>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.burns}</p>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Syncs</span>
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-500">{stats.syncs}</p>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Consensus</span>
              </div>
              <p className="text-2xl font-bold">{stats.consensus_rate}%</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPagination(prev => ({ ...prev, offset: 0 }))
            }}
            className="px-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Operations</option>
            <option value="mint">Mints Only</option>
            <option value="burn">Burns Only</option>
            <option value="sync">Syncs Only</option>
          </select>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh ? 'bg-primary text-primary-foreground' : 'bg-card'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={loadOperations}
            className="px-4 py-2 bg-card border rounded-lg hover:bg-muted transition-colors"
          >
            Refresh Now
          </button>
        </div>

        {/* Operations Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Sources</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Consensus</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading encrypted operations...
                    </td>
                  </tr>
                ) : operations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No operations found
                    </td>
                  </tr>
                ) : (
                  operations.map((op) => (
                    <tr key={op.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono">#{op.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(op.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          op.action === 'MINT' ? 'bg-green-500/20 text-green-500' :
                          op.action === 'BURN' ? 'bg-red-500/20 text-red-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {op.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{op.sources_count} sources</td>
                      <td className="px-4 py-3 text-sm">
                        {op.consensus_reached ? '✅' : '⏳'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {op.user_address}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={pagination.offset === 0}
                className="px-3 py-1 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextPage}
                disabled={!pagination.hasMore}
                className="px-3 py-1 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-500 dark:text-amber-400">
            🔒 All user addresses and amounts are encrypted to protect privacy
          </p>
        </div>
      </div>
    </div>
  )
}