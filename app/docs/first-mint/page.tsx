import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Coins, Play, CheckCircle, AlertCircle, Zap, Gift, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'First Mint Tutorial | ReserveBTC Documentation',
  description: 'Step-by-step tutorial for minting your first ReserveBTC synthetic tokens backed by your Bitcoin holdings.',
  keywords: 'ReserveBTC minting, first mint tutorial, synthetic Bitcoin tokens, rBTC-SYNTH, wrBTC',
}

export default function FirstMintPage() {
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
          <h1 className="text-3xl font-bold mb-4">Getting Your First Tokens Tutorial</h1>
          <p className="text-lg text-muted-foreground">
            This tutorial explains how ReserveBTC's Oracle-based system works and how you can 
            get synthetic tokens automatically minted based on your Bitcoin holdings.
          </p>
        </div>

        {/* Prerequisites Checklist */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Prerequisites Checklist
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Required Setup</h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>EVM wallet connected (MetaMask)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>MegaETH Testnet configured</span>
                </li>
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Test ETH for gas fees</span>
                </li>
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Bitcoin wallet with BIP-322 support</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What You Need</h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Bitcoin address with balance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Completed address verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Understanding of token types</span>
                </li>
                <li className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>~5 minutes of time</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-700 dark:text-blue-300">
            <p>📝 <strong>Not ready yet?</strong> Check out our <Link href="/docs/wallet-setup" className="underline">Wallet Setup Guide</Link> and <Link href="/docs/verification" className="underline">Verification Process</Link> first.</p>
          </div>
        </div>

        {/* Choose Token Type */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Coins className="h-6 w-6 mr-2" />
            Step 1: Choose Your Token Type
          </h2>
          <p className="text-muted-foreground mb-6">
            ReserveBTC offers two types of synthetic tokens. Choose based on your intended use case:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-200">rBTC-SYNTH (Soulbound)</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Perfect 1:1 Bitcoin backing</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Automatic balance synchronization</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Lower gas costs</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Non-transferable (soulbound)</span>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/20 rounded p-3">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    <strong>Best for:</strong> Personal DeFi use, yield farming, lending protocols where transfers aren't needed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-orange-800 dark:text-orange-200">wrBTC (Transferable)</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Standard ERC-20 token</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Fully transferable</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>DeFi protocol compatible</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Trading and swapping enabled</span>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/20 rounded p-3">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    <strong>Best for:</strong> Trading, advanced DeFi strategies, liquidity provision, any use case requiring transfers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Oracle Process */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Step 2: Oracle-Based Token Management</h2>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">Important: Automated System</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ReserveBTC uses an Oracle-based system where tokens are automatically minted and burned 
              based on your Bitcoin balance changes. You don't manually mint tokens.
            </p>
          </div>

          {/* Verification Step */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                1
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold">Complete Address Verification</h3>
                <p className="text-muted-foreground">
                  Prove ownership of your Bitcoin address through the web interface.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Go to <Link href="/" className="text-primary hover:underline">app.reservebtc.io</Link></li>
                    <li>Connect your EVM wallet (MetaMask)</li>
                    <li>Enter your Bitcoin address</li>
                    <li>Complete BIP-322 signature verification</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Oracle Registration */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                2
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold">Oracle Registration</h3>
                <p className="text-muted-foreground">
                  After verification, Oracle server adds your address to monitoring list.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Automated Process:</strong> The Oracle server (oracle-server.js) automatically 
                    starts monitoring your Bitcoin address every 5 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Monitoring */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                3
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold">Automatic Balance Monitoring</h3>
                <p className="text-muted-foreground">
                  Oracle monitors your Bitcoin address and detects balance changes.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">What Oracle Tracks:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Current Bitcoin balance via BlockCypher API</li>
                    <li>• Balance changes (deltas) from last sync</li>
                    <li>• Transaction confirmations</li>
                    <li>• Last sync timestamp</li>
                    <li>• Fee calculations for sync operations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Automatic Token Management */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                4
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold">Automatic Token Operations</h3>
                <p className="text-muted-foreground">
                  When balance changes are detected, Oracle automatically calls sync() function.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Automatic Operations:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Positive delta: Mint rBTC-SYNTH tokens</li>
                        <li>• Negative delta: Burn rBTC-SYNTH tokens</li>
                        <li>• No user interaction required</li>
                        <li>• Oracle pays gas fees</li>
                      </ul>
                    </div>
                    <div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• 1:1 backing ratio maintained</li>
                        <li>• Transaction recorded on-chain</li>
                        <li>• Oracle updates user records</li>
                        <li>• Balance sync initiated</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ <strong>Success!</strong> Your MetaMask will show the transaction confirmation, 
                    and you'll receive your synthetic tokens within seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Tokens to Wallet */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Step 3: Add Tokens to Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            To see your newly minted tokens in MetaMask, you need to add the token contracts.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-200">rBTC-SYNTH Token</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="break-all">0xF1C8...aCBcB</span>
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
              <button className="mt-3 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                Add to MetaMask
              </button>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-orange-800 dark:text-orange-200">wrBTC Token</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="break-all">0xa10F...FF87</span>
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
              <button className="mt-3 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors">
                Add to MetaMask
              </button>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Manual Token Addition</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              <li>Open MetaMask and go to "Assets" tab</li>
              <li>Scroll down and click "Import tokens"</li>
              <li>Select "Custom token" tab</li>
              <li>Paste the token contract address</li>
              <li>Symbol and decimals should auto-fill</li>
              <li>Click "Add Custom Token"</li>
              <li>Click "Import tokens" to confirm</li>
            </ol>
          </div>
        </div>

        {/* Verify Success */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-green-800 dark:text-green-200">Step 4: Verify Successful Mint</h2>
          <div className="space-y-4">
            <p className="text-green-700 dark:text-green-300">
              Confirm that your minting was successful by checking multiple indicators:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                <h4 className="font-semibold mb-1">Token Balance</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Check MetaMask for new token balance</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
                <h4 className="font-semibold mb-1">Transaction Hash</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Verify on MegaETH explorer</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <Zap className="h-6 w-6 text-purple-600 mb-2" />
                <h4 className="font-semibold mb-1">Oracle Status</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Check dashboard for sync status</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Gift className="h-6 w-6 mr-2" />
            What's Next?
          </h2>
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Congratulations! You've successfully minted your first ReserveBTC synthetic tokens. 
              Here are some things you can do next:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Using Your Tokens</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>🔄 Hold and watch auto-sync with your Bitcoin</li>
                  <li>🏦 Deposit into lending protocols</li>
                  <li>🌾 Participate in yield farming</li>
                  <li>💱 Trade wrBTC on DEXes (if minted)</li>
                  <li>🏗️ Use in complex DeFi strategies</li>
                  <li>📊 Monitor performance and yields</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Learning More</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/docs/how-it-works" className="text-primary hover:underline">📖 How ReserveBTC Works</Link></li>
                  <li><Link href="/docs/security" className="text-primary hover:underline">🛡️ Security Model</Link></li>
                  <li><Link href="/docs/api" className="text-primary hover:underline">⚙️ API Documentation</Link></li>
                  <li><Link href="/docs/troubleshooting" className="text-primary hover:underline">🔧 Troubleshooting Guide</Link></li>
                  <li><Link href="/oracle" className="text-primary hover:underline">🔮 Oracle Dashboard</Link></li>
                  <li><Link href="/docs/best-practices" className="text-primary hover:underline">✨ Best Practices</Link></li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">💡 Pro Tips</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Monitor your Oracle dashboard to see balance synchronization in real-time</li>
                <li>• Your tokens will automatically adjust when your Bitcoin balance changes</li>
                <li>• Keep small amount of ETH for gas fees if you plan to make transactions</li>
                <li>• Consider minting both token types for maximum flexibility</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Common Issues During First Mint</h2>
          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">❌ "Insufficient Gas Fee"</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Solution:</strong> Get more test ETH from MegaETH developers. 
                You need at least 0.001 ETH for gas fees.
              </p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">❌ "Address Not Verified"</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Solution:</strong> Complete the verification process first. 
                See our <Link href="/docs/verification" className="underline">Verification Guide</Link>.
              </p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">❌ "Transaction Failed"</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Solution:</strong> Check network connection, increase gas limit, 
                or try again. Contact support if issue persists.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/verification" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            ← Verification Process
          </Link>
          <Link 
            href="/docs/troubleshooting" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Troubleshooting Guide →
          </Link>
        </div>
      </div>
    </div>
  )
}