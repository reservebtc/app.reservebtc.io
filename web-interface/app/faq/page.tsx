'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'fees' | 'protocol' | 'general'
}

const faqData: FAQItem[] = [
  {
    id: 'fees-1',
    category: 'fees',
    question: 'What fees do I pay when minting rBTC?',
    answer: 'Minting rBTC involves minimal gas fees on the MegaETH network. There are no protocol fees for minting 1:1 backed rBTC tokens.'
  },
  {
    id: 'fees-2',
    category: 'fees',
    question: 'Are there any withdrawal fees?',
    answer: 'Withdrawal fees are minimal and only cover the transaction costs on the respective networks. No additional protocol fees are charged.'
  },
  {
    id: 'protocol-1',
    category: 'protocol',
    question: 'How does ReserveBTC maintain the 1:1 peg?',
    answer: 'ReserveBTC uses cryptographic proofs and oracles to verify Bitcoin ownership without requiring actual deposits. The protocol maintains reserves through advanced verification mechanisms.'
  },
  {
    id: 'protocol-2',
    category: 'protocol',
    question: 'What is BIP-322 and why do you use it?',
    answer: 'BIP-322 is a Bitcoin standard for message signing. It allows you to prove ownership of your Bitcoin without moving funds, enabling secure verification of your Bitcoin holdings.'
  },
  {
    id: 'protocol-3',
    category: 'protocol',
    question: 'How secure is my Bitcoin?',
    answer: 'Your Bitcoin never leaves your wallet. ReserveBTC only verifies ownership through signatures, ensuring your Bitcoin remains completely secure and under your control.'
  },
  {
    id: 'general-1',
    category: 'general',
    question: 'What is MegaETH and why use it?',
    answer: 'MegaETH is a high-performance Ethereum-compatible blockchain that offers faster transactions and lower fees while maintaining full Ethereum compatibility.'
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'Can I redeem my rBTC back to Bitcoin?',
    answer: 'Yes, rBTC tokens can be redeemed through the protocol. The redemption process uses the same verification mechanisms to ensure secure conversion back to Bitcoin.'
  }
]

export default function FAQPage() {
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

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'fees', label: 'Fees' },
    { id: 'protocol', label: 'Protocol' },
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
      <div className="flex flex-wrap gap-2 justify-center">
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
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-card border rounded-xl overflow-hidden"
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
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-4 text-muted-foreground"
              >
                {item.answer}
              </motion.div>
            )}
          </motion.div>
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
            href="https://github.com/reservebtc"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}