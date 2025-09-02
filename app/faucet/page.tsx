'use client'

import { useState } from 'react'
import { ExternalLink, Wallet, CheckCircle, AlertCircle, Info, Twitter, Github, ChevronRight } from 'lucide-react'
import { useAccount } from 'wagmi'

const bitcoinFaucets = [
  {
    name: 'CoinFaucet.eu',
    url: 'https://coinfaucet.eu/en/btc-testnet',
    description: 'Most popular, reliable faucet with high limits',
    amount: '0.001-0.01 BTC',
    frequency: 'Every 60 minutes',
    recommended: true
  },
  {
    name: 'BitcoinFaucet.uo1',
    url: 'https://bitcoinfaucet.uo1.net',
    description: 'Simple and fast, no registration required',
    amount: '0.0005-0.005 BTC',
    frequency: 'Every 30 minutes'
  },
  {
    name: 'Testnet.help',
    url: 'https://testnet.help/en/btcfaucet/testnet',
    description: 'Established since 2018, battery recharge system',
    amount: '0.001 BTC',
    frequency: 'Hourly recharge'
  },
  {
    name: 'Triangle Platform',
    url: 'https://faucet.triangleplatform.com/bitcoin/testnet',
    description: 'Good for developers, higher amounts',
    amount: '0.002 BTC',
    frequency: 'Daily'
  },
  {
    name: 'BlockCypher Faucet',
    url: 'https://www.blockcypher.com/dev/bitcoin/#faucets',
    description: 'API-friendly faucet for developers',
    amount: '0.001 BTC',
    frequency: 'Per request'
  }
]

export default function FaucetPage() {
  const { address } = useAccount()
  const [formData, setFormData] = useState({
    twitterHandle: '',
    githubUsername: '',
    ethAddress: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [verificationStatus, setVerificationStatus] = useState({
    twitter: false,
    github: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/faucet-request-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ethAddress: formData.ethAddress || address,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({ 
          type: 'success', 
          message: 'Request submitted! You will receive 0.005 ETH within 24 hours after verification.' 
        })
        setFormData({ twitterHandle: '', githubUsername: '', ethAddress: '' })
        setVerificationStatus({ twitter: false, github: false })
      } else {
        setSubmitStatus({ 
          type: 'error', 
          message: data.error || 'Failed to submit request. Please try again.' 
        })
      }
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'Network error. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      {/* SEO-friendly header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Testnet Faucets
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Get free testnet tokens to explore ReserveBTC protocol. Start with Bitcoin testnet, then claim MegaETH tokens.
          </p>
        </div>

        {/* Bitcoin Testnet Faucets */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Bitcoin Testnet Faucets
            </h2>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Bitcoin testnet addresses start with <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">m</code>, <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">n</code>, <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">2</code>, or <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">tb1</code>. Never use mainnet addresses!
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {bitcoinFaucets.map((faucet, index) => (
              <div 
                key={index} 
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                  faucet.recommended 
                    ? 'border-green-200 dark:border-green-800 ring-2 ring-green-500/20' 
                    : 'border-gray-200 dark:border-gray-700'
                } p-4 sm:p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {faucet.name}
                      </h3>
                      {faucet.recommended && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {faucet.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 dark:text-gray-500">Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{faucet.amount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 dark:text-gray-500">Frequency:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{faucet.frequency}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={faucet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200 group"
                  >
                    Get BTC
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MegaETH Testnet Faucet */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              MegaETH Testnet Faucet
            </h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Requirements to receive 0.005 ETH on MegaETH Testnet:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${verificationStatus.twitter ? 'text-green-500' : 'text-gray-400'}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">
                      Follow our Twitter account
                    </p>
                    <a 
                      href="https://x.com/reserveBTC" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Twitter className="w-4 h-4" />
                      @reserveBTC
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${verificationStatus.github ? 'text-green-500' : 'text-gray-400'}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">
                      Star our GitHub repository (GitHub account must be 6+ months old)
                    </p>
                    <a 
                      href="https://github.com/reservebtc/app.reservebtc.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
                    >
                      <Github className="w-4 h-4" />
                      reservebtc/app.reservebtc.io
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Twitter Handle
                </label>
                <input
                  type="text"
                  placeholder="@yourusername"
                  value={formData.twitterHandle}
                  onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="yourusername"
                  value={formData.githubUsername}
                  onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  MegaETH Address
                </label>
                <input
                  type="text"
                  placeholder={address || '0x...'}
                  value={formData.ethAddress || address || ''}
                  onChange={(e) => setFormData({ ...formData, ethAddress: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors font-mono text-sm"
                  required
                />
                {address && !formData.ethAddress && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Using your connected wallet address
                  </p>
                )}
              </div>

              {submitStatus.type && (
                <div className={`p-4 rounded-lg flex items-start gap-2 ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                }`}>
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{submitStatus.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Request 0.005 ETH
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-medium mb-1">Manual Distribution</p>
                  <p>Tokens are distributed manually within 24 hours after verification. Make sure you've completed both requirements before submitting.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="mt-12 sm:mt-16 text-center">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Join our community for support and updates
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://x.com/reserveBTC"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </a>
              <a
                href="https://github.com/reservebtc/app.reservebtc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
              >
                <Github className="w-5 h-5" />
                GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}