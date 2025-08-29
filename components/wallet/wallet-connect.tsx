'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState } from 'react'
import { Wallet, ChevronDown } from 'lucide-react'
import { megaeth } from '@/web-interface/lib/chains/megaeth'

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, error } = useConnect({
    mutation: {
      onMutate() {
        setIsConnecting(true)
      },
      onSettled() {
        setIsConnecting(false)
      },
    },
  })
  const { disconnect } = useDisconnect()

  // Auto-switch to MegaETH if connected to wrong network
  const isWrongNetwork = isConnected && chain?.id !== megaeth.id

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <div className="px-3 py-2 bg-destructive/20 text-destructive rounded-md text-sm">
            Wrong Network - Please switch to MegaETH
          </div>
        )}
        <div className="flex items-center space-x-2 bg-card border rounded-lg px-4 py-2">
          <Wallet className="h-4 w-4" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
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
        onClick={() => {
          const metaMaskConnector = connectors.find(c => c.id === 'metaMask')
          if (metaMaskConnector) {
            connect({ connector: metaMaskConnector })
          }
        }}
        disabled={isConnecting}
        className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        <Wallet className="h-5 w-5" />
        <span>
          {isConnecting ? 'Connecting...' : '🦊 Connect Wallet'}
        </span>
      </button>
      
      {error && (
        <div className="text-sm text-destructive text-center">
          {error.message}
        </div>
      )}
    </div>
  )
}