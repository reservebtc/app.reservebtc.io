'use client'

import { useState, useEffect } from 'react'
import { Wallet, CheckCircle, AlertCircle, Loader2, Smartphone, Monitor, ExternalLink } from 'lucide-react'

interface BitcoinWallet {
  name: string
  icon: string
  detected: boolean
  address?: string
  type?: 'taproot' | 'segwit' | 'legacy'
}

interface BitcoinWalletConnectProps {
  onWalletConnected?: (wallet: { name: string; address: string }) => void
  onSignMessage?: (signature: string) => void
}

export function BitcoinWalletConnect({ onWalletConnected, onSignMessage }: BitcoinWalletConnectProps) {
  const [wallets, setWallets] = useState<BitcoinWallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect available wallets and mobile device
  useEffect(() => {
    const checkWallets = () => {
      const detected: BitcoinWallet[] = []

      // Check for Phantom
      if (typeof window !== 'undefined' && (window as any).phantom?.bitcoin) {
        detected.push({
          name: 'Phantom',
          icon: '👻',
          detected: true
        })
      } else {
        detected.push({
          name: 'Phantom',
          icon: '👻',
          detected: false
        })
      }

      // Check for Exodus
      if (typeof window !== 'undefined' && (window as any).exodus?.bitcoin) {
        detected.push({
          name: 'Exodus',
          icon: '💼',
          detected: true
        })
      } else {
        detected.push({
          name: 'Exodus',
          icon: '💼',
          detected: false
        })
      }

      setWallets(detected)
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }

    checkWallets()
    checkMobile()

    // Listen for wallet injection
    const interval = setInterval(checkWallets, 1000)
    return () => clearInterval(interval)
  }, [])

  const connectPhantom = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const provider = (window as any).phantom?.bitcoin

      if (!provider) {
        throw new Error('Phantom wallet not detected. Please install Phantom browser extension.')
      }

      // Request accounts
      const accounts = await provider.requestAccounts()
      
      if (accounts && accounts.length > 0) {
        const account = accounts[0]
        
        setSelectedWallet('Phantom')
        onWalletConnected?.({
          name: 'Phantom',
          address: account.address
        })

        // Update wallet info
        setWallets(prev => prev.map(w => 
          w.name === 'Phantom' 
            ? { ...w, address: account.address, type: account.addressType }
            : w
        ))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Phantom wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const connectExodus = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const provider = (window as any).exodus?.bitcoin

      if (!provider) {
        throw new Error('Exodus wallet not detected. Please install Exodus wallet.')
      }

      // Request connection
      const accounts = await provider.request({ method: 'bitcoin_requestAccounts' })
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        
        setSelectedWallet('Exodus')
        onWalletConnected?.({
          name: 'Exodus',
          address: address
        })

        // Update wallet info
        setWallets(prev => prev.map(w => 
          w.name === 'Exodus' 
            ? { ...w, address: address }
            : w
        ))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Exodus wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const signMessageWithWallet = async (message: string) => {
    if (!selectedWallet) {
      setError('Please connect a wallet first')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      let signature = ''

      if (selectedWallet === 'Phantom') {
        const provider = (window as any).phantom?.bitcoin
        const wallet = wallets.find(w => w.name === 'Phantom')
        
        if (!provider || !wallet?.address) {
          throw new Error('Phantom wallet not properly connected')
        }

        // Sign message using Phantom
        const result = await provider.signMessage(wallet.address, new TextEncoder().encode(message))
        signature = result.signature
      } else if (selectedWallet === 'Exodus') {
        const provider = (window as any).exodus?.bitcoin
        const wallet = wallets.find(w => w.name === 'Exodus')
        
        if (!provider || !wallet?.address) {
          throw new Error('Exodus wallet not properly connected')
        }

        // Sign message using Exodus
        signature = await provider.signMessage({
          address: wallet.address,
          message: message
        })
      }

      if (signature) {
        onSignMessage?.(signature)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign message')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Wallet Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Bitcoin Wallet Connection</span>
          </h3>
          {selectedWallet && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Connected</span>
            </span>
          )}
        </div>

        {/* Mobile Warning */}
        {isMobile && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Mobile Device Detected
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  For best experience, use the Phantom or Exodus mobile app with WalletConnect, or switch to desktop.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Phantom Wallet */}
          <div className={`border rounded-lg p-4 transition-all ${
            selectedWallet === 'Phantom' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallets.find(w => w.name === 'Phantom')?.icon}</span>
                <div>
                  <h4 className="font-semibold">Phantom</h4>
                  <p className="text-xs text-muted-foreground">Recommended</p>
                </div>
              </div>
              {wallets.find(w => w.name === 'Phantom')?.detected ? (
                <span className="text-xs text-green-600 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Detected</span>
                </span>
              ) : (
                <span className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Not found</span>
                </span>
              )}
            </div>

            {wallets.find(w => w.name === 'Phantom')?.address && (
              <div className="mb-3 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                {wallets.find(w => w.name === 'Phantom')?.address}
              </div>
            )}

            <button
              onClick={connectPhantom}
              disabled={isConnecting || selectedWallet === 'Phantom'}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {selectedWallet === 'Phantom' ? 'Connected' : 'Connect Phantom'}
            </button>

            {!wallets.find(w => w.name === 'Phantom')?.detected && (
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center space-x-1 text-xs text-primary hover:underline"
              >
                <span>Install Phantom</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Exodus Wallet */}
          <div className={`border rounded-lg p-4 transition-all ${
            selectedWallet === 'Exodus' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallets.find(w => w.name === 'Exodus')?.icon}</span>
                <div>
                  <h4 className="font-semibold">Exodus</h4>
                  <p className="text-xs text-muted-foreground">Alternative</p>
                </div>
              </div>
              {wallets.find(w => w.name === 'Exodus')?.detected ? (
                <span className="text-xs text-green-600 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Detected</span>
                </span>
              ) : (
                <span className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Not found</span>
                </span>
              )}
            </div>

            {wallets.find(w => w.name === 'Exodus')?.address && (
              <div className="mb-3 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                {wallets.find(w => w.name === 'Exodus')?.address}
              </div>
            )}

            <button
              onClick={connectExodus}
              disabled={isConnecting || selectedWallet === 'Exodus'}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {selectedWallet === 'Exodus' ? 'Connected' : 'Connect Exodus'}
            </button>

            {!wallets.find(w => w.name === 'Exodus')?.detected && (
              <a
                href="https://www.exodus.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center space-x-1 text-xs text-primary hover:underline"
              >
                <span>Install Exodus</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {isConnecting && (
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Connecting wallet...</span>
          </div>
        )}
      </div>
    </div>
  )
}