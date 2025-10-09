import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { CONTRACTS } from '@/app/lib/contracts'

// 🔥 CRITICAL: Force no caching for real-time blockchain data
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'edge'
export const maxDuration = 10

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
      balance: '0',
      oracleSats: 0,
      lastUpdate: new Date().toISOString()
    }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ 
      error: 'Address required',
      balance: '0',
      oracleSats: 0
    }, { 
      status: 400,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  }
  
  console.log('💰 REALTIME API: Fetching balance for', address)
  
  try {
    // 🔥 CRITICAL FIX: Create completely new client every time with cache disabled
    // This prevents viem from using any internal caching mechanisms
    const publicClient = createPublicClient({
      chain: megaeth,
      transport: http('https://carrot.megaeth.com/rpc', {
        timeout: 8000,
        retryCount: 2,
        retryDelay: 500
      }),
      cacheTime: 0  // 🔥 Disable viem internal cache completely
    })
    
    console.log('🔗 REALTIME API: Reading from Oracle contract...')
    
    // 🔥 CRITICAL: Get latest block to ensure fresh data
    const currentBlock = await publicClient.getBlockNumber()
    console.log('📊 REALTIME API: Latest block:', currentBlock.toString())
    
    // 🔥 CRITICAL: Read from specific block with cache disabled
    const lastSats = await publicClient.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
      abi: [{
        name: 'lastSats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint64' }]
      }],
      functionName: 'lastSats',
      args: [address as `0x${string}`],
      blockNumber: currentBlock  // Read from latest block
    })
    
    const satsBalance = Number(lastSats)
    
    console.log('✅ REALTIME API: Fresh balance from block', currentBlock.toString(), ':', satsBalance, 'sats')
    
    const responseData = {
      success: true,
      address: address.toLowerCase(),
      balance: satsBalance.toString(),           // Balance in satoshis
      oracleSats: satsBalance,                   // Same as balance
      btc: (satsBalance / 100000000).toFixed(8), // Balance in BTC
      lastUpdate: new Date().toISOString(),
      source: 'oracle_contract',
      blockNumber: currentBlock.toString(),
      _timestamp: Date.now(),                    // Cache busting timestamp
      _fresh: true                               // Indicator that data is fresh
    }
    
    console.log('✅ REALTIME API: Returning fresh balance data:', responseData)
    
    // 🔥 CRITICAL: Maximum cache prevention headers
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'X-Accel-Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('❌ REALTIME API: Error fetching balance:', error)
    
    // Return error response with fallback
    return NextResponse.json({
      success: false,
      address: address.toLowerCase(),
      balance: '0',
      oracleSats: 0,
      btc: '0.00000000',
      lastUpdate: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'error_fallback',
      _timestamp: Date.now()
    }, { 
      status: 200,  // Still return 200 to not break frontend
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}