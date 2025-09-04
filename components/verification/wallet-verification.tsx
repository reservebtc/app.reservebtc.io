'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Shield, Bitcoin, Wallet2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { BitcoinSignatureVerify } from './bitcoin-signature-verify'

interface WalletVerificationProps {
  onVerificationComplete?: (data: any) => void
}

export function WalletVerification({ onVerificationComplete }: WalletVerificationProps) {
  const { address, isConnected } = useAccount()
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [verifiedData, setVerifiedData] = useState<{ address: string; signature: string } | null>(null)

  const handleBitcoinVerification = (data: { address: string; signature: string; verified: boolean }) => {
    if (data.verified) {
      setVerificationComplete(true)
      setVerifiedData({ address: data.address, signature: data.signature })
      onVerificationComplete?.(data)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Bitcoin className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 bg-clip-text text-transparent">
          Bitcoin Wallet Verification
        </h1>
        <p className="text-muted-foreground">
          Prove ownership of your Bitcoin address to mint rBTC on MegaETH
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-card border rounded-xl p-6">
        <div className="space-y-4">
          {/* MetaMask Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Wallet2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">MegaETH Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? address : 'Not connected'}
                </p>
              </div>
            </div>
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Connect Wallet</span>
              </div>
            )}
          </div>

          {/* Bitcoin Verification Status */}
          {verificationComplete && verifiedData && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bitcoin className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Bitcoin Address Verified</p>
                  <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                    {verifiedData.address.slice(0, 8)}...{verifiedData.address.slice(-6)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Verified</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Verification Component */}
      <div className="bg-card border rounded-xl p-8">
        <BitcoinSignatureVerify onVerificationComplete={handleBitcoinVerification} />
      </div>

      {/* Why BIP-322? */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span>Why BIP-322 Signatures?</span>
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">Universal Compatibility</p>
              <p>Works with any Bitcoin wallet that supports message signing - from hardware wallets to desktop applications</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">Maximum Security</p>
              <p>Your private keys never leave your wallet. Only a cryptographic signature is shared</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">Hardware Wallet Support</p>
              <p>Perfect for cold storage - works with Ledger, Trezor, and other hardware wallets via Sparrow or Electrum</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">No Dependencies</p>
              <p>No need to install specific browser extensions or rely on third-party services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Networks */}
      <div className="bg-muted/50 border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Supported Bitcoin Networks</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Bitcoin Mainnet</span>
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground ml-4">
              <li>• Legacy addresses (1...)</li>
              <li>• SegWit addresses (3...)</li>
              <li>• Native SegWit (bc1q...)</li>
              <li>• Taproot addresses (bc1p...)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Bitcoin Testnet</span>
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground ml-4">
              <li>• Testnet Legacy (m... or n...)</li>
              <li>• Testnet SegWit (2...)</li>
              <li>• Testnet Native SegWit (tb1q...)</li>
              <li>• Testnet Taproot (tb1p...)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center justify-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>Your funds are always safe. No transactions are made during verification.</span>
        </p>
        <p>ReserveBTC uses industry-standard BIP-322 signatures for secure, non-custodial verification.</p>
      </div>
    </div>
  )
}