'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'mint'
  const txHash = searchParams.get('tx')
  const amount = searchParams.get('amount')

  const getSuccessContent = () => {
    switch (type) {
      case 'verification':
        return {
          title: 'Wallet Verified Successfully!',
          description: 'Your Bitcoin wallet has been verified using BIP-322 signatures.',
          nextAction: 'Begin Minting rBTC',
          nextHref: '/mint'
        }
      case 'mint':
        return {
          title: 'rBTC Minted Successfully!',
          description: `You have successfully minted ${amount || '0'} rBTC tokens.`,
          nextAction: 'View Statistics',
          nextHref: '/stats'
        }
      default:
        return {
          title: 'Operation Completed Successfully!',
          description: 'Your transaction has been completed successfully.',
          nextAction: 'Go to Dashboard',
          nextHref: '/'
        }
    }
  }

  const content = getSuccessContent()

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="p-6 bg-green-100 dark:bg-green-900/20 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-8">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-green-600">{content.title}</h1>
        <p className="text-muted-foreground text-lg">{content.description}</p>
      </div>

      {txHash && (
        <div className="bg-card border rounded-xl p-6 space-y-3">
          <h3 className="font-semibold">Transaction Details</h3>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Transaction Hash:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </span>
              <a
                href={`https://explorer.megaeth.systems/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={content.nextHref}
          className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <span>{content.nextAction}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/"
          className="flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="p-6 bg-green-100 dark:bg-green-900/20 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-8">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-green-600">Success!</h1>
          <p className="text-muted-foreground text-lg">Loading details...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}