import { Chain } from 'viem'

export const megaeth = {
  id: 70532, // MegaETH Testnet chain ID
  name: 'MegaETH Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.megaeth.systems'] },
    default: { http: ['https://rpc.megaeth.systems'] },
  },
  blockExplorers: {
    etherscan: { name: 'MegaETH Explorer', url: 'https://explorer.megaeth.systems' },
    default: { name: 'MegaETH Explorer', url: 'https://explorer.megaeth.systems' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
} as const satisfies Chain