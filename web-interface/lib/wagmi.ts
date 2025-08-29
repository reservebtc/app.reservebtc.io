import { createConfig, http } from 'wagmi'
import { megaeth } from './chains/megaeth'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'
import { createClient } from 'viem'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo'

export const config = createConfig({
  chains: [megaeth],
  connectors: [
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: 'ReserveBTC',
        description: 'Mint 1:1 backed rBTC tokens',
        url: 'https://app.reservebtc.io',
        icons: ['https://app.reservebtc.io/logo/logo.png']
      }
    }),
    injected()
  ],
  client({ chain }) {
    return createClient({ 
      chain, 
      transport: http() 
    })
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}