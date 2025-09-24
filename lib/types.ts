// lib/types.ts - Production-ready type definitions for ReserveBTC

// Transaction types
export interface Transaction {
  tx_hash: string
  block_number: number
  block_timestamp: string
  user_address: string
  tx_type: 'MINT' | 'BURN' | 'DEPOSIT' | 'WITHDRAW' | 'SYNC' | 'EMERGENCY_BURN'
  amount: string
  delta?: string
  fee_wei?: string
  bitcoin_address?: string
  gas_used?: number
  gas_price?: string
  status: 'pending' | 'confirmed' | 'failed'
  metadata?: Record<string, any>
}

export interface TransactionResponse {
  tx_hash?: string
  hash?: string
  block_number?: number
  block?: number
  block_timestamp?: string
  timestamp?: string
  user_address?: string
  tx_type?: string
  type?: string
  amount: string
  delta?: string
  fee_wei?: string
  fee?: string
  bitcoin_address?: string
  bitcoinAddress?: string
  gas_used?: number | string
  gasUsed?: string
  gas_price?: string
  gasPrice?: string
  status: string
  metadata?: Record<string, any>
}

// Balance types
export interface BalanceData {
  address: string
  rbtc: string
  wrbtc?: string
  lastUpdate?: string
  error?: string
}

// Bitcoin address types
export interface BitcoinAddress {
  bitcoin_address: string
  network: 'mainnet' | 'testnet'
  verified_at: string
  is_monitoring: boolean
}

export interface BitcoinAddressesResponse {
  success?: boolean
  address?: string
  bitcoinAddresses: BitcoinAddress[]
  error?: string
}

// Oracle types
export interface OracleUserData {
  encrypted: string
  hasData: boolean
  registeredAt: string | null
  bitcoinAddressCount: number
  isMonitoring: boolean
  mintedAddresses: string[]
  btcAddresses: string[]
  error?: string
}

export interface OracleOperation {
  id: string
  timestamp: string
  action: string
  userAddress: string
  bitcoinAddress?: string
  amount?: string
  status: string
  metadata?: Record<string, any>
}

// Verification types
export interface VerificationRequest {
  bitcoinAddress: string
  ethereumAddress?: string
  message: string
  signature: string
}

export interface VerificationResponse {
  success: boolean
  data?: {
    bitcoinAddress: string
    ethereumAddress: string
    verified: boolean
    timestamp: string
  }
  error?: string
}

// Yield Scales types
export interface YieldScalesStats {
  currentYieldRate: number
  totalParticipants: number
  totalTVL: number
  scalesBalance: {
    usdtScale: number
    rbtcScale: number
  }
  lastUpdated: string
}

export interface YieldScalesParticipant {
  isParticipant: boolean
  participantType: 'bitcoin_holder' | 'trader' | null
  virtualUSDTDeposited?: number
  rbtcContributed?: number
  yieldEarned: number
  yieldClaimed: number
  joinedAt?: string
  lastActivityAt?: string
  loyaltyTier?: 'bronze' | 'silver' | 'gold'
}

export interface LoyaltyData {
  tier: 'bronze' | 'silver' | 'gold'
  multiplier: number
  timeInSystem: number
  nextTierIn: number
  benefits: string[]
}

// Dispute types
export interface Dispute {
  id: string
  userAddress: string
  reportedBalance: string
  oracleBalance: string
  status: 'pending' | 'resolved' | 'rejected'
  description?: string
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

// Emergency burn types
export interface EmergencyBurn {
  id: string
  userAddress: string
  burnedAmount: string
  reason: string
  timestamp: string
  blockNumber: number
  txHash?: string
}

// Proof of reserves types
export interface ProofOfReserves {
  totalRBTC: string
  totalBTC: string
  backingRatio: number
  merkleRoot?: string
  lastUpdated: string
  verificationUrl?: string
}

// Sync status types
export interface SyncStatus {
  address: string
  lastSync: string | null
  pendingSyncs: number
  syncHistory: Array<{
    timestamp: string
    oldBalance: string
    newBalance: string
    delta: string
    fee: string
  }>
}

// Partner types
export interface PartnerApplication {
  companyName: string
  contactEmail: string
  website?: string
  description: string
  expectedVolume: string
  integrationType: 'api' | 'sdk' | 'custom'
}

export interface PartnerYieldData {
  protocol: string
  totalUSDTLocked: number
  totalRBTCBacking: number
  currentYieldRate: number
  projectedReturns: {
    daily: number
    weekly: number
    monthly: number
    annual: number
  }
  scalesBalance: {
    usdtScale: number
    rbtcScale: number
  }
}

// Fee vault types
export interface FeeVaultHistory {
  deposits: Array<{
    timestamp: string
    amount: string
    txHash: string
  }>
  withdrawals: Array<{
    timestamp: string
    amount: string
    txHash: string
  }>
  totalDeposited: string
  totalWithdrawn: string
  currentBalance: string
}

// Generic API response
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

// Monitoring types
export interface MonitoringRequest {
  userAddress: string
  bitcoinAddress: string
  initialBalance?: number
}

export interface MonitoringResponse {
  success: boolean
  message?: string
  error?: string
  registrationHash?: string
  feeVaultBalance?: string
  requiredFee?: string
}

// Cron job types
export interface CronJobStatus {
  lastRun: string
  nextRun: string
  status: 'active' | 'inactive' | 'error'
  processedCount?: number
  errors?: string[]
}

// User data types
export interface UserData {
  ethAddress: string
  bitcoinAddress?: string
  bitcoinAddresses?: string[]
  btcAddresses?: string[]
  registeredAt: string
  lastSync?: string
  totalMinted?: string
  totalBurned?: string
  currentBalance?: string
}

// Pagination types
export interface PaginationParams {
  limit?: number
  offset?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    count: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Error types
export interface ErrorResponse {
  error: string
  code?: string
  details?: any
  timestamp: string
}