import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Package, Code2, Terminal, Book, Download, Github } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SDK & Libraries | ReserveBTC Documentation',
  description: 'Official ReserveBTC SDKs and libraries for JavaScript, Python, and other programming languages with installation guides and examples.',
  keywords: 'ReserveBTC SDK, JavaScript SDK, Python SDK, libraries, npm package, pip package, developer tools',
}

export default function SDKPage() {
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
          <h1 className="text-3xl font-bold mb-4">SDK & Libraries</h1>
          <p className="text-lg text-muted-foreground">
            Official SDKs and libraries for integrating ReserveBTC protocol into your applications. 
            Currently in development and planned for future release.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Planned SDKs</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            We are developing SDKs for popular programming languages to simplify integration with ReserveBTC protocol. 
            All SDKs will provide the same core functionality with language-specific optimizations and conventions.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📦</div>
              <h3 className="font-medium">JavaScript/TypeScript</h3>
              <p className="text-sm text-muted-foreground">Planned NPM Package</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🐍</div>
              <h3 className="font-medium">Python</h3>
              <p className="text-sm text-muted-foreground">Planned PyPI Package</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔧</div>
              <h3 className="font-medium">More Languages</h3>
              <p className="text-sm text-muted-foreground">Future Releases</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold">JavaScript SDK (Planned)</h3>
            </div>
            <p className="text-muted-foreground">
              Full-featured SDK for Node.js and browser environments with TypeScript support, 
              wallet integrations, and comprehensive error handling. Currently in development.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Code2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Python SDK (Planned)</h3>
            </div>
            <p className="text-muted-foreground">
              Python library with async/await support, data science integrations, 
              and comprehensive documentation for backend applications. Planned for future release.
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">JavaScript SDK (Preview)</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Terminal className="h-5 w-5 mr-2 text-orange-600" />
                Installation (Coming Soon)
              </h3>
              <div className="bg-black rounded-lg p-4">
                <pre className="text-orange-400 text-sm">
                  <code># Will be available soon</code>
                </pre>
                <pre className="text-gray-500 text-sm">
                  <code>npm install @reservebtc/sdk</code>
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                SDK is currently in development. For now, integrate directly with smart contracts using the <Link href="/docs/abi" className="text-primary hover:underline">ABI documentation</Link>.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-3">Planned API (Preview)</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-xs text-orange-600 mb-2 font-medium">// Planned SDK API - Not yet available</div>
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`import { ReserveBTC } from '@reservebtc/sdk';

// Initialize the SDK
const reserveBTC = new ReserveBTC({
  network: 'mainnet', // or 'testnet'
  provider: window.ethereum, // or your Web3 provider
});

// Connect wallet
await reserveBTC.connect();

// Mint synthetic tokens
const result = await reserveBTC.mintSynth({
  btcAddress: 'bc1q...', // Your Bitcoin address
  amount: '1000000', // Amount in satoshis
  signature: '...', // BIP-322 signature
});

console.log('Minted:', result.transactionHash);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Advanced Usage</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Get user balances
const synthBalance = await reserveBTC.getSynthBalance();
const wrappedBalance = await reserveBTC.getWrappedBalance();

// Listen to events
reserveBTC.on('synthMinted', (event) => {
  console.log('Synth minted:', event);
});

// Burn tokens
await reserveBTC.burnSynth('500000'); // Burn 0.005 BTC worth

// Get Bitcoin address verification
const isValid = await reserveBTC.verifyBitcoinSignature({
  address: 'bc1q...',
  signature: '...',
  message: 'verification message'
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Python SDK (Preview)</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Terminal className="h-5 w-5 mr-2 text-orange-600" />
                Installation (Coming Soon)
              </h3>
              <div className="bg-black rounded-lg p-4">
                <pre className="text-orange-400 text-sm">
                  <code># Will be available soon</code>
                </pre>
                <pre className="text-gray-500 text-sm">
                  <code>pip install reservebtc-sdk</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Planned API (Preview)</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-xs text-orange-600 mb-2 font-medium"># Planned Python SDK API - Not yet available</div>
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`from reservebtc import ReserveBTC
import asyncio

async def main():
    # Initialize the SDK
    reservebtc = ReserveBTC(
        network='mainnet',
        private_key='your_private_key'  # Or use wallet connection
    )
    
    # Mint synthetic tokens
    result = await reservebtc.mint_synth(
        btc_address='bc1q...',
        amount=1000000,  # Amount in satoshis
        signature='...'  # BIP-322 signature
    )
    
    print(f"Minted: {result['transaction_hash']}")

# Run the example
asyncio.run(main())`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Data Analysis Integration</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`import pandas as pd
from reservebtc import ReserveBTC

# Get historical data
reservebtc = ReserveBTC()
events = await reservebtc.get_mint_events(
    from_block=1000000,
    to_block='latest'
)

# Convert to DataFrame for analysis
df = pd.DataFrame([{
    'timestamp': event['timestamp'],
    'amount': event['amount'],
    'user': event['user']
} for event in events])

# Analyze minting trends
daily_volume = df.groupby(df['timestamp'].dt.date)['amount'].sum()
print(daily_volume.describe())`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">SDK Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Core Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  ✓ <span className="ml-2">Mint synthetic and wrapped tokens</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Burn tokens and reclaim backing</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Query balances and protocol state</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">BIP-322 signature verification</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Event listening and filtering</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Transaction history tracking</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Advanced Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  ✓ <span className="ml-2">Multi-wallet support</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Network switching (mainnet/testnet)</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Gas optimization utilities</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Error handling and retries</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">TypeScript type definitions</span>
                </li>
                <li className="flex items-center">
                  ✓ <span className="ml-2">Comprehensive logging</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Development Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <Book className="h-8 w-8 mx-auto text-blue-600" />
              <h3 className="font-medium">Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Complete API reference and guides
              </p>
              <Link href="/docs/api" className="text-primary hover:underline text-sm">
                View Docs →
              </Link>
            </div>
            <div className="text-center space-y-3">
              <Github className="h-8 w-8 mx-auto text-gray-600" />
              <h3 className="font-medium">Source Code</h3>
              <p className="text-sm text-muted-foreground">
                Open source on GitHub
              </p>
              <a 
                href="https://github.com/reservebtc/sdk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                View on GitHub →
              </a>
            </div>
            <div className="text-center space-y-3">
              <Download className="h-8 w-8 mx-auto text-green-600" />
              <h3 className="font-medium">Examples</h3>
              <p className="text-sm text-muted-foreground">
                Sample projects and tutorials
              </p>
              <Link href="/docs/integration" className="text-primary hover:underline text-sm">
                Get Started →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Support & Community</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Need help with the SDK? Our community and support team are here to help.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="https://discord.gg/reservebtc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg p-3 transition-colors"
              >
                <span>💬</span>
                <span>Discord Community</span>
              </a>
              <a 
                href="https://github.com/reservebtc/sdk/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-card border hover:bg-muted/50 rounded-lg p-3 transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub Issues</span>
              </a>
              <Link 
                href="/docs/api"
                className="flex items-center justify-center space-x-2 bg-card border hover:bg-muted/50 rounded-lg p-3 transition-colors"
              >
                <Book className="h-4 w-4" />
                <span>API Docs</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/integration" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Integration Guide
          </Link>
          <Link 
            href="/docs/abi" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Smart Contract ABI
          </Link>
        </div>
      </div>
    </div>
  )
}