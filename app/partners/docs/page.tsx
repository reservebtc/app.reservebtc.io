// app/partners/docs/page.tsx
'use client'

import { useState } from 'react'
import { Code, Copy, Check, Shield, Key, BarChart3 } from 'lucide-react'

export default function PartnerDocsPage() {
  const [copiedCode, setCopiedCode] = useState('')

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const codeExamples = {
    javascript: `// Fetch yield data
const response = await fetch('https://app.reservebtc.io/api/partners/yield-data', {
  headers: {
    'x-api-key': 'your-api-key-here'
  }
});
const data = await response.json();
console.log('Current yield rate:', data.metrics.recommendedYieldRate);`,
    
    python: `# Fetch yield data
import requests

headers = {'x-api-key': 'your-api-key-here'}
response = requests.get('https://app.reservebtc.io/api/partners/yield-data', headers=headers)
data = response.json()
print(f"Current yield rate: {data['metrics']['recommendedYieldRate']}")`,
    
    curl: `curl -H "x-api-key: your-api-key-here" \\
  https://app.reservebtc.io/api/partners/yield-data`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10">
            <Code className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Partner API Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Complete guide for integrating with ReserveBTC Yield Scales protocol
          </p>
        </div>

        {/* Authentication Section */}
        <section className="mb-12">
          <div className="bg-card rounded-xl border p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              Authentication
            </h2>
            <p className="text-muted-foreground mb-4">
              All API requests require an API key passed in the header:
            </p>
            <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
              x-api-key: your-api-key-here
            </div>
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-500 dark:text-amber-400">
                <strong>Security:</strong> Never expose your API key in client-side code. Always make API calls from your backend.
              </p>
            </div>
          </div>
        </section>

        {/* Endpoints Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">API Endpoints</h2>
          
          <div className="space-y-6">
            {/* Yield Data Endpoint */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Get Yield Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Retrieve current yield metrics, liquidity, and revenue projections
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                  GET
                </span>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3 font-mono text-sm mb-4">
                /api/partners/yield-data
              </div>

              {/* Response Example */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium mb-2 hover:text-primary">
                  View Response Example
                </summary>
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify({
                      protocol: "ReserveBTC Yield Scales",
                      metrics: {
                        totalRBTCSupply: 238967,
                        rbtcScalePercentage: 23.9,
                        recommendedYieldRate: 1.19,
                        totalParticipants: "encrypted"
                      },
                      trading: {
                        availableLiquidity: 3456789,
                        averageDailyVolume: 234567,
                        priceFeeds: {
                          BTC_USD: 45000,
                          RBTC_SYNTH_USD: 44950
                        }
                      }
                    }, null, 2), 'response')}
                    className="absolute top-2 right-2 p-2 bg-background border rounded hover:bg-muted"
                  >
                    {copiedCode === 'response' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-xs">
{`{
  "protocol": "ReserveBTC Yield Scales",
  "timestamp": "2025-01-14T12:00:00Z",
  "partner": {
    "id": "partner_id",
    "name": "Partner Name",
    "tier": "premium"
  },
  "metrics": {
    "totalRBTCSupply": 238967,
    "rbtcScalePercentage": 23.9,
    "recommendedYieldRate": 1.19,
    "totalParticipants": "encrypted"
  },
  "trading": {
    "availableLiquidity": 3456789,
    "averageDailyVolume": 234567,
    "priceFeeds": {
      "BTC_USD": 45000,
      "ETH_USD": 2500,
      "RBTC_SYNTH_USD": 44950,
      "last_update": "2025-01-14T12:00:00Z"
    }
  },
  "revenue": {
    "feeStructure": {
      "tradingFee": "0.3%",
      "protocolShare": "30%",
      "partnerShare": "70%"
    },
    "projectedMonthlyRevenue": {
      "daily": 493,
      "weekly": 3456,
      "monthly": 14796,
      "currency": "USD"
    }
  },
  "limits": {
    "rate_limit": 100,
    "rate_limit_window": "hour",
    "calls_remaining": 97
  }
}`}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Code Examples</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(codeExamples).map(([lang, code]) => (
              <div key={lang} className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-3 capitalize">{lang}</h3>
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(code, lang)}
                    className="absolute top-2 right-2 p-1 bg-background border rounded hover:bg-muted"
                  >
                    {copiedCode === lang ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <pre className="bg-muted/30 rounded-lg p-3 overflow-x-auto text-xs">
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <div className="bg-card rounded-xl border p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Rate Limits
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Basic Tier</p>
                <p className="text-2xl font-bold">100 req/hour</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Premium Tier</p>
                <p className="text-2xl font-bold">1000 req/hour</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Enterprise</p>
                <p className="text-2xl font-bold">Unlimited</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Notice */}
        <section>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-500 dark:text-red-400">
              <Shield className="w-5 h-5" />
              Security Best Practices
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Store API keys in environment variables, never in code</li>
              <li>• Make API calls from your backend, not frontend</li>
              <li>• Implement request signing for additional security</li>
              <li>• Monitor API usage for unusual patterns</li>
              <li>• Rotate API keys regularly</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}