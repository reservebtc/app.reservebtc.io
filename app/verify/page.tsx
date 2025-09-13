import { BitcoinSignatureVerify } from '@/components/verification/bitcoin-signature-verify'
import { Metadata } from 'next'
import { Bitcoin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Verify Bitcoin Wallet | ReserveBTC - BIP-322 Signature Verification',
  description: 'Verify your Bitcoin wallet ownership using BIP-322 signatures to mint rBTC on MegaETH.',
}

export default function VerifyPage() {
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

      {/* Main verification component */}
      <div className="bg-card border rounded-xl p-8">
        <BitcoinSignatureVerify />
      </div>
    </div>
  )
}