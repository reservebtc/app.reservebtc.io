// app/bip322-demo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, CheckCircle, XCircle, Loader2, Github, Package } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'
type WalletStatus = 'idle' | 'detecting' | 'detected' | 'signing' | 'success' | 'error'

export default function BIP322Demo() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [walletDetected, setWalletDetected] = useState<string[]>([])
  const [status, setStatus] = useState<WalletStatus>('idle')
  const [result, setResult] = useState<any>(null)

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
    } else {
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }
  }, [theme])

  const detectWallets = () => {
    setStatus('detecting')
    setResult(null)
    
    setTimeout(() => {
      const detected = []
      if (typeof window !== 'undefined') {
        if ((window as any).unisat) detected.push('UniSat')
        if ((window as any).XverseProviders) detected.push('Xverse')
        if ((window as any).LeatherProvider) detected.push('Leather')
        if ((window as any).okxwallet?.bitcoin) detected.push('OKX')
        
        // Demo mode if no wallets
        if (detected.length === 0) {
          detected.push('Demo Wallet (Install real wallet to test)')
        }
      }
      
      setWalletDetected(detected)
      setStatus('detected')
    }, 1000)
  }

  const handleSign = async (walletName: string) => {
    setStatus('signing')
    setResult(null)
    
    // Simulate signing process
    setTimeout(() => {
      setStatus('success')
      setResult({
        wallet: walletName,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        message: 'ReserveBTC Wallet Verification',
        signature: 'H123QE0EwEcYvAWWMgwIL/s6acvWdQYW7++I+HFwr1XAAX+VRkqK+8jBtxzblDCUVZhcPK33wAddIEIT+Z25Mpg=',
        timestamp: new Date().toISOString(),
        protocol: 'BIP-322'
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Header with theme toggle */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BIP-322 Connector Demo
          </h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Light theme"
            >
              <Sun className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Dark theme"
            >
              <Moon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'system' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="System theme"
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            One-Click Bitcoin Signature Verification
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience the future of BIP-322 signing with MetaMask-like UX
          </p>
        </div>

        {/* Before vs After Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Before - Old UX */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <h3 className="text-2xl font-bold text-red-900 dark:text-red-300">
                Before (Old UX)
              </h3>
            </div>
            <ol className="space-y-3 text-gray-800 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="font-bold text-red-600 dark:text-red-400">1.</span>
                <span>Install wallet extension</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-red-600 dark:text-red-400">2.</span>
                <span>Navigate to signing feature</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-red-600 dark:text-red-400">3.</span>
                <span>Copy message manually</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-red-600 dark:text-red-400">4.</span>
                <span>Paste in wallet interface</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-red-600 dark:text-red-400">5.</span>
                <span>Sign the message</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-red-600 dark:text-red-400">6.</span>
                <span>Copy signature back to dApp</span>
              </li>
            </ol>
            <div className="mt-6 pt-6 border-t border-red-300 dark:border-red-800">
              <p className="text-red-900 dark:text-red-300 font-bold text-lg">
                ⏱️ 6 steps • ~2 minutes
              </p>
            </div>
          </div>

          {/* After - New UX */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-300">
                After (New UX)
              </h3>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={detectWallets}
                disabled={status === 'detecting' || status === 'signing'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 shadow-lg"
              >
                {status === 'detecting' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Detecting wallets...
                  </span>
                ) : (
                  '1. Detect Wallets'
                )}
              </button>
              
              {walletDetected.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Found {walletDetected.length} wallet{walletDetected.length > 1 ? 's' : ''}:
                  </p>
                  {walletDetected.map((wallet, index) => (
                    <button
                      key={wallet}
                      onClick={() => handleSign(wallet)}
                      disabled={status === 'signing'}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {status === 'signing' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing...
                        </span>
                      ) : (
                        `2. Sign with ${wallet}`
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-green-300 dark:border-green-800">
              <p className="text-green-900 dark:text-green-300 font-bold text-lg">
                ⚡ 1 click • ~5 seconds
              </p>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mb-12 animate-slide-up">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Signature Result
                </h3>
              </div>
              <div className="bg-black rounded-xl p-6 overflow-auto">
                <pre className="text-green-400 text-sm font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Installation Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Install BIP-322 Connector
          </h3>
          
          <div className="bg-black rounded-xl p-6 mb-6">
            <code className="text-green-400 font-mono text-sm sm:text-base">
              npm install @reservebtc/bip322-connector
            </code>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <a 
              href="https://github.com/reservebtc/bip322-connector" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-200 transform hover:scale-105"
            >
              <Github className="w-6 h-6 text-gray-900 dark:text-white" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  GitHub Repository
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  View source code
                </div>
              </div>
            </a>

            <a 
              href="https://www.npmjs.com/package/@reservebtc/bip322-connector" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-200 transform hover:scale-105"
            >
              <Package className="w-6 h-6 text-gray-900 dark:text-white" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  NPM Package
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Install from NPM
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Built by{' '}
            <a 
              href="https://app.reservebtc.io" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >
              ReserveBTC Team
            </a>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Improving Bitcoin DeFi UX, one signature at a time
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}