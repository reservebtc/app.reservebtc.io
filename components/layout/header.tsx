'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WalletConnect } from '@/components/wallet/wallet-connect'
import { WalletRequiredToast } from '@/components/ui/wallet-required-toast'

export function Header() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [showWalletToast, setShowWalletToast] = useState(false)

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      e.preventDefault()
      setShowWalletToast(true)
    }
  }

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 via-purple-500 via-blue-500 to-green-500 animate-spin-slow"></div>
                <div className="absolute inset-[2px] rounded-full bg-background flex items-center justify-center">
                  <span className="text-foreground font-bold text-base sm:text-lg">₿</span>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">ReserveBTC</h1>
            </Link>
            
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <Link 
                  href="/verify" 
                  className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Verify</span>
                </Link>
                <Link 
                  href="/mint" 
                  className="inline-flex items-center space-x-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-medium hover:from-orange-500/20 hover:to-amber-500/20 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Mint</span>
                </Link>
                <Link 
                  href="/wrap" 
                  className="inline-flex items-center space-x-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-medium hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Wrap</span>
                </Link>
              </div>
              <Link 
                href="/dashboard"
                onClick={handleDashboardClick}
                className="inline-flex items-center space-x-1 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 text-blue-700 dark:text-blue-400 px-2 sm:px-3 py-1 rounded-full text-xs font-medium hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="hidden xs:inline">Dashboard</span>
                <span className="xs:hidden">Dash</span>
              </Link>
              <Link 
                href="/faucet" 
                className="inline-flex items-center space-x-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-2 sm:px-3 py-1 rounded-full text-xs font-medium hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="hidden xs:inline">Faucet</span>
                <span className="xs:hidden">Fct</span>
              </Link>
              <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="hidden xs:inline">TestNet</span>
                <span className="xs:hidden">Test</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <ThemeToggle />
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </header>

      <WalletRequiredToast 
        show={showWalletToast}
        onClose={() => setShowWalletToast(false)}
      />
    </>
  )
}