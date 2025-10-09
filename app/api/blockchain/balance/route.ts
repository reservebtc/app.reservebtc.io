import { NextRequest, NextResponse } from 'next/server'
import { CONTRACTS } from '@/app/lib/contracts'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/blockchain/balance
 * 
 * PRODUCTION-GRADE: Direct RPC balance reading (bypasses CORS)
 * Returns real Oracle contract balance for user address
 * 
 * Query params:
 * - address: User ETH address (required)
 * - _t: Timestamp for cache busting (optional)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  
  if (!address) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Address parameter is required' 
      }, 
      { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  }

  // Validate ETH address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid Ethereum address format' 
      }, 
      { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  }

  const MAX_RETRIES = 3
  const RETRY_DELAY = 500

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 BALANCE API: Attempt ${attempt}/${MAX_RETRIES} for ${address}`)
      
      // 🔥 STEP 1: Get latest block number via RPC
      const blockResponse = await fetch('https://carrot.megaeth.com/rpc', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: Date.now()
        }),
        cache: 'no-store'
      })
      
      if (!blockResponse.ok) {
        throw new Error(`Block number request failed: ${blockResponse.status} ${blockResponse.statusText}`)
      }
      
      const blockData = await blockResponse.json()
      
      if (blockData.error) {
        throw new Error(`RPC error: ${blockData.error.message || JSON.stringify(blockData.error)}`)
      }
      
      const currentBlockHex = blockData.result
      const currentBlock = BigInt(currentBlockHex)
      
      console.log(`📊 BALANCE API: Latest block: ${currentBlock.toString()} (${currentBlockHex})`)
      
      // 🔥 STEP 2: Read lastSats(address) from Oracle contract
      const functionSelector = '0x6be25fe1' // lastSats(address)
      const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0')
      const callData = functionSelector + paddedAddress
      
      console.log(`🔍 BALANCE API: Reading balance with calldata: ${callData}`)
      
      const balanceResponse = await fetch('https://carrot.megaeth.com/rpc', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: CONTRACTS.ORACLE_AGGREGATOR,
            data: callData
          }, currentBlockHex],
          id: Date.now()
        }),
        cache: 'no-store'
      })
      
      if (!balanceResponse.ok) {
        throw new Error(`Balance request failed: ${balanceResponse.status} ${balanceResponse.statusText}`)
      }
      
      const balanceData = await balanceResponse.json()
      
      if (balanceData.error) {
        throw new Error(`RPC error: ${balanceData.error.message || JSON.stringify(balanceData.error)}`)
      }
      
      const lastSatsHex = balanceData.result
      const lastSats = BigInt(lastSatsHex)
      
      const balanceInSats = Number(lastSats)
      const btcBalance = (balanceInSats / 1e8).toFixed(8)
      
      console.log(`✅ BALANCE API: Success - ${balanceInSats} sats = ${btcBalance} BTC at block ${currentBlock.toString()}`)
      
      return NextResponse.json({
        success: true,
        address: address.toLowerCase(),
        balance: balanceInSats.toString(),
        btc: btcBalance,
        blockNumber: parseInt(currentBlockHex, 16),
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
    } catch (error: any) {
      console.error(`❌ BALANCE API: Attempt ${attempt} failed:`, error.message)
      
      // If this was the last attempt, return error
      if (attempt === MAX_RETRIES) {
        console.error('❌ BALANCE API: All retry attempts exhausted')
        
        return NextResponse.json(
          { 
            success: false,
            error: error.message || 'Failed to fetch balance after multiple retries',
            address: address.toLowerCase(),
            balance: '0',
            btc: '0.00000000'
          }, 
          { 
            status: 500,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        )
      }
      
      // Wait before retry
      const delay = RETRY_DELAY * attempt
      console.log(`⏳ BALANCE API: Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Fallback return (should never reach here)
  return NextResponse.json(
    { 
      success: false,
      error: 'Unexpected error in balance API',
      address: address.toLowerCase(),
      balance: '0',
      btc: '0.00000000'
    }, 
    { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    }
  )
}