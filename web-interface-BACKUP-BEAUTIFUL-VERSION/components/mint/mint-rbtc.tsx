'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react'
import { mintFormSchema, MintForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount } from 'wagmi'

interface MintRBTCProps {
  onMintComplete?: (data: MintForm) => void
}

export function MintRBTC({ onMintComplete }: MintRBTCProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const { address, isConnected } = useAccount()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<MintForm>({
    resolver: zodResolver(mintFormSchema),
    mode: 'onChange'
  })

  const amount = watch('amount')
  const bitcoinAddress = watch('bitcoinAddress')
  const bitcoinValidation = bitcoinAddress ? validateBitcoinAddress(bitcoinAddress) : null

  // Convert BTC to satoshis
  const amountInSatoshis = amount ? Math.round(parseFloat(amount) * 100_000_000) : 0

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
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (BTC)</label>
              <div className="relative">
                <input
                  {...register('amount')}
                  type="number"
                  step="0.00000001"
                  placeholder="0.00001"
                  className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors pr-16"
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
              {errors.amount && (
                <div className="flex items-center space-x-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.amount.message}</span>
                </div>
              )}
            </div>

            {/* Bitcoin Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bitcoin Deposit Address</label>
              <input
                {...register('bitcoinAddress')}
                type="text"
                placeholder="bc1p... or bc1q... or 1... or 3..."
                className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {bitcoinValidation?.isValid && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{getBitcoinAddressTypeLabel(bitcoinValidation.type)}</span>
                </div>
              )}
              {errors.bitcoinAddress && (
                <div className="flex items-center space-x-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.bitcoinAddress.message}</span>
                </div>
              )}
            </div>

            {/* Mint Summary */}
            {amount && isValid && (
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Mint Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount to deposit:</span>
                    <span className="font-mono">{amount} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>rBTC to receive:</span>
                    <span className="font-mono">{amount} rBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange rate:</span>
                    <span>1:1</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isMinting}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Initiating Mint...</span>
                </>
              ) : (
                <span>Begin Mint Process</span>
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