import { Chain } from 'viem'

export const megaeth = {
  id: 6342, // MegaETH Testnet chain ID
  name: 'MegaETH Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://carrot.megaeth.com/rpc'] },
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  },
  blockExplorers: {
    etherscan: { name: 'MegaExplorer', url: 'https://megaexplorer.xyz' },
    default: { name: 'MegaExplorer', url: 'https://megaexplorer.xyz' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
    // ReserveBTC Protocol Contracts
    feePolicy: {
      address: '0x2F0f48EA3dD5bCff86A178F20f9c4AB2860CD468',
    },
    feeVault: {
      address: '0x298b3746B593df83E5bB2122cb80d17bdE2AB5fF',
    },
    rbtcSynth: {
      address: '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB',
    },
    vaultWrBTC: {
      address: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
    },
    oracleAggregator: {
      address: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
    },
  },
  testnet: true,
} as const satisfies Chain