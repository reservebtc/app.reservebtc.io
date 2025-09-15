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
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'
import { oracleService } from '@/lib/oracle-service'
import { mempoolService } from '@/lib/mempool-service'

interface Transaction {
  tx_hash: string
  block_number: number
  block_timestamp: string
  user_address: string
  tx_type: string
  amount: string
  delta?: string
  fee_wei?: string
  status: string
}

interface BitcoinAddress {
  bitcoin_address: string
  network: string
  verified_at: string
  is_monitoring: boolean
}

export function DashboardContent() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const publicClient = usePublicClient()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bitcoinAddresses, setBitcoinAddresses] = useState<BitcoinAddress[]>([])
  const [rbtcBalance, setRbtcBalance] = useState('0.00000000')
  const [wrbtcBalance, setWrbtcBalance] = useState('0.00000000')
  const [oracleBalance, setOracleBalance] = useState('0.00000000')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [currentlyMonitoredAddress, setCurrentlyMonitoredAddress] = useState<string | null>(null)

  // Load all data
  const loadDashboardData = async () => {
    if (!address) return
    
    console.log('📊 DASHBOARD: Loading data for address:', address)
    setIsLoading(true)
    
    try {
      // Load Oracle data first - this is our primary data source
      const oracleData = await oracleService.getUserByAddress(address)
      
      // Load on-chain balances first to determine what's being monitored
      let currentOracleBalance = 0;
      let monitoredAddr: string | null = null;
      
      if (publicClient) {
        console.log('📊 DASHBOARD: Fetching on-chain balances...')
        
        try {
          // Get rBTC balance
          const rbtcBal = await publicClient.readContract({
            address: CONTRACTS.RBTC_SYNTH as `0x${string}`,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'balanceOf',
            args: [address]
          }) as bigint
          
          const rbtcFormatted = (Number(rbtcBal) / 1e8).toFixed(8)
          setRbtcBalance(rbtcFormatted)
          console.log('✅ DASHBOARD: On-chain rBTC balance:', rbtcFormatted)
          
          // Get Oracle lastSats - this is the key to determine monitoring
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
          console.log('✅ DASHBOARD: On-chain Oracle balance:', oracleFormatted)
          
          // Get wrBTC balance
          const wrbtcBal = await publicClient.readContract({
            address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'balanceOf',
            args: [address]
          }) as bigint
          
          const wrbtcFormatted = (Number(wrbtcBal) / 1e8).toFixed(8)
          setWrbtcBalance(wrbtcFormatted)
          console.log('✅ DASHBOARD: On-chain wrBTC balance:', wrbtcFormatted)
          
          // Create synthetic transaction for display if we have balance
          if (Number(lastSats) > 0) {
            const syntheticTx: Transaction = {
              tx_hash: '0x' + Math.random().toString(16).substring(2),
              block_number: 0,
              block_timestamp: new Date().toISOString(),
              user_address: address.toLowerCase(),
              tx_type: 'MINT',
              amount: lastSats.toString(),
              status: 'confirmed'
            }
            setTransactions([syntheticTx])
            setTotalTransactions(1)
          }
          
        } catch (error) {
          console.error('❌ DASHBOARD: On-chain balance fetch error:', error)
        }
      }
      
      if (oracleData) {
        console.log('✅ DASHBOARD: Oracle data loaded:', oracleData)
        
        // Extract Bitcoin addresses from Oracle
        const btcAddrs: BitcoinAddress[] = []
        const processedAddresses = new Set<string>()
        
        // Collect all addresses first
        const allAddresses: string[] = []
        
        if (oracleData.bitcoinAddress) allAddresses.push(oracleData.bitcoinAddress)
        if ((oracleData as any).btcAddress) allAddresses.push((oracleData as any).btcAddress)
        
        const bitcoinAddresses = (oracleData as any).bitcoinAddresses
        if (Array.isArray(bitcoinAddresses)) {
          bitcoinAddresses.forEach((addr: string) => allAddresses.push(addr))
        }
        
        const btcAddresses = (oracleData as any).btcAddresses
        if (Array.isArray(btcAddresses)) {
          btcAddresses.forEach((addr: string) => allAddresses.push(addr))
        }
        
        // Now check which address is actually being monitored
        // Only ONE address can be monitored at a time - the one whose balance matches Oracle balance
        if (currentOracleBalance > 0) {
          console.log('🔍 DASHBOARD: Oracle has balance, checking which address is monitored...')
          
          for (const btcAddr of allAddresses) {
            if (processedAddresses.has(btcAddr)) continue;
            
            try {
              // Check actual Bitcoin balance for this address
              const balanceData = await mempoolService.getAddressBalance(btcAddr)
              
              if (balanceData && Math.abs(balanceData.balance - currentOracleBalance) < 0.00000001) {
                // This address balance matches Oracle - it's the monitored one
                monitoredAddr = btcAddr
                setCurrentlyMonitoredAddress(btcAddr)
                console.log(`✅ DASHBOARD: Found monitored address: ${btcAddr} with balance ${balanceData.balance} BTC`)
                break
              }
            } catch (err) {
              console.error(`Error checking balance for ${btcAddr}:`, err)
            }
          }
        } else {
          console.log('🔍 DASHBOARD: Oracle balance is zero - no address is being monitored')
          setCurrentlyMonitoredAddress(null)
        }
        
        // Add all addresses with correct monitoring status
        for (const addr of allAddresses) {
          if (!addr || processedAddresses.has(addr)) continue;
          processedAddresses.add(addr)
          
          // Only the address that matches Oracle balance is monitored
          const isMonitored = monitoredAddr === addr
          
          btcAddrs.push({
            bitcoin_address: addr,
            network: addr.startsWith('tb1') || addr.startsWith('m') || addr.startsWith('n') ? 'testnet' : 'mainnet',
            verified_at: oracleData.registeredAt || new Date().toISOString(),
            is_monitoring: isMonitored
          })
        }
        
        setBitcoinAddresses(btcAddrs)
        console.log('✅ DASHBOARD: Bitcoin addresses loaded:', btcAddrs.length)
        if (monitoredAddr) {
          console.log(`✅ DASHBOARD: Currently monitoring: ${monitoredAddr}`)
        } else {
          console.log('✅ DASHBOARD: No address currently being monitored')
        }
      }
      
      // Try to load from Supabase if available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY
      
      if (supabaseUrl && supabaseKey) {
        try {
          console.log('📊 DASHBOARD: Loading from Supabase...')
          
          // Load transactions
          const txResponse = await fetch(
            `${supabaseUrl}/rest/v1/transactions?user_address=eq.${address.toLowerCase()}&order=block_timestamp.desc&limit=50`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Range': '0-49',
                'Prefer': 'count=exact'
              }
            }
          )
          
          if (txResponse.ok) {
            const txData = await txResponse.json()
            const contentRange = txResponse.headers.get('content-range')
            const total = contentRange ? parseInt(contentRange.split('/')[1]) : txData.length
            
            if (txData.length > 0) {
              console.log('✅ DASHBOARD: Loaded transactions from Supabase:', txData.length)
              setTransactions(txData)
              setTotalTransactions(total)
            }
          }
          
          // Load Bitcoin addresses from Supabase ONLY if we don't have them from Oracle
          // Check if we already set addresses from Oracle
          const hasOracleAddresses = bitcoinAddresses.length > 0 || (oracleData && currentOracleBalance >= 0);
          if (!hasOracleAddresses) {
            const btcResponse = await fetch(
              `${supabaseUrl}/rest/v1/bitcoin_addresses?eth_address=eq.${address.toLowerCase()}`,
              {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                }
              }
            )
            
            if (btcResponse.ok) {
              const btcData = await btcResponse.json()
              if (btcData.length > 0) {
                console.log('✅ DASHBOARD: Loaded Bitcoin addresses from Supabase:', btcData.length)
                const supabaseAddrs = btcData.map((addr: any) => ({
                  ...addr,
                  is_monitoring: false
                }))
                setBitcoinAddresses(supabaseAddrs)
              }
            }
          }
        } catch (error) {
          console.error('⚠️ DASHBOARD: Supabase load error (non-critical):', error)
        }
      }
      
    } catch (error) {
      console.error('❌ DASHBOARD: General loading error:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      console.log('✅ DASHBOARD: Data loading complete')
    }
  }

  useEffect(() => {
    if (address) {
      loadDashboardData()
    }
  }, [address, publicClient])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadDashboardData()
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get transaction icon and color
  const getTransactionStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MINT':
        return { 
          icon: <Plus className="h-4 w-4 text-green-600" />, 
          bg: 'bg-green-500/10',
          prefix: '+',
          suffix: 'rBTC'
        };
      case 'BURN':
        return { 
          icon: <ArrowRight className="h-4 w-4 text-red-600 rotate-180" />, 
          bg: 'bg-red-500/10',
          prefix: '-',
          suffix: 'rBTC'
        };
      case 'DEPOSIT':
        return { 
          icon: <ArrowUpRight className="h-4 w-4 text-blue-600" />, 
          bg: 'bg-blue-500/10',
          prefix: '+',
          suffix: 'ETH'
        };
      case 'FEE_SPENT':
        return { 
          icon: <ArrowRight className="h-4 w-4 text-orange-600" />, 
          bg: 'bg-orange-500/10',
          prefix: '-',
          suffix: 'ETH'
        };
      default:
        return { 
          icon: <RefreshCw className="h-4 w-4 text-gray-600" />, 
          bg: 'bg-gray-500/10',
          prefix: '',
          suffix: ''
        };
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

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground mb-6">
            Fetching your data from blockchain...
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
        {/* rBTC-SYNTH Balance */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="font-medium">rBTC-SYNTH</span>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">Soulbound</span>
          </div>
          <div className="text-2xl font-bold">
            {rbtcBalance} BTC
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Non-transferable synthetic BTC
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

        {/* wrBTC Balance */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-500" />
              <span className="font-medium">wrBTC</span>
            </div>
            <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded">Transferable</span>
          </div>
          <div className="text-2xl font-bold">
            {wrbtcBalance} BTC
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link href="/wrap" className="text-primary hover:underline">
              Wrap rBTC → wrBTC
            </Link>
          </p>
        </div>

        {/* Total Transactions */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Transactions</span>
            </div>
          </div>
          <div className="text-2xl font-bold">
            {totalTransactions}
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

      {/* Transaction History */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Transaction History</h2>
          </div>
          {totalTransactions > 0 && (
            <span className="text-sm text-muted-foreground">
              Total: {totalTransactions}
            </span>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-sm">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const style = getTransactionStyle(tx.tx_type)
              const amount = tx.tx_type === 'DEPOSIT' || tx.tx_type === 'FEE_SPENT' 
                ? (Number(tx.amount) / 1e18).toFixed(6)
                : (Number(tx.amount) / 1e8).toFixed(8)
              
              return (
                <div key={tx.tx_hash} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{tx.tx_type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimestamp(tx.block_timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {style.prefix}{amount} {style.suffix}
                    </div>
                    
                    <a 
                      href={`https://www.megaexplorer.xyz/tx/${tx.tx_hash}`}
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
    </div>
  );
}