'use client'

import { CheckCircle, ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { StatisticsWidget } from '@/components/widgets/statistics-widget'

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          ReserveBTC
        </h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-xl md:text-2xl font-medium leading-relaxed">
            <span className="text-foreground">Mint 1:1 backed </span>
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent font-semibold">rBTC tokens</span>
            <span className="text-foreground"> on </span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">MegaETH</span>
            <span className="text-muted-foreground">.</span>
          </p>
          <p className="text-lg md:text-xl text-green-600 dark:text-green-400 font-semibold mt-3 flex items-center justify-center space-x-2">
            <span className="text-2xl">🛡️</span>
            <span>Your Bitcoin stays secure in your wallet</span>
          </p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Verify Bitcoin Wallet */}
        <div className="bg-card border rounded-xl p-8 space-y-6 animate-in slide-in-from-left duration-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Verify Bitcoin Wallet</h3>
              <p className="text-muted-foreground">Use BIP-322 Signatures</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Prove ownership of your Bitcoin address using cryptographic signatures.
          </p>

          <Link
            href="/verify"
            className="w-full inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
          >
            <span>Begin Verification</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mint rBTC Token */}
        <div className="bg-card border rounded-xl p-8 space-y-6 animate-in slide-in-from-right duration-700 animation-delay-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <ArrowRight className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Mint rBTC Token</h3>
              <p className="text-muted-foreground">Deposit Bitcoin to mint 1:1 backed rBTC</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Requires wallet connection and verification</span>
          </div>

          <Link
            href={isConnected ? "/mint" : "/verify"}
            className={`w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 ${
              isConnected 
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <span>Begin Mint</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Statistics Widget */}
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-700 animation-delay-600">
        <StatisticsWidget />
      </div>

      {/* Security Guarantee Section */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-8 text-center animate-in fade-in duration-700 animation-delay-800">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🛡️ Your Bitcoin Never Leaves Your Wallet
          </h3>
          <p className="text-lg text-muted-foreground mb-4">
            ReserveBTC uses advanced cryptographic proofs to ensure your Bitcoin remains completely secure while you access DeFi on MegaETH.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Non-custodial • Zero Trust • Cryptographically Secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}