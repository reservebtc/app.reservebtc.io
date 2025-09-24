// app/api/oracle/register-monitoring/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS } from '@/app/lib/contracts'
import { megaeth } from '@/lib/chains/megaeth'

// Oracle committee credentials
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY

interface MonitoringRequest {
  userAddress: string
  bitcoinAddress: string
  initialBalance: number // in satoshis
}

interface MonitoringResponse {
  success: boolean
  transactionHash?: string
  error?: string
}

// Cache for blockchain clients
let clientCache: {
  account: ReturnType<typeof privateKeyToAccount>
  publicClient: ReturnType<typeof createPublicClient>
  walletClient: ReturnType<typeof createWalletClient>
} | null = null

function getOrCreateClients() {
  if (!clientCache) {
    if (!ORACLE_PRIVATE_KEY) {
      throw new Error('Oracle service is not configured')
    }
    const account = privateKeyToAccount(ORACLE_PRIVATE_KEY as `0x${string}`)
    const publicClient = createPublicClient({
      chain: megaeth,
      transport: http(),
    })
    const walletClient = createWalletClient({
      account,
      chain: megaeth,
      transport: http(),
    })
    
    clientCache = { account, publicClient, walletClient }
  }
  return clientCache
}

// Helper function to sync data to Supabase - optimized for background execution
async function syncToSupabaseAsync(
  eventType: string,
  userAddress: string,
  transactionHash: string,
  bitcoinAddress: string,
  amount: string,
  blockNumber?: number
) {
  // Run in background - don't block response
  setTimeout(async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('⚠️ Supabase not configured, skipping sync')
        return
      }

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }

      // 1. Ensure user exists with timeout
      const userCheckResponse = await fetch(
        `${supabaseUrl}/rest/v1/users?eth_address=eq.${userAddress.toLowerCase()}`,
        { 
          headers,
          signal: AbortSignal.timeout(3000) // 3 second timeout
        }
      )
      
      if (userCheckResponse.ok) {
        const users = await userCheckResponse.json()
        if (users.length === 0) {
          // Create user
          await fetch(`${supabaseUrl}/rest/v1/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              eth_address: userAddress.toLowerCase(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }),
            signal: AbortSignal.timeout(3000)
          })
          console.log('✅ User created in Supabase')
        }
      }

      // 2. Insert transaction
      await fetch(`${supabaseUrl}/rest/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tx_hash: transactionHash,
          block_number: blockNumber || 0,
          block_timestamp: new Date().toISOString(),
          user_address: userAddress.toLowerCase(),
          tx_type: eventType,
          amount: amount,
          delta: amount,
          fee_wei: '1400000000000000', // Standard fee
          bitcoin_address: bitcoinAddress,
          status: 'confirmed',
          created_at: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(3000)
      })
      console.log('✅ Transaction saved to Supabase')

      // 3. Upsert Bitcoin address
      await fetch(`${supabaseUrl}/rest/v1/bitcoin_addresses`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          eth_address: userAddress.toLowerCase(),
          bitcoin_address: bitcoinAddress,
          network: bitcoinAddress.startsWith('tb1') ? 'testnet' : 'mainnet',
          verified_at: new Date().toISOString(),
          monitoring_started_at: new Date().toISOString(),
          is_monitoring: true,
          created_at: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(3000)
      })
      console.log('✅ Bitcoin address saved to Supabase')

      // 4. Create balance snapshot
      await fetch(`${supabaseUrl}/rest/v1/balance_snapshots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_address: userAddress.toLowerCase(),
          block_number: blockNumber || 0,
          rbtc_balance: amount,
          last_sats: amount,
          snapshot_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(3000)
      })
      console.log('✅ Balance snapshot saved to Supabase')

      console.log('✅ Background Supabase sync completed')
    } catch (error) {
      console.error('⚠️ Background Supabase sync failed (non-critical):', error)
      // Don't throw - this is non-critical background operation
    }
  }, 100) // Small delay to not block response
}

export async function POST(request: NextRequest): Promise<NextResponse<MonitoringResponse>> {
  const startTime = Date.now()
  
  try {
    // Check Oracle credentials at runtime
    if (!ORACLE_PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Oracle service is not configured'
      }, { status: 503 })
    }

    const body: MonitoringRequest = await request.json()
    const { userAddress, bitcoinAddress, initialBalance } = body

    console.log('🎯 ORACLE MINT: Starting mint process...')
    console.log(`   User: ${userAddress}`)
    console.log(`   Bitcoin: ${bitcoinAddress}`)
    console.log(`   Balance: ${initialBalance} sats`)

    // Validate input
    if (!userAddress || !bitcoinAddress || initialBalance === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userAddress, bitcoinAddress, initialBalance'
      }, { status: 400 })
    }

    const { account, publicClient, walletClient } = getOrCreateClients()

    // 1. Check if user has sufficient FeeVault balance - with timeout
    const feeVaultBalance = await Promise.race([
      publicClient.readContract({
        address: CONTRACTS.FEE_VAULT as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`]
      }),
      new Promise<bigint>((resolve) => 
        setTimeout(() => resolve(BigInt(0)), 3000) // 3 second timeout
      )
    ])

    const minimumBalance = parseEther('0.001')
    if (feeVaultBalance < minimumBalance) {
      console.log('❌ ORACLE MINT: Insufficient FeeVault balance')
      return NextResponse.json({
        success: false,
        error: `Insufficient FeeVault balance. Required: 0.001 ETH, Current: ${Number(feeVaultBalance) / 1e18} ETH`
      }, { status: 400 })
    }

    console.log(`   FeeVault balance: ${Number(feeVaultBalance) / 1e18} ETH`)

    // 2. Check current Oracle lastSats - with timeout
    const currentLastSats = await Promise.race([
      publicClient.readContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: [
          {
            name: 'lastSats',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'user', type: 'address' }],
            outputs: [{ name: '', type: 'uint64' }]
          }
        ],
        functionName: 'lastSats',
        args: [userAddress as `0x${string}`]
      }),
      new Promise<bigint>((resolve) => 
        setTimeout(() => resolve(BigInt(0)), 3000) // 3 second timeout
      )
    ])

    console.log(`   Current lastSats: ${currentLastSats}`)

    // 3. If user is not registered (lastSats == 0), register first
    if (Number(currentLastSats) === 0) {
      console.log('📝 ORACLE MINT: User not registered, calling registerAndPrepay...')
      
      const checksum = ('0x' + Buffer.from(`${userAddress}_${bitcoinAddress}_${initialBalance}`).toString('hex').substring(0, 64).padEnd(64, '0')) as `0x${string}`
      
      try {
        const registerHash = await Promise.race([
          walletClient.writeContract({
            address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
            abi: [
              {
                name: 'registerAndPrepay',
                type: 'function',
                stateMutability: 'payable',
                inputs: [
                  { name: 'user', type: 'address' },
                  { name: 'method', type: 'uint8' },
                  { name: 'checksum', type: 'bytes32' }
                ],
                outputs: []
              }
            ] as const,
            functionName: 'registerAndPrepay',
            args: [
              userAddress as `0x${string}`,
              1, // method: 1 = Bitcoin monitoring
              checksum
            ],
            value: BigInt(0), // No ETH, user has FeeVault balance
            chain: megaeth,
            account
          }),
          new Promise<`0x${string}`>((_, reject) => 
            setTimeout(() => reject(new Error('Register timeout')), 5000) // 5 second timeout
          )
        ])
        
        console.log(`✅ RegisterAndPrepay transaction sent: ${registerHash}`)
        // Don't wait for receipt - continue immediately
      } catch (error: any) {
        console.error('⚠️ RegisterAndPrepay failed (non-critical):', error.message)
        // Continue anyway - user might already be registered
      }
    } else {
      console.log('📝 ORACLE MINT: User already registered, skipping registerAndPrepay')
    }

    // 4. Call sync to mint initial tokens - most important operation
    console.log('🔄 ORACLE MINT: Calling sync to mint tokens...')
    
    const syncHash = await Promise.race([
      walletClient.writeContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: [
          {
            name: 'sync',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'user', type: 'address' },
              { name: 'newBalanceSats', type: 'uint64' },
              { name: 'proof', type: 'bytes' }
            ],
            outputs: []
          }
        ] as const,
        functionName: 'sync',
        args: [
          userAddress as `0x${string}`,
          BigInt(initialBalance),
          '0x' as `0x${string}` // Empty proof for MVP
        ],
        chain: megaeth,
        account
      }),
      new Promise<`0x${string}`>((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 8000) // 8 second timeout
      )
    ])

    const elapsed = Date.now() - startTime
    console.log('✅ ORACLE MINT: Sync transaction sent!')
    console.log(`   Transaction: ${syncHash}`)
    console.log(`   Time taken: ${elapsed}ms`)
    console.log('   Oracle monitoring activated successfully!')
    
    // Get current block number for Supabase sync (non-blocking)
    publicClient.getBlockNumber()
      .then(blockNumber => {
        // Fire and forget - sync to Supabase in background
        syncToSupabaseAsync(
          'MINT',
          userAddress,
          syncHash,
          bitcoinAddress,
          initialBalance.toString(),
          Number(blockNumber)
        )
      })
      .catch(() => {
        // Still sync without block number
        syncToSupabaseAsync(
          'MINT',
          userAddress,
          syncHash,
          bitcoinAddress,
          initialBalance.toString()
        )
      })

    // Return immediately with transaction hash
    // Real-time system will handle balance updates
    return NextResponse.json({
      success: true,
      transactionHash: syncHash,
    })

  } catch (error: any) {
    const elapsed = Date.now() - startTime
    console.error(`❌ ORACLE MINT: Request failed after ${elapsed}ms:`, error)
    
    // Handle specific error cases
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Request timeout - Oracle may be busy. Please try again.'
      }, { status: 408 })
    }
    
    if (error.message?.includes('insufficient funds')) {
      return NextResponse.json({
        success: false,
        error: 'Transaction failed - Oracle may need gas'
      }, { status: 400 })
    }
    
    if (error.message?.includes('user rejected')) {
      return NextResponse.json({
        success: false,
        error: 'Transaction was rejected'
      }, { status: 400 })
    }
    
    // Generic error
    return NextResponse.json({
      success: false,
      error: `Mint failed: ${error.message || 'Unknown error'}`
    }, { status: 500 })
  }
}