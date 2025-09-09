/**
 * wrBTC Transaction Tracking System
 * 
 * Tracks VaultWrBTC contract events and syncs with Oracle database
 * All transaction data is encrypted before sending to Oracle
 */

import { createPublicClient, http, parseAbiItem, Log } from 'viem'
import { CONTRACTS, MEGAETH_TESTNET, CONTRACT_ABIS } from '@/app/lib/contracts'
import { encryptSensitiveData } from './encryption-utils'

interface WrBTCTransaction {
  txHash: string
  blockNumber: number
  blockHash: string
  logIndex: number
  userAddress: string
  amount: string
  type: 'wrapped' | 'redeemed' | 'slashed'
  timestamp: number
  status: 'confirmed' | 'pending'
}

interface OracleWrBTCData {
  userAddress: string
  wrBTCTransactions: WrBTCTransaction[]
  totalWrapped: string
  totalRedeemed: string
  currentBalance: string
  lastTransactionHash?: string
  lastUpdated: number
}

/**
 * Create public client for MegaETH network
 */
const publicClient = createPublicClient({
  chain: MEGAETH_TESTNET,
  transport: http(MEGAETH_TESTNET.rpcUrls.default.http[0])
})

/**
 * Parse VaultWrBTC contract events
 */
export async function getWrBTCTransactionEvents(
  userAddress: string,
  fromBlock: bigint = BigInt(0),
  toBlock: bigint | 'latest' = 'latest'
): Promise<WrBTCTransaction[]> {
  try {
    console.log('🔍 Fetching wrBTC events for user:', userAddress.substring(0, 10) + '...')
    
    const wrappedEvents = await publicClient.getLogs({
      address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
      event: parseAbiItem('event Wrapped(address indexed user, uint256 amount)'),
      args: { user: userAddress as `0x${string}` },
      fromBlock,
      toBlock,
    })
    
    const redeemedEvents = await publicClient.getLogs({
      address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
      event: parseAbiItem('event Redeemed(address indexed user, uint256 amount)'),
      args: { user: userAddress as `0x${string}` },
      fromBlock,
      toBlock,
    })
    
    const slashedEvents = await publicClient.getLogs({
      address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
      event: parseAbiItem('event Slashed(address indexed user, uint256 amount)'),
      args: { user: userAddress as `0x${string}` },
      fromBlock,
      toBlock,
    })

    // Combine and process all events
    const transactions: WrBTCTransaction[] = []
    
    // Process Wrapped events
    for (const log of wrappedEvents) {
      const block = await publicClient.getBlock({ blockHash: log.blockHash })
      transactions.push({
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        blockHash: log.blockHash,
        logIndex: log.logIndex,
        userAddress: log.args.user!,
        amount: log.args.amount!.toString(),
        type: 'wrapped',
        timestamp: Number(block.timestamp),
        status: 'confirmed'
      })
    }
    
    // Process Redeemed events
    for (const log of redeemedEvents) {
      const block = await publicClient.getBlock({ blockHash: log.blockHash })
      transactions.push({
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        blockHash: log.blockHash,
        logIndex: log.logIndex,
        userAddress: log.args.user!,
        amount: log.args.amount!.toString(),
        type: 'redeemed',
        timestamp: Number(block.timestamp),
        status: 'confirmed'
      })
    }
    
    // Process Slashed events
    for (const log of slashedEvents) {
      const block = await publicClient.getBlock({ blockHash: log.blockHash })
      transactions.push({
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        blockHash: log.blockHash,
        logIndex: log.logIndex,
        userAddress: log.args.user!,
        amount: log.args.amount!.toString(),
        type: 'slashed',
        timestamp: Number(block.timestamp),
        status: 'confirmed'
      })
    }
    
    // Sort by block number and log index
    transactions.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return a.blockNumber - b.blockNumber
      }
      return a.logIndex - b.logIndex
    })
    
    console.log(`✅ Found ${transactions.length} wrBTC transactions for user`)
    return transactions
    
  } catch (error) {
    console.error('❌ Error fetching wrBTC events:', error)
    return []
  }
}

/**
 * Calculate wrBTC balance from transaction history
 */
export function calculateWrBTCBalance(transactions: WrBTCTransaction[]): {
  totalWrapped: string
  totalRedeemed: string
  currentBalance: string
} {
  let totalWrapped = BigInt(0)
  let totalRedeemed = BigInt(0)
  
  for (const tx of transactions) {
    const amount = BigInt(tx.amount)
    
    if (tx.type === 'wrapped') {
      totalWrapped += amount
    } else if (tx.type === 'redeemed' || tx.type === 'slashed') {
      totalRedeemed += amount
    }
  }
  
  const currentBalance = totalWrapped - totalRedeemed
  
  return {
    totalWrapped: totalWrapped.toString(),
    totalRedeemed: totalRedeemed.toString(),
    currentBalance: currentBalance.toString()
  }
}

/**
 * Generate Oracle wrBTC data for user
 */
export async function generateOracleWrBTCData(userAddress: string): Promise<OracleWrBTCData> {
  const transactions = await getWrBTCTransactionEvents(userAddress)
  const balance = calculateWrBTCBalance(transactions)
  
  return {
    userAddress,
    wrBTCTransactions: transactions,
    totalWrapped: balance.totalWrapped,
    totalRedeemed: balance.totalRedeemed,
    currentBalance: balance.currentBalance,
    lastTransactionHash: transactions.length > 0 ? transactions[transactions.length - 1].txHash : undefined,
    lastUpdated: Date.now()
  }
}

/**
 * Encrypt and send wrBTC data to Oracle
 */
export async function syncWrBTCDataToOracle(userAddress: string): Promise<boolean> {
  try {
    console.log('🔄 Syncing wrBTC data to Oracle for user:', userAddress.substring(0, 10) + '...')
    
    // Generate wrBTC data
    const wrbtcData = await generateOracleWrBTCData(userAddress)
    
    // Encrypt sensitive data
    const encryptedData = await encryptSensitiveData(
      JSON.stringify(wrbtcData), 
      userAddress
    )
    
    // Send to Oracle server
    const response = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'}/sync-wrbtc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_ORACLE_API_KEY || '',
      },
      body: JSON.stringify({
        userAddress,
        encryptedWrBTCData: encryptedData,
        timestamp: Date.now()
      })
    })
    
    if (!response.ok) {
      throw new Error(`Oracle sync failed: ${response.status} ${response.statusText}`)
    }
    
    console.log('✅ wrBTC data synced to Oracle successfully')
    return true
    
  } catch (error) {
    console.error('❌ Failed to sync wrBTC data to Oracle:', error)
    return false
  }
}

/**
 * Get current wrBTC balance from contract
 */
export async function getCurrentWrBTCBalance(userAddress: string): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
      abi: CONTRACT_ABIS.VAULT_WRBTC,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`]
    }) as bigint
    
    return balance.toString()
  } catch (error) {
    console.error('Error reading wrBTC balance:', error)
    return '0'
  }
}

/**
 * Listen for new wrBTC events and auto-sync
 */
export function startWrBTCEventListener(userAddress: string, callback?: () => void) {
  console.log('🎧 Starting wrBTC event listener for user:', userAddress.substring(0, 10) + '...')
  
  // Listen for new Wrapped events
  const unwatchWrapped = publicClient.watchContractEvent({
    address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
    abi: CONTRACT_ABIS.VAULT_WRBTC,
    eventName: 'Wrapped',
    args: { user: userAddress as `0x${string}` },
    onLogs: async (logs) => {
      console.log('🔔 New Wrapped event detected:', logs.length, 'events')
      await syncWrBTCDataToOracle(userAddress)
      if (callback) callback()
    }
  })
  
  // Listen for new Redeemed events
  const unwatchRedeemed = publicClient.watchContractEvent({
    address: CONTRACTS.VAULT_WRBTC as `0x${string}`,
    abi: CONTRACT_ABIS.VAULT_WRBTC,
    eventName: 'Redeemed',
    args: { user: userAddress as `0x${string}` },
    onLogs: async (logs) => {
      console.log('🔔 New Redeemed event detected:', logs.length, 'events')
      await syncWrBTCDataToOracle(userAddress)
      if (callback) callback()
    }
  })
  
  // Return cleanup function
  return () => {
    unwatchWrapped()
    unwatchRedeemed()
    console.log('🔇 wrBTC event listener stopped')
  }
}