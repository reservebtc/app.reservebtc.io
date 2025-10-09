import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { CONTRACTS } from '@/app/lib/contracts'

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
    }, { status: 400 })
  }
  
  console.log('💰 REALTIME API: Fetching balance for', address)
  
  // Create timeout promise for 5 seconds
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), 5000)
  )
  
  // Main data fetch promise - ONLY from Oracle smart contract
  const dataPromise = (async () => {
    try {
      const publicClient = createPublicClient({
        chain: megaeth,
        transport: http()
      })
      
      console.log('🔗 REALTIME API: Calling Oracle contract...')
      
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
      
      // Add 4 second timeout for contract call
      const lastSats = await Promise.race([
        contractPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contract timeout')), 4000)
        )
      ]) as bigint
      
      const satsBalance = Number(lastSats)
      
      console.log('✅ REALTIME API: Oracle balance fetched:', satsBalance, 'sats')
      
      return {
        success: true,
        address: address.toLowerCase(),
        balance: satsBalance.toString(),           // Balance in satoshis
        oracleSats: satsBalance,                   // Same as balance
        btc: (satsBalance / 100000000).toFixed(8), // Balance in BTC
        lastUpdate: new Date().toISOString(),
        source: 'oracle_contract'
      }
    } catch (error) {
      console.error('❌ REALTIME API: Oracle balance fetch error:', error)
      throw error
    }
  })()
  
  try {
    // Race between data fetch and timeout
    const balanceData = await Promise.race([dataPromise, timeoutPromise]) as any
    
    console.log('✅ REALTIME API: Returning balance data:', balanceData)
    
    return NextResponse.json(balanceData)
  } catch (error) {
    // Return fallback data on timeout or error
    console.error('❌ REALTIME API: Timeout/error:', error)
    return NextResponse.json({
      success: false,
      address: address.toLowerCase(),
      balance: '0',
      oracleSats: 0,
      btc: '0.00000000',
      lastUpdate: new Date().toISOString(),
      error: 'Network timeout - using fallback values',
      source: 'fallback'
    }, { status: 200 }) // Return 200 even on error for graceful degradation
  }
}

// Add edge runtime for better performance
export const runtime = 'edge'
export const maxDuration = 10