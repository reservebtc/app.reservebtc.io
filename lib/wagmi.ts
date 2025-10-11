import { createConfig, http } from 'wagmi'
import { megaeth } from './chains/megaeth'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
                  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 
                  '53859cecd826f1d2c2eebdd38461a8c1'

// 🔒 PRODUCTION: Use private RPC from environment
const PRIVATE_RPC = process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 
                    'https://carrot.megaeth.com/rpc'

// 🔍 DEBUG: Log WalletConnect configuration
console.log('🔗 WalletConnect Project ID:', projectId.slice(0, 10) + '...')

/**
 * PRODUCTION-READY wagmi configuration
 * 
 * WebSocket Strategy:
 * - WalletConnect uses its OWN relay WebSocket (wss://relay.walletconnect.com)
 * - Unified-realtime uses MegaETH private WebSocket (wss://carrot.megaeth.com/mafia/ws/...)
 * - NO CONFLICTS because they connect to DIFFERENT servers!
 */
export const config = createConfig({
  chains: [megaeth],
  connectors: [
    // 🦊 MetaMask Browser Extension
    metaMask({
      dappMetadata: {
        name: 'ReserveBTC',
        url: 'https://app.reservebtc.io',
      }
    }),
    
    // 🔗 WalletConnect - Mobile & Desktop Wallets via QR Code
    walletConnect({
      projectId,
      metadata: {
        name: 'ReserveBTC',
        description: 'Mint 1:1 backed rBTC tokens on MegaETH',
        url: 'https://app.reservebtc.io',
        icons: ['https://app.reservebtc.io/favicon.ico']
      },
      // ✅ Show QR modal for mobile wallet connection
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '9999'
        }
      }, // ← ✅ ДОБАВЛЕНА ЗАПЯТАЯ!
    }),
    
    // 💉 Injected Wallets (Rabby, Coinbase Wallet, etc.)
    injected({
      shimDisconnect: true
    })
  ],
  
  transports: {
    // 🔥 CRITICAL: Use HTTP-only transport
    // This prevents wagmi from creating WebSocket connections to MegaETH
    // WebSocket is handled separately by unified-realtime-system.ts
    [megaeth.id]: http(PRIVATE_RPC, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000
    })
  },
  
  ssr: true,
  
  // 🔥 CRITICAL: Disable automatic WebSocket connections to MegaETH
  pollingInterval: 4000, // Use HTTP polling instead
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}