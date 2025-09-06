'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { 
  Wallet, 
  Bitcoin, 
  ArrowRight, 
  ArrowUpDown,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  ExternalLink,
  Clock,
  Users,
  TrendingUp,
  Lock,
  Unlock,
  History,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { CONTRACTS } from '@/app/lib/contracts'
import { getVerifiedBitcoinAddresses } from '@/lib/user-data-storage'

interface VerifiedAddress {
  address: string
  verifiedAt: string
}

interface WrapTransaction {
  id: string
  type: 'wrap' | 'unwrap'
  amount: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  bitcoinAddress?: string
}

export function WrapRBTC() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  
  // State
  const [rbtcBalance, setRbtcBalance] = useState<string>('0')
  const [wrbtcBalance, setWrbtcBalance] = useState<string>('0')
  const [wrapAmount, setWrapAmount] = useState<string>('')
  const [unwrapAmount, setUnwrapAmount] = useState<string>('')
  const [isWrapping, setIsWrapping] = useState(false)
  const [isUnwrapping, setIsUnwrapping] = useState(false)
  const [verifiedAddresses, setVerifiedAddresses] = useState<VerifiedAddress[]>([])
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [acceptedRisks, setAcceptedRisks] = useState(false)
  const [pendingOperation, setPendingOperation] = useState<'wrap' | 'unwrap' | null>(null)
  const [wrapTransactions, setWrapTransactions] = useState<WrapTransaction[]>([])
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap')

  // Load balances
  useEffect(() => {
    if (!address || !publicClient) return

    const loadBalances = async () => {
      try {
        // Load rBTC-SYNTH balance
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

        // Load wrBTC balance  
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

        setRbtcBalance(formatUnits(rbtcBal, 8))
        setWrbtcBalance(formatUnits(wrbtcBal, 8))
        
        // Load verified addresses
        const verifiedAddrs = await getVerifiedBitcoinAddresses(address)
        setVerifiedAddresses(verifiedAddrs)
        
      } catch (error) {
        console.error('Error loading balances:', error)
      }
    }

    loadBalances()
  }, [address, publicClient])

  // Handle wrap operation
  const handleWrap = async () => {
    if (!wrapAmount || !address) return
    
    setPendingOperation('wrap')
    setShowRiskModal(true)
  }

  // Confirm wrap after risk acceptance
  const confirmWrap = async () => {
    if (!wrapAmount || !address || !acceptedRisks) return
    
    setIsWrapping(true)
    setShowRiskModal(false)
    
    try {
      // Demo simulation - in production this would call actual contracts
      console.log('Wrapping', wrapAmount, 'rBTC-SYNTH → wrBTC')
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newTransaction: WrapTransaction = {
        id: Date.now().toString(),
        type: 'wrap',
        amount: wrapAmount,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: `0x${Math.random().toString(16).substring(2)}`,
        bitcoinAddress: verifiedAddresses[0]?.address
      }
      
      setWrapTransactions(prev => [newTransaction, ...prev])
      
      // Update balances
      const currentRbtc = parseFloat(rbtcBalance)
      const wrapAmountNum = parseFloat(wrapAmount)
      setRbtcBalance((currentRbtc - wrapAmountNum).toFixed(8))
      setWrbtcBalance((parseFloat(wrbtcBalance) + wrapAmountNum).toFixed(8))
      
      setWrapAmount('')
      
    } catch (error) {
      console.error('Wrap failed:', error)
    } finally {
      setIsWrapping(false)
      setPendingOperation(null)
    }
  }

  // Handle unwrap operation
  const handleUnwrap = async () => {
    if (!unwrapAmount || !address) return
    
    setIsUnwrapping(true)
    
    try {
      console.log('Unwrapping', unwrapAmount, 'wrBTC → rBTC-SYNTH')
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newTransaction: WrapTransaction = {
        id: Date.now().toString(),
        type: 'unwrap',
        amount: unwrapAmount,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: `0x${Math.random().toString(16).substring(2)}`
      }
      
      setWrapTransactions(prev => [newTransaction, ...prev])
      
      // Update balances
      const currentWrbtc = parseFloat(wrbtcBalance)
      const unwrapAmountNum = parseFloat(unwrapAmount)
      setWrbtcBalance((currentWrbtc - unwrapAmountNum).toFixed(8))
      setRbtcBalance((parseFloat(rbtcBalance) + unwrapAmountNum).toFixed(8))
      
      setUnwrapAmount('')
      
    } catch (error) {
      console.error('Unwrap failed:', error)
    } finally {
      setIsUnwrapping(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-6 animate-in fade-in duration-500">
        <div className="p-3 bg-destructive/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold">Wallet Not Connected</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to access the wrapping interface.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <ArrowUpDown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h1 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Wrap rBTC-SYNTH
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Convert your soulbound rBTC-SYNTH into transferable wrBTC certificates. 
          Create Bitcoin liquidity while maintaining non-custodial control.
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* rBTC-SYNTH Balance */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Bitcoin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">rBTC-SYNTH</h3>
                <p className="text-xs text-muted-foreground">Soulbound • Non-transferable</p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold font-mono">
              {parseFloat(rbtcBalance).toFixed(8)}
            </div>
            <p className="text-sm text-muted-foreground">
              Backed 1:1 by Bitcoin in your wallet
            </p>
          </div>
        </div>

        {/* wrBTC Balance */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">wrBTC</h3>
                <p className="text-xs text-muted-foreground">ERC-20 • Transferable</p>
              </div>
            </div>
            <Unlock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold font-mono">
              {parseFloat(wrbtcBalance).toFixed(8)}
            </div>
            <p className="text-sm text-muted-foreground">
              Certificates backed by rBTC-SYNTH
            </p>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wrap/Unwrap Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('wrap')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'wrap' 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Wrap → wrBTC
            </button>
            <button
              onClick={() => setActiveTab('unwrap')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'unwrap' 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unwrap → rBTC-SYNTH
            </button>
          </div>

          {/* Wrap Interface */}
          {activeTab === 'wrap' && (
            <div className="bg-card border rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Wrap Amount</label>
                  <div className="text-xs text-muted-foreground">
                    Available: {parseFloat(rbtcBalance).toFixed(8)} rBTC-SYNTH
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00000000"
                    value={wrapAmount}
                    onChange={(e) => setWrapAmount(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg font-mono text-lg bg-background"
                    step="0.00000001"
                    min="0"
                    max={rbtcBalance}
                  />
                  <button
                    onClick={() => setWrapAmount(rbtcBalance)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80"
                  >
                    MAX
                  </button>
                </div>

                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">You will receive:</span>
                    <span className="font-mono font-medium">
                      {wrapAmount || '0.00000000'} wrBTC
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWrap}
                disabled={!wrapAmount || parseFloat(wrapAmount) <= 0 || parseFloat(wrapAmount) > parseFloat(rbtcBalance) || isWrapping}
                className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                {isWrapping ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Wrapping...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="h-5 w-5" />
                    <span>Wrap to wrBTC</span>
                  </>
                )}
              </button>

              {/* Important Notice for Wrap */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      ⚠️ Critical: You remain the ONLY owner who can unwrap!
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      wrBTC buyers cannot directly claim your Bitcoin. They depend on your honesty to maintain backing.
                      If you spend Bitcoin from your wallet, your wrBTC becomes worthless.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unwrap Interface */}
          {activeTab === 'unwrap' && (
            <div className="bg-card border rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Unwrap Amount</label>
                  <div className="text-xs text-muted-foreground">
                    Available: {parseFloat(wrbtcBalance).toFixed(8)} wrBTC
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00000000"
                    value={unwrapAmount}
                    onChange={(e) => setUnwrapAmount(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg font-mono text-lg bg-background"
                    step="0.00000001"
                    min="0"
                    max={wrbtcBalance}
                  />
                  <button
                    onClick={() => setUnwrapAmount(wrbtcBalance)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80"
                  >
                    MAX
                  </button>
                </div>

                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">You will receive:</span>
                    <span className="font-mono font-medium">
                      {unwrapAmount || '0.00000000'} rBTC-SYNTH
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUnwrap}
                disabled={!unwrapAmount || parseFloat(unwrapAmount) <= 0 || parseFloat(unwrapAmount) > parseFloat(wrbtcBalance) || isUnwrapping}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                {isUnwrapping ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Unwrapping...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="h-5 w-5 rotate-180" />
                    <span>Unwrap to rBTC-SYNTH</span>
                  </>
                )}
              </button>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Safe Operation
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      Unwrapping returns your wrBTC to soulbound rBTC-SYNTH, restoring direct Bitcoin backing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange Rate:</span>
                <span className="font-mono">1:1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total wrBTC Supply:</span>
                <span className="font-mono">- BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backing Ratio:</span>
                <span className="text-green-600 font-medium">100%</span>
              </div>
            </div>
          </div>

          {/* Verified Addresses */}
          {verifiedAddresses.length > 0 && (
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Your Bitcoin Addresses
              </h3>
              <div className="space-y-2">
                {verifiedAddresses.slice(0, 2).map((addr, index) => (
                  <div key={addr.address} className="text-xs">
                    <div className="font-mono truncate text-muted-foreground">
                      {addr.address}
                    </div>
                    <div className="text-muted-foreground">
                      Verified {new Date(addr.verifiedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {verifiedAddresses.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{verifiedAddresses.length - 2} more addresses
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Learn More */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              How it Works
            </h3>
            <p className="text-sm text-muted-foreground">
              Understand the Full-Reserve model, risks, and benefits of wrapping your Bitcoin certificates.
            </p>
            <Link 
              href="/wrap/learn-more"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Learn More
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {wrapTransactions.length > 0 && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </h3>
          </div>
          <div className="space-y-3">
            {wrapTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-full ${
                    tx.type === 'wrap' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <ArrowUpDown className={`h-3 w-3 ${
                      tx.type === 'wrap' ? 'text-purple-600' : 'text-green-600'
                    } ${tx.type === 'unwrap' ? 'rotate-180' : ''}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {tx.type === 'wrap' ? 'Wrapped' : 'Unwrapped'} {tx.amount} 
                      {tx.type === 'wrap' ? ' → wrBTC' : ' → rBTC-SYNTH'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {tx.status}
                  </span>
                  {tx.txHash && (
                    <Link 
                      href={`https://megaexplorer.xyz/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Acceptance Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Risk Acknowledgment Required</h2>
                <button 
                  onClick={() => setShowRiskModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ⚠️ CRITICAL DISCLAIMER
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    By wrapping rBTC-SYNTH, you create transferable certificates while remaining the ONLY person 
                    who can redeem the underlying Bitcoin. This is a decentralized, non-custodial system with no central authority.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">You acknowledge and accept that:</h4>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>You are the sole owner of the Bitcoin backing these certificates</li>
                    <li>Only you can unwrap wrBTC back to rBTC-SYNTH</li>
                    <li>If you spend Bitcoin from your wallet, your wrBTC becomes unbacked</li>
                    <li>wrBTC buyers depend entirely on your honesty and Bitcoin custody</li>
                    <li>This creates reputational and financial responsibility</li>
                    <li>No insurance or guarantees protect wrBTC holders</li>
                    <li>You assume all risks of this experimental protocol</li>
                    <li>Smart contracts are immutable and cannot be modified</li>
                    <li>ReserveBTC is a DAO with no central authority or customer support</li>
                    <li>All transactions are irreversible on the blockchain</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Full-Reserve Model Responsibility
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    This protocol implements a Full-Reserve model where wrBTC holders trust you to maintain Bitcoin backing. 
                    Your reputation and financial integrity are the only guarantees.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="accept-risks"
                  checked={acceptedRisks}
                  onChange={(e) => setAcceptedRisks(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                />
                <label htmlFor="accept-risks" className="text-sm">
                  <span className="font-medium">I understand and accept all risks.</span>
                  <br />
                  I confirm that I am the sole owner of the Bitcoin backing these tokens and will maintain custody responsibly.
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowRiskModal(false)
                    setAcceptedRisks(false)
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmWrap}
                  disabled={!acceptedRisks}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  I Accept - Proceed with Wrap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}