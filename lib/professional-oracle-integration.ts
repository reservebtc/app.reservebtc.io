/**
 * Professional Oracle Integration Module
 * 
 * This module handles integration with the Professional Oracle Server
 * providing enterprise-grade user profile management and transaction history
 */

import crypto from 'crypto';

// Configuration
const ORACLE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://oracle.reservebtc.io'
  : 'http://localhost:3000';

// Encryption key for data decryption (matches server)
const ENCRYPTION_KEY = Buffer.from(process.env.ORACLE_ENCRYPTION_KEY || '', 'hex');

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface UserProfile {
  userId: string;
  ethAddress: string;
  bitcoinAddress?: string; // LEGACY: for compatibility
  bitcoinAddresses?: string[]; // FIXED: support for address array
  signature?: string;
  source: string;
  createdAt: string;
  lastActivityAt: string;
  verification: {
    status: 'pending' | 'verified' | 'failed';
    verifiedAt?: string;
    signature?: string;
  };
  statistics: {
    totalTransactions: number;
    totalMintAmount: string;
    totalBurnAmount: string;
    totalWrapAmount: string;
    totalUnwrapAmount: string;
    totalFees: string;
    lastSyncBalance: string;
  };
  settings: {
    notifications: boolean;
    dataRetention: string;
  };
  metadata: {
    version: string;
    lastUpdated: string;
  };
}

export interface TransactionRecord {
  id: string;
  hash: string;
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'sync';
  amount: string;
  timestamp: string;
  blockNumber: number;
  contract: string;
  status: 'pending' | 'success' | 'failed';
  fee?: string;
  metadata?: Record<string, any>;
  addedAt: string;
  userId: string;
}

export interface EncryptedResponse {
  encrypted: boolean;
  data: string;
  iv: string;
  authTag: string;
  algorithm: string;
  timestamp: string;
  additionalData?: string;
}

export interface OracleStatus {
  status: string;
  mode: string;
  version: string;
  uptime: number;
  metrics: {
    totalUsers: number;
    totalTransactions: number;
    totalMintOperations: number;
    totalBurnOperations: number;
    totalWrapOperations: number;
    totalUnwrapOperations: number;
    activeUsers: number;
  };
  blockchain: {
    chainId: number;
    lastSync?: string;
  };
  features: string[];
}

// ============================================================================
// ENCRYPTION/DECRYPTION UTILITIES
// ============================================================================

/**
 * Decrypt AES-256-GCM encrypted data from Oracle server
 */
function decryptOracleData(encryptedPayload: EncryptedResponse): any {
  try {
    if (!encryptedPayload.encrypted) {
      throw new Error('Data is not encrypted');
    }

    const { data, iv, authTag, additionalData = '' } = encryptedPayload;
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData));
    }
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('🔒 Oracle data decryption failed:', error);
    throw new Error('Failed to decrypt Oracle response');
  }
}

// ============================================================================
// API COMMUNICATION LAYER
// ============================================================================

/**
 * Make authenticated request to Oracle server
 */
async function makeOracleRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${ORACLE_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'ReserveBTC-Frontend/2.0.0',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Oracle API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Register new user via verification (automatic user creation)
 */
// FIXED: Add Bitcoin address validation
function isValidBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  // Basic check of length and format
  return address.length >= 26 && address.length <= 62 && /^[a-zA-Z0-9]+$/.test(address)
}

/**
 * FIXED: Support for Bitcoin address array
 * Adds new address to existing user or creates new one
 */
export async function registerUserViaOracleVerification(
  ethAddress: string,
  bitcoinAddress?: string,
  signature?: string,
  verificationType: string = 'website'
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    console.log('🏢 ORACLE REGISTRATION: Creating/updating user profile...');
    console.log(`   ETH: ${ethAddress}`);
    console.log(`   BTC: ${bitcoinAddress || 'pending'}`);
    
    // FIXED: Check address validity before saving
    if (bitcoinAddress && !isValidBitcoinAddress(bitcoinAddress)) {
      console.error('❌ INVALID BITCOIN ADDRESS:', bitcoinAddress);
      return {
        success: false,
        error: `Invalid Bitcoin address format: ${bitcoinAddress}`
      };
    }
    
    // CRITICAL FIX: Send address array instead of single address
    const payload = {
      ethAddress,
      bitcoinAddresses: bitcoinAddress ? [bitcoinAddress] : [], // array
      signature,
      status: 'verified',
      verificationType,
      operation: 'add_address' // specify that we're adding an address
    };
    console.log('🔍 ORACLE REQUEST PAYLOAD (FIXED FOR ARRAYS):', JSON.stringify(payload, null, 2));
    
    const response = await makeOracleRequest('/store-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ ORACLE REGISTRATION: User profile created/updated successfully');
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Total users: ${result.totalUsers}`);
      console.log(`   Bitcoin addresses count: ${result.bitcoinAddressesCount || 1}`);
      
      return {
        success: true,
        userId: result.userId
      };
    } else {
      console.error('❌ ORACLE REGISTRATION: Failed to create/update user profile');
      return {
        success: false,
        error: result.error || 'Unknown error'
      };
    }
  } catch (error: any) {
    console.error('❌ ORACLE REGISTRATION: Request failed:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * Get Oracle server status and metrics
 */
export async function getOracleStatus(): Promise<OracleStatus | null> {
  try {
    const response = await makeOracleRequest('/status');
    const status = await response.json();
    
    console.log('📊 ORACLE STATUS:', {
      mode: status.mode,
      users: status.metrics?.totalUsers || 0,
      transactions: status.metrics?.totalTransactions || 0
    });
    
    return status;
  } catch (error) {
    console.error('❌ Failed to get Oracle status:', error);
    return null;
  }
}

/**
 * NEW FUNCTION: Add additional Bitcoin address to existing user
 */
export async function addBitcoinAddressToUser(
  ethAddress: string,
  newBitcoinAddress: string,
  signature?: string
): Promise<{ success: boolean; totalAddresses?: number; error?: string }> {
  try {
    console.log('🔗 ORACLE ADD ADDRESS: Adding Bitcoin address to existing user...');
    console.log(`   ETH: ${ethAddress}`);
    console.log(`   New BTC: ${newBitcoinAddress}`);
    
    // Address validation
    if (!isValidBitcoinAddress(newBitcoinAddress)) {
      return {
        success: false,
        error: `Invalid Bitcoin address format: ${newBitcoinAddress}`
      };
    }
    
    const payload = {
      ethAddress,
      newBitcoinAddress,
      signature,
      operation: 'add_additional_address'
    };
    console.log('🔍 ADD ADDRESS PAYLOAD:', JSON.stringify(payload, null, 2));
    
    const response = await makeOracleRequest('/add-bitcoin-address', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ ORACLE ADD ADDRESS: Bitcoin address added successfully');
      console.log(`   Total addresses: ${result.totalAddresses}`);
      
      return {
        success: true,
        totalAddresses: result.totalAddresses
      };
    } else {
      console.error('❌ ORACLE ADD ADDRESS: Failed to add Bitcoin address');
      return {
        success: false,
        error: result.error || 'Unknown error'
      };
    }
  } catch (error: any) {
    console.error('❌ ORACLE ADD ADDRESS: Request failed:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * Get all users from Oracle (encrypted) - UPDATED for array support
 */
export async function getAllUsersFromOracle(): Promise<{
  totalUsers: number;
  users: Array<{
    ethAddress: string;
    bitcoinAddress?: string; // LEGACY: for compatibility
    bitcoinAddresses?: string[]; // FIXED: address array
    lastSyncedBalance: string;
    transactionCount: number;
    registeredAt: string;
    lastActivityAt: string;
    verificationStatus: string;
    source: string;
  }>;
} | null> {
  try {
    const response = await makeOracleRequest('/users');
    const encryptedData = await response.json() as EncryptedResponse;
    
    if (!encryptedData.encrypted) {
      throw new Error('Expected encrypted response from Oracle');
    }
    
    const decryptedData = decryptOracleData(encryptedData);
    
    console.log(`📊 ORACLE USERS: Retrieved ${decryptedData.totalUsers} users`);
    
    return decryptedData;
  } catch (error) {
    console.error('❌ Failed to get users from Oracle:', error);
    return null;
  }
}

/**
 * Get specific user profile and transaction history
 */
export async function getUserFromOracle(ethAddress: string): Promise<{
  profile: UserProfile;
  transactions: TransactionRecord[];
  totalTransactions: number;
} | null> {
  try {
    const response = await makeOracleRequest(`/user/${ethAddress}`);
    const encryptedData = await response.json() as EncryptedResponse;
    
    if (!encryptedData.encrypted) {
      throw new Error('Expected encrypted response from Oracle');
    }
    
    const decryptedData = decryptOracleData(encryptedData);
    
    console.log(`👤 ORACLE USER: Retrieved profile for ${ethAddress.substring(0, 10)}...`);
    console.log(`   Transactions: ${decryptedData.totalTransactions}`);
    console.log(`   Last activity: ${decryptedData.profile.lastActivityAt}`);
    
    return decryptedData;
  } catch (error) {
    console.error(`❌ Failed to get user ${ethAddress} from Oracle:`, error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user exists in Oracle database
 */
export async function checkUserExistsInOracle(ethAddress: string): Promise<boolean> {
  try {
    const userData = await getUserFromOracle(ethAddress);
    return userData !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get user statistics from Oracle
 */
export async function getUserStatisticsFromOracle(ethAddress: string): Promise<UserProfile['statistics'] | null> {
  try {
    const userData = await getUserFromOracle(ethAddress);
    return userData?.profile.statistics || null;
  } catch (error) {
    console.error('❌ Failed to get user statistics:', error);
    return null;
  }
}

/**
 * Get user transaction history from Oracle
 */
export async function getUserTransactionHistory(ethAddress: string): Promise<TransactionRecord[]> {
  try {
    const userData = await getUserFromOracle(ethAddress);
    return userData?.transactions || [];
  } catch (error) {
    console.error('❌ Failed to get transaction history:', error);
    return [];
  }
}

/**
 * Format transaction for display
 */
export function formatTransactionForDisplay(transaction: TransactionRecord) {
  return {
    hash: transaction.hash,
    type: transaction.type.toUpperCase(),
    amount: transaction.amount,
    timestamp: new Date(transaction.timestamp).toLocaleString(),
    status: transaction.status,
    explorerUrl: `https://explorer.megaeth.com/tx/${transaction.hash}`,
    blockNumber: transaction.blockNumber,
    fee: transaction.fee || '0'
  };
}

/**
 * Calculate user portfolio summary
 */
export function calculateUserPortfolioSummary(profile: UserProfile) {
  const stats = profile.statistics;
  
  return {
    totalValue: (
      parseFloat(stats.totalMintAmount) - 
      parseFloat(stats.totalBurnAmount) + 
      parseFloat(stats.totalWrapAmount) - 
      parseFloat(stats.totalUnwrapAmount)
    ).toFixed(8),
    totalMinted: parseFloat(stats.totalMintAmount).toFixed(8),
    totalBurned: parseFloat(stats.totalBurnAmount).toFixed(8),
    totalWrapped: parseFloat(stats.totalWrapAmount).toFixed(8),
    totalUnwrapped: parseFloat(stats.totalUnwrapAmount).toFixed(8),
    totalFeesPaid: parseFloat(stats.totalFees).toFixed(8),
    totalTransactions: stats.totalTransactions,
    lastSyncBalance: parseFloat(stats.lastSyncBalance).toFixed(8),
    memberSince: new Date(profile.createdAt).toLocaleDateString(),
    verificationStatus: profile.verification.status
  };
}

// ============================================================================
// INTEGRATION HELPERS FOR EXISTING CODE
// ============================================================================

/**
 * Create Oracle profile during verification (replaces old method)
 */
export async function createOracleProfile(
  ethAddress: string,
  bitcoinAddress?: string,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  console.log('🏢 ORACLE INTEGRATION: Creating user profile via Professional Oracle...');
  
  const result = await registerUserViaOracleVerification(
    ethAddress,
    bitcoinAddress,
    signature,
    'website_verification'
  );
  
  if (result.success) {
    return {
      success: true,
      message: 'Oracle profile created successfully'
    };
  } else {
    return {
      success: false,
      message: result.error || 'Failed to create Oracle profile'
    };
  }
}

/**
 * Check Oracle health and connectivity
 */
export async function checkOracleHealth(): Promise<boolean> {
  try {
    const response = await makeOracleRequest('/health');
    const health = await response.json();
    return health.status === 'healthy';
  } catch (error) {
    console.error('❌ Oracle health check failed:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export default {
  registerUserViaOracleVerification,
  addBitcoinAddressToUser, // NEW FUNCTION
  getOracleStatus,
  getAllUsersFromOracle,
  getUserFromOracle,
  checkUserExistsInOracle,
  getUserStatisticsFromOracle,
  getUserTransactionHistory,
  formatTransactionForDisplay,
  calculateUserPortfolioSummary,
  createOracleProfile,
  checkOracleHealth
};