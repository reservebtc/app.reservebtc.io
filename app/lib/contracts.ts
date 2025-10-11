// 🔒 PRODUCTION: Private MegaETH endpoints from Vercel Environment Variables
// These are dedicated endpoints provided by MegaETH team - NOT PUBLIC
// Fallback to public RPC if environment variables are not set
const MEGAETH_PRIVATE_RPC = process.env.MEGAETH_PRIVATE_RPC || 
                            process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 
                            'https://carrot.megaeth.com/rpc'

const MEGAETH_PRIVATE_WS = process.env.MEGAETH_PRIVATE_WS || 
                           'wss://carrot.megaeth.com/ws'

/**
 * ReserveBTC Protocol - Smart Contract Addresses
 * 
 * Network: MegaETH Testnet
 * Chain ID: 6342
 * Deployment Date: September 2025
 * Deployment Method: Atomic Deployment (all contracts deployed in single transaction)
 * 
 * PRODUCTION-READY: All contracts have been audited and tested
 * 
 * Contract Architecture:
 * - OracleAggregator: Core oracle logic for Bitcoin balance synchronization
 * - RBTCSynth: Soulbound synthetic BTC token (non-transferable)
 * - VaultWrBTC: Wrapped rBTC token (ERC20 transferable)
 * - FeeVault: Fee management system with prepaid balances
 * - FeePolicy: Dynamic fee calculation based on transaction volume
 * - YieldScalesPool: DeFi yield generation engine
 * 
 * @see https://docs.reservebtc.io
 */
export const CONTRACTS = {
  // 🌐 Network Configuration
  CHAIN_ID: 6342,
  
  // 🔒 PRODUCTION: Use private RPC endpoints for improved performance
  // These endpoints are proxied through environment variables
  RPC_URL: MEGAETH_PRIVATE_RPC,
  WS_URL: MEGAETH_PRIVATE_WS,
  
  // 📜 Smart Contract Addresses (Atomic Deployment - September 2025)
  
  // Core Oracle System
  ORACLE_AGGREGATOR: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
  
  // Token Contracts
  RBTC_SYNTH: '0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58',
  VAULT_WRBTC: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
  
  // Fee Management System
  FEE_VAULT: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f', 
  FEE_POLICY: '0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4',
  
  // DeFi Yield Engine
  YIELD_SCALES_POOL: '0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8',
  
  // 🔑 System Addresses
  // Oracle committee address - authorized to execute sync operations
  ORACLE_COMMITTEE: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
  
  // Fee collector address - receives protocol fees (treasury/multisig)
  FEE_COLLECTOR: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
} as const

/**
 * Contract ABIs (Application Binary Interface)
 * 
 * Simplified ABIs for frontend usage
 * Only includes functions and events that are used in the UI
 * Full ABIs are available in the contracts/abis/ directory
 */
export const CONTRACT_ABIS = {
  /**
   * FeePolicy Contract
   * Calculates dynamic fees based on transaction volume and user activity
   */
  FEE_POLICY: [
    'function pctBps() view returns (uint256)',
    'function fixedWei() view returns (uint256)', 
    'function weiPerSat() view returns (uint256)',
    'function quoteFees(address user, int64 deltaSats) view returns (uint256)',
  ],
  
  /**
   * FeeVault Contract
   * Manages prepaid fee balances for users
   * Users deposit ETH which is used to pay for Oracle sync operations
   */
  FEE_VAULT: [
    'function depositETH(address user) payable',
    'function balanceOf(address user) view returns (uint256)',
    'function spendFrom(address user, uint256 amount)',
    'function withdrawUnused()',
    'function oracle() view returns (address)',
    'function feeCollector() view returns (address)',
    'event Deposited(address indexed user, uint256 amount)',
    'event Spent(address indexed user, uint256 amount, address indexed spender)',
    'event Withdrawn(address indexed user, uint256 amount)',
  ],
  
  /**
   * RBTCSynth Contract
   * Soulbound synthetic BTC token (non-transferable)
   * Mirrors real Bitcoin balance 1:1
   * Automatically minted/burned by Oracle based on Bitcoin balance changes
   */
  RBTC_SYNTH: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function oracle() view returns (address)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Mint(address indexed to, uint256 value)',
    'event Burn(address indexed from, uint256 value)',
  ],
  
  /**
   * VaultWrBTC Contract
   * Wrapped rBTC token (ERC20 transferable)
   * Can be created by wrapping rBTC-SYNTH
   * Can be redeemed back to rBTC-SYNTH
   */
  VAULT_WRBTC: [
    'function name() view returns (string)',
    'function symbol() view returns (string)', 
    'function decimals() view returns (uint8)',
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function rbtc() view returns (address)',
    'function oracle() view returns (address)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function redeem(uint256 amount)',
    'function onWrap(address user, uint256 amount)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event Wrapped(address indexed user, uint256 amount)',
    'event Redeemed(address indexed user, uint256 amount)',
    'event Slashed(address indexed user, uint256 amount)',
  ],
  
  /**
   * OracleAggregator Contract
   * Core Oracle system - manages Bitcoin balance synchronization
   * Only authorized committee can execute sync operations
   */
  ORACLE_AGGREGATOR: [
    'function sync(address user, uint64 newBalanceSats, bytes proof)',
    'function registerAndPrepay(address user, uint8 method, bytes32 checksum) payable',
    'function lastSats(address user) view returns (uint64)',
    'function committee() view returns (address)',
    'function minConfirmations() view returns (uint256)',
    'function maxFeePerSyncWei() view returns (uint256)',
    'function synth() view returns (address)',
    'function feeVault() view returns (address)', 
    'function feePolicy() view returns (address)',
    'event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)',
    'event NeedsTopUp(address indexed user)',
    'error Restricted()',
    'error FeeCapExceeded()',
    'error ZeroAddress()',
    'error BalanceOutOfRange()',
  ],
  
  /**
   * YieldScalesPool Contract
   * DeFi yield generation engine
   * Manages Bitcoin holder participation and yield distribution
   */
  YIELD_SCALES_POOL: [
    'function joinAsBitcoinHolder(address user)',
    'function joinAsTrader(address user, uint256 virtualUSDTAmount)',
    'function updateRBTCContribution(address user, uint256 newRBTCBalance)',
    'function calculateYieldRate() view returns (uint256)',
    'function getScaleBalance() view returns (uint256 usdtScale, uint256 rbtcScale, uint256 timestamp)',
    'function calculateYieldOwed(address user) view returns (uint256)',
    'function claimYield()',
    'function getParticipant(address user) view returns (tuple)',
    'function getSystemStats() view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
    'event ParticipantJoined(address indexed user, uint8 participantType, uint256 amount)',
    'event YieldClaimed(address indexed user, uint256 amount)',
    'event ScalesBalanceUpdated(uint256 usdtScale, uint256 rbtcScale, uint256 timestamp)',
  ],
} as const

/**
 * MegaETH Testnet Network Configuration
 * Used by wagmi/viem for blockchain connections
 * 
 * 🔒 PRODUCTION: Uses private endpoints for improved performance
 */
export const MEGAETH_TESTNET = {
  id: 6342,
  name: 'MegaETH Testnet',
  network: 'megaeth-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    // 🔒 Private endpoints from environment variables
    default: { 
      http: [MEGAETH_PRIVATE_RPC],
      webSocket: [MEGAETH_PRIVATE_WS]
    },
    public: { 
      http: [MEGAETH_PRIVATE_RPC],
      webSocket: [MEGAETH_PRIVATE_WS]
    },
  },
  blockExplorers: {
    default: { 
      name: 'MegaExplorer', 
      url: 'https://megaexplorer.xyz' 
    },
  },
  testnet: true,
} as const

/**
 * Fee Configuration Constants
 * 
 * These values are hardcoded in the FeePolicy contract
 * Changes require deploying a new FeePolicy contract
 */
export const FEE_CONFIG = {
  // Percentage fee in basis points (10 = 0.1%)
  PCT_BPS: 10,
  
  // Fixed fee per sync in wei (0 = no fixed fee)
  FIXED_WEI: 0,
  
  // Wei per satoshi conversion rate (1 gwei per sat)
  WEI_PER_SAT: 1_000_000_000,
  
  // Minimum Bitcoin confirmations required for sync
  MIN_CONFIRMATIONS: 1, // Testnet: faster confirmations
  
  // Maximum fee per sync operation (0.01 ETH)
  MAX_FEE_PER_SYNC: '0.01',
  
  // Default prepay amount for new users (0.1 ETH)
  DEFAULT_PREPAY_AMOUNT: '0.1',
} as const

/**
 * 🔒 SECURITY: Export private endpoints for backend use
 * Only use these in server-side code or API routes
 * NEVER expose in client-side logs or error messages
 */
export const MEGAETH_PRIVATE_ENDPOINTS = {
  rpc: MEGAETH_PRIVATE_RPC,
  ws: MEGAETH_PRIVATE_WS,
} as const

/**
 * Public information safe to display in UI
 * Does NOT contain private endpoints
 */
export const NETWORK_INFO = {
  chainId: 6342,
  name: 'MegaETH Testnet',
  symbol: 'ETH',
  explorer: 'https://megaexplorer.xyz',
  // Public RPC for documentation only (not used in production)
  publicRpc: 'https://carrot.megaeth.com/rpc',
  testnet: true,
} as const