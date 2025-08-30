import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Bitcoin, Key, RefreshCw, Coins, Shield, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How ReserveBTC Works | Documentation',
  description: 'Detailed explanation of ReserveBTC protocol mechanics, BIP-322 verification, Oracle system, and token minting process.',
  keywords: 'ReserveBTC mechanics, BIP-322 verification, Oracle system, token minting, Bitcoin DeFi protocol',
}

export default function HowItWorksPage() {
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
          <h1 className="text-3xl font-bold mb-4">How ReserveBTC Works</h1>
          <p className="text-lg text-muted-foreground">
            ReserveBTC enables Bitcoin holders to participate in DeFi without giving up custody of their Bitcoin. 
            Here's a comprehensive breakdown of how the protocol works.
          </p>
        </div>

        {/* Protocol Architecture */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Protocol Architecture</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <Bitcoin className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold">Bitcoin Layer</h3>
              <p className="text-sm text-muted-foreground">
                Users maintain full custody of their Bitcoin in their own wallets
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold">Oracle System</h3>
              <p className="text-sm text-muted-foreground">
                Verifies Bitcoin balances and synchronizes with smart contracts
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Coins className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold">MegaETH Layer</h3>
              <p className="text-sm text-muted-foreground">
                Smart contracts mint synthetic tokens representing Bitcoin holdings
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground mx-4 md:hidden" />
          </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Step-by-Step Process</h2>

          {/* Step 1 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                1
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">User Registration & Address Verification</h3>
                <p className="text-muted-foreground">
                  Users connect their EVM wallet (MetaMask, WalletConnect, etc.) to the ReserveBTC interface 
                  and provide their Bitcoin address for verification.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Supported Bitcoin Address Types:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Legacy (P2PKH): Starting with '1'</li>
                    <li>• SegWit (P2SH): Starting with '3'</li>
                    <li>• Native SegWit (P2WPKH): Starting with 'bc1'</li>
                    <li>• Taproot (P2TR): Starting with 'bc1p'</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                2
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">BIP-322 Signature Creation</h3>
                <p className="text-muted-foreground">
                  The user creates a BIP-322 signature to prove ownership of their Bitcoin address 
                  without revealing private keys or transferring Bitcoin.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      What is BIP-322?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Bitcoin Improvement Proposal 322 provides a standard way to create 
                      signatures that prove ownership of Bitcoin addresses for any address type.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Benefits
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      No private key exposure, no Bitcoin transfer required, 
                      cryptographically verifiable proof of ownership.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                3
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Oracle Monitoring System</h3>
                <p className="text-muted-foreground">
                  The Oracle server continuously monitors Bitcoin addresses via BlockCypher API 
                  and automatically detects balance changes to trigger token synchronization.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Oracle Server Features (oracle-server.js):</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">✓ BlockCypher API integration</p>
                      <p className="text-muted-foreground">✓ 5-minute monitoring intervals</p>
                      <p className="text-muted-foreground">✓ CLI management interface</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">✓ Automated sync() calls</p>
                      <p className="text-muted-foreground">✓ Delta detection & validation</p>
                      <p className="text-muted-foreground">✓ Fee management system</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                4
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Automatic Token Management</h3>
                <p className="text-muted-foreground">
                  The Oracle automatically calls the sync() function on smart contracts to mint/burn tokens 
                  based on detected Bitcoin balance changes, without requiring user interaction.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">rBTC-SYNTH (Soulbound)</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Non-transferable tokens</li>
                      <li>• Perfect 1:1 backing</li>
                      <li>• Automatic balance sync</li>
                      <li>• Lower gas costs</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">wrBTC (Transferable)</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Standard ERC-20 token</li>
                      <li>• Fully transferable</li>
                      <li>• DeFi compatible</li>
                      <li>• Trading enabled</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                5
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Continuous Synchronization</h3>
                <p className="text-muted-foreground">
                  The Oracle system continuously monitors Bitcoin balances and automatically updates 
                  token supplies to maintain perfect backing ratios.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Synchronization Process:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Oracle checks Bitcoin balances every 5 minutes</p>
                    <p>• Balance changes trigger automatic token adjustments</p>
                    <p>• Mint new tokens when Bitcoin balance increases</p>
                    <p>• Burn tokens when Bitcoin balance decreases</p>
                    <p>• All changes are transparent and verifiable on-chain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Guarantees */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Security Guarantees
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">No Custody Risk</p>
                  <p className="text-sm text-muted-foreground">Your Bitcoin never leaves your wallet</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Cryptographic Proof</p>
                  <p className="text-sm text-muted-foreground">BIP-322 signatures provide mathematical certainty</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Real-time Backing</p>
                  <p className="text-sm text-muted-foreground">Tokens always reflect actual Bitcoin holdings</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Smart Contract Audits</p>
                  <p className="text-sm text-muted-foreground">Independently verified and tested code</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Decentralized Oracle</p>
                  <p className="text-sm text-muted-foreground">No single point of failure in verification</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Open Source</p>
                  <p className="text-sm text-muted-foreground">Fully transparent and verifiable protocol</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/bip322" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Learn About BIP-322
          </Link>
          <Link 
            href="/docs/security" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Security Model
          </Link>
        </div>
      </div>
    </div>
  )
}