import { Chain } from 'viem'

export const megaeth = {
  id: 6342, // MegaETH Testnet chain ID (updated 2025)
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
      address: '0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4',
    },
    feeVault: {
      address: '0x298b3746B593df83E5bB2122cb80d17bdE2AB5fF',
    },
    rbtcSynth: {
      address: '0x37fE059490B70e2605cb3D6fD64F5292d3eB46dE',
    },
    vaultWrBTC: {
      address: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
    },
    oracleAggregator: {
      address: '0x611AFD3808e732Ba89A0D9991d2902b0Df9bd149',
    },
  },
  testnet: true,
} as const satisfies Chain