import { createConfig, http } from 'wagmi'
import { megaeth } from './chains/megaeth'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'

// 🔒 PRODUCTION: Environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
                  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 
                  '53859cecd826f1d2c2eebdd38461a8c1'

const PRIVATE_RPC = process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 
                    'https://carrot.megaeth.com/rpc'

/**
 * PRODUCTION-READY wagmi configuration
 * 
 * Architecture:
 * - HTTP-only transport for blockchain queries (no WebSocket conflicts)
 * - WalletConnect configured with optimized settings
 * - Supports MetaMask extension, WalletConnect (mobile), and injected wallets
 * - Compatible with unified-realtime-system.ts WebSocket monitoring
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
      },
      // Prefer extension over mobile if both available
      extensionOnly: false,
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
      // ✅ CRITICAL: WalletConnect configuration to prevent conflicts
      showQrModal: true,  // Show QR code modal automatically
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '9999'
        }
      },
      // ✅ IMPORTANT: Use official WalletConnect relay (separate from MegaETH WebSocket)
      // This WebSocket connects to relay.walletconnect.com, NOT to MegaETH
      // No conflicts with unified-realtime-system.ts!
    }),

    // 💉 Injected Wallets (Rabby, Coinbase Wallet, etc.)
    injected({
      // Support any injected wallet, not just MetaMask
      shimDisconnect: true,
    })
  ],

  transports: {
    // 🔥 CRITICAL: HTTP-only transport for MegaETH
    // This prevents wagmi from creating WebSocket to MegaETH
    // WebSocket monitoring is handled by unified-realtime-system.ts
    [megaeth.id]: http(PRIVATE_RPC, {
      batch: true,        // ✅ FIXED: Simplified batch option
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000,    // 10 second timeout
    })
  },

  // ✅ SSR support for Next.js
  ssr: true,

  // 🔥 CRITICAL: Use HTTP polling instead of WebSocket for state updates
  // This prevents wagmi from trying to create WebSocket to MegaETH
  pollingInterval: 4_000,  // Poll every 4 seconds

  // ✅ Enable batch calls for better performance
  multiInjectedProviderDiscovery: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}