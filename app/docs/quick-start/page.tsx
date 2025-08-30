import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Wallet, Signature, Coins, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Quick Start Guide | ReserveBTC Documentation',
  description: 'Get started with ReserveBTC in minutes. Connect your wallet, verify Bitcoin ownership, and mint your first synthetic Bitcoin tokens.',
  keywords: 'ReserveBTC quick start, Bitcoin DeFi tutorial, BIP-322 signature, synthetic Bitcoin tokens',
}

export default function QuickStartPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Quick Start Guide</h1>
          <p className="text-lg text-muted-foreground">
            Get started with ReserveBTC in just a few minutes. This guide will walk you through 
            connecting your wallet, verifying your Bitcoin, and minting your first synthetic tokens.
          </p>
        </div>

        {/* Prerequisites */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Before You Start
          </h2>
          <div className="space-y-3 text-blue-700 dark:text-blue-300">
            <p>✅ An EVM-compatible wallet (MetaMask, WalletConnect, etc.)</p>
            <p>✅ A Bitcoin wallet with some BTC balance</p>
            <p>✅ Small amount of ETH on MegaETH for gas fees</p>
            <p>✅ Ability to sign messages with your Bitcoin wallet</p>
          </div>
        </div>

        {/* Step 1: Connect Wallet */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
              1
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Connect Your EVM Wallet
              </h3>
              <p className="text-muted-foreground">
                Start by connecting your Ethereum-compatible wallet to the ReserveBTC application.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Visit <Link href="/" className="text-primary hover:underline">app.reservebtc.io</Link></li>
                  <li>Click "Connect Wallet" in the top right</li>
                  <li>Choose your wallet (MetaMask, WalletConnect, etc.)</li>
                  <li>Approve the connection in your wallet</li>
                  <li>Add MegaETH Testnet if prompted</li>
                </ol>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">MegaETH Network Details</h4>
                <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <p><strong>Network Name:</strong> MegaETH Testnet</p>
                  <p><strong>RPC URL:</strong> https://carrot.megaeth.com/rpc</p>
                  <p><strong>Chain ID:</strong> 6342</p>
                  <p><strong>Currency:</strong> ETH</p>
                  <p><strong>Block Explorer:</strong> https://megaexplorer.xyz</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Verify Bitcoin Address */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
              2
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Signature className="h-5 w-5 mr-2" />
                Verify Your Bitcoin Address
              </h3>
              <p className="text-muted-foreground">
                Prove ownership of your Bitcoin address using BIP-322 signature verification.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Navigate to the "Verification" section</li>
                  <li>Enter your Bitcoin address</li>
                  <li>Click "Generate Verification Message"</li>
                  <li>Sign the message with your Bitcoin wallet</li>
                  <li>Paste the signature back into the form</li>
                  <li>Click "Verify Ownership"</li>
                </ol>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">✅ Supported Wallets</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Bitcoin Core</li>
                    <li>• Electrum</li>
                    <li>• Sparrow Wallet</li>
                    <li>• BlueWallet</li>
                    <li>• Any BIP-322 compatible wallet</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">📍 Address Types</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Legacy (P2PKH)</li>
                    <li>• SegWit (P2SH-P2WPKH)</li>
                    <li>• Native SegWit (P2WPKH)</li>
                    <li>• Taproot (P2TR)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Mint Tokens */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
              3
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Coins className="h-5 w-5 mr-2" />
                Mint Your Synthetic Tokens
              </h3>
              <p className="text-muted-foreground">
                Once verified, you can mint synthetic tokens backed by your Bitcoin holdings.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to the "Mint" section</li>
                  <li>Choose your token type (rBTC-SYNTH or wrBTC)</li>
                  <li>Review your Bitcoin balance</li>
                  <li>Click "Mint Tokens"</li>
                  <li>Confirm the transaction in your wallet</li>
                  <li>Wait for confirmation (~30 seconds)</li>
                </ol>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">rBTC-SYNTH (Soulbound)</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>✓ Perfect 1:1 Bitcoin backing</li>
                    <li>✓ Automatic balance synchronization</li>
                    <li>✓ Non-transferable (soulbound)</li>
                    <li>✓ Lower gas costs</li>
                    <li>✓ Best for personal DeFi use</li>
                  </ul>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">wrBTC (Transferable)</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>✓ Standard ERC-20 token</li>
                    <li>✓ Fully transferable</li>
                    <li>✓ DeFi protocol compatible</li>
                    <li>✓ Trading and lending enabled</li>
                    <li>✓ Best for advanced DeFi strategies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Success! You're Ready to Go
          </h2>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Congratulations! You've successfully minted your first ReserveBTC synthetic tokens. 
            Your tokens will automatically stay synchronized with your Bitcoin balance.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <h4 className="font-semibold mb-1">✅ View Tokens</h4>
              <p className="text-green-600 dark:text-green-400">Check your wallet to see your new tokens</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <h4 className="font-semibold mb-1">✅ Auto-Sync</h4>
              <p className="text-green-600 dark:text-green-400">Tokens update automatically every 5 minutes</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <h4 className="font-semibold mb-1">✅ DeFi Ready</h4>
              <p className="text-green-600 dark:text-green-400">Use in MegaETH DeFi protocols</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">📚 Learn More</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs/how-it-works" className="text-primary hover:underline">• How ReserveBTC Works</Link></li>
                <li><Link href="/docs/bip322" className="text-primary hover:underline">• Understanding BIP-322</Link></li>
                <li><Link href="/docs/security" className="text-primary hover:underline">• Security Model</Link></li>
                <li><Link href="/docs/troubleshooting" className="text-primary hover:underline">• Troubleshooting Guide</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔗 Useful Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/oracle" className="text-primary hover:underline">• Oracle Dashboard</Link></li>
                <li><a href="https://megaexplorer.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">• MegaETH Explorer <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://github.com/reservebtc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">• GitHub Repository <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><Link href="/docs/api" className="text-primary hover:underline">• API Documentation</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/wallet-setup" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Detailed Wallet Setup
          </Link>
          <Link 
            href="/docs/first-mint" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            First Mint Tutorial
          </Link>
        </div>
      </div>
    </div>
  )
}