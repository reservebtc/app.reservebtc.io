import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Bitcoin, Coins, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Introduction to ReserveBTC | Documentation',
  description: 'Learn about ReserveBTC - the first Bitcoin-backed synthetic asset protocol built on MegaETH with BIP-322 signature verification.',
  keywords: 'ReserveBTC introduction, Bitcoin DeFi, synthetic assets, BIP-322, MegaETH, Bitcoin backed tokens',
}

export default function IntroductionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Introduction to ReserveBTC</h1>
          <p className="text-lg text-muted-foreground">
            ReserveBTC is a revolutionary protocol that brings Bitcoin-backed synthetic assets to the MegaETH ecosystem, 
            enabling true Bitcoin DeFi without compromising security or decentralization.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">What is ReserveBTC?</h2>
          <p className="text-muted-foreground mb-4">
            ReserveBTC is the first Bitcoin-backed synthetic asset protocol built on MegaETH that uses an innovative 
            Oracle-based architecture. Users prove Bitcoin ownership through BIP-322 signatures, and an automated 
            Oracle server monitors their Bitcoin addresses to mint/burn tokens automatically when balance changes occur.
          </p>
          <p className="text-muted-foreground">
            This approach maintains complete Bitcoin self-custody while enabling DeFi functionality through 
            rBTC-SYNTH (soulbound) and wrBTC (transferable) tokens on the ultra-fast MegaETH network.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Bitcoin className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Bitcoin-Backed</h3>
            </div>
            <p className="text-muted-foreground">
              Every token is 1:1 backed by real Bitcoin holdings, automatically synchronized by Oracle 
              monitoring without requiring custody transfer.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Self-Custody</h3>
            </div>
            <p className="text-muted-foreground">
              Users maintain full control of their Bitcoin while the Oracle automatically manages 
              token supply based on Bitcoin address balances. No bridging required.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">MegaETH Powered</h3>
            </div>
            <p className="text-muted-foreground">
              Built on MegaETH for ultra-fast transactions, low fees, and seamless DeFi integration 
              with institutional-grade performance.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Coins className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Two Token Types</h3>
            </div>
            <p className="text-muted-foreground">
              rBTC-SYNTH (soulbound) and wrBTC (transferable) tokens provide flexibility 
              for different use cases and risk profiles.
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Key Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🔐 BIP-322 Signature Verification</h3>
              <p className="text-muted-foreground">
                Uses the Bitcoin Improvement Proposal 322 standard for cryptographic proof of Bitcoin ownership, 
                eliminating the need for custody transfer.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Oracle-Based Architecture</h3>
              <p className="text-muted-foreground">
                Automated Oracle server monitors Bitcoin addresses and synchronizes token balances 
                without requiring user interaction for minting/burning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🛡️ Security First</h3>
              <p className="text-muted-foreground">
                Comprehensive testing with 206 security tests passing, E2E validation, 
                and Oracle resilience testing for production readiness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🌐 Cross-Compatible</h3>
              <p className="text-muted-foreground">
                Works with all major Bitcoin wallets and supports both SegWit and Legacy address formats.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Connect Wallet</p>
                <p className="text-muted-foreground text-sm">Connect your EVM wallet to access the ReserveBTC protocol</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Prove Bitcoin Ownership</p>
                <p className="text-muted-foreground text-sm">Sign a message with your Bitcoin wallet using BIP-322</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Oracle Monitoring</p>
                <p className="text-muted-foreground text-sm">Oracle server monitors your Bitcoin address and detects balance changes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Automatic Token Management</p>
                <p className="text-muted-foreground text-sm">Tokens are automatically minted/burned based on your Bitcoin balance changes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/how-it-works" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Learn How It Works
          </Link>
          <Link 
            href="/docs/quick-start" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Quick Start Guide
          </Link>
        </div>
      </div>
    </div>
  )
}