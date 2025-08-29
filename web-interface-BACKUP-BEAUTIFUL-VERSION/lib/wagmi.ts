import { createConfig, http } from 'wagmi'
import { megaeth } from './chains/megaeth'
import { metaMask, walletConnect, injected } from '@wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'e8b2f3c4d5a6b7c8d9e0f1a2b3c4d5e6'

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
    [megaeth.id]: http()
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}