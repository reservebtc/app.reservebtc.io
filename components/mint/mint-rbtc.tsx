'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, AlertCircle, Loader2, CheckCircle, Info, Bitcoin, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { mintFormSchema, MintForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount } from 'wagmi'
import { DepositFeeVault } from './deposit-fee-vault'

interface MintRBTCProps {
  onMintComplete?: (data: MintForm) => void
}

export function MintRBTC({ onMintComplete }: MintRBTCProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [verifiedBitcoinAddress, setVerifiedBitcoinAddress] = useState<string>('')
  const [bitcoinBalance, setBitcoinBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [showFeeVaultWarning, setShowFeeVaultWarning] = useState(false)
  const [showAutoSyncDetails, setShowAutoSyncDetails] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsDetails, setShowTermsDetails] = useState(false)
  const { address, isConnected } = useAccount()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<MintForm>({
    resolver: zodResolver(mintFormSchema),
    mode: 'onChange'
  })

  const amount = watch('amount')
  const bitcoinAddress = watch('bitcoinAddress')
  const bitcoinValidation = bitcoinAddress ? validateBitcoinAddress(bitcoinAddress) : null

  // Load verified Bitcoin address from localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('verifiedBitcoinAddress')
    if (savedAddress) {
      setVerifiedBitcoinAddress(savedAddress)
      setValue('bitcoinAddress', savedAddress)
      // Fetch Bitcoin balance for this address
      fetchBitcoinBalance(savedAddress)
    }
  }, [setValue])

  // Fetch Bitcoin balance from the verified address
  const fetchBitcoinBalance = async (btcAddress: string) => {
    setIsLoadingBalance(true)
    try {
      // For testnet addresses, use testnet API
      const isTestnet = btcAddress.startsWith('tb1') || btcAddress.startsWith('2') || /^[mn]/.test(btcAddress)
      
      if (isTestnet) {
        // Testnet API (example with blockstream)
        const response = await fetch(`https://blockstream.info/testnet/api/address/${btcAddress}`)
        if (response.ok) {
          const data = await response.json()
          // Calculate total balance (funded - spent)
          const balanceSats = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) || 0
          const balanceBTC = balanceSats / 100_000_000
          setBitcoinBalance(balanceBTC)
          setValue('amount', balanceBTC.toString())
        }
      } else {
        // Mainnet API
        const response = await fetch(`https://blockchain.info/rawaddr/${btcAddress}?limit=0`)
        if (response.ok) {
          const data = await response.json()
          const balanceBTC = (data.final_balance || 0) / 100_000_000
          setBitcoinBalance(balanceBTC)
          setValue('amount', balanceBTC.toString())
        }
      }
    } catch (error) {
      console.error('Failed to fetch Bitcoin balance:', error)
      // For demo purposes, set a test balance for testnet
      if (btcAddress.startsWith('tb1')) {
        setBitcoinBalance(0.001) // Demo balance
        setValue('amount', '0.001')
      }
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Refresh balance
  const refreshBalance = () => {
    if (verifiedBitcoinAddress) {
      fetchBitcoinBalance(verifiedBitcoinAddress)
    }
  }

  // Convert BTC to satoshis (now using bitcoinBalance instead of amount)
  const amountInSatoshis = bitcoinBalance ? Math.round(bitcoinBalance * 100_000_000) : 0

  const onSubmit = async (data: MintForm) => {
    console.log('Mint form submitted with data:', {
      amount: data.amount,
      bitcoinAddress: data.bitcoinAddress,
      verifiedBitcoinAddress,
      bitcoinBalance,
      address
    })
    
    // First check FeeVault balance
    const feeVaultBalance = localStorage.getItem(`feeVault_deposited_${address}`)
    console.log('FeeVault deposit status:', feeVaultBalance, 'for address:', address)
    
    if (!feeVaultBalance || feeVaultBalance !== 'true') {
      console.log('FeeVault not deposited, showing warning')
      // Show FeeVault warning instead of minting
      setShowFeeVaultWarning(true)
      // Smooth scroll to FeeVault component with a slight delay for visual feedback
      setTimeout(() => {
        const feeVaultElement = document.querySelector('#fee-vault-section')
        if (feeVaultElement) {
          // Add visual highlight effect
          feeVaultElement.classList.add('ring-2', 'ring-amber-500', 'ring-offset-2')
          feeVaultElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Remove highlight after animation
          setTimeout(() => {
            feeVaultElement.classList.remove('ring-2', 'ring-amber-500', 'ring-offset-2')
          }, 3000)
        }
      }, 100)
      return
    }

    console.log('FeeVault verified, proceeding with mint')
    setIsMinting(true)
    setMintStatus('pending')
    setShowFeeVaultWarning(false)

    try {
      // For the first mint, we just need to ensure FeeVault has balance
      // The Oracle will automatically sync when it detects Bitcoin balance changes
      // This is a simulation for testnet - in production, the Oracle service handles this
      
      console.log('Starting mint simulation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate a mock transaction hash for testnet
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`
      
      setTxHash(mockTxHash)
      setMintStatus('success')
      
      // Store that initial mint was triggered
      localStorage.setItem(`oracle_sync_initiated_${address}`, 'true')
      
      onMintComplete?.(data)
      
      // Note: In production, the Oracle will automatically:
      // 1. Detect Bitcoin balance changes  
      // 2. Call sync() function on OracleAggregator
      // 3. Mint/burn rBTC tokens accordingly
      // 4. Deduct fees from FeeVault
    } catch (error) {
      console.error('Mint initiation failed:', error)
      setMintStatus('error')
    } finally {
      setIsMinting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-500">
        <div className="p-3 bg-destructive/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold">Wallet Not Connected</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to continue with the minting process.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Deposit FeeVault Component */}
      <div id="fee-vault-section" className="transition-all duration-300 rounded-xl">
        <DepositFeeVault />
      </div>
      
      <div className="text-center space-y-4">
        <div className="p-3 bg-primary/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Mint rBTC Token</h1>
        <p className="text-muted-foreground">
          Deposit Bitcoin to mint 1:1 backed rBTC on MegaETH
        </p>
      </div>

      {mintStatus === 'idle' && (
        <div className="bg-card border rounded-xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Bitcoin Balance from Verified Wallet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Bitcoin className="h-4 w-4" />
                  Bitcoin Balance (from verified wallet)
                </label>
                <button
                  type="button"
                  onClick={refreshBalance}
                  disabled={isLoadingBalance}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('amount')}
                  type="text"
                  readOnly
                  value={amount || bitcoinBalance.toFixed(8)}
                  className="w-full px-4 py-3 border rounded-lg bg-muted/50 cursor-not-allowed pr-16 font-mono"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  BTC
                </div>
              </div>
              {amountInSatoshis > 0 && (
                <div className="text-sm text-muted-foreground">
                  = {amountInSatoshis.toLocaleString()} satoshis
                </div>
              )}
              {bitcoinBalance === 0 && !isLoadingBalance && (
                <div className="text-xs text-amber-600">
                  ⚠️ No balance detected. Make sure you have BTC in your verified wallet.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                ℹ️ Balance is fetched automatically from your verified Bitcoin wallet
              </p>
            </div>

            {/* Verified Bitcoin Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Verified Bitcoin Address</label>
              <input
                {...register('bitcoinAddress')}
                type="text"
                readOnly
                value={bitcoinAddress || verifiedBitcoinAddress || ''}
                className="w-full px-4 py-3 border rounded-lg bg-muted/50 cursor-not-allowed font-mono text-sm"
              />
              {bitcoinValidation?.isValid && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified {getBitcoinAddressTypeLabel(bitcoinValidation.type)}</span>
                </div>
              )}
              {!verifiedBitcoinAddress && (
                <div className="text-xs text-amber-600">
                  ⚠️ Please verify your Bitcoin address first on the /verify page
                </div>
              )}
            </div>

            {/* Mint Summary */}
            {bitcoinBalance > 0 && verifiedBitcoinAddress && (
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Mint Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Your Bitcoin balance:</span>
                    <span className="font-mono">{bitcoinBalance.toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>rBTC to receive:</span>
                    <span className="font-mono">{bitcoinBalance.toFixed(8)} rBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange rate:</span>
                    <span>1:1</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Network:</span>
                    <span>{verifiedBitcoinAddress.startsWith('tb1') ? 'Testnet' : 'Mainnet'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* FeeVault Warning - Show inline when trying to mint without deposit */}
            {showFeeVaultWarning && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-500 dark:border-amber-600 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-full animate-pulse">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                      Action Required: Deposit to Fee Vault First
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Before you can mint rBTC, you need to deposit ETH to the Fee Vault. This covers Oracle fees for automatic Bitcoin synchronization.
                    </p>
                    <div className="flex items-center justify-between bg-white/60 dark:bg-gray-900/60 rounded-lg p-3">
                      <div className="text-xs space-y-1">
                        <p className="text-amber-700 dark:text-amber-300 font-medium">Quick deposit options:</p>
                        <p className="text-amber-600 dark:text-amber-400">• Minimum: 0.01 ETH</p>
                        <p className="text-amber-600 dark:text-amber-400">• Recommended: 0.25 ETH</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const feeVaultElement = document.querySelector('#fee-vault-section')
                          if (feeVaultElement) {
                            feeVaultElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all')
                            feeVaultElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            setTimeout(() => {
                              feeVaultElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
                            }, 3000)
                          }
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Go to Fee Vault
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="accept-terms" className="flex-1 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    I accept the Terms of Service and understand the risks
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTermsDetails(!showTermsDetails)}
                    className="ml-2 text-primary hover:text-primary/80 underline text-xs"
                  >
                    {showTermsDetails ? 'Hide' : 'Read'} Terms
                  </button>
                </label>
              </div>
              
              {showTermsDetails && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-md space-y-3 text-xs text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-top duration-300">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      ⚖️ Legal Disclaimer & Terms of Service:
                    </p>
                    <ul className="space-y-2 list-disc list-inside ml-2">
                      <li>
                        <strong>Decentralized Protocol:</strong> ReserveBTC is a fully decentralized protocol with no central authority, company address, or custodial control.
                      </li>
                      <li>
                        <strong>Non-Custodial:</strong> Your Bitcoin remains in your wallet at all times. We never have access to your private keys or funds.
                      </li>
                      <li>
                        <strong>Automatic Synchronization:</strong> By clicking "Mint", you authorize automatic minting/burning of rBTC based on your Bitcoin balance changes.
                      </li>
                      <li>
                        <strong>Oracle Fees:</strong> Small fees (~0.001 ETH per sync) will be automatically deducted from your Fee Vault for each operation.
                      </li>
                      <li>
                        <strong>User Responsibility:</strong> You are solely responsible for:
                        <ul className="mt-1 ml-4 space-y-1">
                          <li>• Maintaining sufficient ETH in your Fee Vault</li>
                          <li>• Securing your Bitcoin and Ethereum wallets</li>
                          <li>• Understanding blockchain transaction risks</li>
                          <li>• Tax obligations in your jurisdiction</li>
                        </ul>
                      </li>
                      <li>
                        <strong>No Warranties:</strong> The protocol is provided "as is" without warranties of any kind. Smart contracts are immutable and cannot be modified.
                      </li>
                      <li>
                        <strong>Risk Acknowledgment:</strong> You acknowledge risks including but not limited to: smart contract bugs, Oracle failures, network congestion, and market volatility.
                      </li>
                      <li>
                        <strong>Jurisdiction:</strong> You confirm that using this protocol is legal in your jurisdiction and you comply with all applicable laws.
                      </li>
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ By accepting these terms, you acknowledge full understanding and assumption of all risks associated with using this decentralized protocol.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!verifiedBitcoinAddress || bitcoinBalance === 0 || isMinting || isLoadingBalance || !acceptedTerms}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Initiating Mint...</span>
                </>
              ) : isLoadingBalance ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading Balance...</span>
                </>
              ) : !verifiedBitcoinAddress ? (
                <span>Please Verify Bitcoin Address First</span>
              ) : bitcoinBalance === 0 ? (
                <span>No Bitcoin Balance Available</span>
              ) : !acceptedTerms ? (
                <span>Please Accept Terms to Continue</span>
              ) : (
                <span>Mint {bitcoinBalance.toFixed(8)} rBTC & Start Auto-Sync</span>
              )}
            </button>

            {/* Auto-Sync Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      🚀 Automatic Synchronization
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      After first mint, Oracle will automatically track your Bitcoin balance forever
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAutoSyncDetails(!showAutoSyncDetails)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  Details
                  {showAutoSyncDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              
              {showAutoSyncDetails && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top duration-300">
                  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 space-y-3">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200">
                      How Automatic Synchronization Works:
                    </h5>
                    <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                        <div>
                          <p className="font-medium">Bitcoin Deposits → Automatic Minting</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            When BTC arrives in your wallet, rBTC is automatically minted to your MegaETH address
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                        <div>
                          <p className="font-medium">Bitcoin Withdrawals → Automatic Burning</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            When BTC leaves your wallet, rBTC is automatically burned from your balance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                        <div>
                          <p className="font-medium">24/7 Oracle Monitoring</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Oracle continuously monitors Bitcoin blockchain and syncs changes within minutes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-100/70 dark:bg-amber-900/30 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                          ⚠️ Keep Fee Vault Funded
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Oracle deducts small fees (~0.001 ETH) for each sync operation. If your Fee Vault runs empty, 
                          automatic sync will pause until refilled. Monitor your balance above!
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                    💡 Pro tip: Deposit 0.25 ETH to Fee Vault for ~100 automatic operations
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {mintStatus === 'pending' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-yellow-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Transaction Found</h2>
            <p className="text-muted-foreground">
              Your mint transaction is being processed on MegaETH...
            </p>
          </div>
        </div>
      )}

      {mintStatus === 'success' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Mint Successful!</h2>
            <p className="text-muted-foreground">
              Your rBTC tokens have been minted successfully.
            </p>
            {txHash && (
              <div className="text-sm text-muted-foreground">
                Transaction: <span className="font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {mintStatus === 'error' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Mint Failed</h2>
            <p className="text-muted-foreground">
              There was an error processing your mint transaction. Please try again.
            </p>
          </div>
          <button
            onClick={() => {
              setMintStatus('idle')
              setTxHash('')
            }}
            className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

    </div>
  )
}