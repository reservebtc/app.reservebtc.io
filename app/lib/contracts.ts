// MegaETH Testnet Contract Addresses - Updated 2025-09-04 (Fixed Architecture)
export const CONTRACTS = {
  // Chain Configuration
  CHAIN_ID: 6342,
  RPC_URL: 'https://carrot.megaeth.com/rpc',
  
  // Contract Addresses on MegaETH Testnet - ATOMIC DEPLOYMENT
  FEE_POLICY: '0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4',
  FEE_VAULT: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f', 
  RBTC_SYNTH: '0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58',
  VAULT_WRBTC: '0xa10FC332f12d102Dddf431F8136E4E89279EFF87',
  ORACLE_AGGREGATOR: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
  
  // Oracle Configuration
  // Note: This is the actual Oracle committee address that controls sync operations
  ORACLE_COMMITTEE: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
  // Note: This is where collected fees go (treasury/multisig)
  FEE_COLLECTOR: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
  // Note: The actual Oracle address in contracts is ORACLE_COMMITTEE, not ORACLE_AGGREGATOR
  // ORACLE_AGGREGATOR is the smart contract that processes sync operations
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
    'function balanceOf(address user) view returns (uint256)',
    'function spendFrom(address user, uint256 amount)',
    'function withdrawUnused()',
    'function oracle() view returns (address)',
    'function feeCollector() view returns (address)',
    'event Deposited(address indexed user, uint256 amount)',
    'event Spent(address indexed user, uint256 amount, address indexed spender)',
    'event Withdrawn(address indexed user, uint256 amount)',
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
    'function redeem(uint256 amount)',
    'function onWrap(address user, uint256 amount)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event Wrapped(address indexed user, uint256 amount)',
    'event Redeemed(address indexed user, uint256 amount)',
    'event Slashed(address indexed user, uint256 amount)',
  ],
  
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