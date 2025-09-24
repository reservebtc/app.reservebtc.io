'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'fees' | 'protocol' | 'general' | 'yield' | 'oracle' | 'security'
}

const faqData: FAQItem[] = [
  // Fees Category
  {
    id: 'fees-1',
    category: 'fees',
    question: 'What fees do I pay when minting rBTC?',
    answer: 'You need to deposit a minimum of 0.001 ETH to the FeeVault to cover Oracle monitoring costs. The Oracle charges 0.1% on positive balance changes (minting) plus 1 gwei per satoshi. Maximum fee per sync is capped at 0.01 ETH for your protection.'
  },
  {
    id: 'fees-2',
    category: 'fees',
    question: 'Are there fees when my Bitcoin balance decreases?',
    answer: 'No fees are charged when your Bitcoin balance decreases (burning rBTC-SYNTH). Fees only apply to positive balance changes (minting new tokens).'
  },
  {
    id: 'fees-3',
    category: 'fees',
    question: 'What happens if my FeeVault balance runs out?',
    answer: 'If your FeeVault balance drops below 0.001 ETH, the Oracle performs an emergency burn of all your rBTC-SYNTH tokens to prevent system abuse. Monitor your fee balance at /dashboard/fee-monitor to avoid this.'
  },
  
  // Protocol Category
  {
    id: 'protocol-1',
    category: 'protocol',
    question: 'How does ReserveBTC work without taking custody of my Bitcoin?',
    answer: 'ReserveBTC uses BIP-322 signatures to cryptographically prove you own a Bitcoin address without moving funds. Our Oracle monitors your Bitcoin balance every 30 seconds and automatically mints/burns rBTC-SYNTH tokens to maintain 1:1 backing.'
  },
  {
    id: 'protocol-2',
    category: 'protocol',
    question: 'What is rBTC-SYNTH and why is it soulbound?',
    answer: 'rBTC-SYNTH is your primary synthetic Bitcoin token that mirrors your actual Bitcoin balance. It\'s soulbound (non-transferable) to ensure 1:1 backing integrity. If you need transferable tokens, you can wrap them into wrBTC tokens.'
  },
  {
    id: 'protocol-3',
    category: 'protocol',
    question: 'Can I mint the same Bitcoin address multiple times?',
    answer: 'No, each Bitcoin address can only be minted once. Our mint protection system prevents double-minting. Once an address is registered for monitoring, the Oracle tracks it continuously until the balance reaches zero.'
  },
  {
    id: 'protocol-4',
    category: 'protocol',
    question: 'What happens when my Bitcoin balance changes?',
    answer: 'The Oracle automatically detects changes every 30 seconds. If your Bitcoin increases, it mints more rBTC-SYNTH. If it decreases, it burns tokens. This happens automatically without any action required from you.'
  },
  
  // Yield Category
  {
    id: 'yield-1',
    category: 'yield',
    question: 'What is the Yield Scales Protocol?',
    answer: 'Yield Scales is our revolutionary DeFi system where Bitcoin holders and USDT traders create a balance that determines yield rates. Think of it like old market scales - the balance between the two sides determines the yield (currently 0.26-1.76% APY, targeting 3-7%).'
  },
  {
    id: 'yield-2',
    category: 'yield',
    question: 'How is my principal protected in Yield Scales?',
    answer: 'For traders, USDT deposits never leave the secure vault - only the yield rate changes based on the scales balance. Your principal is 100% protected. You cannot lose your deposited capital, only the yield rate varies.'
  },
  {
    id: 'yield-3',
    category: 'yield',
    question: 'What are realistic yield expectations?',
    answer: 'Based on conservative modeling: 3-5% APY (70% probability), 5-7% APY (25% probability), 7-10% APY (5% probability). Current APY is lower (0.26-1.76%) due to early stage imbalance but will increase as more participants join.'
  },
  {
    id: 'yield-4',
    category: 'yield',
    question: 'What is the loyalty program?',
    answer: 'Long-term participants earn bonus yields: Bronze (0-180 days): +10%, Silver (180-365 days): +25%, Gold (365+ days): +50%. These multipliers apply to your base yield rate.'
  },
  
  // Oracle Category
  {
    id: 'oracle-1',
    category: 'oracle',
    question: 'How does the Oracle system work?',
    answer: 'Our Oracle v2.2 runs 24/7 on dedicated servers, monitoring registered Bitcoin addresses every 30 seconds. It uses 3 independent data sources with 2/3 consensus requirement for maximum reliability and 99.9% uptime.'
  },
  {
    id: 'oracle-2',
    category: 'oracle',
    question: 'Is the Oracle centralized?',
    answer: 'The Oracle uses a committee-based multi-signature system for security. While the monitoring is automated, critical operations require committee consensus. Full transparency is available at oracle.reservebtc.io.'
  },
  {
    id: 'oracle-3',
    category: 'oracle',
    question: 'What happens if the Oracle goes down?',
    answer: 'The Oracle has 99.9% uptime with automatic failover systems. Your tokens remain safe and your Bitcoin never moves. The system includes emergency procedures and state persistence for quick recovery.'
  },
  
  // Security Category
  {
    id: 'security-1',
    category: 'security',
    question: 'How secure is ReserveBTC?',
    answer: 'We\'ve passed 318/318 security tests with zero critical vulnerabilities. All smart contracts are audited, use reentrancy protection, and follow best practices. Your Bitcoin never leaves your wallet, eliminating custody risk.'
  },
  {
    id: 'security-2',
    category: 'security',
    question: 'What is BIP-322 and why is it secure?',
    answer: 'BIP-322 is a Bitcoin standard for cryptographic message signing. It proves you own a Bitcoin address without exposing private keys or moving funds. Signatures are mathematically bound to specific addresses, preventing any cross-address attacks.'
  },
  {
    id: 'security-3',
    category: 'security',
    question: 'What if there\'s a balance discrepancy?',
    answer: 'We have a dispute resolution system at /dispute. Discrepancies are investigated using our multi-source verification system and resolved within 24 hours. The Oracle uses 3 independent sources to prevent errors.'
  },
  
  // General Category
  {
    id: 'general-1',
    category: 'general',
    question: 'What is MegaETH and why use it?',
    answer: 'MegaETH is a high-performance Ethereum L2 offering institutional-grade speed with <1 second response times and minimal fees. It maintains full Ethereum compatibility while providing the performance needed for real-time Oracle operations.'
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'Can I use ReserveBTC with mainnet Bitcoin?',
    answer: 'Currently we support Bitcoin testnet for the MegaETH competition. Mainnet support is planned post-competition. The same security and functionality will apply to mainnet operations.'
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'Do I need to keep my wallet connected?',
    answer: 'No, once you\'ve registered your Bitcoin address for monitoring, the Oracle works automatically 24/7. You only need to connect your wallet to view your dashboard or make changes.'
  },
  {
    id: 'general-4',
    category: 'general',
    question: 'How do I get started?',
    answer: 'Visit /faucet for testnet ETH, verify your Bitcoin address at /verify, deposit 0.001 ETH to FeeVault at /mint, and start monitoring. Your rBTC-SYNTH tokens will automatically reflect your Bitcoin balance.'
  },
  {
    id: 'general-5',
    category: 'general',
    question: 'Who are the ideal users for ReserveBTC?',
    answer: 'Bitcoin HODLers wanting yield without selling, traders seeking Bitcoin exposure without custody, DeFi protocols needing Bitcoin liquidity, and DAOs requiring proof of wealth for governance. Anyone who wants Bitcoin\'s value in DeFi without giving up their keys.'
  },
  {
    id: 'general-6',
    category: 'general',
    question: 'What makes ReserveBTC different from wrapped Bitcoin?',
    answer: 'Traditional wrapped Bitcoin requires you to send your BTC to a custodian. ReserveBTC lets you keep your Bitcoin in your own wallet while still participating in DeFi. Your keys, your Bitcoin, your yield.'
  }
]

export function FAQContent() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Handle URL hash on component mount
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash === 'protocol') {
      setSelectedCategory('protocol')
      // Auto-open all protocol questions
      const protocolIds = faqData.filter(item => item.category === 'protocol').map(item => item.id)
      setOpenItems(new Set(protocolIds))
    }
  }, [])

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'fees', label: 'Fees' },
    { id: 'protocol', label: 'Protocol' },
    { id: 'yield', label: 'Yield Scales' },
    { id: 'oracle', label: 'Oracle' },
    { id: 'security', label: 'Security' },
    { id: 'general', label: 'General' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">
          Find answers to common questions about ReserveBTC
        </p>
      </div>

      {/* Category Filter */}
      <div id="protocol" className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQ.map((item, index) => (
          <div
            key={item.id}
            className="bg-card border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-semibold pr-4">{item.question}</h3>
              {openItems.has(item.id) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            
            {openItems.has(item.id) && (
              <div className="px-6 pb-4 text-muted-foreground animate-in fade-in duration-300">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="bg-muted/50 border rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Still have questions?</h2>
        <p className="text-muted-foreground">
          Can't find the answer you're looking for? Check our documentation or reach out to the community.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/docs"
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            View Documentation
          </a>
          <a
            href="https://github.com/reservebtc/app.reservebtc.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://x.com/reserveBTC"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </div>
  )
}