'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import Link from 'next/link'

function ErrorPageContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'general'
  const message = searchParams.get('message')
  const code = searchParams.get('code')

  const getErrorContent = () => {
    switch (type) {
      case 'verification':
        return {
          title: 'Verification Failed',
          description: 'We could not verify your Bitcoin wallet. Please check your signature and try again.',
          suggestions: [
            'Ensure you are using a supported wallet (Sparrow, Electrum)',
            'Verify that your BIP-322 signature is correctly formatted',
            'Make sure the message matches exactly what you signed'
          ]
        }
      case 'mint':
        return {
          title: 'Mint Transaction Failed',
          description: 'Your rBTC mint transaction could not be completed.',
          suggestions: [
            'Check your wallet connection and network',
            'Ensure you have sufficient gas fees',
            'Verify your Bitcoin address is valid and verified'
          ]
        }
      case 'network':
        return {
          title: 'Network Error',
          description: 'Unable to connect to the MegaETH network.',
          suggestions: [
            'Check your internet connection',
            'Switch to the MegaETH network in your wallet',
            'Try refreshing the page'
          ]
        }
      case 'wallet':
        return {
          title: 'Wallet Connection Error',
          description: 'Could not connect to your wallet.',
          suggestions: [
            'Make sure your wallet is unlocked',
            'Check if the wallet extension is installed',
            'Try connecting with a different wallet'
          ]
        }
      default:
        return {
          title: 'Something Went Wrong',
          description: message || 'An unexpected error occurred. Please try again.',
          suggestions: [
            'Refresh the page and try again',
            'Check your wallet connection',
            'Contact support if the problem persists'
          ]
        }
    }
  }

  const content = getErrorContent()

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="animate-in zoom-in-0 duration-700 delay-200">
        <div className="p-6 bg-red-100 dark:bg-red-900/20 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-8">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        <h1 className="text-3xl font-bold text-red-600">{content.title}</h1>
        <p className="text-muted-foreground text-lg">{content.description}</p>
      </div>

      {code && (
        <div className="bg-card border rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600">
          <div className="text-sm text-muted-foreground">
            Error Code: <span className="font-mono">{code}</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="bg-card border rounded-xl p-6 text-left space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600">
        <h3 className="font-semibold flex items-center space-x-2">
          <HelpCircle className="h-5 w-5" />
          <span>What you can try:</span>
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {content.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-primary mt-1">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-800">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Go Home</span>
        </Link>

        <Link
          href="/faq"
          className="flex items-center justify-center space-x-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Get Help</span>
        </Link>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto text-center space-y-8 py-16">Loading...</div>}>
      <ErrorPageContent />
    </Suspense>
  )
}