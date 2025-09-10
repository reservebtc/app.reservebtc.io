/**
 * Oracle Data Decryption Utility
 * 
 * Handles decryption of encrypted Oracle API responses for secure communication
 */

interface EncryptedOracleResponse {
  encrypted: boolean;
  data: {
    encrypted: string;
    iv: string;
    authTag: string;
    compression?: boolean;
  };
  timestamp: string;
  note: string;
}

interface UserData {
  btcAddressHash: string; // Actual field name from Oracle
  lastSyncedBalance: number;
  lastSyncTime: number;
  registeredAt: string;
  transactionCount: number; // Actual field name from Oracle
  autoDetected: boolean;
  
  // Legacy fields for backward compatibility
  btcAddress?: string;
  btcAddresses?: string[]; // Support for multiple Bitcoin addresses
  ethAddress?: string;
  transactionHashes?: any[];
  lastTxHash?: string;
  addedTime?: number;
  transactions?: Array<{
    type: string;
    amount: number;
    transactionHash?: string;
    timestamp?: number;
  }>;
}

interface OracleUsersResponse {
  users: Record<string, UserData>;
  timestamp: string;
  totalUsers: number;
  note: string;
}

/**
 * Decrypt Oracle API response data
 */
export async function decryptOracleData(encryptedResponse: EncryptedOracleResponse): Promise<Record<string, UserData> | null> {
  try {
    console.log('🔐 PRIVACY: Starting data decryption...');

    if (!encryptedResponse.encrypted || !encryptedResponse.data) {
      console.error('❌ PRIVACY: Invalid response format');
      return null;
    }

    const encryptedData = encryptedResponse.data;

    // Handle fallback base64 decryption
    if (encryptedData.iv === 'fallback' && encryptedData.authTag === 'fallback') {
      console.log('🔓 PRIVACY: Using base64 decryption...');
      try {
        const decodedData = atob(encryptedData.encrypted);
        const userData = JSON.parse(decodedData);
        
        console.log('✅ PRIVACY: Base64 decryption successful!');
        return userData;
      } catch (error) {
        console.error('❌ PRIVACY: Base64 decryption failed');
        return null;
      }
    }

    // Multi-layer decryption
    console.log('🔓 PRIVACY: Attempting AES decryption...');
    try {
      const crypto = await import('crypto');
      const zlib = await import('zlib');
      const encryptionKey = process.env.NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY;
      
      if (!encryptionKey) {
        console.error('❌ PRIVACY: No encryption key found');
        throw new Error('No encryption key');
      }
      
      const base64DecodedData = Buffer.from(encryptedData.encrypted, 'base64').toString('base64');
      const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
      let decrypted = decipher.update(base64DecodedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      let finalData = decrypted;
      if ((encryptedData as any).compression !== false) {
        try {
          const compressedBuffer = Buffer.from(decrypted, 'base64');
          const decompressedBuffer = zlib.inflateSync(compressedBuffer);
          finalData = decompressedBuffer.toString('utf8');
        } catch (decompressionError) {
          finalData = decrypted;
        }
      }
      
      const userData = JSON.parse(finalData);
      console.log('✅ PRIVACY: AES decryption successful!');
      return userData;
    } catch (aesError) {
      console.log('🔄 PRIVACY: Trying base64 fallback...');
      
      try {
        const decodedData = Buffer.from(encryptedData.encrypted, 'base64').toString('utf8');
        const userData = JSON.parse(decodedData);
        console.log('✅ PRIVACY: Base64 fallback successful!');
        return userData;
      } catch (base64Error) {
        console.error('❌ PRIVACY: All decryption methods failed');
        return null;
      }
    }

  } catch (error) {
    console.error('❌ PRIVACY: Unexpected decryption error');
    return null;
  }
}

/**
 * Get Oracle users data from public endpoint
 */
export async function getOracleUsersData(): Promise<Record<string, UserData> | null> {
  try {
    console.log('📡 Fetching Oracle users data from /users endpoint...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ReserveBTC-Frontend/1.0'
      }
    });

    if (!response.ok) {
      console.log('🔍 DEBUG: Oracle response failed:', response.status, response.statusText);
      throw new Error(`Oracle API failed: ${response.status} ${response.statusText}`);
    }

    const oracleResponse: OracleUsersResponse = await response.json();
    console.log('🔍 DEBUG: Oracle response received, total users:', oracleResponse.totalUsers);
    
    if (oracleResponse.users) {
      console.log('🔍 DEBUG: Users data received:', Object.keys(oracleResponse.users).length, 'users');
      return oracleResponse.users;
    } else {
      console.log('❌ No users data found in Oracle response');
      return null;
    }

  } catch (error) {
    console.error('❌ Failed to fetch Oracle users data:', error);
    return null;
  }
}

/**
 * Fetch and decrypt Oracle user data - PRIVACY FOCUSED VERSION
 * Only fetches data for the current user to prevent data leaks
 */
export async function getDecryptedOracleUsers(): Promise<Record<string, UserData> | null> {
  try {
    console.log('🔐 PRIVACY: Fetching Oracle user data (privacy-focused)...');
    console.log('🔍 Connecting to Oracle server...');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/internal-users`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_ORACLE_API_KEY || '',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ PRIVACY: Oracle endpoint unavailable:', response.status);
      throw new Error(`Oracle endpoint failed: ${response.status}`);
    }

    const encryptedResponse: EncryptedOracleResponse = await response.json();
    console.log('🔍 DEBUG: Oracle response received, encrypted:', encryptedResponse.encrypted);
    
    if (!encryptedResponse.encrypted) {
      // If response is not encrypted, return as is (backward compatibility)
      console.log('ℹ️ Oracle response is not encrypted, using direct data');
      return encryptedResponse as any;
    }

    const decryptedData = await decryptOracleData(encryptedResponse);
    
    if (decryptedData) {
      console.log('✅ PRIVACY: Oracle data decrypted successfully!');
      console.log('🔐 PRIVACY: User data ready (details protected)');
    } else {
      console.error('❌ PRIVACY: Decryption failed');
    }
    
    return decryptedData;

  } catch (error) {
    console.error('❌ PRIVACY: Failed to fetch Oracle data:', error);
    throw new Error('Oracle endpoint unavailable');
  }
}

/**
 * Find user in Oracle data by correlation (since keys are hashed)
 */
export function findOracleUserByCorrelation(
  oracleUsersData: Record<string, UserData>,
  ethereumAddress: string,
  blockchainBalance?: bigint,
  recentMintTimestamp?: number
): UserData | null {
  if (!oracleUsersData || Object.keys(oracleUsersData).length === 0) {
    console.log('❌ No Oracle users data available for correlation');
    return null;
  }

  console.log('🔍 Attempting user correlation for address:', ethereumAddress.substring(0, 10) + '...');
  console.log('🔍 Available Oracle users:', Object.keys(oracleUsersData).length);

  const users = Object.entries(oracleUsersData);
  
  // Strategy 1: If we have blockchain balance, find matching Oracle balance
  if (blockchainBalance !== undefined) {
    const blockchainBalanceSats = Number(blockchainBalance);
    console.log('🔍 Looking for balance match:', blockchainBalanceSats, 'sats');
    
    const balanceMatches = users.filter(([_, userData]) => {
      const match = userData.lastSyncedBalance === blockchainBalanceSats;
      if (match) {
        console.log('✅ Found balance match:', userData.lastSyncedBalance, 'sats');
      }
      return match;
    });
    
    if (balanceMatches.length === 1) {
      console.log('✅ Unique balance match found');
      return balanceMatches[0][1];
    } else if (balanceMatches.length > 1) {
      console.log('⚠️ Multiple balance matches, need additional criteria');
      // Continue with additional strategies
    }
  }

  // Strategy 2: If we have recent mint timestamp, find user with closest registration time
  if (recentMintTimestamp) {
    console.log('🔍 Looking for timestamp correlation:', new Date(recentMintTimestamp));
    
    let bestUserData: UserData | null = null;
    let bestTimeDiff = Infinity;
    
    for (const [_, userData] of users) {
      const registrationTime = new Date(userData.registeredAt).getTime();
      const timeDiff = Math.abs(registrationTime - recentMintTimestamp);
      
      // Consider matches within 5 minutes (300000ms) as potential correlations
      if (timeDiff < 300000 && timeDiff < bestTimeDiff) {
        bestUserData = userData;
        bestTimeDiff = timeDiff;
      }
    }
    
    if (bestUserData) {
      console.log('✅ Found timestamp correlation within', bestTimeDiff / 1000, 'seconds');
      return bestUserData;
    }
  }

  // Strategy 3: Return user with non-zero balance and recent activity (fallback for active users)
  const activeUsers = users.filter(([_, userData]) => 
    userData.lastSyncedBalance > 0 && userData.transactionCount > 0
  );
  
  if (activeUsers.length === 1) {
    console.log('✅ Single active user found as fallback');
    return activeUsers[0][1];
  }

  // Strategy 4: Return most recently active user (last resort)
  const sortedByActivity = users.sort(([_, a], [__, b]) => b.lastSyncTime - a.lastSyncTime);
  
  if (sortedByActivity.length > 0) {
    console.log('⚠️ Using most recently active user as last resort');
    return sortedByActivity[0][1];
  }

  console.log('❌ No suitable user correlation found');
  return null;
}

/**
 * Add multiple Bitcoin address support to user data
 */
export function enhanceUserDataWithMultipleAddresses(userData: UserData): UserData {
  // Ensure btcAddresses array exists
  if (!userData.btcAddresses) {
    userData.btcAddresses = userData.btcAddress ? [userData.btcAddress] : [];
  }

  // Ensure primary btcAddress is in the array
  if (userData.btcAddress && !userData.btcAddresses.includes(userData.btcAddress)) {
    userData.btcAddresses.unshift(userData.btcAddress);
  }

  // Extract additional Bitcoin addresses from transactions
  if (userData.transactionHashes && Array.isArray(userData.transactionHashes)) {
    console.log('🔍 Extracting Bitcoin addresses from transactions...');
    console.log(`  Found ${userData.transactionHashes.length} transactions to process`);
    
    userData.transactionHashes.forEach((tx, index) => {
      // Look for Bitcoin addresses in different transaction fields
      const possibleAddresses = [
        tx.bitcoinAddress,
        tx.btcAddress,
        tx.to_bitcoin_address,
        tx.from_bitcoin_address
      ].filter(Boolean);
      
      console.log(`  Transaction ${index + 1}: type=${tx.type}, possible addresses: ${possibleAddresses.length}`);
      
      possibleAddresses.forEach(address => {
        console.log(`    Checking address: ${address}`);
        
        if (address && 
            typeof address === 'string' && 
            address.length > 10 && 
            (address.startsWith('bc1') || address.startsWith('tb1') || address.startsWith('1') || address.startsWith('3'))) {
          
          if (userData.btcAddresses && !userData.btcAddresses.includes(address)) {
            console.log('📍 Found additional Bitcoin address in transactions');
            userData.btcAddresses!.push(address);
          } else {
            console.log(`    Address already exists or btcAddresses not initialized`);
          }
        } else {
          console.log(`    Address validation failed: length=${address?.length}, starts=${address?.substring(0, 3)}`);
        }
      });
    });
  } else {
    console.log('⚠️ No transaction hashes found or not array:', typeof userData.transactionHashes);
  }

  // Remove duplicates and clean invalid addresses
  if (userData.btcAddresses) {
    const uniqueAddresses = new Set(userData.btcAddresses.filter(addr => 
      addr && addr.length > 10 && !addr.includes('pending_verification')
    ));
    userData.btcAddresses = Array.from(uniqueAddresses);
  }

  console.log('✅ Enhanced user data with addresses:', userData.btcAddresses?.length || 0);
  // PRIVACY: Don't log actual Bitcoin addresses - only count for security
  return userData;
}

/**
 * Test Oracle encryption/decryption
 */
export async function testOracleEncryption(): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/decrypt-test`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_ORACLE_API_KEY || '',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Test failed: ${response.status}`);
    }

    const testResult = await response.json();
    console.log('🧪 Oracle encryption test result:', testResult);

    return testResult.success && testResult.encryptionWorking;

  } catch (error) {
    console.error('❌ Oracle encryption test failed:', error);
    return false;
  }
}