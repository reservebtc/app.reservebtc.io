'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { StatisticsWidget } from '@/components/widgets/statistics-widget'

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          ReserveBTC
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mint 1:1 backed rBTC tokens on MegaETH. Your Bitcoin stays secure in your wallet.
        </p>
      </motion.div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Verify Bitcoin Wallet */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border rounded-xl p-8 space-y-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Verify Bitcoin Wallet</h3>
              <p className="text-muted-foreground">Use BIP-322 Signatures</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Prove ownership of your Bitcoin address using cryptographic signatures.
          </p>

          <Link
            href="/verify"
            className="w-full inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
          >
            <span>Begin Verification</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Mint rBTC Token */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border rounded-xl p-8 space-y-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <ArrowRight className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Mint rBTC Token</h3>
              <p className="text-muted-foreground">Deposit Bitcoin to mint 1:1 backed rBTC</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Requires wallet connection and verification</span>
          </div>

          <Link
            href={isConnected ? "/mint" : "/verify"}
            className={`w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 ${
              isConnected 
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <span>Begin Mint</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      {/* Statistics Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <StatisticsWidget />
      </motion.div>

      {/* Bottom Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center"
      >
        <h4 className="text-2xl font-semibold mb-4">Bitcoin stays in your wallet</h4>
        <p className="text-muted-foreground">
          ReserveBTC uses advanced cryptographic proofs to ensure your Bitcoin remains secure while you access DeFi on MegaETH.
        </p>
      </motion.div>
    </div>
  )
}