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
    fullProfile,
    isLoading,
    error,
    refreshProfile
  } = useUserDashboard()

  // Log useUserDashboard hook results
  console.log('🔍 DASHBOARD: useUserDashboard hook results:')
  console.log('   - totalBalance:', totalBalance)
  console.log('   - rBTCBalance:', rBTCBalance) 
  console.log('   - wrBTCBalance:', wrBTCBalance)
  console.log('   - bitcoinAddresses:', bitcoinAddresses)
  console.log('   - bitcoinAddresses length:', bitcoinAddresses?.length)
  console.log('   - recentTransactions:', recentTransactions)
  console.log('   - recentTransactions length:', recentTransactions?.length)
  console.log('   - isVerified:', isVerified)
  console.log('   - isLoading:', isLoading)
  console.log('   - error:', error)
  console.log('   - address:', address)
  console.log('   - useUserDashboard hook is active, monitoring profile loading...')
  
  // Local state for UI interactions
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [showAllAddresses, setShowAllAddresses] = useState(false)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

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
      
      // Clear all states - handled by new hook system
      console.log('🧹 User changed - profile will be refreshed automatically')
      
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

  // Legacy Oracle data loading - now handled by useUserDashboard hook
  // Removed to fix build errors and use new architecture

  // Contract balance updates are now handled by useUserDashboard hook
  // Legacy code removed - balances come from rBTCBalance and wrBTCBalance props

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

  // Bitcoin balance loading is now handled by useUserDashboard hook

  // Total Bitcoin balance is now provided by useUserDashboard hook

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

  // Check if Bitcoin address already minted tokens
  const hasAddressMinted = (bitcoinAddress: string): boolean => {
    if (!recentTransactions || recentTransactions.length === 0) {
      console.log(`🔍 No transactions found for mint check`)
      return false
    }

    const mintTransactions = recentTransactions.filter(tx => 
      tx.type === 'mint' && 
      (tx.bitcoinAddress === bitcoinAddress || 
       (tx.source === 'rBTC' && parseFloat(tx.amount || '0') > 0))
    )

    console.log(`🔍 MINT CHECK for ${bitcoinAddress.substring(0, 20)}...`)
    console.log(`   - Total transactions:`, recentTransactions.length)
    console.log(`   - Mint transactions found:`, mintTransactions.length)
    console.log(`   - Has minted:`, mintTransactions.length > 0)
    
    if (mintTransactions.length > 0) {
      console.log(`   - Mint transaction details:`, mintTransactions[0])
    }

    return mintTransactions.length > 0
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get professional transaction type description
  const getTransactionDescription = (type: string): { title: string; description: string } => {
    switch (type.toLowerCase()) {
      case 'mint':
        return {
          title: 'Synthetic Token Mint',
          description: 'Created rBTC-SYNTH tokens from Bitcoin reserves'
        }
      case 'burn':
        return {
          title: 'Token Burn',
          description: 'Destroyed rBTC-SYNTH tokens to release Bitcoin'
        }
      case 'wrap':
        return {
          title: 'Token Wrapping',
          description: 'Wrapped rBTC-SYNTH into transferable wrBTC'
        }
      case 'unwrap':
      case 'redeem':
        return {
          title: 'Token Unwrapping',
          description: 'Unwrapped wrBTC back to rBTC-SYNTH'
        }
      case 'balance_sync':
        return {
          title: 'Oracle Balance Sync',
          description: 'Synchronized Bitcoin balance with Oracle server'
        }
      case 'transfer':
        return {
          title: 'Token Transfer',
          description: 'Transferred wrBTC tokens between addresses'
        }
      case 'deposit':
        return {
          title: 'Bitcoin Deposit',
          description: 'Deposited Bitcoin to verified address'
        }
      case 'withdrawal':
        return {
          title: 'Bitcoin Withdrawal',
          description: 'Withdrew Bitcoin from verified address'
        }
      default:
        return {
          title: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          description: 'ReserveBTC system transaction'
        }
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
            {isLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              `${parseFloat(totalBalance).toFixed(8)} BTC`
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
            {(() => {
              console.log('🔍 DASHBOARD: rBTC-SYNTH Balance Display')
              console.log('   - rBTCBalance prop:', rBTCBalance)
              console.log('   - Type of rBTCBalance:', typeof rBTCBalance)
              console.log('   - Data source: useUserDashboard hook')
              return rBTCBalance
            })()}
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
              {(() => {
                console.log('🔍 DASHBOARD: Oracle Status Display')
                console.log('   - isVerified:', isVerified)
                console.log('   - Data from useUserDashboard hook')
                console.log('   - Address:', address)
                console.log('   - Displaying:', isVerified ? 'Synced' : 'No Data')
                return isVerified ? 'Synced' : 'No Data'
              })()}
            </span>
          </div>
          <div className="text-2xl font-bold">
            {(() => {
              console.log('🔍 DASHBOARD: Oracle Synchronized Balance Display')
              console.log('   - totalBalance prop:', totalBalance)
              console.log('   - Type of totalBalance:', typeof totalBalance)
              console.log('   - Profile available:', !!fullProfile)
              if (fullProfile) {
                console.log('   - Profile userStatistics:', fullProfile.userStatistics)
                console.log('   - Profile transactionHistory:', fullProfile.transactionHistory)
                console.log('   - Profile walletInformation:', fullProfile.walletInformation)
              }
              return totalBalance
            })()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Oracle synchronized balance
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
            {(() => {
              console.log('🔍 DASHBOARD: wrBTC Balance Display')
              console.log('   - wrBTCBalance prop:', wrBTCBalance)
              console.log('   - Type of wrBTCBalance:', typeof wrBTCBalance)
              console.log('   - Data from useUserDashboard hook')
              return wrBTCBalance
            })()}
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

        {/* Warning for limited data - removed legacy Oracle direct access */}

        {(() => {
          console.log('🔍 DASHBOARD: Bitcoin Addresses Section')
          console.log('   - bitcoinAddresses prop:', bitcoinAddresses)
          console.log('   - Length:', bitcoinAddresses.length)
          console.log('   - isVerified:', isVerified)
          console.log('   - hasTransactions:', hasTransactions)
          console.log('   - recentTransactions length:', recentTransactions?.length || 0)
          console.log('   - Data from useUserDashboard hook')
          
          // Check mint status for each address
          if (bitcoinAddresses.length > 0) {
            bitcoinAddresses.forEach(addr => {
              const hasMinted = hasAddressMinted(addr)
              console.log(`   - Address ${addr.substring(0, 20)}... has minted: ${hasMinted}`)
            })
          }
          
          return bitcoinAddresses.length === 0
        })() ? (
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
                    {(() => {
                      const addressHasMinted = hasAddressMinted(addr)
                      const canMint = isVerified && !addressHasMinted
                      
                      console.log(`🔍 MINT BUTTON LOGIC for ${addr.substring(0, 20)}...`)
                      console.log(`   - isVerified: ${isVerified}`)
                      console.log(`   - addressHasMinted: ${addressHasMinted}`)
                      console.log(`   - canMint: ${canMint}`)
                      
                      if (addressHasMinted) {
                        return (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              Minted
                            </span>
                          </div>
                        )
                      } else if (canMint) {
                        return (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <Link 
                              href="/mint"
                              className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                            >
                              Mint
                            </Link>
                          </div>
                        )
                      } else {
                        return (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-muted-foreground">Pending</span>
                          </div>
                        )
                      }
                    })()}
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

        {(() => {
          console.log('🔍 DASHBOARD: Transaction History Section')
          console.log('   - recentTransactions prop:', recentTransactions)
          console.log('   - Length:', recentTransactions.length)
          console.log('   - Profile available:', !!fullProfile)
          console.log('   - Data from useUserDashboard hook')
          return recentTransactions.length === 0
        })() ? (
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
                    tx.type === 'burn' ? 'bg-red-500/10' : 
                    tx.type === 'wrap' ? 'bg-purple-500/10' :
                    tx.type === 'unwrap' || tx.type === 'redeem' ? 'bg-orange-500/10' :
                    tx.type === 'balance_sync' ? 'bg-blue-500/10' :
                    tx.type === 'transfer' ? 'bg-cyan-500/10' :
                    'bg-blue-500/10'
                  }`}>
                    {tx.type === 'mint' ? (
                      <Plus className="h-4 w-4 text-green-600" />
                    ) : tx.type === 'burn' ? (
                      <ArrowRight className="h-4 w-4 text-red-600 rotate-180" />
                    ) : tx.type === 'wrap' ? (
                      <Link2 className="h-4 w-4 text-purple-600" />
                    ) : tx.type === 'unwrap' || tx.type === 'redeem' ? (
                      <ArrowRight className="h-4 w-4 text-orange-600" />
                    ) : tx.type === 'balance_sync' ? (
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    ) : tx.type === 'transfer' ? (
                      <ArrowUpRight className="h-4 w-4 text-cyan-600" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{getTransactionDescription(tx.type).title}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {getTransactionDescription(tx.type).description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">
                    {tx.type === 'mint' ? '+' : tx.type === 'burn' ? '-' : ''}
                    {parseFloat(tx.amount || '0').toFixed(8)} 
                    {tx.type === 'balance_sync' ? ' BTC' : 
                     tx.type === 'mint' || tx.type === 'burn' ? ' rBTC' :
                     tx.type === 'wrap' || tx.type === 'unwrap' || tx.type === 'transfer' ? ' wrBTC' :
                     ' BTC'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {tx.hash && tx.hash.startsWith('0x') && tx.hash.length === 66 ? (
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
                        {tx.hash && tx.hash.length > 16 ? `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}` : (tx.hash || 'No Hash')}
                      </span>
                    )}
                    <button
                      onClick={() => copyAddress(tx.hash || '')}
                      className="p-1 hover:bg-accent rounded transition-colors"
                      disabled={!tx.hash}
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