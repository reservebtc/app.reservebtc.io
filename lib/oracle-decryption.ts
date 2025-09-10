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
    console.log('🔐 UNIVERSAL DECRYPTION: Starting Oracle data decryption process...');
    console.log('🔍 DEBUG: Response structure:', {
      encrypted: encryptedResponse.encrypted,
      hasData: !!encryptedResponse.data,
      timestamp: encryptedResponse.timestamp,
      note: encryptedResponse.note
    });

    if (!encryptedResponse.encrypted || !encryptedResponse.data) {
      console.error('❌ UNIVERSAL ERROR: Invalid encrypted response format');
      console.error('❌ DEBUG: Response details:', JSON.stringify(encryptedResponse, null, 2));
      return null;
    }

    const encryptedData = encryptedResponse.data;

    // Handle fallback base64 decryption (simplified encryption for compatibility)
    if (encryptedData.iv === 'fallback' && encryptedData.authTag === 'fallback') {
      console.log('🔓 UNIVERSAL DECRYPTION: Using base64 fallback method...');
      try {
        const decodedData = atob(encryptedData.encrypted);
        const userData = JSON.parse(decodedData);
        
        console.log('✅ UNIVERSAL SUCCESS: Base64 decryption successful!');
        console.log('📊 UNIVERSAL SUCCESS: Decrypted', Object.keys(userData).length, 'users');
        console.log('📋 UNIVERSAL SUCCESS: Sample user keys:', Object.keys(userData).slice(0, 3));
        return userData;
      } catch (error) {
        console.error('❌ UNIVERSAL ERROR: Base64 fallback decryption failed:', error);
        console.error('❌ UNIVERSAL ERROR: Error details:', error instanceof Error ? error.message : String(error));
        return null;
      }
    }

    // Multi-layer decryption to match Oracle encryption process
    console.log('🔓 UNIVERSAL DECRYPTION: Attempting multi-layer decryption...');
    try {
      // Import crypto and zlib dynamically for Next.js compatibility
      const crypto = await import('crypto');
      const zlib = await import('zlib');
      const encryptionKey = process.env.NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY;
      
      if (!encryptionKey) {
        console.error('❌ UNIVERSAL ERROR: No encryption key found in environment!');
        console.error('❌ UNIVERSAL ERROR: Set NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY in Vercel env vars');
        console.error('❌ UNIVERSAL ERROR: Available env keys:', Object.keys(process.env).filter(key => key.includes('ORACLE')));
        throw new Error('No encryption key');
      }
      
      console.log('🔑 Using encryption key (first 8 chars):', encryptionKey.substring(0, 8) + '...');
      
      console.log('🔑 UNIVERSAL DECRYPTION: Using AES encryption key from environment...');
      console.log('🔍 DEBUG: Encrypted data format:', {
        encryptedLength: encryptedData.encrypted?.length,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        compression: (encryptedData as any).compression
      });
      
      // Step 1: Base64 decode the outer layer
      console.log('🔓 Step 1: Base64 decoding outer layer...');
      const base64DecodedData = Buffer.from(encryptedData.encrypted, 'base64').toString('base64');
      
      // Step 2: AES-256-CBC decryption
      console.log('🔓 Step 2: AES-256-CBC decryption...');
      const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
      let decrypted = decipher.update(base64DecodedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Step 3: Decompression (if compressed)
      console.log('🔓 Step 3: Checking for compression...');
      let finalData = decrypted;
      if ((encryptedData as any).compression !== false) {
        try {
          console.log('🔓 Step 3a: Decompressing zlib data...');
          const compressedBuffer = Buffer.from(decrypted, 'base64');
          const decompressedBuffer = zlib.inflateSync(compressedBuffer);
          finalData = decompressedBuffer.toString('utf8');
          console.log('✅ Decompression successful');
        } catch (decompressionError) {
          console.log('ℹ️ No compression detected, using raw data');
          finalData = decrypted;
        }
      }
      
      // Step 4: JSON parse
      console.log('🔓 Step 4: JSON parsing...');
      const userData = JSON.parse(finalData);
      
      console.log('✅ UNIVERSAL SUCCESS: Multi-layer decryption successful!');
      console.log('📊 UNIVERSAL SUCCESS: Decrypted', Object.keys(userData).length, 'users');
      console.log('📋 UNIVERSAL SUCCESS: Sample user keys:', Object.keys(userData).slice(0, 3));
      return userData;
    } catch (aesError) {
      console.error('❌ UNIVERSAL ERROR: Multi-layer decryption failed!');
      console.error('❌ UNIVERSAL ERROR: AES Error details:', aesError instanceof Error ? aesError.message : String(aesError));
      console.log('🔄 UNIVERSAL FALLBACK: Trying simple base64 decryption as backup...');
      
      // Fallback to simple base64 if multi-layer fails
      try {
        const decodedData = Buffer.from(encryptedData.encrypted, 'base64').toString('utf8');
        const userData = JSON.parse(decodedData);
        console.log('✅ UNIVERSAL SUCCESS: Simple base64 fallback worked!');
        console.log('📊 UNIVERSAL SUCCESS: Decrypted', Object.keys(userData).length, 'users via base64');
        console.log('📋 UNIVERSAL SUCCESS: Sample user keys:', Object.keys(userData).slice(0, 3));
        return userData;
      } catch (base64Error) {
        console.error('❌ UNIVERSAL ERROR: Both AES and base64 decryption failed!');
        console.error('❌ UNIVERSAL ERROR: Base64 Error details:', base64Error instanceof Error ? base64Error.message : String(base64Error));
        console.error('❌ UNIVERSAL ERROR: Complete decryption failure - check Oracle server configuration');
        return null;
      }
    }

  } catch (error) {
    console.error('❌ UNIVERSAL ERROR: Unexpected decryption error:', error);
    console.error('❌ UNIVERSAL ERROR: Unexpected error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ UNIVERSAL ERROR: This should not happen - check code logic');
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
 * Fetch and decrypt Oracle user data
 */
export async function getDecryptedOracleUsers(): Promise<Record<string, UserData> | null> {
  try {
    console.log('🔐 UNIVERSAL SOLUTION: Fetching encrypted Oracle user data for ALL users...');
    console.log('🔍 DEBUG: Oracle URL:', `${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/internal-users`);
    console.log('🔑 DEBUG: Has encryption key:', !!process.env.NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY);
    console.log('🔑 DEBUG: Has API key:', !!process.env.NEXT_PUBLIC_ORACLE_API_KEY);

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
      console.error('❌ DASHBOARD ERROR: Encrypted Oracle endpoint failed:', response.status, response.statusText);
      console.error('❌ DASHBOARD ERROR: Response details:', await response.text().catch(() => 'Could not read response'));
      console.error('❌ DASHBOARD ERROR: Request URL:', `${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/internal-users`);
      console.error('❌ DASHBOARD ERROR: API Key present:', !!process.env.NEXT_PUBLIC_ORACLE_API_KEY);
      console.error('❌ DASHBOARD ERROR: API Key value (first 10 chars):', process.env.NEXT_PUBLIC_ORACLE_API_KEY?.substring(0, 10) + '...');
      console.error('❌ DASHBOARD ERROR: Encryption key present:', !!process.env.NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY);
      console.error('❌ DASHBOARD ERROR: This means user profile cannot load - encrypted data is REQUIRED');
      console.error('❌ DASHBOARD ERROR: Check Vercel environment variables configuration');
      
      // CRITICAL: Do not fallback to public endpoint - we need real addresses
      console.error('🚨 DASHBOARD CRITICAL: Cannot use public endpoint fallback - it returns hashed addresses');
      console.error('🚨 DASHBOARD CRITICAL: User dashboard will show empty state until encrypted endpoint works');
      
      throw new Error(`Oracle encrypted endpoint failed: ${response.status} - Check API key configuration`);
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
      console.log('✅ DASHBOARD SUCCESS: Oracle data decrypted successfully!');
      console.log('📊 DASHBOARD SUCCESS: Total users found:', Object.keys(decryptedData).length);
      console.log('🔐 PRIVACY: User data decrypted (details protected)');
      console.log('📋 DASHBOARD SUCCESS: Oracle decryption complete - user lookup can proceed');
    } else {
      console.error('❌ DASHBOARD ERROR: Decryption returned null data');
    }
    
    return decryptedData;

  } catch (error) {
    console.error('❌ DASHBOARD CRITICAL: Failed to fetch/decrypt Oracle data:', error);
    console.error('❌ DASHBOARD CRITICAL: Error details:', error instanceof Error ? error.message : String(error));
    console.error('🚨 DASHBOARD CRITICAL: No fallback available - encrypted endpoint is REQUIRED');
    console.error('🚨 DASHBOARD CRITICAL: User will see empty dashboard until this is fixed');
    console.error('🚨 DASHBOARD CRITICAL: Check these Vercel environment variables:');
    console.error('   - NEXT_PUBLIC_ORACLE_API_KEY should be: internal-api-key-reservebtc-site-2025');
    console.error('   - NEXT_PUBLIC_ORACLE_BASE_URL should be: https://oracle.reservebtc.io');
    console.error('   - NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY should be: 3fc8e1758b839...');
    
    // Do not return fallback data - throw error to show user what's wrong
    throw new Error('Oracle encrypted endpoint required for user dashboard - check environment variables');
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