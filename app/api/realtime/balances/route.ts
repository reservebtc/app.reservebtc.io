import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPublicClient, http } from 'viem'
import { CONTRACTS } from '@/app/lib/contracts'

// Create client only if environment variables are available
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || key === 'placeholder-key') {
    return null
  }

  try {
    return createClient(url, key)
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
    return null
  }
}

const supabase = createSupabaseClient()

const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } }
}

export async function GET(request: NextRequest) {
  // Check for build mode
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
    return NextResponse.json({
      error: 'API not available during build',
      rbtc: '0',
      wrbtc: '0',
      lastUpdate: new Date().toISOString()
    }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }
  
  // Create timeout promise for 8 seconds
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), 8000)
  )
  
  // Main data fetch promise
  const dataPromise = (async () => {
    try {
      // Get latest balance from snapshots (if Supabase is available)
      let snapshot = null
      if (supabase) {
        try {
          const snapshotPromise = supabase
            .from('balance_snapshots')
            .select('*')
            .eq('user_address', address.toLowerCase())
            .order('snapshot_timestamp', { ascending: false })
            .limit(1)
            .single()
          
          // Add 3 second timeout for Supabase query
          const { data } = await Promise.race([
            snapshotPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Supabase timeout')), 3000)
            )
          ]) as any
          
          snapshot = data
        } catch (error) {
          console.warn('Failed to fetch from Supabase:', error)
        }
      }
      
      // Get Oracle balance from contract with timeout
      let oracleBalance = 0
      try {
        const publicClient = createPublicClient({
          chain: megaeth,
          transport: http()
        })
        
        const contractPromise = publicClient.readContract({
          address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
          abi: [{
            name: 'lastSats',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'user', type: 'address' }],
            outputs: [{ name: '', type: 'uint64' }]
          }],
          functionName: 'lastSats',
          args: [address as `0x${string}`]
        })
        
        // Add 3 second timeout for contract call
        const lastSats = await Promise.race([
          contractPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contract timeout')), 3000)
          )
        ]) as bigint
        
        oracleBalance = Number(lastSats)
      } catch (error) {
        console.error('Oracle balance fetch error:', error)
      }
      
      return {
        address: address.toLowerCase(),
        rbtc: snapshot?.rbtc_balance || '0',
        wrbtc: snapshot?.wrbtc_balance || '0',
        oracle: oracleBalance.toString(),
        oracleBalance: oracleBalance,
        lastUpdate: snapshot?.snapshot_timestamp || new Date().toISOString(),
        blockNumber: snapshot?.block_number || 0
      }
    } catch (error) {
      console.error('Balance fetch error:', error)
      throw error
    }
  })()
  
  try {
    // Race between data fetch and timeout
    const balanceData = await Promise.race([dataPromise, timeoutPromise])
    return NextResponse.json(balanceData)
  } catch (error) {
    // Return fallback data on timeout or error
    console.error('Balance API timeout/error:', error)
    return NextResponse.json({
      address: address.toLowerCase(),
      rbtc: '0',
      wrbtc: '0',
      oracle: '0',
      oracleBalance: 0,
      lastUpdate: new Date().toISOString(),
      error: 'Network timeout - using fallback values'
    })
  }
}

// Add edge runtime for better performance
export const runtime = 'edge'
export const maxDuration = 10