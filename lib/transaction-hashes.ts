// Transaction Hash Storage and Retrieval
// Stores real blockchain transaction hashes on Oracle server during mint/burn operations
// and retrieves them for Transaction History display

interface StoredTransactionHash {
  hash: string
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer'
  amount: string
  timestamp: string
  blockNumber?: number
  storedAt?: number
}

const ORACLE_BASE_URL = 'https://oracle.reservebtc.io'

/**
 * Store a transaction hash on Oracle server for a user
 */
export async function storeTransactionHashOnServer(
  userAddress: string,
  txHash: string,
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer',
  amount: string,
  blockNumber?: number
): Promise<boolean> {
  try {
    console.log(`📡 Storing ${type} transaction hash on Oracle server:`, txHash)
    
    const response = await fetch(`${ORACLE_BASE_URL}/store-transaction-hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress,
        txHash,
        type,
        amount,
        blockNumber
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Successfully stored ${type} transaction hash on Oracle server:`, txHash)
      return true
    } else {
      console.warn(`⚠️ Failed to store transaction hash on Oracle server:`, result.error)
      return false
    }
  } catch (error) {
    console.warn('❌ Failed to store transaction hash on Oracle server:', error)
    return false
  }
}

/**
 * Get all stored transaction hashes for a user from Oracle server
 */
export async function getStoredTransactionHashesFromServer(userAddress: string): Promise<StoredTransactionHash[]> {
  try {
    console.log(`📡 Loading transaction hashes from Oracle server for:`, userAddress)
    
    const response = await fetch(`${ORACLE_BASE_URL}/get-transaction-hashes/${userAddress}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ User not found on Oracle server (may not be registered yet)`)
        return []
      }
      throw new Error(`Oracle server error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && Array.isArray(result.transactionHashes)) {
      console.log(`✅ Loaded ${result.total} transaction hashes from Oracle server`)
      return result.transactionHashes
    } else {
      console.warn(`⚠️ Invalid response from Oracle server:`, result)
      return []
    }
  } catch (error) {
    console.warn('❌ Failed to load transaction hashes from Oracle server:', error)
    return []
  }
}

/**
 * Find a stored transaction hash from Oracle server by type and approximate amount/time
 */
export async function findStoredTransactionHashFromServer(
  userAddress: string,
  type: 'mint' | 'burn' | 'wrap' | 'unwrap' | 'transfer',
  approximateAmount?: string,
  approximateTimestamp?: string
): Promise<string | null> {
  try {
    const stored = await getStoredTransactionHashesFromServer(userAddress)
    
    // Filter by type first
    const typeMatches = stored.filter(tx => tx.type === type)
    
    if (typeMatches.length === 0) {
      return null
    }
    
    // If only one match, return it
    if (typeMatches.length === 1) {
      return typeMatches[0].hash
    }
    
    // If we have amount and timestamp, try to find best match
    if (approximateAmount && approximateTimestamp) {
      const targetTime = new Date(approximateTimestamp).getTime()
      
      // Find closest by time and amount
      let bestMatch = typeMatches[0]
      let bestScore = Infinity
      
      for (const tx of typeMatches) {
        const txTime = new Date(tx.timestamp).getTime()
        const timeDiff = Math.abs(txTime - targetTime)
        const amountMatch = tx.amount === approximateAmount
        
        // Score: time difference in minutes, bonus for exact amount match
        const score = timeDiff / (1000 * 60) - (amountMatch ? 1000 : 0)
        
        if (score < bestScore) {
          bestScore = score
          bestMatch = tx
        }
      }
      
      return bestMatch.hash
    }
    
    // Otherwise return most recent
    return typeMatches[0].hash
  } catch (error) {
    console.warn('Failed to find stored transaction hash:', error)
    return null
  }
}

