import { createConfig, http } from 'wagmi'
import { megaeth } from './chains/megaeth'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '53859cecd826f1d2c2eebdd38461a8c1'

// 🔒 PRODUCTION: Use private RPC from environment
const PRIVATE_RPC = process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 
                    'https://carrot.megaeth.com/rpc'

export const config = createConfig({
  chains: [megaeth],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'ReserveBTC',
        url: 'https://app.reservebtc.io',
      }
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'ReserveBTC',
        description: 'Mint 1:1 backed rBTC tokens on MegaETH',
        url: 'https://app.reservebtc.io',
        icons: ['https://app.reservebtc.io/favicon.ico']
      }
    }),
    injected({
      target: 'metaMask'
    })
  ],
  transports: {
    // 🔥 CRITICAL: Use HTTP-only transport
    // This prevents wagmi from creating WebSocket connections
    // WebSocket is handled separately by unified-realtime-system.ts
    [megaeth.id]: http(PRIVATE_RPC, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000
    })
  },
  ssr: true,
  // 🔥 CRITICAL: Disable automatic WebSocket connections
  pollingInterval: 4000, // Use HTTP polling instead
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}