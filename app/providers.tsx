'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { useState } from 'react'
import { useBlockchainMonitor } from '@/hooks/use-blockchain-monitor'

function BlockchainMonitorProvider({ children }: { children: React.ReactNode }) {
  // Initialize automatic blockchain monitoring for enterprise operation
  useBlockchainMonitor()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BlockchainMonitorProvider>
          {children}
        </BlockchainMonitorProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}