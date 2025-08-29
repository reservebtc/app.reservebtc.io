'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { walletVerificationSchema, WalletVerificationForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount } from 'wagmi'

interface WalletVerificationProps {
  onVerificationComplete?: (data: WalletVerificationForm) => void
}

export function WalletVerification({ onVerificationComplete }: WalletVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { address } = useAccount()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<WalletVerificationForm>({
    resolver: zodResolver(walletVerificationSchema),
    mode: 'onChange',
    defaultValues: {
      ethereumAddress: address || '',
    }
  })

  const bitcoinAddress = watch('bitcoinAddress')
  const bitcoinValidation = bitcoinAddress ? validateBitcoinAddress(bitcoinAddress) : null

  const onSubmit = async (data: WalletVerificationForm) => {
    setIsVerifying(true)
    setVerificationStatus('idle')

    try {
      // Simulate BIP-322 verification process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would call your backend API to verify the BIP-322 signature
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setVerificationStatus('success')
        onVerificationComplete?.(data)
      } else {
        setVerificationStatus('error')
      }
    } catch (error) {
      setVerificationStatus('error')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="p-3 bg-primary/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Verify Bitcoin Wallet</h1>
        <p className="text-muted-foreground">
          Use BIP-322 signatures to prove ownership of your Bitcoin address
        </p>
      </div>

      <div className="bg-card border rounded-xl p-8 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bitcoin Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bitcoin Address</label>
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

          {/* Ethereum Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ethereum Address (MegaETH)</label>
            <input
              {...register('ethereumAddress')}
              type="text"
              placeholder="0x..."
              className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              readOnly={!!address}
            />
            {errors.ethereumAddress && (
              <div className="flex items-center space-x-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2 duration-200">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.ethereumAddress.message}</span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message to Sign</label>
            <textarea
              {...register('message')}
              placeholder="Enter the message you want to sign..."
              className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors h-24 resize-none"
            />
            {errors.message && (
              <div className="flex items-center space-x-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2 duration-200">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.message.message}</span>
              </div>
            )}
          </div>

          {/* BIP-322 Signature */}
          <div className="space-y-2">
            <label className="text-sm font-medium">BIP-322 Signature</label>
            <textarea
              {...register('signature')}
              placeholder="Paste your BIP-322 signature here..."
              className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors h-32 resize-none font-mono text-sm"
            />
            {errors.signature && (
              <div className="flex items-center space-x-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2 duration-200">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.signature.message}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isVerifying}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying Signature...</span>
              </>
            ) : (
              <span>Verify Wallet Ownership</span>
            )}
          </button>

          {/* Status Messages */}
          {verificationStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle className="h-5 w-5" />
              <span>Wallet verification successful!</span>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-4 rounded-lg animate-in fade-in zoom-in-95 duration-300">
              <AlertCircle className="h-5 w-5" />
              <span>Verification failed. Please check your signature and try again.</span>
            </div>
          )}
        </form>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">How to create a BIP-322 signature:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Use a wallet that supports BIP-322 signatures (like Sparrow Wallet)</li>
          <li>Enter your message in the field above</li>
          <li>Sign the message with your Bitcoin private key</li>
          <li>Copy the generated signature and paste it above</li>
        </ol>
      </div>
    </div>
  )
}