'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Bitcoin, 
  Wallet,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Lock,
  Unlock,
  ArrowUpDown,
  Home,
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  DollarSign,
  Zap,
  Target
} from 'lucide-react'

interface Step {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'active' | 'upcoming'
}

interface FAQItem {
  question: string
  answer: string
}

export function LearnMoreWrap() {
  const [activeStep, setActiveStep] = useState(0)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const steps: Step[] = [
    {
      id: 'mint',
      title: 'Step 1: Mint rBTC-SYNTH',
      description: 'Alexey has 1.5 BTC in wallet bc1q...abc123. He verifies address and receives 1.5 rBTC-SYNTH (soulbound). Bitcoin stays in his wallet!',
      icon: <Bitcoin className="h-6 w-6 text-orange-500" />,
      status: 'completed'
    },
    {
      id: 'wrap',
      title: 'Step 2: Wrap to wrBTC',
      description: 'Alexey wraps 1.0 rBTC-SYNTH → gets 1.0 wrBTC (transferable ERC-20). His rBTC-SYNTH is locked as collateral.',
      icon: <ArrowUpDown className="h-6 w-6 text-purple-500" />,
      status: 'active'
    },
    {
      id: 'trade',
      title: 'Step 3: Trade wrBTC',
      description: 'Alexey sells 1.0 wrBTC to Bob for $65,000 USDC. Bob now owns transferable Bitcoin certificates.',
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
      status: 'upcoming'
    },
    {
      id: 'critical',
      title: 'Critical: Only Alexey Can Unwrap',
      description: 'Bob owns wrBTC but CANNOT directly claim Bitcoin. Only Alexey (original owner) can unwrap wrBTC → rBTC-SYNTH → Bitcoin.',
      icon: <Lock className="h-6 w-6 text-red-500" />,
      status: 'upcoming'
    }
  ]

  const faqs: FAQItem[] = [
    {
      question: "What happens if the original Bitcoin owner spends their Bitcoin?",
      answer: "If Alexey spends Bitcoin from his wallet, his wrBTC becomes 'unbacked' - essentially worthless IOUs. This creates strong incentives for Bitcoin owners to maintain honest custody, as their reputation and financial standing depend on it."
    },
    {
      question: "How can wrBTC buyers protect themselves?",
      answer: "The protocol includes monitoring systems to track Bitcoin balances, reputation scoring based on wallet history, and community-driven insurance pools. Buyers should only purchase wrBTC from trusted Bitcoin holders with strong reputations."
    },
    {
      question: "What makes someone a trustworthy Bitcoin holder?",
      answer: "Factors include: long Bitcoin holding history, large stable balances, verified identity, community reputation, participation in insurance pools, and transparent wallet activity. The protocol will implement automated scoring systems."
    },
    {
      question: "Can this system scale to thousands of users?",
      answer: "Yes, through automated reputation systems, zk-proofs for balance verification, NFT certificates with metadata, and insurance mechanisms. Market forces naturally create tiers of trust and corresponding risk premiums."
    },
    {
      question: "What are the benefits for Bitcoin holders?",
      answer: "Bitcoin holders can unlock liquidity without selling Bitcoin, earn fees from wrBTC trading, maintain custody and control, build reputation for future opportunities, and participate in DeFi while keeping Bitcoin exposure."
    },
    {
      question: "How does this compare to other Bitcoin DeFi solutions?",
      answer: "Unlike centralized Bitcoin bridges or custody solutions, this is fully non-custodial and decentralized. Bitcoin owners maintain complete control while creating liquid, transferable certificates backed by reputation and transparency."
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
          <Info className="h-10 w-10 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              How wrBTC Works
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding the revolutionary Full-Reserve Bitcoin model where Bitcoin owners create transferable certificates while maintaining complete custody
          </p>
        </div>
        <div className="flex justify-center">
          <Link 
            href="/wrap"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Wrapping Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Key Concept */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
            <Zap className="h-4 w-4" />
            Core Innovation
          </div>
          <h2 className="text-3xl font-bold">The Full-Reserve Trust Model</h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            wrBTC certificates are <strong>backed by reputation, not custody</strong>. 
            Bitcoin owners create transferable IOUs while maintaining complete control of their Bitcoin. 
            Buyers trust the seller's honesty and reputation rather than a central custodian.
          </p>
        </div>
      </div>

      {/* Step-by-step Example */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Real-World Example: Alexey's Journey</h2>
          <p className="text-muted-foreground">Follow Alexey as he creates and trades Bitcoin liquidity certificates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Steps Timeline */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start space-x-4 p-4 rounded-xl cursor-pointer transition-all ${
                  activeStep === index 
                    ? 'bg-card border-2 border-primary' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className={`p-2 rounded-full ${
                  step.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                  step.status === 'active' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  'bg-gray-100 dark:bg-gray-900/30'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  step.status === 'completed' ? 'bg-green-500 border-green-500' :
                  step.status === 'active' ? 'bg-purple-500 border-purple-500' :
                  'border-gray-300'
                }`} />
              </div>
            ))}
          </div>

          {/* Visual Illustration */}
          <div className="bg-card border rounded-xl p-6">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-center">
                {steps[activeStep].title}
              </h3>
              
              {activeStep === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Bitcoin className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-sm font-medium">1.5 BTC</p>
                      <p className="text-xs text-muted-foreground">Alexey's Wallet</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium">1.5 rBTC-SYNTH</p>
                      <p className="text-xs text-muted-foreground">Soulbound</p>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm text-green-700 dark:text-green-300 text-center">
                      ✅ Bitcoin remains in Alexey's wallet. Perfect 1:1 backing guaranteed by Oracle.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium">1.0 rBTC-SYNTH</p>
                      <p className="text-xs text-muted-foreground">Locked as Collateral</p>
                    </div>
                    <ArrowUpDown className="h-6 w-6 text-purple-600" />
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Unlock className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium">1.0 wrBTC</p>
                      <p className="text-xs text-muted-foreground">Transferable ERC-20</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
                      🔄 Alexey creates transferable certificates backed by his locked rBTC-SYNTH
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-xs font-medium">Alexey</p>
                      <p className="text-xs text-muted-foreground">Sells wrBTC</p>
                    </div>
                    <div className="text-center space-y-1">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium">$65,000 USDC</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-xs font-medium">Bob</p>
                      <p className="text-xs text-muted-foreground">Buys wrBTC</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                      💰 Bob owns 1.0 wrBTC certificates. Alexey gets liquidity but keeps Bitcoin custody.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="h-10 w-10 text-red-600" />
                    </div>
                    <p className="font-semibold text-red-600">Critical Point</p>
                    <p className="text-sm">
                      Bob owns wrBTC but <strong>cannot</strong> directly unwrap it to claim Bitcoin.
                      Only Alexey can unwrap: wrBTC → rBTC-SYNTH → Bitcoin
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong>Trust-Based Model:</strong> Bob's wrBTC value depends entirely on Alexey's honesty 
                        and continued Bitcoin custody. If Alexey spends his Bitcoin, Bob's wrBTC becomes worthless.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk & Benefit Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Risks */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Risks to Consider</h3>
            </div>
            <ul className="space-y-3 text-sm text-red-700 dark:text-red-300">
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>Bitcoin Spending Risk:</strong> Original owner could spend backing Bitcoin</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>Trust Dependency:</strong> wrBTC value relies on seller's honesty</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>No Direct Recourse:</strong> Buyers cannot force Bitcoin delivery</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>Reputation System:</strong> New sellers have unproven track records</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>Market Risk:</strong> wrBTC could trade at discount to backing</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Benefits & Innovation</h3>
            </div>
            <ul className="space-y-3 text-sm text-green-700 dark:text-green-300">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>True Non-Custodial:</strong> Bitcoin never leaves owner's control</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>Instant Liquidity:</strong> Trade Bitcoin exposure without selling</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>DeFi Compatible:</strong> Use wrBTC in any Ethereum protocol</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>Reputation Building:</strong> Honest sellers build valuable trust</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>Market Efficiency:</strong> Price discovery through reputation premiums</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Real-World Applications</h2>
          <p className="text-muted-foreground mt-2">How businesses and individuals use wrBTC</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* B2B Use Case */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Corporate Treasury</h3>
              <p className="text-sm text-muted-foreground">
                Companies with Bitcoin reserves create wrBTC to show proof-of-reserves while trading liquidity for operations, 
                without ever selling their Bitcoin holdings.
              </p>
            </div>
          </div>

          {/* Lending Protocol */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">DeFi Lending</h3>
              <p className="text-sm text-muted-foreground">
                High-reputation wrBTC serves as collateral in lending protocols. Lenders assess Bitcoin holder reputation 
                and adjust interest rates accordingly.
              </p>
            </div>
          </div>

          {/* Derivatives */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Risk-Rated Derivatives</h3>
              <p className="text-sm text-muted-foreground">
                Create AAA, AA, BB rated wrBTC derivatives based on original owner's reputation, 
                enabling sophisticated risk management strategies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mt-2">Everything you need to know about the Full-Reserve model</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card border rounded-xl">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-semibold pr-4">{faq.question}</h3>
                {expandedFAQ === index ? 
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : 
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                }
              </button>
              {expandedFAQ === index && (
                <div className="px-6 pb-6 text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-8 text-center space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Ready to Create Bitcoin Liquidity?</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Join the Full-Reserve revolution. Maintain Bitcoin custody while unlocking DeFi opportunities.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/wrap"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Wrapping
            <ArrowUpDown className="h-4 w-4" />
          </Link>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-card border hover:bg-muted px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Dashboard
            <Home className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-8 border-t">
        <Link 
          href="/wrap"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to Wrap Interface
        </Link>
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}