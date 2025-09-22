// app/yield-scales/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Shield, Zap, Scale, ChevronRight, Info, Lock, Calculator } from 'lucide-react'
import { useAccount } from 'wagmi'

export default function YieldScalesPage() {
  const { address } = useAccount()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScale, setSelectedScale] = useState<'bitcoin' | 'trader'>('bitcoin')

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [address])

  async function loadMetrics() {
    try {
      const response = await fetch('/api/yield-scales/metrics')
      const data = await response.json()
      setMetrics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load metrics')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10">
            <Scale className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Yield Scales Protocol
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Dynamic yield generation based on balanced liquidity. 
            Your capital stays protected while yield scales with participation.
          </p>
          
          {/* Security Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">100% Principal Protection</span>
          </div>
        </div>

        {/* Live Scales Visualization */}
        <ScalesVisualization metrics={metrics} loading={loading} />

        {/* Live Metrics Grid */}
        <LiveMetrics metrics={metrics} />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Participation Options */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <BitcoinHolderSection metrics={metrics} address={address} />
          <TraderSection metrics={metrics} />
        </div>

        {/* Yield Calculator */}
        <YieldCalculator metrics={metrics} />

        {/* Risk & Security */}
        <RiskAndSecurity />
      </div>
    </div>
  )
}

// Scales Visualization Component
function ScalesVisualization({ metrics, loading }: any) {
  const usdtScale = metrics?.scales?.usdt || 100
  const rbtcScale = metrics?.scales?.rbtc || 0
  const currentYield = metrics?.currentYield || 0

  return (
    <div className="mb-12 p-8 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 rounded-2xl border">
      <h2 className="text-2xl font-semibold text-center mb-8">Live Balance Scales</h2>
      
      <div className="relative max-w-2xl mx-auto">
        {/* Scale Animation */}
        <div className="flex items-center justify-center gap-8">
          {/* USDT Scale */}
          <div className="flex-1 text-center">
            <div className={`transform transition-all duration-1000 ${
              usdtScale > rbtcScale ? 'translate-y-4' : 'translate-y-0'
            }`}>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6">
                <p className="text-white font-bold text-2xl">{usdtScale}%</p>
                <p className="text-white/80 text-sm mt-1">USDT Scale</p>
              </div>
            </div>
          </div>

          {/* Center Pivot */}
          <div className="relative">
            <Scale className="w-12 h-12 text-primary" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-2xl font-bold text-primary">{currentYield.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">APY</p>
            </div>
          </div>

          {/* rBTC Scale */}
          <div className="flex-1 text-center">
            <div className={`transform transition-all duration-1000 ${
              rbtcScale > usdtScale ? 'translate-y-4' : 'translate-y-0'
            }`}>
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6">
                <p className="text-white font-bold text-2xl">{rbtcScale}%</p>
                <p className="text-white/80 text-sm mt-1">rBTC Scale</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Balance Bar */}
        <div className="mt-12 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-1000"
            style={{ width: `${(usdtScale + rbtcScale) / 2}%` }}
          />
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Scales update in real-time as participants join or leave
      </p>
    </div>
  )
}

// Live Metrics Component
function LiveMetrics({ metrics }: any) {
  const stats = [
    {
      label: 'Total Participants',
      value: metrics?.participants || 0,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Current APY',
      value: `${metrics?.currentYield?.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Total Locked',
      value: `$${metrics?.totalLocked?.toLocaleString() || 0}`,
      icon: Lock,
      color: 'text-purple-500'
    },
    {
      label: 'Yield Distributed',
      value: `$${metrics?.totalDistributed?.toLocaleString() || 0}`,
      icon: Zap,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {stats.map((stat, index) => (
        <div key={index} className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      title: 'Bitcoin Holders',
      description: 'Provide rBTC-SYNTH liquidity without transferring Bitcoin',
      icon: '₿'
    },
    {
      title: 'Traders',
      description: 'Deposit USDT for yield generation (principal protected)',
      icon: '💰'
    },
    {
      title: 'Balance Scales',
      description: 'Yield rate adjusts based on balance between both sides',
      icon: '⚖️'
    },
    {
      title: 'Earn Yield',
      description: 'Both parties earn proportional to their contribution',
      icon: '📈'
    }
  ]

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="bg-card rounded-xl border p-6 text-center">
            <div className="text-3xl mb-3">{step.icon}</div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Bitcoin Holder Section
function BitcoinHolderSection({ metrics, address }: any) {
  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border p-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">₿</span>
        For Bitcoin Holders
      </h3>
      
      <ul className="space-y-3 mb-6">
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">Keep Bitcoin in your wallet - never transfer custody</span>
        </li>
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">Earn yield from trading activity automatically</span>
        </li>
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">No impermanent loss or liquidation risk</span>
        </li>
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">Withdraw anytime without penalties</span>
        </li>
      </ul>

      {address ? (
        <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-all">
          Check Eligibility
        </button>
      ) : (
        <button className="w-full bg-muted text-muted-foreground font-medium py-3 rounded-lg cursor-not-allowed">
          Connect Wallet to Participate
        </button>
      )}
    </div>
  )
}

// Trader Section
function TraderSection({ metrics }: any) {
  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border p-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">💱</span>
        For Traders
      </h3>
      
      <ul className="space-y-3 mb-6">
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">100% principal protection - never lose your deposit</span>
        </li>
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">Dynamic yield based on market activity</span>
        </li>
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">Access exclusive rBTC-SYNTH trading market</span>
        </li>
        <li className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-primary mt-1" />
          <span className="text-sm">Compound returns with auto-reinvestment</span>
        </li>
      </ul>

      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all">
        Learn More
      </button>
    </div>
  )
}

// Yield Calculator Component
function YieldCalculator({ metrics }: any) {
  const [amount, setAmount] = useState('10000')
  const [type, setType] = useState<'bitcoin' | 'trader'>('bitcoin')
  
  const calculateYield = () => {
    const base = parseFloat(amount) || 0
    const rate = metrics?.currentYield || 5
    const annual = base * (rate / 100)
    const monthly = annual / 12
    return { monthly: monthly.toFixed(2), annual: annual.toFixed(2) }
  }

  const yields = calculateYield()

  return (
    <div className="mb-12 bg-card rounded-xl border p-8">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Calculator className="w-6 h-6" />
        Yield Calculator
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Participant Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as 'bitcoin' | 'trader')}
              className="w-full px-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="bitcoin">Bitcoin Holder (rBTC)</option>
              <option value="trader">Trader (USDT)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount ({type === 'bitcoin' ? 'sats' : 'USDT'})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter amount"
            />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Estimated Returns</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly</span>
              <span className="font-bold">${yields.monthly}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual</span>
              <span className="font-bold text-lg">${yields.annual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current APY</span>
              <span className="font-bold text-primary">{metrics?.currentYield?.toFixed(1) || 5}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4">
        * Estimates based on current scale balance. Actual returns may vary.
      </p>
    </div>
  )
}

// Risk & Security Section
function RiskAndSecurity() {
  return (
    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border p-8">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Info className="w-6 h-6" />
        Risk Disclosure & Security
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-3">Risks</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Yield varies based on participation levels</li>
            <li>• Smart contract risk (audited but not risk-free)</li>
            <li>• Market volatility may affect returns</li>
            <li>• No guaranteed minimum yield</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Security Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Non-custodial for Bitcoin holders</li>
            <li>• Principal protection for traders</li>
            <li>• Multi-sig treasury management</li>
            <li>• Regular third-party audits</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          🔒 All participant data is encrypted. Only aggregated metrics are displayed publicly.
        </p>
      </div>
    </div>
  )
}