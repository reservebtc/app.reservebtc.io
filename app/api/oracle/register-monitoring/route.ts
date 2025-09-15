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

// Helper function to sync data to Supabase
async function syncToSupabase(
  eventType: string,
  userAddress: string,
  transactionHash: string,
  bitcoinAddress: string,
  amount: string,
  blockNumber?: number
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase not configured, skipping sync')
      return
    }

    // Direct API calls to Supabase REST API
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }

    // 1. Ensure user exists
    const userCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?eth_address=eq.${userAddress.toLowerCase()}`,
      { headers }
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
          })
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
      })
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
      })
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
      })
    })
    console.log('✅ Balance snapshot saved to Supabase')

  } catch (error) {
    console.error('⚠️ Supabase sync failed (non-critical):', error)
    // Don't throw - this is non-critical functionality
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<MonitoringResponse>> {
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

    // 1. Check if user has sufficient FeeVault balance
    const feeVaultBalance = await publicClient.readContract({
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
    })

    const minimumBalance = parseEther('0.001')
    if (feeVaultBalance < minimumBalance) {
      console.log('❌ ORACLE MINT: Insufficient FeeVault balance')
      return NextResponse.json({
        success: false,
        error: `Insufficient FeeVault balance. Required: 0.001 ETH, Current: ${Number(feeVaultBalance) / 1e18} ETH`
      }, { status: 400 })
    }

    // 2. Check current Oracle lastSats
    const currentLastSats = await publicClient.readContract({
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
    })

    console.log(`   Current lastSats: ${currentLastSats}`)

    // 3. If user is not registered (lastSats == 0), register first
    if (Number(currentLastSats) === 0) {
      console.log('📝 ORACLE MINT: User not registered, calling registerAndPrepay...')
      
      const checksum = ('0x' + Buffer.from(`${userAddress}_${bitcoinAddress}_${initialBalance}`).toString('hex').substring(0, 64).padEnd(64, '0')) as `0x${string}`
      
      try {
        const registerHash = await walletClient.writeContract({
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
        })

        const registerReceipt = await publicClient.waitForTransactionReceipt({
          hash: registerHash,
          timeout: 30000
        })

        if (registerReceipt.status !== 'success') {
          throw new Error('RegisterAndPrepay transaction failed')
        }
        
        console.log(`✅ RegisterAndPrepay successful: ${registerHash}`)
      } catch (error: any) {
        console.error('❌ RegisterAndPrepay failed:', error)
        // Continue anyway - user might already be registered
      }
    }

    // 4. Call sync to mint initial tokens
    console.log('🔄 ORACLE MINT: Calling sync to mint tokens...')
    
    try {
      const syncHash = await walletClient.writeContract({
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
      })

      const syncReceipt = await publicClient.waitForTransactionReceipt({
        hash: syncHash,
        timeout: 30000
      })

      if (syncReceipt.status === 'success') {
        console.log('✅ ORACLE MINT: Sync successful!')
        console.log(`   Transaction: ${syncHash}`)
        
        // Get block number from receipt
        const blockNumber = Number(syncReceipt.blockNumber)
        
        // Verify the mint was successful
        const newLastSats = await publicClient.readContract({
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
        })
        
        console.log(`   New lastSats: ${newLastSats}`)
        console.log('   Oracle monitoring activated successfully!')
        
        // Sync to Supabase database
        await syncToSupabase(
          'MINT',
          userAddress,
          syncHash,
          bitcoinAddress,
          initialBalance.toString(),
          blockNumber
        )

        return NextResponse.json({
          success: true,
          transactionHash: syncHash,
        })
      } else {
        throw new Error('Sync transaction failed')
      }

    } catch (syncError: any) {
      console.error('❌ ORACLE MINT: Sync failed:', syncError)
      return NextResponse.json({
        success: false,
        error: `Failed to mint tokens: ${syncError.message}`
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ ORACLE MINT: Request failed:', error)
    return NextResponse.json({
      success: false,
      error: `Mint failed: ${error.message}`
    }, { status: 500 })
  }
}