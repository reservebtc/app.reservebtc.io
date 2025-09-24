// app/partners/page.tsx
'use client'

import { useState } from 'react'
import { Shield, TrendingUp, Users, Code, CheckCircle, ArrowRight, Lock, Zap, BarChart3 } from 'lucide-react'

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              DeFi Partner Program
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join the revolutionary Bitcoin yield ecosystem. Enable your users to earn from Bitcoin holdings without custody risk.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('application')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Apply Now
              </button>
              <button 
                onClick={() => document.getElementById('documentation')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 bg-card border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="container mx-auto px-4 py-16">
        <PartnerValueProposition />
      </section>

      {/* Requirements */}
      <section className="container mx-auto px-4 py-16 bg-card/30">
        <PartnerRequirements />
      </section>

      {/* Integration Guide */}
      <section id="documentation" className="container mx-auto px-4 py-16">
        <IntegrationGuide />
      </section>

      {/* Partner Comparison */}
      <section className="container mx-auto px-4 py-16 bg-card/30">
        <PartnerComparisonTable />
      </section>

      {/* Application Form */}
      <section id="application" className="container mx-auto px-4 py-16">
        <PartnerApplicationForm />
      </section>
    </div>
  )
}

// Value Proposition Component
function PartnerValueProposition() {
  const benefits = [
    {
      icon: TrendingUp,
      title: 'New Revenue Streams',
      description: 'Access Bitcoin holders who previously avoided DeFi. Premium fees from monopolistic position.',
      metrics: '$2-5M monthly volume projected'
    },
    {
      icon: Users,
      title: 'Premium User Base',
      description: 'Bitcoin maximalists with significant capital and long-term investment mindset.',
      metrics: '10,000+ potential users'
    },
    {
      icon: Shield,
      title: 'Zero Custody Risk',
      description: 'Users keep Bitcoin in their wallets. You only manage USDT deposits.',
      metrics: '100% non-custodial for BTC'
    },
    {
      icon: Zap,
      title: 'Quick Integration',
      description: 'Simple API integration. Go live in days, not months.',
      metrics: '< 1 week integration time'
    }
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-12">Why Partner with ReserveBTC?</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <benefit.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
            <p className="text-xs font-medium text-primary">{benefit.metrics}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Requirements Component
function PartnerRequirements() {
  const requirements = {
    technical: [
      'Proven DeFi protocol with $100M+ TVL',
      'Smart contract audits from reputable firms',
      'API infrastructure for real-time integration',
      'Multi-chain capability (optional but preferred)'
    ],
    business: [
      'Regulatory compliance in operating jurisdictions',
      'Insurance coverage for user funds',
      'Professional team with DeFi experience',
      'Commitment to long-term partnership'
    ]
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-12">Partner Requirements</h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Technical Requirements
          </h3>
          <ul className="space-y-3">
            {requirements.technical.map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{req}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Business Requirements
          </h3>
          <ul className="space-y-3">
            {requirements.business.map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Integration Guide Component
function IntegrationGuide() {
  const steps = [
    { step: 1, title: 'Apply & Review', description: 'Submit application and undergo technical review', time: '1-2 days' },
    { step: 2, title: 'Contract Signing', description: 'Sign partnership agreement with revenue terms', time: '1 day' },
    { step: 3, title: 'API Integration', description: 'Implement vault creation and yield distribution', time: '3-5 days' },
    { step: 4, title: 'Testing', description: 'Testnet deployment and integration testing', time: '2-3 days' },
    { step: 5, title: 'Launch', description: 'Mainnet deployment and marketing campaign', time: '1 day' }
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-12">Integration Process</h2>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {steps.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
              </div>
              <div className="flex-1 pb-8 border-l-2 border-muted pl-4 ml-5">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                <span className="text-xs text-primary">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-card rounded-xl border p-6">
          <h3 className="font-semibold mb-4">API Documentation</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-mono">POST /api/vault/create</span>
              <span className="text-xs text-muted-foreground">Create USDT vault</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-mono">GET /api/vault/balance</span>
              <span className="text-xs text-muted-foreground">Query vault balance</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-mono">POST /api/yield/distribute</span>
              <span className="text-xs text-muted-foreground">Distribute yields</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Partner Comparison Component
function PartnerComparisonTable() {
  const partners = [
    { name: 'Partner A', type: 'Lending', tvl: '$2.5B', audits: 3, insurance: 'Partial', fee: '15%', status: 'Active' },
    { name: 'Partner B', type: 'DEX', tvl: '$1.8B', audits: 2, insurance: 'None', fee: '20%', status: 'Pending' },
    { name: 'Partner C', type: 'Yield', tvl: '$500M', audits: 1, insurance: 'Full', fee: '10%', status: 'Review' }
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-12">Current Partners</h2>
      <div className="max-w-6xl mx-auto overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Partner</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">TVL</th>
              <th className="text-left py-3 px-4">Audits</th>
              <th className="text-left py-3 px-4">Insurance</th>
              <th className="text-left py-3 px-4">Rev Share</th>
              <th className="text-left py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner, index) => (
              <tr key={index} className="border-b hover:bg-muted/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{partner.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{partner.type}</td>
                <td className="py-3 px-4 font-mono">{partner.tvl}</td>
                <td className="py-3 px-4">{partner.audits}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    partner.insurance === 'Full' ? 'bg-green-500/20 text-green-500' :
                    partner.insurance === 'Partial' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {partner.insurance}
                  </span>
                </td>
                <td className="py-3 px-4">{partner.fee}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    partner.status === 'Active' ? 'bg-green-500/20 text-green-500' :
                    partner.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {partner.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4">
        * Partner identities are anonymized for security. Details revealed after NDA signing.
      </p>
    </div>
  )
}

// Application Form Component
function PartnerApplicationForm() {
  const [formData, setFormData] = useState({
    protocol: '',
    contact: '',
    tvl: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        alert('Application submitted successfully! We will contact you within 48 hours.')
        setFormData({ protocol: '', contact: '', tvl: '', description: '' })
      }
    } catch (error) {
      alert('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">Apply to Become a Partner</h2>
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Protocol Name *</label>
          <input
            type="text"
            required
            value={formData.protocol}
            onChange={(e) => setFormData({...formData, protocol: e.target.value})}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your protocol name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Contact Email *</label>
          <input
            type="email"
            required
            value={formData.contact}
            onChange={(e) => setFormData({...formData, contact: e.target.value})}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="business@protocol.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Total Value Locked (TVL) *</label>
          <input
            type="text"
            required
            value={formData.tvl}
            onChange={(e) => setFormData({...formData, tvl: e.target.value})}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="$100M+"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Why partner with ReserveBTC? *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
            placeholder="Describe your protocol and integration plans..."
          />
        </div>
        
        <div className="flex items-start gap-2">
          <input type="checkbox" required className="mt-1" />
          <span className="text-sm text-muted-foreground">
            I confirm that our protocol meets the technical and business requirements listed above.
          </span>
        </div>
        
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}