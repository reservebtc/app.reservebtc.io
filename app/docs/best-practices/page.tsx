import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Zap, TrendingUp, AlertTriangle, CheckCircle, Eye, Lock, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Best Practices | ReserveBTC Documentation',
  description: 'Security best practices, optimization tips, and recommended workflows for using ReserveBTC protocol safely and efficiently.',
  keywords: 'ReserveBTC best practices, Bitcoin DeFi security, wallet security, Oracle monitoring, DeFi strategies',
}

export default function BestPracticesPage() {
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
          <h1 className="text-3xl font-bold mb-4">Security & Best Practices</h1>
          <p className="text-lg text-muted-foreground">
            Essential security practices and optimization strategies for safely using ReserveBTC 
            and maximizing your Bitcoin DeFi experience.
          </p>
        </div>

        {/* Security First */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-red-800 dark:text-red-200 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Security Best Practices
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-green-600">✅ Essential Security Habits</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Use Hardware Wallets</p>
                    <p className="text-xs text-muted-foreground">Store Bitcoin on hardware devices for maximum security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Verify All Addresses</p>
                    <p className="text-xs text-muted-foreground">Double-check addresses before any transaction</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Keep Software Updated</p>
                    <p className="text-xs text-muted-foreground">Update wallets and browsers regularly</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Use Official Interfaces Only</p>
                    <p className="text-xs text-muted-foreground">Always access via app.reservebtc.io</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Monitor Regularly</p>
                    <p className="text-xs text-muted-foreground">Check balances and transactions frequently</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-red-600">❌ Security Risks to Avoid</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Never Share Private Keys</p>
                    <p className="text-xs text-muted-foreground">No legitimate service will ask for private keys</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Avoid Public WiFi</p>
                    <p className="text-xs text-muted-foreground">Use secure networks for all transactions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Don't Sign Unknown Messages</p>
                    <p className="text-xs text-muted-foreground">Only sign ReserveBTC verification messages</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Avoid Custodial Wallets</p>
                    <p className="text-xs text-muted-foreground">Don't use exchange wallets for verification</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">No Phishing Links</p>
                    <p className="text-xs text-muted-foreground">Always type URLs manually or use bookmarks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Best Practices */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Zap className="h-6 w-6 mr-2" />
            Operational Excellence
          </h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-blue-800 dark:text-blue-200">Gas Fee Optimization</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Cost-Saving Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Batch multiple operations together</li>
                    <li>• Use rBTC-SYNTH for lower gas costs</li>
                    <li>• Monitor gas prices before transactions</li>
                    <li>• Plan larger operations during low activity</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Gas Estimation</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Verification: ~0.001 ETH</li>
                    <li>• Token minting: ~0.0005 ETH</li>
                    <li>• Balance sync: ~0.0003 ETH</li>
                    <li>• Token transfer: ~0.0002 ETH</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-green-800 dark:text-green-200">Balance Management</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Bitcoin Side</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Keep Bitcoin in cold storage when possible</li>
                    <li>• Use multiple addresses for different purposes</li>
                    <li>• Monitor for unexpected balance changes</li>
                    <li>• Maintain transaction history records</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Token Side</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Monitor auto-sync frequency</li>
                    <li>• Check Oracle dashboard regularly</li>
                    <li>• Verify 1:1 backing ratio</li>
                    <li>• Track DeFi protocol interactions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DeFi Strategy Best Practices */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2" />
            DeFi Strategy Best Practices
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-purple-800 dark:text-purple-200">Token Type Selection</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">rBTC-SYNTH Usage</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>✓ Personal DeFi portfolios</li>
                    <li>✓ Long-term yield farming</li>
                    <li>✓ Lending protocol deposits</li>
                    <li>✓ Staking mechanisms</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">wrBTC Usage</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>✓ Active trading strategies</li>
                    <li>✓ Liquidity provision</li>
                    <li>✓ Cross-protocol interactions</li>
                    <li>✓ Complex DeFi compositions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-orange-800 dark:text-orange-200">Risk Management</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Diversification</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Don't put all Bitcoin in one address</li>
                    <li>• Use multiple DeFi protocols</li>
                    <li>• Split between token types</li>
                    <li>• Maintain some liquid reserves</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Monitoring</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Set up balance alerts</li>
                    <li>• Monitor Oracle performance</li>
                    <li>• Track DeFi protocol health</li>
                    <li>• Review transaction history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring & Maintenance */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Eye className="h-6 w-6 mr-2" />
            Monitoring & Maintenance
          </h2>
          
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Regular Monitoring Checklist</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Daily Checks</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>□ Bitcoin balance unchanged</li>
                    <li>□ Token balances match Bitcoin</li>
                    <li>□ No unauthorized transactions</li>
                    <li>□ Oracle sync status normal</li>
                    <li>□ DeFi positions healthy</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Weekly Reviews</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>□ Security backup verification</li>
                    <li>□ Software updates available</li>
                    <li>□ Protocol announcement review</li>
                    <li>□ Performance optimization check</li>
                    <li>□ Risk assessment update</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Oracle Dashboard</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Monitor synchronization status and Oracle health
                </p>
                <Link href="/oracle" className="text-primary hover:underline text-sm">
                  View Dashboard →
                </Link>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Balance Tracking</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Keep records of all balance changes and syncs
                </p>
                <span className="text-sm text-muted-foreground">Built-in tracking</span>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Transaction History</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                  Review all protocol interactions
                </p>
                <a href="https://megaexplorer.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                  View Explorer →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Security */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Lock className="h-6 w-6 mr-2" />
            Advanced Wallet Security
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Bitcoin Wallet Security</h3>
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">Cold Storage Strategy</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Keep majority in hardware wallet</li>
                    <li>• Use hot wallet for active amounts only</li>
                    <li>• Regular cold storage transfers</li>
                    <li>• Multi-signature for large amounts</li>
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-800 dark:text-red-200">Backup Procedures</h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Multiple physical seed phrase copies</li>
                    <li>• Secure location storage</li>
                    <li>• Regular backup verification</li>
                    <li>• Emergency recovery plan</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">EVM Wallet Security</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">MetaMask Configuration</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Enable transaction notifications</li>
                    <li>• Set up hardware wallet connection</li>
                    <li>• Review connected sites regularly</li>
                    <li>• Use separate wallet for DeFi</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Access Control</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Regular permission audits</li>
                    <li>• Revoke unused connections</li>
                    <li>• Monitor transaction approvals</li>
                    <li>• Use time-limited sessions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Optimization */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Performance Optimization</h2>
          
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Sync Optimization</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Frequency</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Auto-sync every 5 minutes</li>
                    <li>• Manual sync when needed</li>
                    <li>• Batch operations together</li>
                    <li>• Avoid excessive syncing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Efficiency</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Monitor Oracle gas usage</li>
                    <li>• Plan balance changes</li>
                    <li>• Use optimal address types</li>
                    <li>• Minimize dust amounts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Reliability</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Keep Oracle running continuously</li>
                    <li>• Monitor network connectivity</li>
                    <li>• Backup Oracle configuration</li>
                    <li>• Test failover procedures</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">💡 Pro Tips</h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Use Native SegWit addresses (bc1) for lowest Bitcoin fees</li>
                <li>• Mint both token types initially to test both workflows</li>
                <li>• Keep small ETH buffer for unexpected gas costs</li>
                <li>• Monitor Oracle dashboard during high Bitcoin volatility</li>
                <li>• Set up transaction monitoring alerts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Procedures */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Response Procedures
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">🚨 Security Incident</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-red-700 dark:text-red-300">
                <li><strong>Immediate:</strong> Move Bitcoin to new secure address</li>
                <li><strong>Disconnect:</strong> Revoke all wallet connections</li>
                <li><strong>Secure:</strong> Change all passwords and enable 2FA</li>
                <li><strong>Monitor:</strong> Watch for unauthorized transactions</li>
                <li><strong>Report:</strong> Contact support immediately</li>
                <li><strong>Document:</strong> Keep records of incident</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🔧 Technical Issues</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-red-700 dark:text-red-300">
                <li><strong>Assess:</strong> Determine scope of issue</li>
                <li><strong>Backup:</strong> Create system state backup</li>
                <li><strong>Isolate:</strong> Avoid making additional transactions</li>
                <li><strong>Document:</strong> Record error messages and logs</li>
                <li><strong>Support:</strong> Contact technical support</li>
                <li><strong>Wait:</strong> Don't panic-sell or make hasty decisions</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Documentation</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs/security" className="text-primary hover:underline">Security Model</Link></li>
                <li><Link href="/docs/api" className="text-primary hover:underline">API Reference</Link></li>
                <li><Link href="/docs/integration" className="text-primary hover:underline">Integration Guide</Link></li>
                <li><Link href="/docs/wallet-setup" className="text-primary hover:underline">Wallet Setup</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://discord.gg/reservebtc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Discord Community <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://github.com/reservebtc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">GitHub Repository <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://twitter.com/reservebtc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Twitter Updates <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="mailto:support@reservebtc.io" className="text-primary hover:underline">Email Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">External Tools</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://megaexplorer.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">MegaETH Explorer <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://blockstream.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Bitcoin Explorer <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://sparrowwallet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Sparrow Wallet <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">MetaMask <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/security" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            ← Security Model
          </Link>
          <Link 
            href="/docs/integration" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Integration Guide →
          </Link>
        </div>
      </div>
    </div>
  )
}