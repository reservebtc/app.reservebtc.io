'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, AlertCircle } from 'lucide-react'
import { megaeth } from '@/lib/chains/megaeth'

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  // Check if connected to wrong network
  const isWrongNetwork = isConnected && chain && chain.id !== megaeth.id

  // Handle MetaMask connection
  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      
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
      setIsConnecting(false)
    }
  }

  // Reset connecting state when connection changes
  useEffect(() => {
    if (isConnected || error) {
      setIsConnecting(false)
    }
  }, [isConnected, error])

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
        <div className="flex items-center space-x-2 bg-card border rounded-lg px-4 py-2.5 h-10">
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
    <button
      onClick={handleConnect}
      disabled={isConnecting || isPending}
      className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 h-10 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
    >
      <Wallet className="h-5 w-5" />
      <span>
        {isConnecting || isPending ? 'Connecting...' : '🦊 Connect MetaMask'}
      </span>
    </button>
  )
}