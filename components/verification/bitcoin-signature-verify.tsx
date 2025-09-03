'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Copy, Check, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Verifier } from 'bip322-js'

interface BitcoinSignatureVerifyProps {
  onVerificationComplete?: (data: { address: string; signature: string; verified: boolean }) => void
}

interface WalletInstruction {
  id: string
  name: string
  icon: string
  recommended?: boolean
  steps: string[]
  testnet?: string[]
}

export function BitcoinSignatureVerify({ onVerificationComplete }: BitcoinSignatureVerifyProps) {
  const { address: ethAddress, isConnected: isMetaMaskConnected } = useAccount()
  const [bitcoinAddress, setBitcoinAddress] = useState('')
  const [signature, setSignature] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [activeWallet, setActiveWallet] = useState<string | null>(null)

  const message = ethAddress 
    ? `ReserveBTC Wallet Verification
Timestamp: ${Math.floor(Date.now() / 1000)}
MegaETH Address: ${ethAddress}
I confirm ownership of this Bitcoin address for use with ReserveBTC protocol.`
    : ''

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  const verifySignature = async () => {
    if (!bitcoinAddress || !signature || !message) {
      setVerificationResult({
        success: false,
        message: 'Please provide Bitcoin address and signature'
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const isValid = Verifier.verifySignature(bitcoinAddress, message, signature)
      
      setVerificationResult({
        success: isValid,
        message: isValid 
          ? 'Signature verified successfully!' 
          : 'Invalid signature. Please check your address and signature.'
      })

      if (isValid && onVerificationComplete) {
        onVerificationComplete({
          address: bitcoinAddress,
          signature: signature,
          verified: true
        })
      }
    } catch (error: any) {
      setVerificationResult({
        success: false,
        message: `Verification error: ${error.message || 'Invalid signature format'}`
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const walletInstructions: WalletInstruction[] = [
    {
      id: 'sparrow',
      name: 'Sparrow Wallet',
      icon: '🔧',
      recommended: true,
      steps: [
        'Open Sparrow Wallet',
        'Go to Tools → Sign/Verify Message (or press Ctrl+M)',
        'Enter your Bitcoin address',
        'Paste the message from above',
        'Click "Sign"',
        'Copy the signature and paste below'
      ],
      testnet: [
        'Open Sparrow → Tools → Restart in Testnet',
        'Sparrow will close and restart with separate testnet configuration',
        'Create a new wallet in testnet mode (File → New Wallet)',
        'After wallet is created, go to Addresses tab',
        'Copy any address from the list (right-click → Copy Address)',
        'Paste this address in Step 3 field on this page',
        'Go to Tools → Sign/Verify Message (or press Ctrl+M)',
        'In "Address" field: paste your testnet address again',
        'In "Message" field: paste the message you copied from Step 1',
        'Click "Sign Message" button',
        'Copy the signature from "Signature" field',
        'Paste this signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete verification'
      ]
    },
    {
      id: 'ledger',
      name: 'Ledger/Trezor',
      icon: '💎',
      steps: [
        'Connect hardware wallet to Sparrow or Electrum',
        'Open Tools → Sign/Verify Message',
        'Select address from your hardware wallet',
        'Sign message on device',
        'Copy the signature'
      ],
      testnet: [
        'In Sparrow: Enable testnet first (see Sparrow instructions)',
        'Connect your hardware wallet',
        'Hardware wallet will work with testnet automatically',
        'For Trezor: Enable testnet in Trezor Suite settings'
      ]
    },
    {
      id: 'electrum',
      name: 'Electrum',
      icon: '⚡',
      steps: [
        'Open Electrum wallet',
        'Go to Tools → Sign/Verify Message',
        'Enter address and paste message',
        'Click Sign',
        'Copy the signature'
      ],
      testnet: [
        'Run Electrum with --testnet flag',
        'Or download Electrum Testnet version',
        'Create new wallet for testnet',
        'Testnet addresses: tb1... or 2... or m/n...'
      ]
    },
    {
      id: 'bitcoincore',
      name: 'Bitcoin Core',
      icon: '₿',
      steps: [
        'Open Bitcoin Core',
        'Go to File → Sign Message',
        'Select your address',
        'Paste the message',
        'Sign and copy signature'
      ],
      testnet: [
        'Start Bitcoin Core with -testnet flag',
        'Or add testnet=1 to bitcoin.conf',
        'Restart Bitcoin Core',
        'Generate testnet address in Receive tab'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <span>🔐</span>
          <span>Bitcoin Address Verification</span>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Verify ownership of your Bitcoin address using BIP-322 signature
        </p>
      </div>

      {!isMetaMaskConnected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">MetaMask Required</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Please connect your MetaMask wallet first. The MegaETH address is needed for the verification message.
              </p>
            </div>
          </div>
        </div>
      )}

      {isMetaMaskConnected && (
        <>
          {/* Step 1: Message to Sign */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium">Step 1: Copy this message</label>
              <span className="text-xs text-muted-foreground">Sign in your Bitcoin wallet</span>
            </div>
            <div className="bg-muted/50 rounded p-3 font-mono text-sm whitespace-pre-wrap break-all">
              {message}
            </div>
            <button
              onClick={copyMessage}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {copiedMessage ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Wallet Instructions */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium">Step 2: Sign in your wallet</label>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span>Instructions</span>
                {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {showInstructions && (
              <div className="space-y-2">
                {walletInstructions.map((wallet) => (
                  <div key={wallet.id} className="border rounded-lg p-3">
                    <button
                      onClick={() => setActiveWallet(activeWallet === wallet.id ? null : wallet.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{wallet.icon}</span>
                        <span className="font-medium">{wallet.name}</span>
                        {wallet.recommended && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Recommended</span>
                        )}
                      </div>
                      {activeWallet === wallet.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {activeWallet === wallet.id && (
                      <div className="mt-3 ml-7 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-primary mb-1">Mainnet Instructions:</p>
                          <ol className="space-y-1 text-sm text-muted-foreground">
                            {wallet.steps.map((step, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary font-medium">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        {wallet.testnet && (
                          <div className="border-t pt-3">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                              🧪 Testnet Mode:
                            </p>
                            <ol className="space-y-1 text-sm text-muted-foreground">
                              {wallet.testnet.map((step, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Any wallet supporting BIP-322 or message signing will work. 
                Hardware wallets (Ledger, Trezor) provide the best security.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                <strong>Testing:</strong> Use testnet mode (see instructions above) to test without real Bitcoin.
              </p>
            </div>
          </div>

          {/* Step 3: Enter Bitcoin Address */}
          <div className="border rounded-lg p-4 space-y-3">
            <label className="font-medium">Step 3: Enter your Bitcoin address</label>
            <input
              type="text"
              placeholder="bc1q... or 3... or 1..."
              value={bitcoinAddress}
              onChange={(e) => setBitcoinAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background dark:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700"
            />
          </div>

          {/* Step 4: Enter Signature */}
          <div className="border rounded-lg p-4 space-y-3">
            <label className="font-medium">Step 4: Paste your BIP-322 signature</label>
            <textarea
              placeholder="Paste the signature from your wallet here..."
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg bg-background dark:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700 font-mono text-sm"
            />
          </div>

          {/* Verify Button */}
          <button
            onClick={verifySignature}
            disabled={!bitcoinAddress || !signature || isVerifying}
            className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Verify Ownership</span>
              </>
            )}
          </button>

          {/* Verification Result */}
          {verificationResult && (
            <div className={`rounded-lg p-4 ${
              verificationResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3">
                {verificationResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    verificationResult.success
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {verificationResult.message}
                  </p>
                  {verificationResult.success && bitcoinAddress && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Address: {bitcoinAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}