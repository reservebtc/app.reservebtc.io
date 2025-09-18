'use client';

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useRouter } from 'next/navigation'
import { 
  Wallet, 
  Bitcoin, 
  ArrowRight, 
  History, 
  Shield,
  TrendingUp,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowUpRight,
  RefreshCw,
  Link2,
  Plus,
  ExternalLink,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'
import { useRealtimeUserData, useRealtimeBalance, useRealtimeTransactions, useFormattedBalance, useTransactionFormatter } from '@/hooks/use-professional-realtime'
import { oracleService } from '@/lib/oracle-service'
import { mempoolService } from '@/lib/mempool-service'

// UI Badge component (local implementation)
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

// Define transaction type to match real-time system
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
  const publicClient = usePublicClient()
  
  // Real-time hooks
  const userData = useRealtimeUserData()
  const balance = useRealtimeBalance()
  const transactions = useRealtimeTransactions(50)
  const formatBalance = useFormattedBalance()
  const formatTx = useTransactionFormatter()
  
  // Local state for Bitcoin addresses and Oracle data
  const [bitcoinAddresses, setBitcoinAddresses] = useState<BitcoinAddress[]>([])
  const [oracleBalance, setOracleBalance] = useState('0.00000000')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentlyMonitoredAddress, setCurrentlyMonitoredAddress] = useState<string | null>(null)

  // Load additional data not covered by real-time system
  const loadAdditionalData = async () => {
    if (!address) return
    
    console.log('📊 DASHBOARD: Loading additional Oracle and Bitcoin address data...')
    setIsLoading(true)
    
    try {
      // Get Oracle data for Bitcoin addresses
      const oracleData = await oracleService.getUserByAddress(address)
      
      // Get Oracle balance from contract
      let currentOracleBalance = 0;
      let monitoredAddr: string | null = null;
      
      if (publicClient) {
        try {
          // Get Oracle lastSats to determine monitoring status
          const lastSats = await publicClient.readContract({
            address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
            abi: [
              {
                name: 'lastSats',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'user', type: 'address' }],
                outputs: [{ name: '', type: 'uint64' }]
              }
            ],
            functionName: 'lastSats',
            args: [address]
          }) as bigint
          
          currentOracleBalance = Number(lastSats) / 1e8;
          const oracleFormatted = currentOracleBalance.toFixed(8)
          setOracleBalance(oracleFormatted)
          console.log('✅ DASHBOARD: Oracle balance from contract:', oracleFormatted)
          
        } catch (error) {
          console.error('❌ DASHBOARD: Oracle balance fetch error:', error)
        }
      }
      
      if (oracleData) {
        console.log('✅ DASHBOARD: Oracle data loaded, processing Bitcoin addresses...')
        
        // Extract Bitcoin addresses from Oracle
        const btcAddrs: BitcoinAddress[] = []
        const processedAddresses = new Set<string>()
        
        // Collect all addresses from Oracle data
        const allAddresses: string[] = []
        
        if (oracleData.bitcoinAddress) allAddresses.push(oracleData.bitcoinAddress)
        if ((oracleData as any).btcAddress) allAddresses.push((oracleData as any).btcAddress)
        
        const bitcoinAddressesFromOracle = (oracleData as any).bitcoinAddresses
        if (Array.isArray(bitcoinAddressesFromOracle)) {
          bitcoinAddressesFromOracle.forEach((addr: string) => allAddresses.push(addr))
        }
        
        const btcAddresses = (oracleData as any).btcAddresses
        if (Array.isArray(btcAddresses)) {
          btcAddresses.forEach((addr: string) => allAddresses.push(addr))
        }
        
        // Determine which address is being monitored
        if (currentOracleBalance > 0) {
          console.log('🔍 DASHBOARD: Oracle has balance, checking monitored address...')
          
          for (const btcAddr of allAddresses) {
            if (processedAddresses.has(btcAddr)) continue;
            
            try {
              const balanceData = await mempoolService.getAddressBalance(btcAddr)
              
              if (balanceData && Math.abs(balanceData.balance - currentOracleBalance) < 0.00000001) {
                monitoredAddr = btcAddr
                setCurrentlyMonitoredAddress(btcAddr)
                console.log(`✅ DASHBOARD: Found monitored address: ${btcAddr}`)
                break
              }
            } catch (err) {
              console.error(`Error checking balance for ${btcAddr}:`, err)
            }
          }
        } else {
          setCurrentlyMonitoredAddress(null)
        }
        
        // Add all addresses with correct monitoring status
        for (const addr of allAddresses) {
          if (!addr || processedAddresses.has(addr)) continue;
          processedAddresses.add(addr)
          
          const isMonitored = monitoredAddr === addr
          
          btcAddrs.push({
            bitcoin_address: addr,
            network: addr.startsWith('tb1') || addr.startsWith('m') || addr.startsWith('n') ? 'testnet' : 'mainnet',
            verified_at: oracleData.registeredAt || new Date().toISOString(),
            is_monitoring: isMonitored
          })
        }
        
        setBitcoinAddresses(btcAddrs)
        console.log('✅ DASHBOARD: Bitcoin addresses processed:', btcAddrs.length)
      }
      
    } catch (error) {
      console.error('❌ DASHBOARD: Additional data loading error:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      console.log('✅ DASHBOARD: Additional data loading complete')
    }
  }

  useEffect(() => {
    if (address) {
      loadAdditionalData()
    }
  }, [address, publicClient])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadAdditionalData()
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

  // Get transaction icon and color (using real-time formatter)
  const getTransactionStyle = (type: string) => {
    const txFormat = formatTx(type)
    const baseStyles = {
      'MINT': { bg: 'bg-green-500/10', prefix: '+', suffix: 'rBTC' },
      'BURN': { bg: 'bg-red-500/10', prefix: '-', suffix: 'rBTC' },
      'WRAP': { bg: 'bg-blue-500/10', prefix: '→', suffix: 'wrBTC' },
      'UNWRAP': { bg: 'bg-purple-500/10', prefix: '←', suffix: 'rBTC' },
      'DEPOSIT': { bg: 'bg-blue-500/10', prefix: '+', suffix: 'ETH' },
      'WITHDRAW': { bg: 'bg-orange-500/10', prefix: '-', suffix: 'ETH' },
      'TEST': { bg: 'bg-gray-500/10', prefix: '~', suffix: 'TEST' }
    }
    
    const style = baseStyles[type as keyof typeof baseStyles] || baseStyles['TEST']
    
    return {
      icon: <span className={txFormat.color}>{txFormat.emoji}</span>,
      bg: style.bg,
      prefix: style.prefix,
      suffix: style.suffix
    }
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
    );
  }

  if (isLoading || balance.loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground mb-6">
            Fetching your real-time data...
          </p>
        </div>
      </div>
    );
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
          </Badge>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
            className="p-2 hover:bg-accent rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground hover:text-primary transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* rBTC-SYNTH Balance - Real-time */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="font-medium">rBTC-SYNTH</span>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">Soulbound</span>
          </div>
          <div className="text-2xl font-bold">
            {formatBalance(balance.rbtc)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Non-transferable synthetic BTC
            {balance.lastUpdate && (
              <span className="block text-xs text-green-600">
                Updated: {balance.lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Oracle Sync Status */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="font-medium">Oracle Status</span>
            </div>
            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
              {Number(oracleBalance) > 0 ? 'Synced' : 'Not Synced'}
            </span>
          </div>
          <div className="text-2xl font-bold">
            {oracleBalance} BTC
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {currentlyMonitoredAddress ? 'Monitoring active' : 'No active monitoring'}
          </p>
        </div>

        {/* wrBTC Balance - Real-time */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-500" />
              <span className="font-medium">wrBTC</span>
            </div>
            <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded">Transferable</span>
          </div>
          <div className="text-2xl font-bold">
            {formatBalance(balance.wrbtc)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link href="/wrap" className="text-primary hover:underline">
              Wrap rBTC → wrBTC
            </Link>
          </p>
        </div>

        {/* Total Transactions - Real-time */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Transactions</span>
            </div>
            {transactions.loading && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="text-2xl font-bold">
            {transactions.data.length}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total operations
          </p>
        </div>
      </div>

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
        {bitcoinAddresses.length > 0 && Number(oracleBalance) === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  ⚠️ Balance Zero - Quantum Protection Active
                </h4>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  Bitcoin's quantum protection automatically moves ALL funds to new addresses after ANY outgoing transaction. This is normal and protects against quantum attacks.
                </p>
                <Link 
                  href="/verify" 
                  className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium transition-all mt-2"
                >
                  <Shield className="h-3 w-3" />
                  Verify New Quantum-Safe Address
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

      {/* Transaction History - Real-time */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              Live
            </Badge>
          </div>
          {transactions.data.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Total: {transactions.data.length}
            </span>
          )}
        </div>

        {transactions.loading ? (
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
        ) : transactions.error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2 text-red-600">Failed to load transactions</h3>
            <p className="text-muted-foreground text-sm">
              {transactions.error}
            </p>
          </div>
        ) : transactions.data.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-sm">
              Your transaction history will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.data.map((tx: any) => {
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
                      <div className="font-medium capitalize">{formatTx(txType).label}</div>
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
                      View Transaction
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
          href="/wrap"
          className="flex items-center justify-center gap-3 p-4 bg-card border rounded-xl hover:bg-accent transition-colors"
        >
          <Link2 className="h-5 w-5 text-primary" />
          <span className="font-medium">Wrap rBTC</span>
        </Link>
      </div>

      {/* Error notification if any */}
      {userData.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800 dark:text-red-200">
              Real-time data error: {userData.error}. Some data may not be current.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}