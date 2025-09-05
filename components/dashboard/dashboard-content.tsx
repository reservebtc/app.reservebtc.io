'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBlockNumber, usePublicClient } from 'wagmi'
import { formatUnits, parseAbiItem } from 'viem'
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
  Loader2,
  ArrowUpRight,
  RefreshCw,
  Link2,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'

interface VerifiedAddress {
  address: string
  verifiedAt: string
  balance?: number
}

interface TransactionStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  timestamp?: string
  description?: string
}

interface Transaction {
  hash: string
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer'
  amount: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
  steps?: TransactionStep[]
  currentStep?: number
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export function DashboardContent() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const router = useRouter()
  const [verifiedAddresses, setVerifiedAddresses] = useState<VerifiedAddress[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string>('')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set())

  // Watch for new blocks to auto-refresh transactions
  const { data: currentBlockNumber } = useBlockNumber({
    watch: autoRefreshEnabled,
  })

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  // Load verified addresses from localStorage
  useEffect(() => {
    if (address) {
      const savedAddress = localStorage.getItem('verifiedBitcoinAddress')
      if (savedAddress) {
        setVerifiedAddresses([{
          address: savedAddress,
          verifiedAt: new Date().toISOString(),
          balance: 0 // Will be fetched from API
        }])
      }
      
      // Load transaction history from API
      loadTransactions()
      
      setIsLoadingData(false)
    }
  }, [address])

  // Auto-refresh transactions when new blocks appear
  useEffect(() => {
    if (!address || !currentBlockNumber || !autoRefreshEnabled) return

    // Check if we have cached data
    const cachedKey = `rbtc_transactions_${address}`
    const cachedData = localStorage.getItem(cachedKey)
    if (!cachedData) return // No cache yet, initial load will handle it

    const cached = JSON.parse(cachedData)
    const lastSyncedBlock = BigInt(cached.lastSyncedBlock || 0)
    
    // If current block is significantly newer than last synced block, auto-refresh
    const blockDifference = currentBlockNumber - lastSyncedBlock
    
    if (blockDifference > BigInt(10) && !isLoadingTransactions) { // 10+ new blocks
      console.log(`Auto-refresh triggered: ${blockDifference} new blocks detected`)
      setSyncStatus(`New blocks detected (${blockDifference}), refreshing...`)
      loadTransactions()
    }
  }, [currentBlockNumber, address, autoRefreshEnabled, isLoadingTransactions])

  // Read rBTC-SYNTH balance
  const { data: rbtcBalance } = useReadContract({
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
    args: address ? [address] : undefined
  })

  // Read wrBTC balance

  const { data: wrbtcBalance } = useReadContract({
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
    args: address ? [address] : undefined
  })

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopiedAddress(addr)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const toggleTransactionDetails = (hash: string) => {
    const newExpanded = new Set(expandedTransactions)
    if (newExpanded.has(hash)) {
      newExpanded.delete(hash)
    } else {
      newExpanded.add(hash)
    }
    setExpandedTransactions(newExpanded)
  }

  const createTransactionSteps = (type: string): TransactionStep[] => {
    const baseSteps = [
      { id: 'btc-tx', label: 'Bitcoin Transaction Sent', status: 'completed' as const, description: 'Waiting for Bitcoin network confirmation' },
      { id: 'btc-conf', label: 'Bitcoin Confirmation', status: 'completed' as const, description: 'Transaction confirmed on Bitcoin network' },
      { id: 'oracle-detect', label: 'Oracle Detection', status: 'completed' as const, description: 'Oracle server detected balance change' },
      { id: 'oracle-verify', label: 'Oracle Verification', status: 'completed' as const, description: 'Verifying transaction authenticity' },
      { id: 'sync-call', label: 'Smart Contract Sync', status: 'completed' as const, description: 'Oracle calling sync function' },
    ]

    if (type === 'mint') {
      return [
        ...baseSteps,
        { id: 'token-mint', label: 'rBTC Token Mint', status: 'completed' as const, description: 'Creating rBTC-SYNTH tokens' },
        { id: 'completed', label: 'Process Complete', status: 'completed' as const, description: 'rBTC tokens successfully minted' }
      ]
    } else if (type === 'burn') {
      return [
        ...baseSteps,
        { id: 'token-burn', label: 'rBTC Token Burn', status: 'completed' as const, description: 'Burning rBTC-SYNTH tokens' },
        { id: 'completed', label: 'Process Complete', status: 'completed' as const, description: 'rBTC tokens successfully burned' }
      ]
    } else if (type === 'wrap') {
      return [
        { id: 'approve', label: 'Approve rBTC-SYNTH', status: 'completed' as const, description: 'Approving rBTC-SYNTH for wrapping' },
        { id: 'wrap-call', label: 'Wrap Transaction', status: 'completed' as const, description: 'Converting rBTC-SYNTH to wrBTC' },
        { id: 'token-mint', label: 'wrBTC Token Mint', status: 'completed' as const, description: 'Minting transferable wrBTC tokens' },
        { id: 'completed', label: 'Wrap Complete', status: 'completed' as const, description: 'Successfully wrapped to wrBTC' }
      ]
    } else if (type === 'unwrap') {
      return [
        { id: 'unwrap-call', label: 'Unwrap Transaction', status: 'completed' as const, description: 'Converting wrBTC to rBTC-SYNTH' },
        { id: 'token-burn', label: 'wrBTC Token Burn', status: 'completed' as const, description: 'Burning wrBTC tokens' },
        { id: 'token-mint', label: 'rBTC-SYNTH Mint', status: 'completed' as const, description: 'Minting rBTC-SYNTH tokens' },
        { id: 'completed', label: 'Unwrap Complete', status: 'completed' as const, description: 'Successfully unwrapped to rBTC-SYNTH' }
      ]
    } else {
      return [
        { id: 'transfer-tx', label: 'Transfer Transaction', status: 'completed' as const, description: 'Token transfer transaction sent' },
        { id: 'transfer-conf', label: 'Transfer Confirmed', status: 'completed' as const, description: 'Transfer confirmed on MegaETH' },
        { id: 'completed', label: 'Transfer Complete', status: 'completed' as const, description: 'Tokens successfully transferred' }
      ]
    }
  }

  const getStepIcon = (status: TransactionStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    }
  }


  const loadTransactions = async () => {
    if (!address || !publicClient) return

    setIsLoadingTransactions(true)
    try {
      console.log(`Loading transactions for address: ${address}`)
      
      // Load cached transactions first for instant display
      const cachedKey = `rbtc_transactions_${address}`
      const cachedData = localStorage.getItem(cachedKey)
      const cached = cachedData ? JSON.parse(cachedData) : { transactions: [], lastSyncedBlock: 0, lastSyncedAt: 0 }
      
      // Show cached data immediately if available
      if (cached.transactions.length > 0) {
        console.log(`Found ${cached.transactions.length} cached transactions, showing immediately`)
        setTransactions(cached.transactions)
        setSyncStatus(`Showing cached data (${cached.transactions.length} transactions)`)
      }
      
      // Get current block for incremental sync
      const currentBlock = await publicClient.getBlockNumber()
      console.log(`Current block: ${currentBlock}`)
      
      // Determine sync strategy based on cache age and last synced block
      const cacheAge = Date.now() - cached.lastSyncedAt
      const isStaleCache = cacheAge > 5 * 60 * 1000 // 5 minutes
      const lastSyncedBlock = BigInt(cached.lastSyncedBlock || 0)
      
      let startBlock: bigint
      let syncDescription: string
      
      if (cached.transactions.length === 0) {
        // First time sync - start from recent history only (last 50k blocks due to MegaETH limits)
        startBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0)
        syncDescription = 'Initial sync (recent 50k blocks)'
      } else if (isStaleCache || currentBlock > lastSyncedBlock + BigInt(100)) {
        // Incremental sync - only check new blocks since last sync
        startBlock = lastSyncedBlock
        syncDescription = `Incremental sync from block ${startBlock}`
      } else {
        // Cache is fresh, no sync needed
        console.log('Cache is fresh, no sync needed')
        setSyncStatus('Up to date')
        setIsLoadingTransactions(false)
        return
      }
      
      console.log(`${syncDescription}: scanning blocks ${startBlock} to ${currentBlock}`)
      setSyncStatus(`Syncing... (${syncDescription})`)
      
      // Use VERY small chunks due to MegaETH strict limits
      const CHUNK_SIZE = BigInt(50) // Very conservative chunk size
      const MAX_CHUNKS_PER_SYNC = 100 // Limit total chunks to prevent long loading times
      
      const allNewTransactions: Transaction[] = []
      let chunksProcessed = 0
      
      // Process blocks in small chunks
      for (let blockStart = startBlock; blockStart < currentBlock && chunksProcessed < MAX_CHUNKS_PER_SYNC; blockStart += CHUNK_SIZE) {
        const blockEnd = blockStart + CHUNK_SIZE > currentBlock ? currentBlock : blockStart + CHUNK_SIZE
        chunksProcessed++
        
        console.log(`Processing chunk ${chunksProcessed}: blocks ${blockStart} to ${blockEnd}`)
        setSyncStatus(`Syncing... (chunk ${chunksProcessed}/${MAX_CHUNKS_PER_SYNC})`)
        
        try {
          // Search for Oracle Synced events (mint/burn operations)
          const syncedEvents = await publicClient.getLogs({
            address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
            event: parseAbiItem('event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)'),
            args: { user: address as `0x${string}` },
            fromBlock: blockStart,
            toBlock: blockEnd
          })

          // Process Oracle events
          for (const event of syncedEvents) {
            const { deltaSats, timestamp } = event.args
            if (!deltaSats || !timestamp) continue
            
            const deltaSatsBigInt = BigInt(deltaSats)
            const amount = formatUnits(deltaSatsBigInt > 0 ? deltaSatsBigInt : -deltaSatsBigInt, 8)
            
            const transactionType = deltaSatsBigInt > 0 ? 'mint' : 'burn'
            const transaction: Transaction = {
              hash: event.transactionHash,
              type: transactionType,
              amount,
              timestamp: new Date(Number(timestamp) * 1000).toISOString(),
              status: 'success',
              steps: createTransactionSteps(transactionType),
              currentStep: createTransactionSteps(transactionType).length - 1
            }
            
            allNewTransactions.push(transaction)
          }

          // Search for rBTC Transfer events (incoming)
          const transferInEvents = await publicClient.getLogs({
            address: CONTRACTS.RBTC_SYNTH as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { to: address as `0x${string}` },
            fromBlock: blockStart,
            toBlock: blockEnd
          })

          // Process incoming transfers
          for (const event of transferInEvents) {
            const { value } = event.args
            if (!value || event.args.from === '0x0000000000000000000000000000000000000000') continue // Skip mints
            
            // Get block timestamp
            let timestamp: string
            try {
              const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
              timestamp = new Date(Number(block.timestamp) * 1000).toISOString()
            } catch {
              timestamp = new Date().toISOString() // Fallback
            }
            
            const transaction: Transaction = {
              hash: event.transactionHash,
              type: 'transfer',
              amount: formatUnits(value, 8),
              timestamp,
              status: 'success',
              steps: createTransactionSteps('transfer'),
              currentStep: createTransactionSteps('transfer').length - 1
            }
            
            allNewTransactions.push(transaction)
          }

          // Search for rBTC Transfer events (outgoing)
          const transferOutEvents = await publicClient.getLogs({
            address: CONTRACTS.RBTC_SYNTH as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { from: address as `0x${string}` },
            fromBlock: blockStart,
            toBlock: blockEnd
          })

          // Process outgoing transfers
          for (const event of transferOutEvents) {
            const { value } = event.args
            if (!value || event.args.to === '0x0000000000000000000000000000000000000000') continue // Skip burns
            
            // Get block timestamp
            let timestamp: string
            try {
              const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
              timestamp = new Date(Number(block.timestamp) * 1000).toISOString()
            } catch {
              timestamp = new Date().toISOString() // Fallback
            }
            
            const transaction: Transaction = {
              hash: event.transactionHash,
              type: 'transfer',
              amount: formatUnits(value, 8),
              timestamp,
              status: 'success',
              steps: createTransactionSteps('transfer'),
              currentStep: createTransactionSteps('transfer').length - 1
            }
            
            allNewTransactions.push(transaction)
          }

        } catch (chunkError) {
          console.log(`Error processing chunk ${blockStart}-${blockEnd}:`, chunkError instanceof Error ? chunkError.message : 'Unknown error')
          
          // If we hit rate limits, break and save what we have
          if (chunkError instanceof Error && chunkError.message.includes('rate limit')) {
            console.log('Hit rate limits, stopping incremental sync')
            break
          }
          
          // Continue with next chunk for other errors
          continue
        }
      }

      console.log(`Found ${allNewTransactions.length} new transactions in ${chunksProcessed} chunks`)

      // Merge new transactions with cached ones
      const allTransactions = [...cached.transactions, ...allNewTransactions]
      
      // Remove duplicates by hash and sort by timestamp (newest first)
      const uniqueTransactions = allTransactions
        .reduce((acc, tx) => {
          if (!acc.find((existing: Transaction) => existing.hash === tx.hash)) {
            acc.push(tx)
          }
          return acc
        }, [] as Transaction[])
        .sort((a: Transaction, b: Transaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Update state and cache
      setTransactions(uniqueTransactions)
      
      // Save updated cache with sync metadata
      const updatedCache = {
        transactions: uniqueTransactions,
        lastSyncedBlock: currentBlock.toString(),
        lastSyncedAt: Date.now(),
        totalSyncs: (cached.totalSyncs || 0) + 1,
        lastSyncDescription: syncDescription
      }
      localStorage.setItem(cachedKey, JSON.stringify(updatedCache))
      
      console.log(`Transaction sync completed: ${uniqueTransactions.length} total transactions cached`)
      setSyncStatus(`Synchronized ${uniqueTransactions.length} transactions`)
      
    } catch (error) {
      console.error('Error loading transactions:', error)
      
      // On error, still try to show cached data if available
      const cachedKey = `rbtc_transactions_${address}`
      const cachedData = localStorage.getItem(cachedKey)
      if (cachedData) {
        const cached = JSON.parse(cachedData)
        if (cached.transactions?.length > 0) {
          console.log('Showing cached transactions due to sync error')
          setTransactions(cached.transactions)
        }
      }
    } finally {
      setIsLoadingTransactions(false)
    }
  }


  const formatBTC = (value: bigint | undefined) => {
    if (!value) return '0'
    return formatUnits(value, 8)
  }

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center space-y-4 py-12">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your MetaMask wallet to access the dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Track your rBTC portfolio and verification status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* rBTC-SYNTH Balance */}
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">rBTC-SYNTH</p>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Bitcoin className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatBTC(rbtcBalance)}</p>
          <p className="text-xs text-muted-foreground">Soulbound (Non-transferable)</p>
        </div>

        {/* wrBTC Balance */}
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">wrBTC</p>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatBTC(wrbtcBalance)}</p>
          <p className="text-xs text-muted-foreground">Transferable</p>
        </div>

        {/* Verified Addresses */}
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Verified BTC</p>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{verifiedAddresses.length}</p>
          <p className="text-xs text-muted-foreground">Addresses</p>
        </div>

        {/* Total Transactions */}
        <div className="bg-card border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <History className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{transactions.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* wrBTC Explanation */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5 text-green-600" />
          How rBTC-SYNTH → wrBTC Works
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-green-700 dark:text-green-400">1</span>
            </div>
            <div>
              <p className="font-medium">Mint rBTC-SYNTH</p>
              <p className="text-xs text-muted-foreground">
                Verify your Bitcoin address and mint soulbound rBTC-SYNTH tokens (1:1 with your BTC balance)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">2</span>
            </div>
            <div>
              <p className="font-medium">Wrap to wrBTC</p>
              <p className="text-xs text-muted-foreground">
                Convert your rBTC-SYNTH to wrBTC (transferable ERC-20) through the VaultWrBTC contract
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400">3</span>
            </div>
            <div>
              <p className="font-medium">Use in DeFi</p>
              <p className="text-xs text-muted-foreground">
                Trade, provide liquidity, or use wrBTC in any DeFi protocol on MegaETH
              </p>
            </div>
          </div>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Link 
            href="/wrap"
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Wrap rBTC-SYNTH
          </Link>
          <button className="inline-flex items-center justify-center gap-2 bg-card border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            <Info className="h-4 w-4" />
            Learn More
          </button>
        </div>
      </div>

      {/* Verified Bitcoin Addresses */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Verified Bitcoin Addresses</h3>
          <Link 
            href="/verify"
            className="text-sm text-primary hover:underline"
          >
            Add Address
          </Link>
        </div>
        
        {verifiedAddresses.length > 0 ? (
          <div className="space-y-3">
            {verifiedAddresses.map((addr, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4 text-orange-500" />
                    <span className="font-mono text-sm break-all">{addr.address}</span>
                    <button
                      onClick={() => copyAddress(addr.address)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      {copiedAddress === addr.address ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verified on {new Date(addr.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{addr.balance || 0} BTC</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No verified addresses yet</p>
            <Link 
              href="/verify"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Verify your first address
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Transaction History</h3>
            {syncStatus && (
              <p className="text-xs text-muted-foreground mt-1">{syncStatus}</p>
            )}
            {currentBlockNumber && autoRefreshEnabled && (
              <p className="text-xs text-muted-foreground mt-1">
                Block: {currentBlockNumber.toString()} • Auto-refresh: ON
              </p>
            )}
            {isLoadingTransactions && transactions.length === 0 && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Waiting for Bitcoin transaction confirmation...
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefreshEnabled 
                  ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                  : 'bg-muted hover:bg-accent'
              }`}
              title={`Auto-refresh: ${autoRefreshEnabled ? 'ON' : 'OFF'}`}
            >
              <div className={`h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            </button>
            <button 
              onClick={loadTransactions}
              disabled={isLoadingTransactions}
              className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
              title="Refresh transactions"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground hidden sm:table-cell">Hash</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <>
                    <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            tx.type === 'mint' ? 'bg-orange-500/10 text-orange-600' :
                            tx.type === 'burn' ? 'bg-red-500/10 text-red-600' :
                            tx.type === 'wrap' ? 'bg-green-500/10 text-green-600' :
                            tx.type === 'unwrap' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-purple-500/10 text-purple-600'
                          }`}>
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </span>
                          {tx.steps && (
                            <button
                              onClick={() => toggleTransactionDetails(tx.hash)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                              title="Show transaction steps"
                            >
                              {expandedTransactions.has(tx.hash) ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <a 
                          href={`https://www.megaexplorer.xyz/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        <span className={tx.type === 'mint' ? 'text-green-600' : tx.type === 'burn' ? 'text-red-600' : ''}>
                          {tx.type === 'mint' ? '+' : tx.type === 'burn' ? '-' : ''}{tx.amount} BTC
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {tx.status === 'success' ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Complete</span>
                          </div>
                        ) : tx.status === 'pending' ? (
                          <div className="flex flex-col items-center gap-1">
                            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                            <span className="text-xs text-amber-600 font-medium">Processing</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">Failed</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    {/* Transaction Steps Expansion */}
                    {tx.steps && expandedTransactions.has(tx.hash) && (
                      <tr className="bg-muted/20 border-b">
                        <td colSpan={5} className="py-4 px-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Transaction Steps</h4>
                            <div className="space-y-2">
                              {tx.steps.map((step, stepIndex) => (
                                <div key={step.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getStepIcon(step.status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-medium text-foreground">{step.label}</h5>
                                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        step.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                        step.status === 'processing' ? 'bg-blue-500/10 text-blue-600' :
                                        step.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                        'bg-red-500/10 text-red-600'
                                      }`}>
                                        {step.status === 'completed' ? 'Completed' :
                                         step.status === 'processing' ? 'Processing...' :
                                         step.status === 'pending' ? 'Pending' : 'Failed'}
                                      </span>
                                    </div>
                                    {step.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                    )}
                                    {step.timestamp && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(step.timestamp).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 text-center">
                              <p className="text-xs text-muted-foreground">
                                All steps completed successfully. Transaction is finalized on the blockchain.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <History className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <Link 
              href="/mint"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Mint your first rBTC
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Add Tokens to MetaMask */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-600" />
          Add Tokens to MetaMask
        </h3>
        <p className="text-sm text-muted-foreground">
          To see your rBTC-SYNTH and wrBTC balances in MetaMask, add these tokens:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* rBTC-SYNTH Token */}
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">rBTC-SYNTH</span>
              <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded">Soulbound</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{CONTRACTS.RBTC_SYNTH.slice(0, 10)}...</span>
                  <button
                    onClick={() => copyAddress(CONTRACTS.RBTC_SYNTH)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy contract address"
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
                <div className="flex items-center gap-1">
                  <span>rBTC-SYNTH</span>
                  <button
                    onClick={() => copyAddress('rBTC-SYNTH')}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy symbol"
                  >
                    {copiedAddress === 'rBTC-SYNTH' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decimals:</span>
                <div className="flex items-center gap-1">
                  <span>8</span>
                  <button
                    onClick={() => copyAddress('8')}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy decimals"
                  >
                    {copiedAddress === '8' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-300">
                <span className="font-medium">Manual Setup:</span> Copy the contract address, symbol, and decimals above to manually add this token to your wallet.
              </p>
            </div>
          </div>

          {/* wrBTC Token */}
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">wrBTC</span>
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">Transferable</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{CONTRACTS.VAULT_WRBTC.slice(0, 10)}...</span>
                  <button
                    onClick={() => copyAddress(CONTRACTS.VAULT_WRBTC)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy contract address"
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
                <div className="flex items-center gap-1">
                  <span>wrBTC</span>
                  <button
                    onClick={() => copyAddress('wrBTC')}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy symbol"
                  >
                    {copiedAddress === 'wrBTC' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decimals:</span>
                <div className="flex items-center gap-1">
                  <span>8</span>
                  <button
                    onClick={() => copyAddress('8')}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Copy decimals"
                  >
                    {copiedAddress === '8' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-300">
                <span className="font-medium">Manual Setup:</span> Copy the contract address, symbol, and decimals above to manually add this token to your wallet.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-medium">Note:</span> After adding tokens, they will appear in your MetaMask wallet under the "Assets" tab. 
            rBTC-SYNTH cannot be transferred (soulbound), while wrBTC can be freely traded.
          </p>
        </div>
      </div>

      {/* Connected Wallet Info */}
      <div className="bg-muted/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Connected as:</span>
          <span className="font-mono text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
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