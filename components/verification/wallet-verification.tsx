'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, AlertCircle, Loader2, Copy, RefreshCw } from 'lucide-react'
import { walletVerificationSchema, WalletVerificationForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount } from 'wagmi'

interface WalletVerificationProps {
  onVerificationComplete?: (data: WalletVerificationForm) => void
}

export function WalletVerification({ onVerificationComplete }: WalletVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [messageCopied, setMessageCopied] = useState(false)
  const { address } = useAccount()

  // Generate a standardized message with timestamp for uniqueness
  const generateVerificationMessage = (ethAddress?: string) => {
    const timestamp = Math.floor(Date.now() / 1000)
    if (!ethAddress) {
      return `ReserveBTC Wallet Verification\nTimestamp: ${timestamp}\n[Connect wallet to include MegaETH address]\nI confirm ownership of this Bitcoin address for use with ReserveBTC protocol.`
    }
    return `ReserveBTC Wallet Verification\nTimestamp: ${timestamp}\nMegaETH Address: ${ethAddress}\nI confirm ownership of this Bitcoin address for use with ReserveBTC protocol.`
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<WalletVerificationForm>({
    resolver: zodResolver(walletVerificationSchema),
    mode: 'onChange',
    defaultValues: {
      ethereumAddress: address || '',
      message: generateVerificationMessage(address),
    }
  })

  const bitcoinAddress = watch('bitcoinAddress')
  const message = watch('message')
  const bitcoinValidation = bitcoinAddress ? validateBitcoinAddress(bitcoinAddress) : null

  // Update message and ethereum address when wallet connects/disconnects
  useEffect(() => {
    if (address) {
      setValue('ethereumAddress', address)
      setValue('message', generateVerificationMessage(address))
    }
  }, [address, setValue])

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setMessageCopied(true)
      setTimeout(() => setMessageCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

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

      {/* Wallet Connection Warning */}
      {!address && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Wallet Connection Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please connect your MetaMask or Web3 wallet to continue. Your MegaETH address will be automatically included in the verification message.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Ethereum Address (MegaETH)</span>
              {address && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Connected</span>
                </span>
              )}
            </label>
            <div className="relative">
              <input
                {...register('ethereumAddress')}
                type="text"
                placeholder={address ? address : "Connect wallet to auto-fill"}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  address 
                    ? 'bg-muted/50 border-green-500/30 text-foreground' 
                    : 'bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary'
                }`}
                readOnly
              />
              {!address && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <span className="text-xs text-muted-foreground">Wallet not connected</span>
                </div>
              )}
            </div>
            {errors.ethereumAddress && (
              <div className="flex items-center space-x-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2 duration-200">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.ethereumAddress.message}</span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Message to Sign</label>
              <button
                type="button"
                onClick={copyMessage}
                className="flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {messageCopied ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <textarea
                {...register('message')}
                className="w-full px-4 py-3 border rounded-lg bg-muted/50 text-muted-foreground transition-colors h-24 resize-none font-mono text-xs"
                readOnly
              />
              <div className="absolute top-2 right-2">
                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded">
                  Auto-generated
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This message is automatically generated and includes a timestamp for security. Copy it to sign in your Bitcoin wallet.
            </p>
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
            disabled={!isValid || isVerifying || !address}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying Signature...</span>
              </>
            ) : !address ? (
              <span>Connect Wallet to Continue</span>
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

      {/* Detailed Instructions */}
      <div className="space-y-6">
        {/* Supported Wallets */}
        <div className="bg-muted/50 border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Supported Bitcoin Wallets</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Desktop Wallets</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sparrow Wallet (Recommended)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Electrum</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Bitcoin Core</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Wasabi Wallet</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Hardware Wallets</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ledger (via Sparrow)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Trezor (via Sparrow)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>ColdCard (via Sparrow)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>BitBox (Limited)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-card border rounded-xl p-6 space-y-6">
          <h3 className="font-semibold">Step-by-Step Instructions</h3>
          
          <div className="space-y-6">
            {/* Sparrow Wallet Instructions */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-600 flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                <span>Using Sparrow Wallet (Recommended)</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-8">
                <li>Open Sparrow Wallet and load your wallet</li>
                <li>Click "Copy Message" button above to copy the auto-generated message</li>
                <li>Go to <code className="bg-muted px-2 py-1 rounded text-xs">Tools → Sign/Verify Message</code></li>
                <li>Enter your Bitcoin address in the "Address" field</li>
                <li>Paste the copied message in the "Message" field</li>
                <li>Click "Sign Message" to generate BIP-322 signature</li>
                <li>Copy the signature and paste it in the "BIP-322 Signature" field above</li>
              </ol>
            </div>

            {/* Electrum Instructions */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-600 flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                <span>Using Electrum</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-8">
                <li>Open Electrum and load your wallet</li>
                <li>Click "Copy Message" button above to copy the auto-generated message</li>
                <li>Go to <code className="bg-muted px-2 py-1 rounded text-xs">Tools → Sign/Verify Message</code></li>
                <li>Select your address from the dropdown</li>
                <li>Paste the copied message in the "Message" field</li>
                <li>Click "Sign" to create the signature</li>
                <li>Copy the signature and paste it in the "BIP-322 Signature" field above</li>
              </ol>
            </div>

            {/* Hardware Wallet Instructions */}
            <div className="space-y-3">
              <h4 className="font-medium text-purple-600 flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                <span>Using Hardware Wallets</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-8">
                <li>Connect your hardware wallet to Sparrow Wallet</li>
                <li>Click "Copy Message" button above to copy the auto-generated message</li>
                <li>Ensure your device is unlocked and Bitcoin app is open</li>
                <li>Follow the Sparrow Wallet instructions above</li>
                <li>Confirm the signature on your hardware device</li>
                <li>Copy the generated BIP-322 signature and paste it above</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-green-600 dark:text-green-400 flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5" />
            <span>Security Notice</span>
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Your Bitcoin private keys never leave your wallet during this process</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>BIP-322 signatures are cryptographic proofs of ownership that cannot be forged</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>No funds are moved or at risk during the verification process</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}