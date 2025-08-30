import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle, RefreshCw, Wifi, Zap, HelpCircle, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Troubleshooting Guide | ReserveBTC Documentation',
  description: 'Common issues and solutions for ReserveBTC users, including wallet problems, verification issues, and transaction failures.',
  keywords: 'ReserveBTC troubleshooting, Bitcoin DeFi problems, BIP-322 issues, wallet connection problems',
}

export default function TroubleshootingPage() {
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
          <h1 className="text-3xl font-bold mb-4">Troubleshooting Guide</h1>
          <p className="text-lg text-muted-foreground">
            Common issues and their solutions when using ReserveBTC. If you can't find your issue here, 
            check our community forum or contact support.
          </p>
        </div>

        {/* Quick Fixes */}
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200 flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Quick Fixes (Try These First)
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <RefreshCw className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Refresh & Reconnect</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Refresh page and reconnect wallet</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Wifi className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Check Network</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Ensure connected to MegaETH Testnet</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Clear Cache</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Clear browser cache and cookies</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Zap className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Check Gas</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Ensure sufficient ETH for gas fees</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RefreshCw className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Update Wallets</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Update MetaMask and Bitcoin wallet</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Wait & Retry</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Wait 30 seconds and try again</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Issues */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-red-600">🔌 Wallet Connection Issues</h2>
          
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "MetaMask Not Detected"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-red-700 dark:text-red-300"><strong>Symptoms:</strong> Wallet connection button doesn't work</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Install MetaMask browser extension</li>
                  <li>Refresh the page after installation</li>
                  <li>Enable MetaMask in browser extensions</li>
                  <li>Try incognito mode to test</li>
                  <li>Disable other wallet extensions temporarily</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Wrong Network"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-red-700 dark:text-red-300"><strong>Symptoms:</strong> Transactions fail or interface shows errors</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Switch to MegaETH Testnet in MetaMask</li>
                  <li>Add MegaETH network if missing (Chain ID: 6342)</li>
                  <li>Verify RPC URL: https://carrot.megaeth.com/rpc</li>
                  <li>Check network status on MegaETH explorer</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Insufficient Funds for Gas"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-red-700 dark:text-red-300"><strong>Symptoms:</strong> Transactions fail with gas error</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Request test ETH from MegaETH developers</li>
                  <li>Join MegaETH Discord for faucet access</li>
                  <li>Wait for gas prices to decrease</li>
                  <li>Increase gas limit in MetaMask settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Issues */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-orange-600">✍️ Bitcoin Address Verification Issues</h2>
          
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Invalid BIP-322 Signature"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-orange-700 dark:text-orange-300"><strong>Symptoms:</strong> Signature verification fails</p>
                <p className="text-muted-foreground"><strong>Common causes & solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li><strong>Message modified:</strong> Copy message exactly as shown</li>
                  <li><strong>Wrong address:</strong> Sign with the exact address you entered</li>
                  <li><strong>Wallet compatibility:</strong> Use Sparrow or Electrum wallet</li>
                  <li><strong>Truncated signature:</strong> Copy complete signature including padding</li>
                  <li><strong>Encoding issues:</strong> Ensure proper UTF-8 encoding</li>
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Address Balance Not Found"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-orange-700 dark:text-orange-300"><strong>Symptoms:</strong> System can't find Bitcoin balance</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Ensure address has confirmed Bitcoin balance</li>
                  <li>Wait for recent transactions to confirm (6 confirmations)</li>
                  <li>Check address format is correct</li>
                  <li>Try again in 5-10 minutes (API delays)</li>
                  <li>Verify on blockchain explorer first</li>
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Wallet Doesn't Support BIP-322"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-orange-700 dark:text-orange-300"><strong>Symptoms:</strong> Can't find signing option or gets errors</p>
                <p className="text-muted-foreground"><strong>Recommended alternatives:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Download Sparrow Wallet (best BIP-322 support)</li>
                  <li>Update Electrum to latest version (4.5.0+)</li>
                  <li>Import seed phrase to supported wallet temporarily</li>
                  <li>Use Bitcoin Core for advanced users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Oracle & Sync Issues */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-blue-600">🔮 Oracle & Synchronization Issues</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Oracle Not Responding"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700 dark:text-blue-300"><strong>Symptoms:</strong> Balance updates not happening</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Check <Link href="/oracle" className="text-primary underline">Oracle Dashboard</Link> status</li>
                  <li>Verify Oracle server is running</li>
                  <li>Check MegaETH network connectivity</li>
                  <li>Wait for next sync cycle (every 5 minutes)</li>
                  <li>Manual sync via Oracle interface</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Balance Not Syncing"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700 dark:text-blue-300"><strong>Symptoms:</strong> Token balance doesn't match Bitcoin balance</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Wait up to 10 minutes for automatic sync</li>
                  <li>Check that Bitcoin transaction is confirmed</li>
                  <li>Use manual sync button in Oracle dashboard</li>
                  <li>Verify Oracle has sufficient gas fees</li>
                  <li>Check for Oracle authorization issues</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Sync Transaction Failed"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700 dark:text-blue-300"><strong>Symptoms:</strong> Oracle shows sync errors</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Check Oracle has enough ETH for gas</li>
                  <li>Verify smart contract addresses are correct</li>
                  <li>Ensure Oracle is authorized as committee member</li>
                  <li>Check MegaETH network status</li>
                  <li>Restart Oracle server if self-hosting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Token Issues */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-purple-600">🪙 Token & Transaction Issues</h2>
          
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Tokens Not Visible in Wallet"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-purple-700 dark:text-purple-300"><strong>Symptoms:</strong> Minted tokens don't appear in MetaMask</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Add token contracts manually to MetaMask</li>
                  <li>rBTC-SYNTH: 0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB</li>
                  <li>wrBTC: 0xa10FC332f12d102Dddf431F8136E4E89279EFF87</li>
                  <li>Refresh MetaMask and check "Assets" tab</li>
                  <li>Verify transaction was successful on explorer</li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Minting Transaction Reverted"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-purple-700 dark:text-purple-300"><strong>Symptoms:</strong> Mint transaction fails</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Ensure address verification completed successfully</li>
                  <li>Check Bitcoin balance is sufficient ({'>'}0)</li>
                  <li>Increase gas limit in MetaMask</li>
                  <li>Try minting smaller amount first</li>
                  <li>Verify contract addresses are correct</li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Transfer Failed" (wrBTC only)</h3>
              <div className="space-y-2 text-sm">
                <p className="text-purple-700 dark:text-purple-300"><strong>Symptoms:</strong> Can't transfer wrBTC tokens</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Ensure sufficient token balance</li>
                  <li>Check recipient address is valid</li>
                  <li>Increase gas limit for transfers</li>
                  <li>Verify you're using wrBTC (not rBTC-SYNTH)</li>
                  <li>Note: rBTC-SYNTH is non-transferable by design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Network Issues */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">🌐 Network & Performance Issues</h2>
          
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "Network Timeout"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-indigo-700 dark:text-indigo-300"><strong>Symptoms:</strong> Requests taking too long or timing out</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Check internet connection stability</li>
                  <li>Try different RPC endpoint if available</li>
                  <li>Disable VPN temporarily</li>
                  <li>Use different browser or incognito mode</li>
                  <li>Check MegaETH network status</li>
                </ul>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">❌ "RPC Error"</h3>
              <div className="space-y-2 text-sm">
                <p className="text-indigo-700 dark:text-indigo-300"><strong>Symptoms:</strong> JSON-RPC errors or connection failures</p>
                <p className="text-muted-foreground"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Verify RPC URL: https://carrot.megaeth.com/rpc</li>
                  <li>Check if MegaETH network is experiencing issues</li>
                  <li>Clear MetaMask cache and reconnect</li>
                  <li>Try removing and re-adding the network</li>
                  <li>Contact MegaETH support if persistent</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Codes Reference */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Common Error Codes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Oracle Errors</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <code className="font-semibold">ORACLE_NOT_AUTHORIZED</code>
                  <p className="text-muted-foreground mt-1">Oracle not authorized as committee member</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <code className="font-semibold">BALANCE_MISMATCH</code>
                  <p className="text-muted-foreground mt-1">Bitcoin balance verification failed</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <code className="font-semibold">SYNC_TIMEOUT</code>
                  <p className="text-muted-foreground mt-1">Balance sync operation timed out</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Contract Errors</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <code className="font-semibold">INSUFFICIENT_BALANCE</code>
                  <p className="text-muted-foreground mt-1">Not enough Bitcoin to mint requested amount</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <code className="font-semibold">INVALID_SIGNATURE</code>
                  <p className="text-muted-foreground mt-1">BIP-322 signature verification failed</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <code className="font-semibold">USER_NOT_VERIFIED</code>
                  <p className="text-muted-foreground mt-1">Address verification required first</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Still Need Help?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Community Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Join our Discord community for real-time help
              </p>
              <a 
                href="https://discord.gg/reservebtc" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                <span>Join Discord</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">GitHub Issues</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Report bugs or request features
              </p>
              <a 
                href="https://github.com/reservebtc/app.reservebtc.io/issues" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-900 transition-colors"
              >
                <span>Open Issue</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Direct email for technical issues
              </p>
              <a 
                href="mailto:support@reservebtc.io"
                className="inline-flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
              >
                <span>Email Support</span>
              </a>
            </div>
          </div>
        </div>

        {/* Emergency Procedures */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Procedures
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🚨 If You Suspect Security Compromise</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                <li>Immediately move Bitcoin to a new address</li>
                <li>Disconnect all wallet connections</li>
                <li>Change all wallet passwords</li>
                <li>Monitor for unauthorized transactions</li>
                <li>Contact support immediately</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔧 If Protocol Appears Broken</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                <li>Check official status page and social media</li>
                <li>Verify you're using the correct URLs</li>
                <li>Try the backup interface if available</li>
                <li>Do NOT panic-sell or make hasty decisions</li>
                <li>Wait for official communications</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Diagnostic Tools */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Self-Diagnostic Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Check Your Setup</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/oracle" className="text-primary hover:underline">🔮 Oracle Dashboard</Link> - Check Oracle status</li>
                <li><a href="https://megaexplorer.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">🔍 MegaETH Explorer <ExternalLink className="h-3 w-3 ml-1" /></a> - View transactions</li>
                <li><a href="https://blockstream.info/testnet" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">₿ Bitcoin Explorer <ExternalLink className="h-3 w-3 ml-1" /></a> - Check Bitcoin balance</li>
                <li><Link href="/docs/wallet-setup" className="text-primary hover:underline">⚙️ Wallet Configuration</Link> - Verify setup</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Status Pages</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://status.megaeth.systems" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">📊 MegaETH Status <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://status.reservebtc.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">📈 ReserveBTC Status <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://bitcoinnetwork.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">🔗 Bitcoin Network <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><Link href="/docs/api" className="text-primary hover:underline">📡 API Status</Link> - Check API health</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/first-mint" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            ← First Mint Tutorial
          </Link>
          <Link 
            href="/docs/best-practices" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Best Practices →
          </Link>
        </div>
      </div>
    </div>
  )
}