import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Code, Globe, Key, Database, Zap, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Documentation | ReserveBTC',
  description: 'Complete API reference for ReserveBTC protocol including Oracle endpoints, balance queries, and signature verification.',
  keywords: 'ReserveBTC API, Oracle API, Bitcoin balance API, BIP-322 verification API, DeFi API documentation',
}

export default function APIPage() {
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
          <h1 className="text-3xl font-bold mb-4">API Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Complete API reference for integrating with the ReserveBTC protocol, including Oracle endpoints, 
            balance verification, and signature validation.
          </p>
        </div>

        {/* API Overview */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">API Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <Globe className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">REST API</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Standard HTTP endpoints for balance queries, verification, and Oracle data
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <Zap className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">Real-time Updates</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                WebSocket connections for live balance updates and synchronization events
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <Key className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Authentication</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Signature-based authentication using EVM wallets and BIP-322 verification
              </p>
            </div>
          </div>
        </div>

        {/* Base URLs */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Base URLs</h2>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">PRODUCTION</span>
                <span className="font-mono text-sm">https://app.reservebtc.io/api</span>
              </div>
              <p className="text-sm text-muted-foreground">Main production API endpoint</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">TESTNET</span>
                <span className="font-mono text-sm">https://testnet.reservebtc.io/api</span>
              </div>
              <p className="text-sm text-muted-foreground">Testnet API for development and testing</p>
            </div>
          </div>
        </div>

        {/* Oracle API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Database className="h-6 w-6 mr-2" />
            Oracle API
          </h2>

          {/* GET Oracle Status */}
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">GET</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/oracle/status</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Get Oracle system status and configuration</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "committee": "0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b",
    "minConfirmations": "1",
    "maxFeePerSync": "10000000000000000",
    "chainId": 6342,
    "contractAddress": "0x717D12a23Bb46743b15019a52184DF7F250B061a"
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* POST Oracle Sync */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">POST</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/oracle/sync</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Synchronize user's Bitcoin balance with smart contracts</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "userAddress": "0x1234...5678",
  "btcBalance": "0.12345678",
  "blockHeight": 870000,
  "timestamp": 1698765432
}`}</pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "transactionHash": "0xabc123...",
  "gasUsed": "89432"
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Balance Verification API</h2>
          
          <div className="space-y-6">
            {/* GET Balance */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">GET</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/balance/:address</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Get Bitcoin balance for a specific address</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Parameters:</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                    <div className="text-sm">
                      <strong>address</strong> (string): Bitcoin address (any format)
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "balance": "0.12345678",
    "balanceSats": 12345678,
    "unconfirmed": "0.00000000",
    "txCount": 15,
    "lastUpdated": 1698765432
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* POST Verify Signature */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">POST</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/verify/bip322</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Verify BIP-322 signature for address ownership</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "message": "ReserveBTC Verification\\nAddress: bc1q...\\nEVM: 0x123...\\nTimestamp: 1698765432",
  "signature": "H4sIAAAAAAACA..."
}`}</pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "valid": true,
  "data": {
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "addressType": "P2WPKH",
    "verified": true,
    "timestamp": 1698765432
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">User Management API</h2>
          
          <div className="space-y-6">
            {/* GET User Profile */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">GET</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/user/:evmAddress</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Get user profile and token balances</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "evmAddress": "0x1234...5678",
    "btcAddresses": [
      {
        "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "verified": true,
        "lastSynced": 1698765432
      }
    ],
    "tokenBalances": {
      "rbtcSynth": "0.12345678",
      "wrbtc": "0.05000000"
    },
    "totalBtcBacked": "0.17345678"
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* POST Register User */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">POST</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/user/register</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Register user with verified Bitcoin address</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "evmAddress": "0x1234...5678",
  "btcAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "signature": "H4sIAAAAAAACA...",
  "message": "ReserveBTC Verification..."
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Token Information API</h2>
          
          <div className="space-y-6">
            {/* GET Token Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">GET</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/tokens/info</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Get information about ReserveBTC tokens</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "rbtcSynth": {
      "address": "0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB",
      "name": "ReserveBTC Synthetic",
      "symbol": "rBTC-SYNTH",
      "decimals": 8,
      "totalSupply": "123.45678900",
      "soulbound": true
    },
    "wrbtc": {
      "address": "0xa10FC332f12d102Dddf431F8136E4E89279EFF87",
      "name": "Wrapped ReserveBTC",
      "symbol": "wrBTC",
      "decimals": 8,
      "totalSupply": "67.89012345",
      "transferable": true
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Responses */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Error Responses</h2>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Standard Error Format</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}`}</pre>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="font-semibold mb-2">Common HTTP Status Codes</h4>
                <ul className="text-sm space-y-1">
                  <li><code>200</code> - Success</li>
                  <li><code>400</code> - Bad Request</li>
                  <li><code>401</code> - Unauthorized</li>
                  <li><code>403</code> - Forbidden</li>
                  <li><code>404</code> - Not Found</li>
                  <li><code>429</code> - Rate Limited</li>
                  <li><code>500</code> - Internal Server Error</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="font-semibold mb-2">Common Error Codes</h4>
                <ul className="text-sm space-y-1">
                  <li><code>INVALID_ADDRESS</code> - Invalid Bitcoin address</li>
                  <li><code>SIGNATURE_INVALID</code> - BIP-322 signature failed</li>
                  <li><code>BALANCE_MISMATCH</code> - Balance verification failed</li>
                  <li><code>RATE_LIMITED</code> - Too many requests</li>
                  <li><code>ORACLE_ERROR</code> - Oracle system error</li>
                  <li><code>CONTRACT_ERROR</code> - Smart contract error</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">⚡ Rate Limiting</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Limits per IP Address</h3>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• Balance queries: 100 requests/minute</li>
                <li>• Signature verification: 10 requests/minute</li>
                <li>• Oracle sync: 5 requests/minute</li>
                <li>• User registration: 3 requests/hour</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Response Headers</h3>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• <code>X-RateLimit-Limit</code>: Request limit</li>
                <li>• <code>X-RateLimit-Remaining</code>: Requests left</li>
                <li>• <code>X-RateLimit-Reset</code>: Reset timestamp</li>
                <li>• <code>Retry-After</code>: Seconds to wait</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SDK and Libraries */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">SDKs and Libraries</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">JavaScript/TypeScript</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Official SDK for web applications and Node.js
              </p>
              <Link href="/docs/sdk" className="text-primary hover:underline text-sm font-medium">
                Documentation →
              </Link>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">Python</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Python library for backend integrations
              </p>
              <a 
                href="https://github.com/reservebtc/python-sdk" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm font-medium flex items-center"
              >
                GitHub <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Go</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Go library for high-performance applications
              </p>
              <a 
                href="https://github.com/reservebtc/go-sdk" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm font-medium flex items-center"
              >
                GitHub <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/sdk" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            SDK Documentation
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