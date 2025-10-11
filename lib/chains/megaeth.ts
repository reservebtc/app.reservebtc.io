import { Chain } from 'viem'

// 🔒 SECURITY: Private MegaETH endpoints (provided by MegaETH team)
// These endpoints are NOT public and should NEVER be shared or committed to Git
// They are stored securely in Vercel Environment Variables
const PRIVATE_RPC = process.env.MEGAETH_PRIVATE_RPC || 
                    process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 
                    'https://carrot.megaeth.com/rpc' // Fallback to public RPC

const PRIVATE_WS = process.env.MEGAETH_PRIVATE_WS || 
                   'wss://carrot.megaeth.com/ws' // Fallback to public WebSocket

/**
 * MegaETH Testnet Chain Configuration
 * 
 * PRODUCTION-READY: Uses private dedicated endpoints for improved performance
 * Network: MegaETH Testnet (Carrot)
 * Chain ID: 6342
 * 
 * Contract Addresses (Production Deployment - September 2025):
 * - OracleAggregator: Core Oracle logic for Bitcoin balance synchronization
 * - RBTCSynth: Soulbound BTC mirror token (non-transferable)
 * - VaultWrBTC: Wrapped rBTC token (ERC20 transferable)
 * - FeeVault: Fee management and prepaid user balances
 * - FeePolicy: Fee calculations and policy rules
 * - YieldScalesPool: DeFi yield generation engine
 * 
 * @see https://docs.megaeth.com
 */
export const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    // 🔒 PRODUCTION: Use private dedicated RPC endpoint
    default: { 
      http: [PRIVATE_RPC],
      webSocket: [PRIVATE_WS]
    },
    public: { 
      http: [PRIVATE_RPC],
      webSocket: [PRIVATE_WS]
    },
  },
  blockExplorers: {
    etherscan: { 
      name: 'MegaExplorer', 
      url: 'https://megaexplorer.xyz',
      apiUrl: 'https://megaexplorer.xyz/api'
    },
    default: { 
      name: 'MegaExplorer', 
      url: 'https://megaexplorer.xyz' 
    },
  },
  contracts: {
    // Standard Multicall3 contract (deployed on all chains)
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
    
    // 🏦 ReserveBTC Protocol Contracts
    // Core Oracle System
    oracleAggregator: {
      address: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
    },
    
    // Token Contracts
    rbtcSynth: {
      address: '0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58',
    },
    
    vaultWrBTC: {
      address: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
    },
    
    // Fee Management System
    feeVault: {
      address: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f',
    },
    
    feePolicy: {
      address: '0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4',
    },
    
    // DeFi Yield System
    yieldScalesPool: {
      address: '0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8',
    },
  },
  testnet: true,
} as const satisfies Chain

/**
 * 🔒 SECURITY: Export sanitized chain info for public display
 * This object contains NO private endpoints and is safe to share
 */
export const megaethPublicInfo = {
  chainId: 6342,
  name: 'MegaETH Testnet',
  symbol: 'ETH',
  explorer: 'https://megaexplorer.xyz',
  // Public RPC for documentation purposes only (not used in production)
  publicRpc: 'https://carrot.megaeth.com/rpc',
  testnet: true,
  
  // Contract addresses with descriptions (safe to share publicly)
  contracts: {
    oracleAggregator: {
      address: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
      name: 'OracleAggregator',
      description: 'Core Oracle logic - Bitcoin balance synchronization'
    },
    rbtcSynth: {
      address: '0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58',
      name: 'RBTCSynth',
      description: 'Soulbound BTC mirror token (non-transferable)'
    },
    vaultWrBTC: {
      address: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
      name: 'VaultWrBTC',
      description: 'Wrapped rBTC token (ERC20 transferable)'
    },
    feeVault: {
      address: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f',
      name: 'FeeVault',
      description: 'Fee management and prepaid user balances'
    },
    feePolicy: {
      address: '0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4',
      name: 'FeePolicy',
      description: 'Fee calculations and policy rules'
    },
    yieldScalesPool: {
      address: '0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8',
      name: 'YieldScalesPool',
      description: 'DeFi yield generation engine'
    },
  }
} as const

/**
 * 🔒 PRODUCTION: Export private RPC URLs for backend use
 * Only use these in server-side code or API routes
 * NEVER expose in client-side code or logs
 */
export const MEGAETH_PRIVATE_RPC = PRIVATE_RPC
export const MEGAETH_PRIVATE_WS = PRIVATE_WS