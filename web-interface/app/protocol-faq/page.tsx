'use client'

import { useState } from 'react'
import { ChevronDown, Shield, Code, Bitcoin, Zap } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Protocol FAQ | ReserveBTC - Technical Protocol Questions',
  description: 'Deep technical FAQ about ReserveBTC protocol including smart contracts, BIP-322 signatures, MegaETH integration, and security architecture.',
  keywords: 'ReserveBTC protocol FAQ, smart contract FAQ, BIP-322 technical, MegaETH integration, Bitcoin DeFi protocol',
  openGraph: {
    title: 'Protocol FAQ - ReserveBTC',
    description: 'Technical questions and answers about ReserveBTC protocol architecture',
    type: 'website'
  },
  alternates: {
    canonical: '/protocol-faq'
  }
}

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  icon: 'shield' | 'code' | 'bitcoin' | 'zap'
}

const protocolFAQs: FAQItem[] = [
  // Smart Contract Questions
  {
    id: 'sc-1',
    category: 'Smart Contracts',
    icon: 'code',
    question: 'How does the ReserveBTC smart contract architecture work?',
    answer: 'ReserveBTC uses a modular smart contract architecture on MegaETH consisting of: (1) OracleAggregator contract for Bitcoin price feeds and reserves verification, (2) FeePolicy contract for dynamic fee management, (3) rBTC token contract with mint/burn functionality, and (4) Vault contract for managing Bitcoin reserves proofs. All contracts are deployed with upgradeable proxies for security updates while maintaining immutable core logic.'
  },
  {
    id: 'sc-2',
    category: 'Smart Contracts',
    icon: 'code',
    question: 'What security measures protect the smart contracts?',
    answer: 'Our smart contracts implement multiple security layers: (1) Multi-signature governance with time-locks, (2) Role-based access control (RBAC), (3) Reentrancy guards on all external calls, (4) Circuit breakers for emergency stops, (5) Rate limiting for minting operations, (6) Formal verification of critical functions, and (7) Continuous monitoring via security canaries. All code is open-source and regularly audited.'
  },
  {
    id: 'sc-3',
    category: 'Smart Contracts',
    icon: 'code',
    question: 'How are protocol upgrades managed?',
    answer: 'Protocol upgrades use a transparent governance process: (1) Proposals are submitted with 72-hour review period, (2) Multi-sig approval required from 5 of 7 security council members, (3) 48-hour time-lock before execution, (4) Emergency upgrades require 7 of 7 signatures, (5) All upgrade code is publicly audited before deployment, (6) Upgrade history is permanently recorded on-chain.'
  },
  
  // BIP-322 Questions
  {
    id: 'bip-1',
    category: 'BIP-322 Signatures',
    icon: 'bitcoin',
    question: 'What is BIP-322 and how does ReserveBTC use it?',
    answer: 'BIP-322 is a Bitcoin Improvement Proposal for generic signed message format. ReserveBTC uses BIP-322 to cryptographically prove Bitcoin address ownership without requiring private key exposure or fund movement. Users sign a message containing their MegaETH address, proving they control both addresses for secure cross-chain asset linkage.'
  },
  {
    id: 'bip-2',
    category: 'BIP-322 Signatures',
    icon: 'bitcoin',
    question: 'Which Bitcoin address types support BIP-322?',
    answer: 'ReserveBTC supports BIP-322 signatures for: (1) P2WPKH (Native SegWit, bc1q...), (2) P2WSH (Native SegWit Script, bc1q...), (3) P2TR (Taproot, bc1p...), (4) P2SH-P2WPKH (Nested SegWit, 3...), (5) Legacy P2PKH (1...) with limitations. Taproot addresses (bc1p...) provide the strongest privacy and efficiency.'
  },
  {
    id: 'bip-3',
    category: 'BIP-322 Signatures',
    icon: 'bitcoin',
    question: 'How is BIP-322 signature verification implemented?',
    answer: 'Our BIP-322 verification process: (1) Parse the signature to extract witness data, (2) Reconstruct the Bitcoin transaction that would spend from the address, (3) Verify the signature against Bitcoin script execution rules, (4) Validate message commitment using SHA-256 hashing, (5) Cross-reference with Bitcoin blockchain state, (6) Store verified linkage in smart contract with timestamp and block reference.'
  },
  
  // MegaETH Integration
  {
    id: 'mega-1',
    category: 'MegaETH Integration',
    icon: 'zap',
    question: 'Why was MegaETH chosen for ReserveBTC?',
    answer: 'MegaETH offers optimal features for ReserveBTC: (1) Ultra-fast transaction finality (<100ms), (2) Low gas costs for frequent oracle updates, (3) EVM compatibility for existing tooling, (4) High throughput for scaling DeFi applications, (5) Strong security guarantees through parallel execution, (6) Native support for complex contract interactions needed for Bitcoin verification.'
  },
  {
    id: 'mega-2',
    category: 'MegaETH Integration',
    icon: 'zap',
    question: 'How does cross-chain communication work?',
    answer: 'ReserveBTC bridges Bitcoin and MegaETH through: (1) Bitcoin blockchain monitoring via full nodes, (2) Cryptographic proof relay using Merkle proofs, (3) Oracle network for Bitcoin price and reserve data, (4) Multi-signature validators for cross-chain state verification, (5) Time-locked commitment schemes for security, (6) Automated slashing for malicious oracle behavior.'
  },
  {
    id: 'mega-3',
    category: 'MegaETH Integration',
    icon: 'zap',
    question: 'What happens if MegaETH network experiences issues?',
    answer: 'ReserveBTC includes multiple failsafe mechanisms: (1) Emergency pause functionality to halt all operations, (2) Backup oracle networks on alternative chains, (3) Manual withdrawal process bypassing smart contracts, (4) Multi-chain deployment readiness for rapid migration, (5) Insurance fund for user protection, (6) 72-hour delayed emergency procedures with community oversight.'
  },
  
  // Security Architecture
  {
    id: 'sec-1',
    category: 'Security Architecture',
    icon: 'shield',
    question: 'How are Bitcoin reserves verified and secured?',
    answer: 'Bitcoin reserves are secured through: (1) Multi-signature wallets with geographic distribution, (2) Hardware security modules (HSMs) for key storage, (3) Regular cryptographic proofs of reserves, (4) Independent third-party verification, (5) Real-time blockchain monitoring, (6) Automated anomaly detection systems, (7) Insurance coverage for reserve shortfalls, (8) Quarterly reserve audits by certified accountants.'
  },
  {
    id: 'sec-2',
    category: 'Security Architecture',
    icon: 'shield',
    question: 'What economic security mechanisms protect the protocol?',
    answer: 'Economic security includes: (1) Over-collateralization with 110% Bitcoin backing, (2) Dynamic fee adjustments based on utilization, (3) Liquidation mechanisms for under-collateralized positions, (4) Insurance fund from protocol fees, (5) Slashing conditions for oracle misbehavior, (6) Bug bounty program with up to $100K rewards, (7) Protocol-owned liquidity for market stability.'
  },
  {
    id: 'sec-3',
    category: 'Security Architecture',
    icon: 'shield',
    question: 'How is oracle manipulation prevented?',
    answer: 'Oracle security measures: (1) Multiple independent price feeds aggregation, (2) Outlier detection and filtering algorithms, (3) Time-weighted average price (TWAP) calculations, (4) Circuit breakers for extreme price movements, (5) Cryptographic commitments with reveal phases, (6) Stake-based penalties for incorrect data, (7) Fallback to Chainlink and Band Protocol oracles, (8) Manual override capabilities for emergency situations.'
  }
]

export default function ProtocolFAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const categories = ['all', ...Array.from(new Set(protocolFAQs.map(faq => faq.category)))]
  
  const filteredFAQs = selectedCategory === 'all' 
    ? protocolFAQs 
    : protocolFAQs.filter(faq => faq.category === selectedCategory)

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'shield': return <Shield className="h-5 w-5" />
      case 'code': return <Code className="h-5 w-5" />
      case 'bitcoin': return <Bitcoin className="h-5 w-5" />
      case 'zap': return <Zap className="h-5 w-5" />
      default: return <Code className="h-5 w-5" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="p-3 bg-primary/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Code className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Protocol FAQ</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deep technical questions and answers about ReserveBTC protocol architecture, 
          smart contracts, BIP-322 implementation, and security mechanisms.
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Filter by Category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {category === 'all' ? 'All Questions' : category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => {
          const isOpen = openItems.has(faq.id)
          
          return (
            <div key={faq.id} className="bg-card border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full px-6 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {getIcon(faq.icon)}
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">{faq.question}</div>
                      <div className="text-xs text-muted-foreground">{faq.category}</div>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isOpen ? 'transform rotate-180' : ''
                  }`} />
                </div>
              </button>
              
              {isOpen && (
                <div className="px-6 pb-6">
                  <div className="border-t pt-4">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No questions found in this category.</p>
        </div>
      )}

      {/* Additional Resources */}
      <div className="bg-muted/50 border rounded-xl p-8 space-y-6">
        <h2 className="text-xl font-semibold">Additional Technical Resources</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Developer Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://github.com/reservebtc/app.reservebtc.io" 
                   className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  • Smart Contract Source Code
                </a>
              </li>
              <li>
                <a href="https://github.com/reservebtc/app.reservebtc.io/tree/main/contracts/test" 
                   className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  • Comprehensive Test Suite
                </a>
              </li>
              <li>
                <a href="/docs" className="text-primary hover:underline">
                  • Technical Documentation
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Security Information</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/audit" className="text-primary hover:underline">
                  • Security Test Results
                </a>
              </li>
              <li>
                <a href="/audit-fees" className="text-primary hover:underline">
                  • Security Investment Transparency
                </a>
              </li>
              <li>
                <a href="mailto:reservebtcproof@gmail.com" className="text-primary hover:underline">
                  • Report Security Issues
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Still Have Questions?</h2>
        <p className="text-muted-foreground">
          Can't find the answer you're looking for? Our technical team is here to help.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="mailto:reservebtcproof@gmail.com"
            className="inline-flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Code className="h-4 w-4" />
            <span>Technical Support</span>
          </a>
          <a
            href="https://chatgpt.com/g/g-68a3e198b3348191bf4be2ce6e06ba0b-reservebtc-agent-support-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Zap className="h-4 w-4" />
            <span>AI Assistant</span>
          </a>
        </div>
      </div>
    </div>
  )
}