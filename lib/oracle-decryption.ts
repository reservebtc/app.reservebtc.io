/**
 * Oracle Data Decryption Utility
 * 
 * Handles decryption of encrypted Oracle API responses for secure communication
 */

interface EncryptedOracleResponse {
  encrypted: boolean;
  data: string;
  iv: string;
  authTag?: string;
  algorithm: string;
  timestamp: string;
  note?: string;
  additionalData?: string;
}

export interface UserData {
  // Professional Oracle Server fields (from createUserProfile)
  userId?: string;
  ethAddress: string;
  bitcoinAddress?: string; // Main Bitcoin address field from Professional Oracle
  signature?: string;
  source?: string;
  createdAt?: string;
  lastActivityAt?: string;
  verification?: {
    status: string;
    verifiedAt?: string;
    signature?: string;
  };
  statistics?: {
    totalTransactions?: number;
    lastSyncBalance?: string;
  };
  
  // Legacy Oracle fields for backward compatibility
  btcAddressHash?: string;
  lastSyncedBalance?: number;
  lastSyncTime?: number;
  registeredAt?: string;
  transactionCount?: number;
  autoDetected?: boolean;
  btcAddress?: string;
  btcAddresses?: string[];
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
  users: UserData[];
  timestamp: string;
  totalUsers: number;
  note: string;
  mode: string;
}

/**
 * Decrypt Oracle API response data
 */
export async function decryptOracleData(encryptedResponse: EncryptedOracleResponse): Promise<UserData[] | null> {
  try {
    console.log('🔐 PRIVACY: Starting data decryption...');

    // Check for build mode or missing encryption key
    const encryptionKey = process.env.NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY
    if (!encryptionKey || (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL && !process.env.VERCEL)) {
      console.log('🔧 BUILD: Skipping decryption during build or missing key');
      return [];
    }

    if (!encryptedResponse.encrypted || !encryptedResponse.data) {
      console.error('❌ PRIVACY: Invalid response format');
      return null;
    }

    // Handle direct AES-256-GCM decryption
    console.log('🔓 PRIVACY: Using AES-256-GCM decryption...');
    console.log('🔍 PRIVACY: Algorithm:', encryptedResponse.algorithm);
    console.log('🔍 PRIVACY: IV length:', encryptedResponse.iv?.length);
    console.log('🔍 PRIVACY: Data length:', encryptedResponse.data?.length);

    try {
      const encryptionKey = process.env.NEXT_PUBLIC_ORACLE_ENCRYPTION_KEY;
      
      if (!encryptionKey) {
        console.error('❌ PRIVACY: No encryption key found');
        throw new Error('No encryption key');
      }
      
      // For browser environment, use Web Crypto API
      if (typeof window !== 'undefined') {
        console.log('🌐 PRIVACY: Using Web Crypto API for browser...');
        
        const keyBuffer = new Uint8Array(
          encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        const ivBuffer = new Uint8Array(
          encryptedResponse.iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        // For AES-GCM, encrypted data and authTag must be combined correctly
        const encryptedDataBuffer = new Uint8Array(
          encryptedResponse.data.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        // For Web Crypto API, authTag must be appended to encrypted data
        let encryptedBuffer: Uint8Array;
        if (encryptedResponse.authTag) {
          const authTagBuffer = new Uint8Array(
            encryptedResponse.authTag.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
          );
          console.log('🔍 PRIVACY: AuthTag length:', authTagBuffer.length);
          
          // Append authTag to encrypted data for Web Crypto API
          encryptedBuffer = new Uint8Array(encryptedDataBuffer.length + authTagBuffer.length);
          encryptedBuffer.set(encryptedDataBuffer);
          encryptedBuffer.set(authTagBuffer, encryptedDataBuffer.length);
        } else {
          console.warn('⚠️ PRIVACY: No authTag found - this may fail for AES-GCM');
          encryptedBuffer = encryptedDataBuffer;
        }
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        
        // Prepare GCM parameters
        const gcmParams: AesGcmParams = { 
          name: 'AES-GCM', 
          iv: ivBuffer 
        };
        
        // Add additionalData if present
        if (encryptedResponse.additionalData) {
          const additionalDataBuffer = new TextEncoder().encode(encryptedResponse.additionalData);
          gcmParams.additionalData = additionalDataBuffer;
          console.log('🔍 PRIVACY: Using additionalData:', encryptedResponse.additionalData);
        }
        
        const decryptedBuffer = await crypto.subtle.decrypt(
          gcmParams,
          cryptoKey,
          encryptedBuffer.buffer as ArrayBuffer
        );
        
        const decryptedText = new TextDecoder().decode(decryptedBuffer);
        const userData = JSON.parse(decryptedText);
        
        console.log('✅ PRIVACY: Web Crypto API decryption successful!');
        return userData.users || [];
      } else {
        // For Node.js environment
        console.log('💻 PRIVACY: Using Node.js crypto for server...');
        const crypto = await import('crypto');
        
        const keyBuffer = Buffer.from(encryptionKey, 'hex');
        const iv = Buffer.from(encryptedResponse.iv, 'hex');
        const encryptedData = Buffer.from(encryptedResponse.data, 'hex');
        
        // Node.js version must also use GCM for Professional Oracle
        const authTag = encryptedResponse.authTag ? Buffer.from(encryptedResponse.authTag, 'hex') : Buffer.alloc(0);
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
        if (authTag.length > 0) {
          decipher.setAuthTag(authTag);
        }
        if (encryptedResponse.additionalData) {
          decipher.setAAD(Buffer.from(encryptedResponse.additionalData));
        }
        
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        const userData = JSON.parse(decrypted.toString('utf8'));
        
        console.log('✅ PRIVACY: Node.js AES-GCM decryption successful!');
        return userData.users || [];
      }
    } catch (aesError) {
      console.error('❌ PRIVACY: AES-GCM decryption failed:', aesError);
      return null;
    }

  } catch (error) {
    console.error('❌ PRIVACY: Unexpected decryption error');
    return null;
  }
}

/**
 * Get Oracle users data from public endpoint
 */
export async function getOracleUsersData(): Promise<UserData[] | null> {
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
      console.log('🔍 DEBUG: Users data received:', oracleResponse.users.length, 'users');
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
export async function getDecryptedOracleUsers(): Promise<UserData[] | null> {
  try {
    console.log('🔐 PRIVACY: Fetching Oracle user data (privacy-focused)...');
    console.log('🔍 Connecting to Oracle server...');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/users`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      return (encryptedResponse as any).users || [];
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
  oracleUsersData: UserData[],
  ethereumAddress: string,
  blockchainBalance?: bigint,
  recentMintTimestamp?: number
): UserData | null {
  if (!oracleUsersData || oracleUsersData.length === 0) {
    console.log('❌ No Oracle users data available for correlation');
    return null;
  }

  console.log('🔍 Attempting user correlation for address:', ethereumAddress.substring(0, 10) + '...');
  console.log('🔍 Oracle users data available, searching for current user...');

  const users = oracleUsersData;
  
  // Strategy 1: If we have blockchain balance, find matching Oracle balance
  if (blockchainBalance !== undefined) {
    const blockchainBalanceSats = Number(blockchainBalance);
    console.log('🔍 Looking for balance match:', blockchainBalanceSats, 'sats');
    
    const balanceMatches = users.filter(userData => {
      const match = userData.lastSyncedBalance === blockchainBalanceSats;
      if (match) {
        console.log('✅ Found balance match:', userData.lastSyncedBalance, 'sats');
      }
      return match;
    });
    
    if (balanceMatches.length === 1) {
      console.log('✅ Unique balance match found');
      return balanceMatches[0];
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
    
    for (const userData of users) {
      const registrationDate = userData.registeredAt || userData.createdAt;
      if (!registrationDate) continue;
      
      const registrationTime = new Date(registrationDate).getTime();
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
  const activeUsers = users.filter(userData => 
    (userData.lastSyncedBalance || 0) > 0 && (userData.transactionCount || 0) > 0
  );
  
  if (activeUsers.length === 1) {
    console.log('✅ Single active user found as fallback');
    return activeUsers[0];
  }

  // Strategy 4: Return most recently active user (last resort)
  const sortedByActivity = users.sort((a, b) => (b.lastSyncTime || 0) - (a.lastSyncTime || 0));
  
  if (sortedByActivity.length > 0) {
    console.log('⚠️ Using most recently active user as last resort');
    return sortedByActivity[0];
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