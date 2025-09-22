// components/yield-scales/risk-disclosure.tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, Info, Shield, ChevronDown, ChevronUp, ExternalLink, Lock } from 'lucide-react'

export function RiskDisclosure() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const partners = [
    {
      name: 'Partner A',
      type: 'Lending Protocol',
      tvl: '$2.5B',
      audits: 3,
      insurance: 'Partial',
      rating: 'A-'
    },
    {
      name: 'Partner B', 
      type: 'DEX Aggregator',
      tvl: '$1.8B',
      audits: 2,
      insurance: 'None',
      rating: 'B+'
    },
    {
      name: 'Partner C',
      type: 'Yield Optimizer',
      tvl: '$500M',
      audits: 1,
      insurance: 'Full',
      rating: 'B'
    }
  ]

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-card rounded-xl border">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Important Risk Information
          </h2>
          <p className="text-muted-foreground text-sm">
            Understanding the risks is essential before participating in the Yield Scales Protocol
          </p>
        </div>

        {/* Partner Custody Risk */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('custody')}
            className="w-full p-6 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-500 dark:text-amber-400">
                    Partner Custody Risk
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    USDT deposits are managed by DeFi partners, not by ReserveBTC
                  </p>
                </div>
              </div>
              {expandedSection === 'custody' ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </div>
          </button>
          
          {expandedSection === 'custody' && (
            <div className="px-6 pb-6">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm">
                  <strong>Critical Information:</strong> When traders deposit USDT, funds go directly to our 
                  DeFi partner protocols. ReserveBTC does not control or have access to these deposits. 
                  You are trusting the partner protocol's security and solvency.
                </p>
              </div>

              <h4 className="font-semibold mb-3">Current DeFi Partners Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Partner</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">TVL</th>
                      <th className="text-left py-2 px-3">Audits</th>
                      <th className="text-left py-2 px-3">Insurance</th>
                      <th className="text-left py-2 px-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{partner.name}</td>
                        <td className="py-2 px-3">{partner.type}</td>
                        <td className="py-2 px-3">{partner.tvl}</td>
                        <td className="py-2 px-3">{partner.audits}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            partner.insurance === 'Full' ? 'bg-green-500/20 text-green-500' :
                            partner.insurance === 'Partial' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {partner.insurance}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium">{partner.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  * Partner details are anonymized for security. Actual partners revealed after onboarding.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bitcoin Holder Risk */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('bitcoin')}
            className="w-full p-6 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-500 dark:text-blue-400">
                    Bitcoin Holder Risk
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fee management and automatic token burning mechanisms
                  </p>
                </div>
              </div>
              {expandedSection === 'bitcoin' ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </div>
          </button>
          
          {expandedSection === 'bitcoin' && (
            <div className="px-6 pb-6">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Your Bitcoin remains in your wallet at all times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>
                      <strong>Important:</strong> If your FeeVault balance reaches zero, 
                      rBTC-SYNTH tokens will be automatically burned
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Oracle monitors your balance every 30 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>You must maintain ETH balance for operation fees</span>
                  </li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="font-medium mb-2">Fee Structure</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Base fee: 0.1% on mints</li>
                    <li>• Gas costs: ~$0.50 per sync</li>
                    <li>• No fees on burns</li>
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="font-medium mb-2">Protection Tips</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Keep 0.01 ETH minimum</li>
                    <li>• Monitor fee balance regularly</li>
                    <li>• Set up alerts for low balance</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Our Protections */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('protections')}
            className="w-full p-6 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-500 dark:text-green-400">
                    Our Protections
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transparency tools and security measures we provide
                  </p>
                </div>
              </div>
              {expandedSection === 'protections' ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </div>
          </button>
          
          {expandedSection === 'protections' && (
            <div className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4">
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Technical Protections
                  </h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Lock className="w-3 h-3 text-green-500 mt-1" />
                      <span>Multi-source Oracle verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-3 h-3 text-green-500 mt-1" />
                      <span>Smart contract audits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-3 h-3 text-green-500 mt-1" />
                      <span>Non-custodial architecture</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-3 h-3 text-green-500 mt-1" />
                      <span>Emergency pause functionality</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4">
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Transparency Tools
                  </h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ExternalLink className="w-3 h-3 text-blue-500 mt-1" />
                      <span>Real-time Oracle dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ExternalLink className="w-3 h-3 text-blue-500 mt-1" />
                      <span>Dispute resolution system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ExternalLink className="w-3 h-3 text-blue-500 mt-1" />
                      <span>Proof of reserves tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ExternalLink className="w-3 h-3 text-blue-500 mt-1" />
                      <span>Public operation logs</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Despite these protections, DeFi protocols carry inherent risks. 
                  Never invest more than you can afford to lose.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Final Warning */}
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-500 dark:text-red-400 mb-2">
                  Final Risk Warning
                </h3>
                <p className="text-sm text-muted-foreground">
                  This protocol is experimental. Smart contracts may contain bugs. 
                  Partners may fail. Oracle may malfunction. You could lose funds. 
                  Only participate with money you can afford to lose completely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}