'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useRouter } from 'next/navigation'
import { useUserDashboard } from '@/hooks/useUserProfile'
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
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'
import { getDecryptedOracleUsers } from '@/lib/oracle-decryption'

interface VerifiedAddress {
  address: string
  verifiedAt: string
  balance?: number
  isVerified: boolean
}

interface Transaction {
  hash: string
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer'
  amount: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
  bitcoinAddress?: string
}

interface OracleUserData {
  btcAddress?: string
  btcAddresses?: string[]
  ethAddress?: string
  lastSyncedBalance: number
  registeredAt: string
  lastSyncTime: number
  lastTxHash?: string
  transactionCount: number
  transactionHashes?: Transaction[]
}

export function DashboardContent() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  
  // Use new universal user profile hook
  const {
    totalBalance,
    rBTCBalance,
    wrBTCBalance,
    recentTransactions,
    totalTransactionCount,
    lastTransactionHash,
    ethAddress,
    bitcoinAddresses,
    isVerified,
    hasTransactions,
    profileCreatedAt,
    lastActivityAt,
    firstTransactionDate,
    lastTransactionDate,
    mostActiveContract,
    averageTransactionValue,
    dataCompletenessScore,
    isLoading,
    error,
    refreshProfile
  } = useUserDashboard()
  
  // Local state for UI interactions
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [showAllAddresses, setShowAllAddresses] = useState(false)

  // Read rBTC-SYNTH balance from contract
  const { data: rbtcBalanceData } = useReadContract({
    address: CONTRACTS.RBTC_SYNTH as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read wrBTC balance from VaultWrBTC contract
  const { data: wrbtcBalanceData } = useReadContract({
    address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
    abi: [{
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // MetaMask user change detection and cleanup
  useEffect(() => {
    if (!address) return

    const currentUserKey = 'dashboard_current_user'
    const lastUser = localStorage.getItem(currentUserKey)
    
    console.log('🔍 Checking MetaMask user change:', { lastUser, currentUser: address.toLowerCase() })
    
    if (lastUser && lastUser !== address.toLowerCase()) {
      console.log('🚨 MetaMask account changed! Clearing old data...')
      
      // Clear all states
      setVerifiedAddresses([])
      setTransactions([])
      setOracleData(null)
      setRbtcBalance('0')
      setWrbtcBalance('0')
      setIsLoading(true)
      
      // Clear localStorage data for old user
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.includes('rbtc') || 
          key.includes('oracle') || 
          key.includes('transaction') ||
          key.includes('bitcoin') ||
          key.includes(lastUser)
        )) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        console.log('🧹 Removing old user data:', key)
        localStorage.removeItem(key)
      })
      
      console.log(`✅ Cleared ${keysToRemove.length} old user keys`)
    }
    
    // Set current user
    localStorage.setItem(currentUserKey, address.toLowerCase())
  }, [address])

  // Load Oracle data
  useEffect(() => {
    if (!address) return

    const loadOracleData = async () => {
      try {
        setIsLoading(true)
        console.log('📡 Loading Oracle data for user:', address)
        
        const allUsers = await getDecryptedOracleUsers()
        if (!allUsers) {
          console.warn('⚠️ No Oracle users data received')
          return
        }

        const userData = allUsers[address.toLowerCase()] || allUsers[address]
        if (!userData) {
          console.log('ℹ️ User not found in Oracle database')
          setOracleData(null)
          setVerifiedAddresses([])
          setTransactions([])
          return
        }

        console.log('✅ Oracle data loaded:', userData)
        
        // Check if we're getting public (hashed) or encrypted (real) data
        if (userData.btcAddress && userData.btcAddress.length < 20) {
          console.error('⚠️ CRITICAL: Receiving HASHED public data instead of real encrypted data!');
          console.error('⚠️ CRITICAL: btcAddress is hashed:', userData.btcAddress);
          console.error('⚠️ CRITICAL: This means /internal-users endpoint failed and fallback to /users was used');
          console.error('⚠️ CRITICAL: No real transactions available - only Oracle balance data');
        } else if (userData.btcAddress) {
          console.log('✅ SUCCESS: Receiving REAL encrypted data with actual Bitcoin address:', userData.btcAddress);
        }
        
        setOracleData(userData)

        // Process Bitcoin addresses
        const addresses: VerifiedAddress[] = []
        const isHashedData = userData.btcAddress && userData.btcAddress.length < 20
        
        if (userData.btcAddress && !isHashedData) {
          addresses.push({
            address: userData.btcAddress,
            verifiedAt: userData.registeredAt,
            isVerified: true
          })
        } else if (isHashedData) {
          console.log('ℹ️ Skipping hashed Bitcoin address - cannot load real balance or mint')
        }

        if (userData.btcAddresses && Array.isArray(userData.btcAddresses) && !isHashedData) {
          userData.btcAddresses.forEach(addr => {
            if (addr && !addresses.find(a => a.address === addr)) {
              addresses.push({
                address: addr,
                verifiedAt: userData.registeredAt,
                isVerified: true
              })
            }
          })
        }

        setVerifiedAddresses(addresses)

        // Load real Bitcoin balances from Mempool API
        if (addresses.length > 0) {
          loadBitcoinBalances(addresses)
        }

        // Process transactions
        const txs: Transaction[] = []
        if (userData.transactionHashes && Array.isArray(userData.transactionHashes)) {
          userData.transactionHashes.forEach(tx => {
            txs.push({
              hash: tx.hash || tx.transactionHash,
              type: tx.type || 'mint',
              amount: tx.amount || '0',
              timestamp: tx.timestamp || new Date().toISOString(),
              status: tx.status || 'success',
              bitcoinAddress: tx.bitcoinAddress || userData.btcAddress
            })
          })
        } else if (userData.lastTxHash && userData.lastSyncedBalance > 0) {
          // Create transaction from lastTxHash if no transaction array exists
          txs.push({
            hash: userData.lastTxHash,
            type: 'mint',
            amount: (userData.lastSyncedBalance / 100000000).toFixed(8),
            timestamp: userData.registeredAt,
            status: 'success',
            bitcoinAddress: userData.btcAddress
          })
        }

        setTransactions(txs)
        console.log(`✅ Loaded ${addresses.length} addresses and ${txs.length} transactions`)

      } catch (error) {
        console.error('❌ Failed to load Oracle data:', error)
        setOracleData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadOracleData()
  }, [address])

  // Update rBTC balance when contract data changes
  useEffect(() => {
    if (rbtcBalanceData) {
      const balance = formatUnits(rbtcBalanceData, 8)
      setRbtcBalance(balance)
      console.log('💰 rBTC-SYNTH balance updated:', balance)
    }
  }, [rbtcBalanceData])

  // Update wrBTC balance when contract data changes
  useEffect(() => {
    if (wrbtcBalanceData) {
      const balance = formatUnits(wrbtcBalanceData, 8)
      setWrbtcBalance(balance)
      console.log('💰 wrBTC balance updated:', balance)
    }
  }, [wrbtcBalanceData])

  // Detect if address is mainnet or testnet
  const isTestnetAddress = (address: string): boolean => {
    return address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2')
  }

  // Fetch Bitcoin balance from Mempool API
  const fetchBitcoinBalance = async (address: string): Promise<number> => {
    try {
      const isTestnet = isTestnetAddress(address)
      const baseUrl = isTestnet ? 'https://mempool.space/testnet/api' : 'https://mempool.space/api'
      
      console.log(`🔍 Fetching ${isTestnet ? 'testnet' : 'mainnet'} balance for:`, address)
      
      const response = await fetch(`${baseUrl}/address/${address}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const balanceBTC = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000
      
      console.log(`💰 ${address}: ${balanceBTC} BTC (${isTestnet ? 'testnet' : 'mainnet'})`)
      return balanceBTC
      
    } catch (error) {
      console.warn(`⚠️ Failed to fetch balance for ${address}:`, error)
      return 0
    }
  }

  // Load Bitcoin balances for all addresses
  const loadBitcoinBalances = async (addresses: VerifiedAddress[]) => {
    try {
      setIsLoadingBalances(true)
      console.log('💰 Loading Bitcoin balances for all addresses...')
      
      const updatedAddresses = await Promise.all(
        addresses.map(async (addr) => {
          const balance = await fetchBitcoinBalance(addr.address)
          return { ...addr, balance }
        })
      )
      
      setVerifiedAddresses(updatedAddresses)
      
      const totalBalance = updatedAddresses.reduce((total, addr) => total + (addr.balance || 0), 0)
      console.log(`💰 Total Bitcoin balance: ${totalBalance.toFixed(8)} BTC`)
      
    } finally {
      setIsLoadingBalances(false)
    }
  }

  // Get total Bitcoin balance from all addresses
  const getTotalBitcoinBalance = (): number => {
    // TODO: Get real Bitcoin balances from addresses
    return 0
  }

  // Copy to clipboard function
  const copyAddress = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(text)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Your Profile...</h2>
          <p className="text-muted-foreground mb-6">
            🔓 Decrypting user data from Oracle server...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Load Error</h2>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <button
            onClick={refreshProfile}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading Profile
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard</h2>
          <p className="text-muted-foreground">Fetching your data from Oracle server...</p>
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
          <button 
            onClick={() => window.location.reload()}
            title="Refresh data"
            className="p-2 hover:bg-accent rounded transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bitcoin Balance */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Bitcoin</span>
              {isLoadingBalances && (
                <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
              )}
            </div>
            <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded">Reserve</span>
          </div>
          <div className="text-2xl font-bold">
            {isLoadingBalances ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              `${getTotalBitcoinBalance().toFixed(8)} BTC`
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            From {bitcoinAddresses.length} verified address{bitcoinAddresses.length !== 1 ? 'es' : ''} 
            {bitcoinAddresses.some(addr => isTestnetAddress(addr)) && 
             bitcoinAddresses.some(addr => !isTestnetAddress(addr)) && 
             ' (mainnet + testnet)'}
            {bitcoinAddresses.every(addr => isTestnetAddress(addr)) && bitcoinAddresses.length > 0 && ' (testnet)'}
            {bitcoinAddresses.every(addr => !isTestnetAddress(addr)) && bitcoinAddresses.length > 0 && ' (mainnet)'}
          </p>
        </div>

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
            {rBTCBalance}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Non-transferable token
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
              {oracleData ? 'Synced' : 'No Data'}
            </span>
          </div>
          <div className="text-2xl font-bold">
            {oracleData ? (oracleData.lastSyncedBalance / 100000000).toFixed(8) : '0.00000000'}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Oracle balance (sats: {oracleData?.lastSyncedBalance || 0})
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
            {wrBTCBalance}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link 
              href="/wrap" 
              className="text-primary hover:underline"
            >
              Wrap rBTC → wrBTC
            </Link>
          </p>
        </div>
      </div>

      {/* Bitcoin Addresses */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Bitcoin Addresses</h2>
          </div>
          <Link 
            href="/verify-address" 
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </Link>
        </div>

        {/* Warning for hashed data */}
        {oracleData && oracleData.btcAddress && oracleData.btcAddress.length < 20 && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Limited Data Mode
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              Using public Oracle data with privacy hashing. Real Bitcoin addresses and transactions are not available. 
              Check API configuration to access full encrypted data.
            </p>
          </div>
        )}

        {bitcoinAddresses.length === 0 ? (
          <div className="text-center py-8">
            <Bitcoin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No Bitcoin Addresses</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add and verify your Bitcoin addresses to start using ReserveBTC
            </p>
            <Link 
              href="/verify-address"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Verify Address
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bitcoinAddresses
              .slice(0, showAllAddresses ? undefined : 3)
              .map((addr, index) => (
                <div key={addr} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{addr}</span>
                        <button
                          onClick={() => copyAddress(addr)}
                          className="p-1 hover:bg-accent rounded transition-colors"
                        >
                          {copiedAddress === addr ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Verified Bitcoin address
                        <span className="ml-2">({isTestnetAddress(addr) ? 'testnet' : 'mainnet'})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isVerified ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Link 
                          href="/mint"
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                        >
                          Mint
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs text-muted-foreground">Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            }
            
            {bitcoinAddresses.length > 3 && (
              <button
                onClick={() => setShowAllAddresses(!showAllAddresses)}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                {showAllAddresses ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {bitcoinAddresses.length - 3} More
                  </>
                )}
              </button>
            )}
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total: {totalTransactionCount}</span>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No Transactions</h3>
            <p className="text-muted-foreground text-sm">
              Your transaction history will appear here after your first mint
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx, index) => (
              <div key={tx.hash + index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'mint' ? 'bg-green-500/10' : 
                    tx.type === 'burn' ? 'bg-red-500/10' : 'bg-blue-500/10'
                  }`}>
                    {tx.type === 'mint' ? (
                      <ArrowRight className={`h-4 w-4 ${tx.type === 'mint' ? 'text-green-600' : ''}`} />
                    ) : tx.type === 'burn' ? (
                      <ArrowRight className="h-4 w-4 text-red-600 rotate-180" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{tx.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">{parseFloat(tx.amount).toFixed(8)} BTC</div>
                  <div className="flex items-center gap-2 text-sm">
                    {tx.hash.startsWith('0x') && tx.hash.length === 66 ? (
                      <a
                        href={`https://www.megaexplorer.xyz/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <span className="font-mono">{tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-muted-foreground">
                        {tx.hash.length > 16 ? `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}` : tx.hash}
                      </span>
                    )}
                    <button
                      onClick={() => copyAddress(tx.hash)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      {copiedAddress === tx.hash ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          href="/verify-address"
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

        <a
          href={`https://www.megaexplorer.xyz/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 p-4 bg-card border rounded-xl hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-5 w-5 text-primary" />
          <span className="font-medium">View on Explorer</span>
        </a>
      </div>

      {/* Token Contract Info */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Token Contracts</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* rBTC-SYNTH */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">rBTC-SYNTH</span>
              <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">Soulbound</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{CONTRACTS.RBTC_SYNTH.slice(0, 10)}...</span>
                  <button
                    onClick={() => copyAddress(CONTRACTS.RBTC_SYNTH)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    {copiedAddress === CONTRACTS.RBTC_SYNTH ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Symbol:</span>
                <span>rBTC-SYNTH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decimals:</span>
                <span>8</span>
              </div>
            </div>
          </div>

          {/* wrBTC */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">wrBTC</span>
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">Transferable</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{CONTRACTS.VAULT_WRBTC.slice(0, 10)}...</span>
                  <button
                    onClick={() => copyAddress(CONTRACTS.VAULT_WRBTC)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    {copiedAddress === CONTRACTS.VAULT_WRBTC ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Symbol:</span>
                <span>wrBTC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decimals:</span>
                <span>8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Wallet Info */}
      <div className="bg-muted/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Connected as:</span>
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <a 
          href={`https://www.megaexplorer.xyz/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View on Explorer
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}