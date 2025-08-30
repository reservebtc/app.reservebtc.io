import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Wallet, Download, Settings, ExternalLink, CheckCircle, AlertCircle, Smartphone, Monitor } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Wallet Setup Guide | ReserveBTC Documentation',
  description: 'Complete guide to setting up Bitcoin and EVM wallets for use with ReserveBTC protocol, including MetaMask, hardware wallets, and BIP-322 support.',
  keywords: 'ReserveBTC wallet setup, MetaMask setup, Bitcoin wallet, BIP-322 wallet, hardware wallet setup',
}

export default function WalletSetupPage() {
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
          <h1 className="text-3xl font-bold mb-4">Wallet Setup Guide</h1>
          <p className="text-lg text-muted-foreground">
            ReserveBTC requires two types of wallets: an EVM wallet for interacting with MegaETH, 
            and a Bitcoin wallet that supports BIP-322 message signing.
          </p>
        </div>

        {/* Wallet Requirements */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Wallet Requirements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-blue-800 dark:text-blue-200 flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                EVM Wallet (Required)
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  For interacting with MegaETH network and managing synthetic tokens
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">MetaMask (Recommended)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">WalletConnect</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Coinbase Wallet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Rainbow Wallet</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-orange-800 dark:text-orange-200 flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Bitcoin Wallet (Required)
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  For holding Bitcoin and creating BIP-322 signatures
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Sparrow Wallet (Best)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Electrum (Latest)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Bitcoin Core</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">BlueWallet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MetaMask Setup */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">MetaMask Setup for MegaETH</h2>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Step 1: Install MetaMask
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium">Desktop</p>
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center"
                    >
                      Download Extension <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">Mobile</p>
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center"
                    >
                      Download App <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Step 2: Add MegaETH Testnet
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add the MegaETH Testnet to your MetaMask to interact with ReserveBTC contracts.
                </p>
                
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Network Configuration</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Name:</span>
                      <span>MegaETH Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RPC URL:</span>
                      <span>https://carrot.megaeth.com/rpc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chain ID:</span>
                      <span>6342</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency Symbol:</span>
                      <span>ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Block Explorer:</span>
                      <span>https://megaexplorer.xyz</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Manual Setup Instructions</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                    <li>Open MetaMask and click the network dropdown</li>
                    <li>Click "Add Network" or "Custom RPC"</li>
                    <li>Enter the network details above</li>
                    <li>Click "Save" to add the network</li>
                    <li>Switch to MegaETH Testnet</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bitcoin Wallet Setup */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Bitcoin Wallet Setup</h2>
          
          <div className="space-y-6">
            {/* Sparrow Wallet */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-green-800 dark:text-green-200">✅ Sparrow Wallet (Recommended)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Why Sparrow?</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Full BIP-322 support</li>
                    <li>• All address types supported</li>
                    <li>• Hardware wallet integration</li>
                    <li>• User-friendly interface</li>
                    <li>• Active development</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Setup Steps</h4>
                  <ol className="list-decimal list-inside text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>Download from official website</li>
                    <li>Create or import wallet</li>
                    <li>Verify address generation</li>
                    <li>Test message signing</li>
                    <li>Fund with small amount</li>
                  </ol>
                </div>
              </div>
              <div className="mt-4">
                <a 
                  href="https://sparrowwallet.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Sparrow Wallet</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Alternative Wallets */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Electrum Wallet</h3>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>✅ BIP-322 support (v4.5.0+)</p>
                  <p>✅ Lightweight and fast</p>
                  <p>✅ Cross-platform</p>
                  <p>⚠️ Complex UI for beginners</p>
                </div>
                <a 
                  href="https://electrum.org" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary hover:underline mt-2"
                >
                  <span>Download</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-200">BlueWallet</h3>
                <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                  <p>✅ Mobile-friendly</p>
                  <p>✅ Good UX design</p>
                  <p>✅ Lightning support</p>
                  <p>⚠️ Limited BIP-322 support</p>
                </div>
                <a 
                  href="https://bluewallet.io" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary hover:underline mt-2"
                >
                  <span>Download</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Wallet Setup */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Hardware Wallet Integration</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Ledger</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ Works with Sparrow</p>
                <p>✅ Secure signing</p>
                <p>⚠️ Requires Sparrow for BIP-322</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use Ledger with Sparrow Wallet for BIP-322 signing
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Trezor</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ Works with Electrum</p>
                <p>✅ Open source</p>
                <p>⚠️ BIP-322 via Electrum</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use Trezor with Electrum for BIP-322 signing
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">ColdCard</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ Air-gapped security</p>
                <p>✅ Advanced features</p>
                <p>⚠️ Complex setup</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                For advanced users with high security needs
              </p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">💡 Hardware Wallet Best Practices</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Always verify transaction details on device screen</li>
              <li>• Use official wallet software only</li>
              <li>• Keep firmware updated</li>
              <li>• Store recovery phrases securely offline</li>
              <li>• Test with small amounts first</li>
            </ul>
          </div>
        </div>

        {/* Step-by-Step Setup */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Complete Setup Process</h2>
          
          <div className="space-y-6">
            {/* EVM Wallet Setup */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">EVM Wallet Setup (MetaMask)</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Install MetaMask Extension</p>
                    <p className="text-sm text-muted-foreground">Download from Chrome Web Store or Firefox Add-ons</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Create or Import Wallet</p>
                    <p className="text-sm text-muted-foreground">Set up a new wallet or import existing seed phrase</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Add MegaETH Network</p>
                    <p className="text-sm text-muted-foreground">Configure network settings as shown above</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Get Test ETH</p>
                    <p className="text-sm text-muted-foreground">Request test ETH from MegaETH developers for gas fees</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bitcoin Wallet Setup */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Bitcoin Wallet Setup (Sparrow)</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Download Sparrow Wallet</p>
                    <p className="text-sm text-muted-foreground">Get the latest version from sparrowwallet.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Create New Wallet</p>
                    <p className="text-sm text-muted-foreground">Choose wallet type (Single Sig recommended for beginners)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Select Address Type</p>
                    <p className="text-sm text-muted-foreground">Native SegWit (bc1) recommended for lowest fees</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Backup Seed Phrase</p>
                    <p className="text-sm text-muted-foreground">Write down and securely store your 12/24 word seed phrase</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Test Message Signing</p>
                    <p className="text-sm text-muted-foreground">Verify BIP-322 signing works with Tools → Sign/Verify Message</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Configuration */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Add ReserveBTC Tokens to MetaMask</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">rBTC-SYNTH (Soulbound)</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="break-all">0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span>rBTC-SYNTH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decimals:</span>
                  <span>8</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">wrBTC (Transferable)</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="break-all">0xa10FC332f12d102Dddf431F8136E4E89279EFF87</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span>wrBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decimals:</span>
                  <span>8</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">How to Add Tokens</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              <li>Open MetaMask and go to "Assets" tab</li>
              <li>Click "Import tokens" at the bottom</li>
              <li>Paste the contract address</li>
              <li>Symbol and decimals should auto-fill</li>
              <li>Click "Add Custom Token"</li>
              <li>Confirm the import</li>
            </ol>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Security Considerations
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">Wallet Security</h3>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                <li>• Use strong passwords</li>
                <li>• Enable all security features</li>
                <li>• Regular security backups</li>
                <li>• Keep software updated</li>
                <li>• Use official sources only</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">Network Security</h3>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                <li>• Verify network parameters</li>
                <li>• Use HTTPS connections only</li>
                <li>• Avoid public WiFi</li>
                <li>• Check certificate validity</li>
                <li>• Monitor for phishing</li>
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
            Verification Process
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