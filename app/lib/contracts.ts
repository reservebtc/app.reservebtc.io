// MegaETH Testnet Contract Addresses - Deployed 2025-08-30
export const CONTRACTS = {
  // Chain Configuration
  CHAIN_ID: 6342,
  RPC_URL: 'https://carrot.megaeth.com/rpc',
  
  // Contract Addresses on MegaETH Testnet
  FEE_POLICY: '0x2F0f48EA3dD5bCff86A178F20f9c4AB2860CD468',
  FEE_VAULT: '0x298b3746B593df83E5bB2122cb80d17bdE2AB5fF', 
  RBTC_SYNTH: '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB',
  VAULT_WRBTC: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
  ORACLE_AGGREGATOR: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
  
  // Oracle Configuration
  ORACLE_COMMITTEE: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
  FEE_COLLECTOR: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
} as const;

// Contract ABIs (simplified for frontend)
export const CONTRACT_ABIS = {
  FEE_POLICY: [
    'function pctBps() view returns (uint256)',
    'function fixedWei() view returns (uint256)', 
    'function weiPerSat() view returns (uint256)',
    'function quoteFees(address user, int64 deltaSats) view returns (uint256)',
  ],
  
  FEE_VAULT: [
    'function depositETH(address user) payable',
    'function balances(address user) view returns (uint256)',
    'function oracle() view returns (address)',
    'function feeCollector() view returns (address)',
    'event Deposit(address indexed user, uint256 amount)',
  ],
  
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
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  
  ORACLE_AGGREGATOR: [
    'function sync(address user, uint64 newBalanceSats, uint32 height, uint64 timestamp)',
    'function lastSats(address user) view returns (uint64)',
    'function committee() view returns (address)',
    'function minConfirmations() view returns (uint256)',
    'function maxFeePerSyncWei() view returns (uint256)',
    'function synth() view returns (address)',
    'function feeVault() view returns (address)', 
    'function feePolicy() view returns (address)',
    'event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp)',
    'event NeedsTopUp(address indexed user)',
  ],
} as const;

// MegaETH Network Configuration for wagmi/viem
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
    public: { http: ['https://carrot.megaeth.com/rpc'] },
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  },
  blockExplorers: {
    default: { name: 'MegaExplorer', url: 'https://megaexplorer.xyz' },
  },
  testnet: true,
} as const;

// Fee Configuration Constants
export const FEE_CONFIG = {
  PCT_BPS: 10, // 0.1% in basis points
  FIXED_WEI: 0, // No fixed fee
  WEI_PER_SAT: 1_000_000_000, // 1 gwei per satoshi
  MIN_CONFIRMATIONS: 1, // Testnet: faster confirmations
  MAX_FEE_PER_SYNC: '0.01', // 0.01 ETH max fee (as string for BigNumber)
} as const;