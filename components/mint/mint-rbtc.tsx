'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, AlertCircle, Loader2, CheckCircle, Info, Bitcoin, RefreshCw } from 'lucide-react'
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
          setValue('amount', balanceBTC.toFixed(8))
        }
      } else {
        // Mainnet API
        const response = await fetch(`https://blockchain.info/rawaddr/${btcAddress}?limit=0`)
        if (response.ok) {
          const data = await response.json()
          const balanceBTC = (data.final_balance || 0) / 100_000_000
          setBitcoinBalance(balanceBTC)
          setValue('amount', balanceBTC.toFixed(8))
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
    setIsMinting(true)
    setMintStatus('pending')

    try {
      // Simulate transaction submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would call your smart contract to mint rBTC
      const response = await fetch('/api/mint-rbtc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ethereumAddress: address,
          amountSatoshis: amountInSatoshis,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTxHash(result.txHash)
        setMintStatus('success')
        onMintComplete?.(data)
      } else {
        setMintStatus('error')
      }
    } catch (error) {
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
      <DepositFeeVault />
      
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
                  className="w-full px-4 py-3 border rounded-lg bg-muted/50 cursor-not-allowed pr-16 font-mono"
                  value={isLoadingBalance ? 'Loading...' : `${bitcoinBalance.toFixed(8)}`}
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
                value={verifiedBitcoinAddress || 'No verified address'}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!verifiedBitcoinAddress || bitcoinBalance === 0 || isMinting || isLoadingBalance}
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
              ) : (
                <span>Mint {bitcoinBalance.toFixed(8)} rBTC</span>
              )}
            </button>
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

      {/* Important Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Important: Bitcoin stays in your wallet
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ReserveBTC uses advanced cryptographic proofs to verify your Bitcoin ownership. 
              Your Bitcoin remains secure in your wallet while you receive 1:1 backed rBTC tokens on MegaETH.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}