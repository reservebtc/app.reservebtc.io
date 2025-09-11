'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { oracleService } from '@/lib/oracle-service'
import { mempoolService } from '@/lib/mempool-service'
import type { UserData } from '@/lib/oracle-decryption'

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
    bitcoinMainnetBalance,
    bitcoinTestnetBalance,
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

  // Privacy-focused logging for current user only
  console.log('🔍 DASHBOARD: Profile loaded for current user')
  console.log('   - Current user has', bitcoinAddresses?.length || 0, 'verified addresses')
  console.log('   - Current user has', recentTransactions?.length || 0, 'transactions')
  console.log('   - Current user verification status:', isVerified)
  console.log('   - Profile loading status:', isLoading ? 'loading' : 'complete')
  
  // Local state for UI interactions
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [showAllAddresses, setShowAllAddresses] = useState(false)
  
  // Direct Oracle Service integration for debugging
  const [directOracleAddresses, setDirectOracleAddresses] = useState<{address: string, verifiedAt: string}[]>([])
  
  useEffect(() => {
    async function loadDirectOracleData() {
      if (address) {
        try {
          console.log('🔍 DASHBOARD DEBUG: Fetching Oracle data for address:', address.substring(0, 10) + '...')
          
          // Get raw decrypted users first to see the structure
          const allDecryptedUsers = await oracleService.getDecryptedUsers()
          console.log('🔍 DASHBOARD DEBUG: All decrypted users:', allDecryptedUsers)
          
          // Now get the specific user data
          const userData = await oracleService.getUserByAddress(address)
          console.log('🔍 DASHBOARD DEBUG: Direct Oracle user data:', userData)
          console.log('🔍 DASHBOARD DEBUG: User data properties:', userData ? Object.keys(userData) : 'null')
          
          if (userData) {
            console.log('🔍 DASHBOARD DEBUG: Detailed user data:')
            console.log('  - ethAddress:', userData.ethAddress)
            console.log('  - bitcoinAddress (Professional Oracle):', userData.bitcoinAddress)
            console.log('  - btcAddress (Legacy):', userData.btcAddress)
            console.log('  - btcAddressHash:', userData.btcAddressHash)
            console.log('  - btcAddresses:', userData.btcAddresses)
            console.log('  - registeredAt:', userData.registeredAt)
            console.log('  - createdAt:', userData.createdAt)
            console.log('  - lastSyncedBalance:', userData.lastSyncedBalance)
            console.log('  - transactionCount:', userData.transactionCount)
            console.log('  - transactionHashes:', userData.transactionHashes)
            console.log('  - autoDetected:', userData.autoDetected)
            console.log('  - verification:', userData.verification)
            console.log('  - statistics:', userData.statistics)
            
            // Check for Bitcoin addresses in any field (prioritize Professional Oracle field)
            const bitcoinAddr = userData.bitcoinAddress || userData.btcAddress
            const verifiedAt = userData.createdAt || userData.registeredAt || new Date().toISOString()
            
            if (bitcoinAddr) {
              setDirectOracleAddresses([{
                address: bitcoinAddr,
                verifiedAt: verifiedAt
              }])
              console.log('✅ DASHBOARD DEBUG: Found Bitcoin address from Oracle:', bitcoinAddr)
              console.log('  - Source field:', userData.bitcoinAddress ? 'bitcoinAddress' : 'btcAddress')
            } else if (userData.btcAddresses && userData.btcAddresses.length > 0) {
              const addresses = userData.btcAddresses.map(addr => ({
                address: addr,
                verifiedAt: verifiedAt
              }))
              setDirectOracleAddresses(addresses)
              console.log('✅ DASHBOARD DEBUG: Found Bitcoin addresses array from Oracle:', userData.btcAddresses)
            } else {
              console.log('❌ DASHBOARD DEBUG: No Bitcoin address found in Oracle data')
              console.log('❌ DASHBOARD DEBUG: Available fields:', Object.keys(userData))
            }
          } else {
            console.log('❌ DASHBOARD DEBUG: No user data returned from Oracle')
          }
        } catch (error) {
          console.error('❌ DASHBOARD DEBUG: Failed to load Oracle data:', error)
        }
      }
    }
    loadDirectOracleData()
  }, [address])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  
  // Fallback for newly verified addresses not yet in Oracle
  const [fallbackAddresses, setFallbackAddresses] = useState<string[]>([])
  const [fallbackBalances, setFallbackBalances] = useState<Record<string, number>>({})
  const [fallbackTotal, setFallbackTotal] = useState<string>('0.00000000')

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
    
    console.log('🔍 PRIVACY: Checking for account change')
    
    if (lastUser && lastUser !== address.toLowerCase()) {
      console.log('🚨 PRIVACY: MetaMask account changed, clearing previous user data')
      
      // Clear all states - handled by new hook system
      console.log('🧹 PRIVACY: User changed - profile will be refreshed automatically')
      
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
        console.log('🧹 PRIVACY: Clearing old user cache entry')
        localStorage.removeItem(key)
      })
      
      console.log(`✅ PRIVACY: Cleared ${keysToRemove.length} cache entries for previous user`)
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

  // Fetch Bitcoin balance using Professional Mempool Service
  const fetchBitcoinBalance = async (address: string): Promise<number> => {
    try {
      console.log(`🔍 DASHBOARD: Fetching balance for current user via Professional Mempool Service`)
      
      const balanceData = await mempoolService.getAddressBalance(address)
      
      if (balanceData) {
        console.log(`💰 DASHBOARD: Balance fetched for current user: ${balanceData.balance} BTC (${balanceData.network})`)
        return balanceData.balance
      }
      
      console.warn(`⚠️ DASHBOARD: Failed to fetch balance for current user address via Mempool Service`)
      return 0
      
    } catch (error) {
      console.error(`❌ DASHBOARD: Failed to fetch balance for current user address`, error)
      return 0
    }
  }

  // Check for recently verified addresses not yet in Oracle
  const loadFallbackVerifiedAddresses = useCallback(async () => {
    if (!address || bitcoinAddresses.length > 0 || isVerified) {
      return // Skip if Oracle data already available
    }

    console.log('🔍 PRIVACY: Checking for recently verified addresses in localStorage for current user')
    
    try {
      // Check localStorage for recent verification
      const verificationKey = `verification_${address.toLowerCase()}`
      const recentVerification = localStorage.getItem(verificationKey)
      
      if (recentVerification) {
        const verificationData = JSON.parse(recentVerification)
        console.log('🔍 PRIVACY: Found recent verification for current user')
        
        if (verificationData.bitcoinAddress && verificationData.status === 'verified') {
          const btcAddress = verificationData.bitcoinAddress
          console.log('🔍 PRIVACY: Loading Bitcoin balance from mempool.space for current user')
          
          setFallbackAddresses([btcAddress])
          
          // Get balance from mempool.space
          const balance = await fetchBitcoinBalance(btcAddress)
          console.log('💰 PRIVACY: Bitcoin balance loaded for current user:', balance, 'BTC')
          
          setFallbackBalances({ [btcAddress]: balance })
          setFallbackTotal(balance.toFixed(8))
        }
      } else {
        console.log('🔍 PRIVACY: No recent verification found for current user')
      }
    } catch (error) {
      console.error('❌ PRIVACY: Failed to load recent verification for current user:', error)
    }
  }, [address, bitcoinAddresses, isVerified])

  // Load fallback data if user not found in Oracle
  useEffect(() => {
    if (!isLoading && !error && !isVerified && bitcoinAddresses.length === 0) {
      console.log('🔄 PRIVACY: Oracle data not found for current user, checking fallback')
      loadFallbackVerifiedAddresses()
    }
  }, [isLoading, error, isVerified, bitcoinAddresses.length, loadFallbackVerifiedAddresses])

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
      console.log(`🔍 PRIVACY: No transactions found for current user`)
      return false
    }

    const mintTransactions = recentTransactions.filter(tx => 
      tx.type === 'mint' && 
      (tx.bitcoinAddress === bitcoinAddress || 
       (tx.source === 'rBTC' && parseFloat(tx.amount || '0') > 0))
    )

    console.log(`🔍 PRIVACY: Checking mint status for current user address`)
    console.log(`   - Current user total transactions:`, recentTransactions.length)
    console.log(`   - Current user mint transactions found:`, mintTransactions.length)
    console.log(`   - Current user has minted:`, mintTransactions.length > 0)

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {/* Bitcoin Balance - Mainnet */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Bitcoin Mainnet</span>
              {isLoadingBalances && (
                <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
              )}
            </div>
            <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded">Mainnet</span>
          </div>
          <div className="text-2xl font-bold">
            {(() => {
              console.log('🔍 DASHBOARD: Bitcoin Mainnet Balance Display')
              console.log('   - bitcoinMainnetBalance from hook:', bitcoinMainnetBalance)
              if (isLoading) {
                return <span className="text-muted-foreground">Loading...</span>
              }
              
              return `${bitcoinMainnetBalance} BTC`
            })()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {(() => {
              const displayAddresses = bitcoinAddresses.length > 0 ? bitcoinAddresses : fallbackAddresses
              const mainnetAddresses = displayAddresses.filter(addr => !isTestnetAddress(addr))
              const addressCount = mainnetAddresses.length
              
              if (bitcoinAddresses.length > 0) {
                return `From ${addressCount} mainnet address${addressCount !== 1 ? 'es' : ''}`
              } else if (fallbackAddresses.length > 0) {
                return `From ${addressCount} recently verified mainnet address${addressCount !== 1 ? 'es' : ''} (syncing...)`
              } else {
                return `From ${addressCount} mainnet address${addressCount !== 1 ? 'es' : ''}`
              }
            })()}
          </p>
        </div>

        {/* Bitcoin Balance - Testnet */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Bitcoin Testnet</span>
              {isLoadingBalances && (
                <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
              )}
            </div>
            <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">Testnet</span>
          </div>
          <div className="text-2xl font-bold">
            {(() => {
              console.log('🔍 DASHBOARD: Bitcoin Testnet Balance Display')
              console.log('   - bitcoinTestnetBalance from hook:', bitcoinTestnetBalance)
              if (isLoading) {
                return <span className="text-muted-foreground">Loading...</span>
              }
              
              return `${bitcoinTestnetBalance} BTC`
            })()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {(() => {
              const displayAddresses = bitcoinAddresses.length > 0 ? bitcoinAddresses : fallbackAddresses
              const testnetAddresses = displayAddresses.filter(addr => isTestnetAddress(addr))
              const addressCount = testnetAddresses.length
              
              if (bitcoinAddresses.length > 0) {
                return `From ${addressCount} testnet address${addressCount !== 1 ? 'es' : ''}`
              } else if (fallbackAddresses.length > 0) {
                return `From ${addressCount} recently verified testnet address${addressCount !== 1 ? 'es' : ''} (syncing...)`
              } else {
                return `From ${addressCount} testnet address${addressCount !== 1 ? 'es' : ''}`
              }
            })()}
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
              console.log('   - rBTCBalance from hook:', rBTCBalance)
              console.log('   - rBTCBalance type:', typeof rBTCBalance)
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
              {isVerified ? 'Synced' : 'No Data'}
            </span>
          </div>
          <div className="text-2xl font-bold">
            {(() => {
              console.log('🔍 DASHBOARD: Oracle Status Balance Calculation')
              console.log('   - totalBalance from hook:', totalBalance)
              console.log('   - rBTCBalance:', rBTCBalance)
              console.log('   - wrBTCBalance:', wrBTCBalance)
              console.log('   - bitcoinMainnetBalance:', bitcoinMainnetBalance)
              console.log('   - bitcoinTestnetBalance:', bitcoinTestnetBalance)
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
            href="/verify" 
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </Link>
        </div>

        {/* Warning for limited data - removed legacy Oracle direct access */}

        {(() => {
          // Combine addresses from hook and direct Oracle debugging
          const allAddresses = [...bitcoinAddresses, ...directOracleAddresses.map(d => d.address)]
          const uniqueAddresses = Array.from(new Set(allAddresses)).filter(Boolean)
          
          console.log('🔍 DASHBOARD DEBUG: Address display logic:')
          console.log('  - bitcoinAddresses from hook:', bitcoinAddresses)
          console.log('  - directOracleAddresses:', directOracleAddresses.map(d => d.address))
          console.log('  - uniqueAddresses combined:', uniqueAddresses)
          
          if (uniqueAddresses.length === 0) {
            return (
              <div className="text-center py-8">
                <Bitcoin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-2">No Bitcoin Addresses</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add and verify your Bitcoin addresses to start using ReserveBTC
                </p>
                <Link 
                  href="/verify"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Verify Address
                </Link>
              </div>
            )
          }
          
          return (
            <div className="space-y-3">
              {uniqueAddresses
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
            
              {uniqueAddresses.length > 3 && (
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
                      Show {uniqueAddresses.length - 3} More
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })()}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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