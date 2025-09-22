// components/yield-scales/loyalty-program.tsx
'use client'

import { useState, useEffect } from 'react'
import { Trophy, Clock, Star, Shield, ChevronRight, Zap, Award, Crown } from 'lucide-react'
import { useAccount } from 'wagmi'

type TierType = 'bronze' | 'silver' | 'gold' | 'none'

interface LoyaltyData {
  tier: TierType
  timeInSystem: number
  nextTierIn: number
  totalEarned: number
  yieldBonus: number
  joinDate: string
}

export function LoyaltyProgram() {
  const { address } = useAccount()
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData>({
    tier: 'none',
    timeInSystem: 0,
    nextTierIn: 0,
    totalEarned: 0,
    yieldBonus: 0,
    joinDate: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      loadLoyaltyData(address)
    }
  }, [address])

  async function loadLoyaltyData(userAddress: string) {
    try {
      const response = await fetch(`/api/yield-scales/loyalty?address=${userAddress}`)
      const data = await response.json()
      setLoyaltyData(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load loyalty data')
      setLoading(false)
    }
  }

  function getTierIcon(tier: TierType) {
    switch(tier) {
      case 'gold': return '🥇'
      case 'silver': return '🥈'
      case 'bronze': return '🥉'
      default: return '⭐'
    }
  }

  function formatDuration(days: number): string {
    if (days < 30) return `${days} days`
    if (days < 365) return `${Math.floor(days / 30)} months`
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`
  }

  function getTierColor(tier: TierType) {
    switch(tier) {
      case 'gold': return 'from-yellow-500 to-amber-500'
      case 'silver': return 'from-gray-400 to-gray-500'
      case 'bronze': return 'from-orange-600 to-orange-700'
      default: return 'from-gray-600 to-gray-700'
    }
  }

  const tiers = [
    {
      name: 'bronze',
      label: 'Bronze',
      icon: '🥉',
      requirement: '30+ days',
      color: 'from-orange-600/20 to-orange-700/20',
      borderColor: 'border-orange-500/50',
      benefits: [
        { text: '+10% yield bonus', icon: TrendingUp },
        { text: 'Standard support', icon: Shield },
        { text: 'Basic analytics', icon: BarChart3 }
      ]
    },
    {
      name: 'silver',
      label: 'Silver',
      icon: '🥈',
      requirement: '180+ days',
      color: 'from-gray-400/20 to-gray-500/20',
      borderColor: 'border-gray-400/50',
      benefits: [
        { text: '+25% yield bonus', icon: TrendingUp },
        { text: 'Priority support', icon: Zap },
        { text: 'Early feature access', icon: Star },
        { text: 'Advanced analytics', icon: BarChart3 }
      ]
    },
    {
      name: 'gold',
      label: 'Gold',
      icon: '🥇',
      requirement: '365+ days',
      color: 'from-yellow-500/20 to-amber-500/20',
      borderColor: 'border-yellow-500/50',
      benefits: [
        { text: '+50% yield bonus', icon: Trophy },
        { text: 'VIP support', icon: Crown },
        { text: 'Governance voting', icon: Award },
        { text: 'Exclusive alpha access', icon: Star },
        { text: 'Pro analytics suite', icon: BarChart3 }
      ]
    }
  ]

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-card rounded-xl border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Loyalty Rewards Program</h2>
              <p className="text-sm text-muted-foreground">
                Earn bonus yields based on your participation duration
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {address ? (
          <div className="p-6 border-b">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ) : (
              <div className={`relative p-6 rounded-xl bg-gradient-to-r ${getTierColor(loyaltyData.tier)}`}>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-background/80 to-background/60 rounded-xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Current Tier</p>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getTierIcon(loyaltyData.tier)}</span>
                        <span className="text-2xl font-bold capitalize">
                          {loyaltyData.tier === 'none' ? 'Not Enrolled' : loyaltyData.tier}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Yield Bonus</p>
                      <p className="text-2xl font-bold text-primary">
                        +{loyaltyData.yieldBonus}%
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Time in System</span>
                      </div>
                      <p className="font-semibold">
                        {formatDuration(loyaltyData.timeInSystem)}
                      </p>
                    </div>
                    
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Next Tier In</span>
                      </div>
                      <p className="font-semibold">
                        {loyaltyData.nextTierIn > 0 
                          ? formatDuration(loyaltyData.nextTierIn)
                          : 'Max Tier'
                        }
                      </p>
                    </div>
                    
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Total Earned</span>
                      </div>
                      <p className="font-semibold">
                        ${loyaltyData.totalEarned.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {loyaltyData.tier !== 'gold' && loyaltyData.tier !== 'none' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress to next tier</span>
                        <span>{Math.min(100, Math.round((loyaltyData.timeInSystem / (loyaltyData.timeInSystem + loyaltyData.nextTierIn)) * 100))}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000"
                          style={{ 
                            width: `${Math.min(100, Math.round((loyaltyData.timeInSystem / (loyaltyData.timeInSystem + loyaltyData.nextTierIn)) * 100))}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 border-b">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Connect wallet to view your loyalty status</p>
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Tier Benefits Grid */}
        <div className="p-6">
          <h3 className="font-semibold mb-4">Tier Benefits</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div 
                key={tier.name}
                className={`relative rounded-xl border ${tier.borderColor} bg-gradient-to-br ${tier.color} p-6 
                  ${loyaltyData.tier === tier.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-3xl">{tier.icon}</span>
                    <h4 className="text-lg font-semibold mt-2">{tier.label}</h4>
                    <p className="text-xs text-muted-foreground">{tier.requirement}</p>
                  </div>
                  {loyaltyData.tier === tier.name && (
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <benefit.icon className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="p-6 border-t bg-muted/30">
          <h3 className="font-semibold mb-3">How It Works</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5" />
              <span>Tiers are automatically upgraded based on continuous participation</span>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5" />
              <span>Yield bonuses are applied automatically to your earnings</span>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5" />
              <span>Time resets if you withdraw all funds for more than 30 days</span>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5" />
              <span>Benefits stack with other protocol incentives</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing imports
import { TrendingUp, BarChart3 } from 'lucide-react'