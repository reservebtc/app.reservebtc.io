'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, AlertCircle } from 'lucide-react'
import { megaeth } from '@/lib/chains/megaeth'

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, error, isPending } = useConnect({
    mutation: {
      onMutate() {
        setIsConnecting(true)
      },
      onSuccess() {
        setIsConnecting(false)
      },
      onError() {
        setIsConnecting(false)
      },
    },
  })
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  // Check if connected to wrong network
  const isWrongNetwork = isConnected && chain?.id !== megaeth.id

  // Handle MetaMask connection
  const handleConnect = async () => {
    try {
      // First try MetaMask directly
      const metaMaskConnector = connectors.find(c => 
        c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')
      )
      
      if (metaMaskConnector) {
        connect({ connector: metaMaskConnector })
      } else {
        // Fallback to injected connector
        const injectedConnector = connectors.find(c => c.id === 'injected')
        if (injectedConnector) {
          connect({ connector: injectedConnector })
        }
      }
    } catch (err) {
      console.error('Connection failed:', err)
    }
  }

  // Handle network switching
  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: megaeth.id })
    }
  }

  // Auto-detect MetaMask
  const [hasMetaMask, setHasMetaMask] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasMetaMask(true)
      console.log('MetaMask detected')
    }
  }, [])

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-3 py-2 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-md text-sm flex items-center space-x-2 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Switch to MegaETH</span>
          </button>
        )}
        <div className="flex items-center space-x-2 bg-card border rounded-lg px-4 py-2">
          <Wallet className="h-4 w-4" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Disconnect wallet"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isConnecting || isPending}
        className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        <Wallet className="h-5 w-5" />
        <span>
          {isConnecting || isPending ? 'Connecting...' : '🦊 Connect MetaMask'}
        </span>
      </button>
      
      {/* TestNet Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>TestNet</span>
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
          <div className="flex items-center justify-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error.message}</span>
          </div>
        </div>
      )}
      
      {!hasMetaMask && (
        <div className="text-xs text-muted-foreground text-center">
          MetaMask not detected. Please install MetaMask browser extension.
        </div>
      )}
    </div>
  )
}