// components/yield-scales/realistic-yield-projections.tsx
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Info, Calculator, ChevronRight } from 'lucide-react'

export function RealisticYieldProjections() {
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'moderate' | 'optimistic'>('conservative')
  const [marketData, setMarketData] = useState<any>(null)

  useEffect(() => {
    // Load encrypted market data
    fetch('/api/yield-scales/projections')
      .then(res => res.json())
      .then(data => setMarketData(data))
      .catch(console.error)
  }, [])

  const scenarios = {
    conservative: {
      title: 'Conservative Scenario',
      subtitle: 'Most Likely Outcome',
      color: 'from-blue-500 to-cyan-500',
      yields: {
        baseDeFi: { min: 2, max: 3 },
        tradingFees: { min: 1, max: 2 },
        arbitrage: { min: 0, max: 0 },
        total: { min: 3, max: 5 }
      }
    },
    moderate: {
      title: 'Moderate Scenario',
      subtitle: 'Average Market Activity',
      color: 'from-purple-500 to-pink-500',
      yields: {
        baseDeFi: { min: 3, max: 4 },
        tradingFees: { min: 2, max: 3 },
        arbitrage: { min: 0, max: 1 },
        total: { min: 5, max: 8 }
      }
    },
    optimistic: {
      title: 'Optimistic Scenario',
      subtitle: 'High Activity Periods',
      color: 'from-green-500 to-emerald-500',
      yields: {
        baseDeFi: { min: 3, max: 4 },
        tradingFees: { min: 3, max: 5 },
        arbitrage: { min: 1, max: 3 },
        total: { min: 7, max: 12 }
      }
    }
  }

  const currentScenario = scenarios[selectedScenario]

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-card rounded-xl border">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold mb-2">📊 Realistic Yield Expectations</h2>
          <p className="text-muted-foreground text-sm">
            Transparent projections based on market conditions
          </p>
        </div>

        {/* Important Disclaimer */}
        <div className="p-6 border-b">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-500 dark:text-amber-400 mb-1">
                  Important Disclaimer
                </h3>
                <p className="text-sm text-muted-foreground">
                  Yields are not guaranteed and depend entirely on market activity. 
                  These are estimates based on current conditions and historical data. 
                  Your actual returns may be significantly different.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => setSelectedScenario(key as any)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedScenario === key 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {scenario.title}
              </button>
            ))}
          </div>

          {/* Selected Scenario Details */}
          <div className={`bg-gradient-to-r ${currentScenario.color} p-[1px] rounded-lg`}>
            <div className="bg-background rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-1">{currentScenario.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{currentScenario.subtitle}</p>
              
              <div className="space-y-4">
                <YieldComponent
                  label="Base DeFi Yield"
                  min={currentScenario.yields.baseDeFi.min}
                  max={currentScenario.yields.baseDeFi.max}
                  icon={TrendingUp}
                />
                <YieldComponent
                  label="Trading Activity Fees"
                  min={currentScenario.yields.tradingFees.min}
                  max={currentScenario.yields.tradingFees.max}
                  icon={Calculator}
                />
                {currentScenario.yields.arbitrage.max > 0 && (
                  <YieldComponent
                    label="Arbitrage Bonuses"
                    min={currentScenario.yields.arbitrage.min}
                    max={currentScenario.yields.arbitrage.max}
                    icon={TrendingUp}
                  />
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Expected Annual Yield</span>
                    <span className="text-xl font-bold text-primary">
                      {currentScenario.yields.total.min}-{currentScenario.yields.total.max}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Factors Affecting Yield */}
        <div className="p-6 border-b">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Factors Affecting Yield
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Number of active Bitcoin holders',
              'Trading volume and frequency',
              'Market volatility and arbitrage opportunities',
              'DeFi partner performance',
              'Protocol adoption and growth',
              'Overall crypto market conditions'
            ].map((factor, index) => (
              <div key={index} className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm text-muted-foreground">{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Performance Notice */}
        <div className="p-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-500 dark:text-blue-400 mb-1">
                  Historical Performance
                </h3>
                <p className="text-sm text-muted-foreground">
                  Past performance does not indicate future results. The protocol is new and 
                  actual yields will depend on real market adoption and activity levels.
                </p>
                {marketData && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg. DeFi Yield (30d)</p>
                      <p className="font-semibold">{marketData.avgDeFiYield || 'N/A'}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active Participants</p>
                      <p className="font-semibold">{marketData.activeParticipants || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Yield Component Helper
function YieldComponent({ 
  label, 
  min, 
  max, 
  icon: Icon 
}: { 
  label: string
  min: number
  max: number
  icon: any 
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">
        {min === max ? `${min}%` : `${min}-${max}%`} annually
      </span>
    </div>
  )
}