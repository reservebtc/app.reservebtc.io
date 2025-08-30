import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Key, Shield, Code, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'BIP-322 Signatures | ReserveBTC Documentation',
  description: 'Learn about BIP-322 message signing standard used by ReserveBTC for Bitcoin address ownership verification.',
  keywords: 'BIP-322, Bitcoin message signing, address verification, ReserveBTC, Bitcoin signatures',
}

export default function BIP322Page() {
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
          <h1 className="text-3xl font-bold mb-4">BIP-322 Message Signatures</h1>
          <p className="text-lg text-muted-foreground">
            Bitcoin Improvement Proposal 322 (BIP-322) provides a standardized way to create 
            message signatures for any Bitcoin address type, enabling secure ownership verification 
            without revealing private keys.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">What is BIP-322?</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              BIP-322 is a Bitcoin Improvement Proposal that defines a standard for signing arbitrary 
              messages for any Bitcoin script. Unlike older message signing methods that only worked 
              with Legacy addresses, BIP-322 supports all address types including SegWit and Taproot.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Key Benefits:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Works with all Bitcoin address types (Legacy, SegWit, Taproot)</li>
                <li>✅ Provides cryptographic proof of address ownership</li>
                <li>✅ No private key exposure or Bitcoin transfer required</li>
                <li>✅ Industry-standard approach endorsed by the Bitcoin community</li>
                <li>✅ Future-proof design compatible with new Bitcoin features</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Key className="h-6 w-6 mr-2" />
            How BIP-322 Works
          </h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Code className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold">1. Message Creation</h3>
                <p className="text-sm text-muted-foreground">
                  A standardized message is created containing the text to be signed and address information
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Key className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold">2. Signature Generation</h3>
                <p className="text-sm text-muted-foreground">
                  The wallet creates a cryptographic signature using the private key associated with the address
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold">3. Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Anyone can verify the signature mathematically proves ownership of the Bitcoin address
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Technical Process:</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <p>Wallet constructs a virtual Bitcoin transaction that would spend from the address</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <p>The message is embedded in this virtual transaction using OP_RETURN</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <p>Wallet signs this virtual transaction with the appropriate signature method</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    4
                  </div>
                  <p>The signature can be verified by anyone using standard Bitcoin script validation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Type Support */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Supported Bitcoin Address Types</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">Legacy (P2PKH)</h3>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <p className="mb-2">Addresses starting with <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">1</code></p>
                  <p>✅ Full BIP-322 support</p>
                  <p>✅ Compatible with all wallets</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">SegWit (P2SH-P2WPKH)</h3>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="mb-2">Addresses starting with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">3</code></p>
                  <p>✅ Full BIP-322 support</p>
                  <p>✅ Lower transaction fees</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">Native SegWit (P2WPKH)</h3>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="mb-2">Addresses starting with <code className="bg-green-100 dark:bg-green-900 px-1 rounded">bc1</code></p>
                  <p>✅ Full BIP-322 support</p>
                  <p>✅ Lowest transaction fees</p>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Taproot (P2TR)</h3>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  <p className="mb-2">Addresses starting with <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">bc1p</code></p>
                  <p>✅ Full BIP-322 support</p>
                  <p>✅ Enhanced privacy features</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Compatibility */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Wallet Compatibility</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Full Support
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Sparrow Wallet</li>
                <li>• Electrum (latest)</li>
                <li>• Bitcoin Core</li>
                <li>• BlueWallet</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-yellow-800 dark:text-yellow-200 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Partial Support
              </h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Wasabi Wallet</li>
                <li>• Samourai Wallet</li>
                <li>• Some hardware wallets</li>
                <li>• Older wallet versions</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-red-800 dark:text-red-200">Not Supported</h3>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Very old wallets</li>
                <li>• Some web wallets</li>
                <li>• Custodial services</li>
                <li>• Exchange wallets</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">💡 Pro Tip</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              If your wallet doesn't support BIP-322 yet, consider using Sparrow Wallet or Electrum 
              for ReserveBTC verification. You can import your private key or seed phrase temporarily 
              for signing, then remove it afterward.
            </p>
          </div>
        </div>

        {/* Security Considerations */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Security Considerations
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">✅ Safe Practices</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Never share your private keys</li>
                <li>• Only sign messages you understand</li>
                <li>• Use wallets from trusted sources</li>
                <li>• Verify signature contents before signing</li>
                <li>• Keep wallet software updated</li>
                <li>• Use hardware wallets when possible</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-red-600">❌ Avoid These</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Signing unknown or suspicious messages</li>
                <li>• Using custodial wallets for signing</li>
                <li>• Sharing signatures publicly</li>
                <li>• Using unverified wallet software</li>
                <li>• Signing with paper wallet tools online</li>
                <li>• Reusing signatures across platforms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Implementation in ReserveBTC */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">BIP-322 in ReserveBTC</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ReserveBTC uses BIP-322 signatures as cryptographic proof of Bitcoin address ownership, 
              enabling users to mint synthetic tokens without transferring their Bitcoin to smart contracts.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Message Format</h3>
                <div className="bg-muted rounded text-xs p-2 font-mono">
                  ReserveBTC Verification<br/>
                  Address: [your-btc-address]<br/>
                  EVM: [your-evm-address]<br/>
                  Timestamp: [unix-timestamp]
                </div>
              </div>
              <div className="bg-card/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Verification Process</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Generate verification message</li>
                  <li>2. Sign with Bitcoin wallet</li>
                  <li>3. Submit signature to Oracle</li>
                  <li>4. Oracle verifies and updates tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">📚 Learn More</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">BIP-322 Specification <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><Link href="/docs/wallet-setup" className="text-primary hover:underline">Wallet Setup Guide</Link></li>
                <li><Link href="/docs/verification" className="text-primary hover:underline">Verification Process</Link></li>
                <li><Link href="/docs/troubleshooting" className="text-primary hover:underline">Troubleshooting BIP-322</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔧 Tools</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://sparrowwallet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Sparrow Wallet <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://electrum.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Electrum Wallet <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://bitcoin.org/en/wallets" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Bitcoin Wallets <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><Link href="/docs/api" className="text-primary hover:underline">API Documentation</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/verification" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Verification Guide
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