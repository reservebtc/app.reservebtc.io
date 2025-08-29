'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { Wallet, ChevronDown } from 'lucide-react'

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  // Simplified connection
  const handleConnect = () => {
    setIsConnecting(true)
    const connector = connectors[0] // Just use first available connector
    if (connector) {
      connect({ connector })
    }
  }

  // Reset connecting state when connection changes
  useEffect(() => {
    if (isConnected || error) {
      setIsConnecting(false)
    }
  }, [isConnected, error])

  if (isConnected && address) {
    return (
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
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting || isPending}
      className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 sm:px-6 py-2.5 h-10 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
    >
      <Wallet className="h-5 w-5" />
      <span className="text-sm sm:text-base">
        {isConnecting || isPending ? 'Connecting...' : '🦊 Connect MetaMask'}
      </span>
    </button>
  )
}