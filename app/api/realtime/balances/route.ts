import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { CONTRACTS } from '@/app/lib/contracts'

// 🔥 CRITICAL: Maximum anti-cache settings
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs' // 🔥 Changed from 'edge' to 'nodejs' - more control
export const maxDuration = 10

const megaeth = {
  id: 6343,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://timothy.megaeth.com/rpc'] } }
}

export async function GET(request: NextRequest) {
  // 🔥 CRITICAL: Add random seed to prevent ANY caching
  const randomSeed = Math.random().toString(36).substring(7)
  console.log(`🎲 API [${randomSeed}]: New balance request`)
  
  // Check for build mode
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
    return NextResponse.json({
      error: 'API not available during build',
      balance: '0',
      oracleSats: 0,
      lastUpdate: new Date().toISOString(),
      _seed: randomSeed
    }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ 
      error: 'Address required',
      balance: '0',
      oracleSats: 0,
      _seed: randomSeed
    }, { 
      status: 400,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      }
    })
  }
  
  console.log(`💰 API [${randomSeed}]: Fetching balance for ${address.slice(0, 10)}...`)
  
  try {
    // 🔥 CRITICAL: Create completely fresh client with random port to avoid connection pooling
    const rpcUrl = `https://timothy.megaeth.com/rpc?_seed=${randomSeed}&_t=${Date.now()}`
    
    console.log(`🔗 API [${randomSeed}]: Creating fresh viem client...`)
    
    const freshPublicClient = createPublicClient({
      chain: megaeth,
      transport: http(rpcUrl, {
        timeout: 8000,
        retryCount: 1, // Reduce retries to avoid stale cache
        retryDelay: 200
      }),
      cacheTime: 0,  // 🔥 Disable viem internal cache
      pollingInterval: 0 // 🔥 Disable polling
    })
    
    // 🔥 CRITICAL: Get latest block FIRST
    console.log(`📊 API [${randomSeed}]: Getting latest block...`)
    const currentBlock = await freshPublicClient.getBlockNumber()
    console.log(`📊 API [${randomSeed}]: Latest block: ${currentBlock}`)
    
    // 🔥 CRITICAL: Read from specific block with explicit parameters
    console.log(`🔍 API [${randomSeed}]: Reading contract at block ${currentBlock}...`)
    const lastSats = await freshPublicClient.readContract({
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
      blockNumber: currentBlock
    })
    
    const satsBalance = Number(lastSats)
    
    console.log(`✅ API [${randomSeed}]: Balance from block ${currentBlock}: ${satsBalance} sats`)
    
    const responseData = {
      success: true,
      address: address.toLowerCase(),
      balance: satsBalance.toString(),
      oracleSats: satsBalance,
      btc: (satsBalance / 100000000).toFixed(8),
      lastUpdate: new Date().toISOString(),
      source: 'oracle_contract',
      blockNumber: currentBlock.toString(),
      _timestamp: Date.now(),
      _seed: randomSeed, // 🔥 Include seed in response to verify freshness
      _fresh: true
    }
    
    console.log(`✅ API [${randomSeed}]: Returning fresh data:`, responseData)
    
    // 🔥 CRITICAL: Maximum anti-cache headers
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'X-Accel-Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        // 🔥 Add unique ETag to force cache invalidation
        'ETag': `"${randomSeed}-${Date.now()}"`,
        // 🔥 Add Vary header to prevent caching based on query params
        'Vary': '*'
      }
    })
    
  } catch (error) {
    console.error(`❌ API [${randomSeed}]: Error fetching balance:`, error)
    
    return NextResponse.json({
      success: false,
      address: address.toLowerCase(),
      balance: '0',
      oracleSats: 0,
      btc: '0.00000000',
      lastUpdate: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'error_fallback',
      _timestamp: Date.now(),
      _seed: randomSeed
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"error-${randomSeed}-${Date.now()}"`
      }
    })
  }
}