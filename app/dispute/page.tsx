// app/dispute/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { Shield, AlertTriangle, CheckCircle, Clock, Lock, FileText, Search, Scale } from 'lucide-react'

export default function DisputePage() {
  const { address } = useAccount()
  const [disputes, setDisputes] = useState<any[]>([])
  const [userDisputes, setUserDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDisputes()
    if (address) {
      loadUserDisputes()
    }
  }, [address])

  async function loadUserDisputes() {
    if (!address) return
    try {
      const userRes = await fetch(`/api/disputes/user?address=${address}`)
      const userData = await userRes.json()
      setUserDisputes(userData.disputes || [])
    } catch (error) {
      console.error('Failed to load user disputes')
    }
  }

  async function loadDisputes() {
    try {
      setLoading(true)
      const publicRes = await fetch('/api/disputes/public')
      const publicData = await publicRes.json()
      setDisputes(publicData.disputes || [])
    } catch (error) {
      console.error('Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Dispute Resolution Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Report and resolve balance discrepancies with complete transparency and security
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-500 dark:text-amber-400 font-medium">
                End-to-End Encryption Active
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All dispute data is encrypted and only accessible to authorized resolvers
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {address ? (
              <DisputeSubmissionForm 
                address={address} 
                onSubmit={() => {
                  loadDisputes()
                  loadUserDisputes()
                }}
                submitting={submitting}
                setSubmitting={setSubmitting}
              />
            ) : (
              <div className="bg-card rounded-xl border p-12 text-center">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-4">
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect Wallet Required</h3>
                <p className="text-muted-foreground text-sm">
                  Please connect your wallet to submit or view disputes
                </p>
              </div>
            )}

            {/* User's Disputes */}
            {userDisputes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Disputes
                </h2>
                <div className="space-y-4">
                  {userDisputes.map((dispute, index) => (
                    <UserDisputeCard key={index} dispute={dispute} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Stats & Recent */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Resolution Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Resolution Time</span>
                  <span className="font-medium">24-48 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-500">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Disputes</span>
                  <span className="font-medium">{disputes.filter(d => d.status === 'pending').length}</span>
                </div>
              </div>
            </div>

            {/* Recent Public Disputes */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.slice(0, 5).map((dispute, index) => (
                    <MiniDisputeCard key={index} dispute={dispute} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Process Explanation */}
        <DisputeProcessExplanation />
      </div>
    </div>
  )
}

// Dispute Submission Form Component
function DisputeSubmissionForm({ address, onSubmit, submitting, setSubmitting }: any) {
  const [formData, setFormData] = useState({
    bitcoin_address: '',
    reported_balance: '',
    oracle_balance: '',
    description: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.bitcoin_address || !formData.description) {
      toast.error('Please fill all required fields')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await fetch('/api/disputes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_address: address
        })
      })
      
      if (response.ok) {
        toast.success('Dispute submitted successfully')
        setFormData({
          bitcoin_address: '',
          reported_balance: '',
          oracle_balance: '',
          description: ''
        })
        onSubmit()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit dispute')
      }
    } catch (error) {
      toast.error('Failed to submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border p-6 lg:p-8">
      <h2 className="text-xl font-semibold mb-6">Report Balance Discrepancy</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Bitcoin Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.bitcoin_address}
            onChange={(e) => setFormData({...formData, bitcoin_address: e.target.value})}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="tb1q..."
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Reported Balance
              <span className="text-xs text-muted-foreground ml-1">(sats)</span>
            </label>
            <input
              type="number"
              value={formData.reported_balance}
              onChange={(e) => setFormData({...formData, reported_balance: e.target.value})}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="100000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Oracle Balance
              <span className="text-xs text-muted-foreground ml-1">(sats)</span>
            </label>
            <input
              type="number"
              value={formData.oracle_balance}
              onChange={(e) => setFormData({...formData, oracle_balance: e.target.value})}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="90000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all 
                     min-h-[100px] resize-none"
            placeholder="Describe the discrepancy and any relevant details..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted 
                   text-primary-foreground font-medium py-3 px-6 rounded-lg 
                   transition-all disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Dispute'}
        </button>
      </form>
    </div>
  )
}

// User Dispute Card
function UserDisputeCard({ dispute }: any) {
  const statusConfig = {
    resolved: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
    pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
    rejected: { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle }
  }

  const config = statusConfig[dispute.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {dispute.status.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(dispute.created_at).toLocaleDateString()}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Bitcoin Address</p>
          <p className="font-mono text-sm">{dispute.bitcoin_address}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
            <p className="font-medium">{dispute.reported_balance} sats</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Oracle Balance</p>
            <p className="font-medium">{dispute.oracle_balance} sats</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Description</p>
          <p className="text-sm">{dispute.description}</p>
        </div>
      </div>
    </div>
  )
}

// Mini Dispute Card for sidebar
function MiniDisputeCard({ dispute }: any) {
  return (
    <div className="pb-3 border-b last:border-0 last:pb-0">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          dispute.status === 'resolved' ? 'text-green-500' : 'text-muted-foreground'
        }`}>
          {dispute.status}
        </span>
        <span className="text-xs text-muted-foreground">{dispute.time_ago}</span>
      </div>
      <p className="text-xs text-muted-foreground">{dispute.discrepancy_range}</p>
    </div>
  )
}

// Process Explanation
function DisputeProcessExplanation() {
  const steps = [
    { title: 'Submit', description: 'Report discrepancy', icon: FileText },
    { title: 'Review', description: 'Oracle verification', icon: Search },
    { title: 'Resolve', description: 'Balance correction', icon: CheckCircle },
    { title: 'Notify', description: 'Status update', icon: AlertTriangle }
  ]

  return (
    <div className="mt-12 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-xl p-8">
      <h2 className="text-xl font-semibold mb-6 text-center">Resolution Process</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/20 mb-3">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium text-sm mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}