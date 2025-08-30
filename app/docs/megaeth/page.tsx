import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Zap, Globe, Database, Code, ExternalLink, TrendingUp, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'MegaETH Integration | ReserveBTC Documentation',
  description: 'Learn how ReserveBTC leverages MegaETH for high-performance Bitcoin DeFi with ultra-fast transactions and low fees.',
  keywords: 'MegaETH integration, ReserveBTC MegaETH, high-performance DeFi, ultra-fast transactions, low fees',
}

export default function MegaETHPage() {
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
          <h1 className="text-3xl font-bold mb-4">MegaETH Integration</h1>
          <p className="text-lg text-muted-foreground">
            ReserveBTC is built on MegaETH, a high-performance Ethereum-compatible blockchain 
            designed for institutional-grade DeFi applications with ultra-fast transactions and minimal fees.
          </p>
        </div>

        {/* Why MegaETH */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-blue-800 dark:text-blue-200">Why MegaETH?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Zap className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Ultra-Fast Performance</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Sub-second transaction finality with throughput exceeding 100,000+ TPS
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Minimal Fees</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Gas fees orders of magnitude lower than Ethereum mainnet
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Enterprise Security</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Institutional-grade security with formal verification and audits
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Globe className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">EVM Compatibility</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Full Ethereum compatibility with existing tools and infrastructure
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Database className="h-6 w-6 text-indigo-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Scalable Architecture</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Designed to handle institutional volume and complex DeFi operations
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Code className="h-6 w-6 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Developer Friendly</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Familiar development experience with enhanced performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Details */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Network Configuration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">MegaETH Testnet</h3>
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
                  <span className="text-muted-foreground">Currency:</span>
                  <span>ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Explorer:</span>
                  <span>https://megaexplorer.xyz</span>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">MegaETH Mainnet</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Name:</span>
                  <span>MegaETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RPC URL:</span>
                  <span>https://rpc.megaeth.systems</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain ID:</span>
                  <span>TBD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-yellow-600">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Benefits */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Performance Benefits for Bitcoin DeFi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold">Instant Transactions</h3>
              <p className="text-sm text-muted-foreground">
                Sub-second finality means immediate token minting and transfers
              </p>
              <div className="bg-muted/50 rounded px-3 py-1 text-xs font-mono">
                &lt; 1 second
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold">Ultra-Low Fees</h3>
              <p className="text-sm text-muted-foreground">
                Gas costs are negligible, making micro-transactions viable
              </p>
              <div className="bg-muted/50 rounded px-3 py-1 text-xs font-mono">
                ~$0.001
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold">High Throughput</h3>
              <p className="text-sm text-muted-foreground">
                Can handle massive trading volumes and complex DeFi operations
              </p>
              <div className="bg-muted/50 rounded px-3 py-1 text-xs font-mono">
                100,000+ TPS
              </div>
            </div>
          </div>
        </div>

        {/* Smart Contract Deployment */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">ReserveBTC Smart Contracts on MegaETH</h2>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Deployed Contracts (Testnet)</h3>
              <div className="space-y-3">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Oracle Aggregator</p>
                    <p className="font-mono text-xs break-all text-muted-foreground">0x717D12a23Bb46743b15019a52184DF7F250B061a</p>
                  </div>
                  <div>
                    <p className="font-medium">rBTC-SYNTH Token</p>
                    <p className="font-mono text-xs break-all text-muted-foreground">0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB</p>
                  </div>
                  <div>
                    <p className="font-medium">wrBTC Token</p>
                    <p className="font-mono text-xs break-all text-muted-foreground">0xa10FC332f12d102Dddf431F8136E4E89279EFF87</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Contract Features</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                <div>
                  <ul className="space-y-1">
                    <li>• Gas-optimized for MegaETH</li>
                    <li>• Upgradeable proxy pattern</li>
                    <li>• Multi-signature governance</li>
                    <li>• Emergency pause functionality</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-1">
                    <li>• Comprehensive event logging</li>
                    <li>• Access control mechanisms</li>
                    <li>• Batch operation support</li>
                    <li>• Integration-friendly interfaces</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Integration */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Developer Integration</h2>
          
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Web3 Configuration</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// ethers.js
const provider = new ethers.JsonRpcProvider('https://carrot.megaeth.com/rpc');

// viem
import { createPublicClient, http } from 'viem';
import { megaeth } from './chains/megaeth';

const client = createPublicClient({
  chain: megaeth,
  transport: http()
});

// wagmi
import { configureChains } from 'wagmi';

const { chains } = configureChains(
  [megaeth],
  [publicProvider()]
);`}</pre>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Contract Integration</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// ReserveBTC Oracle Contract
const oracleContract = {
  address: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
  abi: ORACLE_ABI
};

// rBTC-SYNTH Token Contract
const rbtcSynthContract = {
  address: '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB',
  abi: ERC20_ABI
};

// wrBTC Token Contract  
const wrbtcContract = {
  address: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
  abi: ERC20_ABI
};`}</pre>
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Performance Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Network</th>
                  <th className="text-left p-3">Transaction Time</th>
                  <th className="text-left p-3">Gas Fee</th>
                  <th className="text-left p-3">Throughput</th>
                  <th className="text-left p-3">Bitcoin DeFi Suitability</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-green-50/50 dark:bg-green-950/10">
                  <td className="p-3 font-semibold text-green-700 dark:text-green-400">MegaETH</td>
                  <td className="p-3">&lt; 1 second</td>
                  <td className="p-3">~$0.001</td>
                  <td className="p-3">100,000+ TPS</td>
                  <td className="p-3 text-green-600">✅ Excellent</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Ethereum</td>
                  <td className="p-3">12-15 seconds</td>
                  <td className="p-3">$5-50</td>
                  <td className="p-3">15 TPS</td>
                  <td className="p-3 text-red-600">❌ Too expensive</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Polygon</td>
                  <td className="p-3">2-3 seconds</td>
                  <td className="p-3">$0.01-0.10</td>
                  <td className="p-3">7,000 TPS</td>
                  <td className="p-3 text-yellow-600">⚠️ Moderate</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Arbitrum</td>
                  <td className="p-3">1-2 seconds</td>
                  <td className="p-3">$0.10-1.00</td>
                  <td className="p-3">4,000 TPS</td>
                  <td className="p-3 text-yellow-600">⚠️ Good</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* MegaETH Features */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">MegaETH Features for DeFi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Technical Advantages</h3>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">Parallel Execution</h4>
                  <p className="text-xs text-muted-foreground">Multiple transactions processed simultaneously</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">Optimized State Management</h4>
                  <p className="text-xs text-muted-foreground">Efficient state updates and storage</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">Advanced Consensus</h4>
                  <p className="text-xs text-muted-foreground">High-performance consensus mechanism</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">EVM+ Enhancements</h4>
                  <p className="text-xs text-muted-foreground">Extended EVM with performance optimizations</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">DeFi Benefits</h3>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">High-Frequency Trading</h4>
                  <p className="text-xs text-muted-foreground">Ultra-fast execution for trading strategies</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">Complex Strategies</h4>
                  <p className="text-xs text-muted-foreground">Multi-step DeFi operations in single transaction</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">Micro-transactions</h4>
                  <p className="text-xs text-muted-foreground">Low fees enable small-value operations</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">Real-time Updates</h4>
                  <p className="text-xs text-muted-foreground">Instant balance and state synchronization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">ReserveBTC + MegaETH Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">For Users</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Instant Bitcoin DeFi participation</li>
                <li>✅ Negligible transaction costs</li>
                <li>✅ Real-time balance updates</li>
                <li>✅ Seamless user experience</li>
                <li>✅ No waiting for confirmations</li>
                <li>✅ Complex strategies possible</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">For Developers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Familiar EVM development</li>
                <li>✅ Enhanced performance tooling</li>
                <li>✅ Lower infrastructure costs</li>
                <li>✅ Reliable execution environment</li>
                <li>✅ Advanced debugging features</li>
                <li>✅ Institutional-grade reliability</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Getting Test ETH */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Getting Test ETH</h2>
          <div className="space-y-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              To interact with ReserveBTC on MegaETH Testnet, you'll need test ETH for gas fees:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Request from Team</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  Contact MegaETH developers for testnet ETH
                </p>
                <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                  <li>• Join MegaETH Discord</li>
                  <li>• Request in #faucet channel</li>
                  <li>• Provide your wallet address</li>
                  <li>• Usually receive within 24 hours</li>
                </ul>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Amount Needed</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  Small amount sufficient for testing
                </p>
                <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                  <li>• ~0.1 ETH for extensive testing</li>
                  <li>• ~0.01 ETH for basic operations</li>
                  <li>• Each transaction costs &lt; 0.001 ETH</li>
                  <li>• Request extra for development</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">MegaETH Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://megaeth.systems" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Official Website <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://megaexplorer.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Block Explorer <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://docs.megaeth.systems" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Documentation <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Wallet Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">MetaMask <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://sparrowwallet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Sparrow Wallet <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li><a href="https://electrum.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">Electrum <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ReserveBTC Docs</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs/api" className="text-primary hover:underline">API Reference</Link></li>
                <li><Link href="/docs/integration" className="text-primary hover:underline">Integration Guide</Link></li>
                <li><Link href="/docs/troubleshooting" className="text-primary hover:underline">Troubleshooting</Link></li>
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
            Address Verification
          </Link>
          <Link 
            href="/docs/integration" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Integration Guide
          </Link>
        </div>
      </div>
    </div>
  )
}