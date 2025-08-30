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
          <h2 className="text-xl font-semibold mb-4">Base URL</h2>
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">TESTNET</span>
              <span className="font-mono text-sm">https://app.reservebtc.io/api</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Currently deployed on MegaETH Testnet. All API endpoints are prefixed with this base URL.
            </p>
          </div>
        </div>

        {/* Oracle API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Database className="h-6 w-6 mr-2" />
            Oracle API
          </h2>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> Oracle API endpoints are used by the Oracle server for automated balance synchronization. 
              Direct user access requires Oracle committee authorization.
            </p>
          </div>

          {/* GET Oracle Status */}
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">GET</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/api/oracle/sync</code>
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
                <code className="bg-muted px-2 py-1 rounded text-sm">/api/oracle/sync</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Synchronize user's Bitcoin balance with smart contracts. Requires Oracle committee authorization.
              </p>
              
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

        {/* Wallet Verification API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Wallet Verification API</h2>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> This endpoint is currently a mock implementation for testing purposes. 
              Real BIP-322 verification will be implemented in production.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* POST Verify Wallet */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">POST</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/api/verify-wallet</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Verify Bitcoin address ownership using BIP-322 signature</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "bitcoinAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "ethereumAddress": "0x1234567890123456789012345678901234567890",
  "message": "ReserveBTC Verification Message",
  "signature": "base64_encoded_signature"
}`}</pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "bitcoinAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "ethereumAddress": "0x1234567890123456789012345678901234567890",
    "verified": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Minting API */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Token Minting API</h2>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Important:</strong> This endpoint is a mock implementation. In the actual Oracle-based architecture, 
              tokens are minted automatically by the Oracle when Bitcoin balance changes are detected.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* POST Mint rBTC */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">POST</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">/api/mint-rbtc</code>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Mock endpoint for rBTC token minting (actual minting is handled by Oracle)
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "amount": "0.12345678",
  "bitcoinAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "ethereumAddress": "0x1234567890123456789012345678901234567890",
  "amountSatoshis": 12345678
}`}</pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Example:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "txHash": "0xabc123def456...",
  "amount": "0.12345678",
  "rbtcAmount": "0.12345678"
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

        {/* API Notes */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">⚡ Important Notes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Implementation Status</h3>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• Only 4 API endpoints are currently implemented</li>
                <li>• Oracle sync endpoint is fully functional for committee members</li>
                <li>• Wallet verification and minting endpoints are mock implementations</li>
                <li>• Real Bitcoin integration via Oracle server (oracle-server.js)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Oracle-Based Architecture</h3>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• Users don't directly mint tokens via API</li>
                <li>• Oracle monitors Bitcoin addresses and automatically syncs balances</li>
                <li>• Token minting/burning is handled by Oracle sync function</li>
                <li>• See integration guide for proper usage patterns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SDK and Libraries */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Development Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">SDK (Planned)</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                JavaScript/TypeScript SDK is in development
              </p>
              <Link href="/docs/sdk" className="text-primary hover:underline text-sm font-medium">
                Documentation →
              </Link>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">Smart Contracts</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Complete ABI documentation and examples
              </p>
              <Link href="/docs/abi" className="text-primary hover:underline text-sm font-medium">
                View ABIs →
              </Link>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Integration Guide</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Step-by-step integration examples
              </p>
              <Link href="/docs/integration" className="text-primary hover:underline text-sm font-medium">
                Get Started →
              </Link>
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