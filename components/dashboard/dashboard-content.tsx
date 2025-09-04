'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBlockNumber } from 'wagmi'
import { formatUnits } from 'viem'
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
  Link2
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'

interface VerifiedAddress {
  address: string
  verifiedAt: string
  balance?: number
}

interface Transaction {
  hash: string
  type: 'mint' | 'wrap' | 'unwrap' | 'transfer'
  amount: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export function DashboardContent() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [verifiedAddresses, setVerifiedAddresses] = useState<VerifiedAddress[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

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


  const loadTransactions = async () => {
    if (!address) return

    setIsLoadingTransactions(true)
    try {
      // Clean up old fake transactions first
      const savedTxs = localStorage.getItem(`transactions_${address}`)
      if (savedTxs) {
        try {
          const existingTxs = JSON.parse(savedTxs)
          // Filter out transactions with fake random hashes or invalid amounts
          const validTxs = existingTxs.filter((tx: any) => {
            // Skip transactions that look like our old generated ones
            if (tx.amount === '0.05' || tx.amount === '0.02') {
              return false
            }
            // Skip transactions with invalid hashes
            if (!tx.hash || tx.hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
              return false
            }
            return true
          })
          
          if (validTxs.length > 0) {
            setTransactions(validTxs)
          } else {
            // Clear invalid data
            localStorage.removeItem(`transactions_${address}`)
            setTransactions([])
          }
        } catch (error) {
          console.log('Error parsing saved transactions:', error)
          localStorage.removeItem(`transactions_${address}`)
          setTransactions([])
        }
      }

      // Try multiple approaches to fetch transaction data
      const allTransactions: Transaction[] = []

      // Approach 1: Try MegaExplorer API with different endpoints
      try {
        const endpoints = [
          `https://api.megaexplorer.xyz/address/${address}/transactions`,
          `https://www.megaexplorer.xyz/api/address/${address}/transactions`,
          `https://megaexplorer.xyz/api/v1/address/${address}/txs`
        ]

        for (const endpoint of endpoints) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            
            const response = await fetch(endpoint, { 
              signal: controller.signal,
              headers: { 'Accept': 'application/json' }
            })
            clearTimeout(timeoutId)
            
            if (response.ok) {
              const data = await response.json()
              
              if (data.transactions && Array.isArray(data.transactions)) {
                const formattedTxs = data.transactions
                  .filter((tx: any) => tx.to === address || tx.from === address)
                  .slice(0, 20)
                  .map((tx: any) => ({
                    hash: tx.hash || tx.transactionHash,
                    type: detectTransactionType(tx),
                    amount: formatUnits(BigInt(tx.value || 0), 18),
                    timestamp: new Date((tx.timestamp || tx.timeStamp) * 1000).toISOString(),
                    status: (tx.status === '1' || tx.status === 'success') ? 'success' : 'failed'
                  }))
                
                allTransactions.push(...formattedTxs)
                break // Use first successful response
              }
            }
          } catch (endpointError) {
            console.log(`Failed endpoint ${endpoint}:`, endpointError)
            continue
          }
        }
      } catch (apiError) {
        console.log('API fetch failed:', apiError)
      }

      // Approach 2: Load from verified mint data if available
      if (allTransactions.length === 0) {
        // Check localStorage for actual mint/verification data
        const bitcoinAddress = localStorage.getItem('verifiedBitcoinAddress')
        const mintData = localStorage.getItem('mintTransaction')
        
        if (bitcoinAddress && mintData) {
          try {
            const parsedMintData = JSON.parse(mintData)
            const realTransaction: Transaction = {
              hash: parsedMintData.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
              type: 'mint',
              amount: parsedMintData.amount || '0.00000000',
              timestamp: parsedMintData.timestamp || new Date().toISOString(),
              status: parsedMintData.status || 'success'
            }
            allTransactions.push(realTransaction)
          } catch (error) {
            console.log('Error parsing mint data:', error)
          }
        }
        
        // If still no data, don't create fake transactions
        // Let the UI show "No transactions yet"
      }

      if (allTransactions.length > 0) {
        // Sort by timestamp (newest first)
        allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        setTransactions(allTransactions)
        
        // Save to localStorage
        localStorage.setItem(`transactions_${address}`, JSON.stringify(allTransactions))
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const detectTransactionType = (tx: any): 'mint' | 'wrap' | 'unwrap' | 'transfer' => {
    // Simple detection based on contract interactions
    if (tx.to === CONTRACTS.RBTC_SYNTH) {
      return 'mint'
    }
    if (tx.to === CONTRACTS.VAULT_WRBTC) {
      return 'wrap'
    }
    if (tx.from === CONTRACTS.VAULT_WRBTC) {
      return 'unwrap'
    }
    return 'transfer'
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
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <button 
            onClick={loadTransactions}
            disabled={isLoadingTransactions}
            className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
            title="Refresh transactions"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
          </button>
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
                  <tr key={index} className="border-b">
                    <td className="py-3 px-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tx.type === 'mint' ? 'bg-orange-500/10 text-orange-600' :
                        tx.type === 'wrap' ? 'bg-green-500/10 text-green-600' :
                        tx.type === 'unwrap' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-purple-500/10 text-purple-600'
                      }`}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
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
                      {tx.amount} BTC
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {tx.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                      ) : tx.status === 'pending' ? (
                        <Loader2 className="h-4 w-4 text-amber-600 animate-spin mx-auto" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
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