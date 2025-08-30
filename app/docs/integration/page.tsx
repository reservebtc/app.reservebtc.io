import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Zap, Code, Database, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integration Guide | ReserveBTC Documentation',
  description: 'Complete guide for integrating ReserveBTC protocol into DeFi applications, dApps, and trading platforms with step-by-step instructions.',
  keywords: 'ReserveBTC integration, DeFi integration, dApp development, smart contract integration, API integration',
}

export default function IntegrationPage() {
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
          <h1 className="text-3xl font-bold mb-4">Integration Guide</h1>
          <p className="text-lg text-muted-foreground">
            Complete guide for integrating ReserveBTC protocol into your DeFi applications, trading platforms, 
            and other blockchain applications with step-by-step instructions and best practices.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Integration Overview</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            ReserveBTC uses an Oracle-based architecture where tokens are automatically managed based on 
            Bitcoin balance verification. Integration options include token support, Oracle monitoring, and analytics.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">🔗 Token Integration</h3>
              <p className="text-sm text-muted-foreground">
                Support rBTC-SYNTH (soulbound) and wrBTC tokens in your platform
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">🔮 Oracle Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Monitor Oracle sync events and balance updates
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">🔌 API Integration</h3>
              <p className="text-sm text-muted-foreground">
                Backend services and data analytics integration
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium">MegaETH Network Setup</h3>
                <p className="text-muted-foreground text-sm">
                  Configure your application to connect to MegaETH network with proper RPC endpoints
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium">Wallet Integration</h3>
                <p className="text-muted-foreground text-sm">
                  Support for both EVM wallets (MetaMask, WalletConnect) and Bitcoin wallets for signing
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium">Development Environment</h3>
                <p className="text-muted-foreground text-sm">
                  Node.js 16+, Web3 library (ethers.js or web3.js), and access to Bitcoin testnet for testing
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Integration Steps</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Install SDK</h3>
                <p className="text-muted-foreground mb-3">
                  Add ReserveBTC SDK to your project dependencies
                </p>
                <div className="bg-black rounded-lg p-3">
                  <code className="text-green-400 text-sm">npm install @reservebtc/sdk</code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Initialize SDK</h3>
                <p className="text-muted-foreground mb-3">
                  Set up ReserveBTC instance with your provider
                </p>
                <div className="bg-muted/30 rounded-lg p-3">
                  <pre className="text-sm text-muted-foreground overflow-x-auto">
{`import { ReserveBTC } from '@reservebtc/sdk';

const reserveBTC = new ReserveBTC({
  network: 'mainnet',
  provider: window.ethereum,
});`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Add Token Support</h3>
                <p className="text-muted-foreground mb-3">
                  Configure your application to recognize ReserveBTC tokens
                </p>
                <div className="bg-muted/30 rounded-lg p-3">
                  <pre className="text-sm text-muted-foreground overflow-x-auto">
{`const tokens = {
  'rBTC-SYNTH': {
    address: '0x9E8A4F2B7C1d3e6f8b4A5c9D2e7F1b8c3A4d6E9F',
    decimals: 8,
    symbol: 'rBTC-SYNTH'
  },
  'wrBTC': {
    address: '0x3B7d4C5e6F8a9B2c1D4e7F9a2B5c8D1e4F7a9C2d',
    decimals: 8,
    symbol: 'wrBTC'
  }
};`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Implement Core Features</h3>
                <p className="text-muted-foreground mb-3">
                  Add minting, burning, and balance checking functionality
                </p>
                <div className="bg-muted/30 rounded-lg p-3">
                  <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Check balances
const synthBalance = await reserveBTC.getSynthBalance();
const wrappedBalance = await reserveBTC.getWrappedBalance();

// Mint tokens
await reserveBTC.mintSynth({
  btcAddress: userBtcAddress,
  amount: mintAmount,
  signature: bip322Signature
});`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Code className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Frontend Integration</h3>
            </div>
            <p className="text-muted-foreground">
              React, Vue, Angular applications with wallet connection and user interfaces.
            </p>
            <Link href="#frontend-guide" className="text-primary hover:underline text-sm">
              View Frontend Guide →
            </Link>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Backend Integration</h3>
            </div>
            <p className="text-muted-foreground">
              Server-side integration for data analytics, automated trading, and monitoring.
            </p>
            <Link href="#backend-guide" className="text-primary hover:underline text-sm">
              View Backend Guide →
            </Link>
          </div>
        </div>

        <div id="frontend-guide" className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Frontend Integration</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">React Example - Oracle Monitoring</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function ReserveBTCDashboard() {
  const [balance, setBalance] = useState('0');
  const [syncEvents, setSyncEvents] = useState([]);
  const [provider, setProvider] = useState(null);
  
  // Contract addresses on MegaETH Testnet
  const SYNTH_ADDRESS = '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB';
  const ORACLE_ADDRESS = '0x717D12a23Bb46743b15019a52184DF7F250B061a';

  useEffect(() => {
    const initProvider = async () => {
      // Connect to MegaETH Testnet
      const p = new ethers.JsonRpcProvider('https://carrot.megaeth.com/rpc');
      setProvider(p);
      
      // Monitor Oracle sync events
      const oracleContract = new ethers.Contract(
        ORACLE_ADDRESS, 
        ['event Synced(address indexed user, uint64, int64, uint256, uint32, uint64)'],
        p
      );
      
      oracleContract.on('Synced', (user, newBalance, delta) => {
        setSyncEvents(prev => [...prev, {
          user,
          newBalance: newBalance.toString(),
          delta: delta.toString(),
          timestamp: Date.now()
        }]);
      });
    };
    
    initProvider();
  }, []);

  const fetchBalance = async (userAddress) => {
    if (!provider || !userAddress) return;
    
    const synthContract = new ethers.Contract(
      SYNTH_ADDRESS,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    
    const balance = await synthContract.balanceOf(userAddress);
    setBalance(ethers.formatUnits(balance, 8));
  };

  return (
    <div className="reservebtc-dashboard">
      <h2>ReserveBTC Oracle Monitor</h2>
      <div>
        <h3>rBTC-SYNTH Balance</h3>
        <p>{balance} BTC</p>
        <button onClick={() => fetchBalance(userAddress)}>
          Refresh Balance
        </button>
      </div>
      
      <div>
        <h3>Recent Oracle Syncs</h3>
        {syncEvents.map((event, i) => (
          <div key={i}>
            User: {event.user}<br/>
            Balance: {(event.newBalance / 1e8).toFixed(8)} BTC<br/>
            Delta: {(event.delta / 1e8).toFixed(8)} BTC
          </div>
        ))}
      </div>
    </div>
  );
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Wallet Connection Best Practices</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Security First</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Always verify contract addresses and implement proper error handling
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-amber-100">User Experience</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Provide clear feedback during transactions and handle loading states
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="backend-guide" className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Backend Integration</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Node.js Server Example</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`const express = require('express');
const { ReserveBTC } = require('@reservebtc/sdk');

const app = express();
app.use(express.json());

// Initialize SDK with server-side provider
const reserveBTC = new ReserveBTC({
  network: 'mainnet',
  privateKey: process.env.PRIVATE_KEY // For server-side transactions
});

// API endpoint to get protocol stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      totalSynthSupply: await reserveBTC.getTotalSynthSupply(),
      totalWrappedSupply: await reserveBTC.getTotalWrappedSupply(),
      totalUsers: await reserveBTC.getTotalUsers()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to verify Bitcoin signatures
app.post('/api/verify-signature', async (req, res) => {
  const { btcAddress, signature, message } = req.body;
  
  try {
    const isValid = await reserveBTC.verifyBitcoinSignature({
      address: btcAddress,
      signature,
      message
    });
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for transaction monitoring
app.post('/webhook/transactions', async (req, res) => {
  const { transactionHash, eventType } = req.body;
  
  // Process the transaction event
  console.log(\`Received \${eventType} event: \${transactionHash}\`);
  
  // Update database, send notifications, etc.
  
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('ReserveBTC backend running on port 3000');
});`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Event Monitoring</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Set up event listeners for real-time monitoring
reserveBTC.on('synthMinted', (event) => {
  console.log('New synthetic tokens minted:', {
    user: event.user,
    amount: event.amount,
    timestamp: event.timestamp
  });
  
  // Update analytics, send notifications, etc.
  updateAnalytics('mint', event);
  notifyUser(event.user, 'mint_successful', event.amount);
});

reserveBTC.on('synthBurned', (event) => {
  console.log('Synthetic tokens burned:', event);
  updateAnalytics('burn', event);
});

// Historical data analysis
const getHistoricalMints = async (fromBlock, toBlock) => {
  const events = await reserveBTC.getMintEvents({
    fromBlock,
    toBlock
  });
  
  return events.map(event => ({
    timestamp: new Date(event.timestamp * 1000),
    amount: event.amount,
    user: event.user,
    txHash: event.transactionHash
  }));
};`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">DeFi Platforms</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Add rBTC-SYNTH and wrBTC to supported tokens</li>
                <li>• Implement lending pools with ReserveBTC tokens</li>
                <li>• Create liquidity pairs on DEXs</li>
                <li>• Yield farming with synthetic Bitcoin</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Trading Platforms</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Support rBTC-SYNTH and wrBTC trading</li>
                <li>• Real-time price feeds integration</li>
                <li>• Portfolio management tools</li>
                <li>• Advanced trading features</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Analytics Platforms</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Protocol metrics and dashboards</li>
                <li>• User activity tracking</li>
                <li>• Volume and TVL analytics</li>
                <li>• Historical data analysis</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Wallet Applications</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Native token support</li>
                <li>• Minting and burning UI</li>
                <li>• Portfolio tracking</li>
                <li>• Transaction history</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Testing & Development</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Use our testnet environment to develop and test your integration before going live.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-4">
                <h3 className="font-medium mb-2">Testnet Configuration</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Network: MegaETH Testnet</p>
                  <p>Chain ID: 123456</p>
                  <p>RPC URL: https://testnet.megaeth.io</p>
                </div>
              </div>
              <div className="bg-card rounded-lg p-4">
                <h3 className="font-medium mb-2">Test Tokens</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Get test ETH from faucet</p>
                  <p>Use Bitcoin testnet addresses</p>
                  <p>Generate test signatures</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Support & Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <ExternalLink className="h-8 w-8 mx-auto text-blue-600" />
              <h3 className="font-medium">API Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Complete SDK reference
              </p>
              <Link href="/docs/api" className="text-primary hover:underline text-sm">
                View API Docs →
              </Link>
            </div>
            <div className="text-center space-y-3">
              <Code className="h-8 w-8 mx-auto text-green-600" />
              <h3 className="font-medium">Code Examples</h3>
              <p className="text-sm text-muted-foreground">
                Sample implementations
              </p>
              <a 
                href="https://github.com/reservebtc/examples" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                View Examples →
              </a>
            </div>
            <div className="text-center space-y-3">
              <Shield className="h-8 w-8 mx-auto text-purple-600" />
              <h3 className="font-medium">Security Guide</h3>
              <p className="text-sm text-muted-foreground">
                Best practices and security
              </p>
              <Link href="/docs/contract-security" className="text-primary hover:underline text-sm">
                Security Guide →
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/sdk" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            SDK Documentation
          </Link>
          <Link 
            href="/docs/api" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            API Reference
          </Link>
        </div>
      </div>
    </div>
  )
}