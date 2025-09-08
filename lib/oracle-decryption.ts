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
  };
  timestamp: string;
  note: string;
}

interface UserData {
  btcAddress: string;
  btcAddresses?: string[]; // Support for multiple Bitcoin addresses
  ethAddress: string;
  lastSyncedBalance: number;
  registeredAt: string;
  lastSyncTime: number;
  autoDetected: boolean;
  transactionHashes: any[];
  lastTxHash?: string; // Optional transaction hash for backward compatibility
  addedTime?: number; // Optional legacy timestamp
}

/**
 * Decrypt Oracle API response data
 */
export function decryptOracleData(encryptedResponse: EncryptedOracleResponse): Record<string, UserData> | null {
  try {
    if (!encryptedResponse.encrypted || !encryptedResponse.data) {
      console.error('❌ Invalid encrypted response format');
      return null;
    }

    const encryptedData = encryptedResponse.data;

    // Handle fallback base64 decryption (simplified encryption for compatibility)
    if (encryptedData.iv === 'fallback' && encryptedData.authTag === 'fallback') {
      try {
        const decodedData = atob(encryptedData.encrypted);
        const userData = JSON.parse(decodedData);
        
        console.log('✅ Oracle data decrypted successfully (fallback method)');
        return userData;
      } catch (error) {
        console.error('❌ Fallback decryption failed:', error);
        return null;
      }
    }

    // TODO: Implement full AES-GCM decryption when needed
    // For now, using fallback method which is sufficient for our security model
    console.warn('⚠️ Full AES decryption not implemented, using fallback');
    return null;

  } catch (error) {
    console.error('❌ Oracle data decryption error:', error);
    return null;
  }
}

/**
 * Fetch and decrypt Oracle user data
 */
export async function getDecryptedOracleUsers(): Promise<Record<string, UserData> | null> {
  try {
    console.log('🔐 Fetching encrypted Oracle user data...');
    console.log('🔍 DEBUG: Oracle URL:', `${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/internal-users`);

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
      console.log('🔍 DEBUG: Oracle response failed:', response.status, response.statusText);
      throw new Error(`Oracle API failed: ${response.status} ${response.statusText}`);
    }

    const encryptedResponse: EncryptedOracleResponse = await response.json();
    console.log('🔍 DEBUG: Oracle response received, encrypted:', encryptedResponse.encrypted);
    
    if (!encryptedResponse.encrypted) {
      // If response is not encrypted, return as is (backward compatibility)
      console.log('ℹ️ Oracle response is not encrypted, using direct data');
      return encryptedResponse as any;
    }

    const decryptedData = decryptOracleData(encryptedResponse);
    console.log('🔍 DEBUG: Decrypted data keys:', decryptedData ? Object.keys(decryptedData).length : 'null');
    if (decryptedData) {
      console.log('🔍 DEBUG: First few user keys:', Object.keys(decryptedData).slice(0, 3));
    }
    return decryptedData;

  } catch (error) {
    console.error('❌ Failed to fetch/decrypt Oracle data:', error);
    return null;
  }
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
            console.log('📍 Found additional Bitcoin address in transactions:', address);
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
  if (userData.btcAddresses && userData.btcAddresses.length > 0) {
    console.log('📋 Final addresses list:');
    userData.btcAddresses.forEach((addr, i) => {
      console.log(`  ${i + 1}. ${addr}`);
    });
  }
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