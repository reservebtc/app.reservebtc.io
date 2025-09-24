// app/api/realtime/balances/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPublicClient, http } from 'viem'
import { CONTRACTS } from '@/app/lib/contracts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }
  
  try {
    // Get latest balance from snapshots
    const { data: snapshot } = await supabase
      .from('balance_snapshots')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('snapshot_timestamp', { ascending: false })
      .limit(1)
      .single()
    
    // Get Oracle balance from contract
    let oracleBalance = 0
    try {
      const publicClient = createPublicClient({
        chain: megaeth,
        transport: http()
      })
      
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
        args: [address as `0x${string}`]
      }) as bigint
      
      oracleBalance = Number(lastSats)
    } catch (error) {
      console.error('Oracle balance fetch error:', error)
    }
    
    const balanceData = {
      address: address.toLowerCase(),
      rbtc: snapshot?.rbtc_balance || '0',
      wrbtc: snapshot?.wrbtc_balance || '0',
      oracle: oracleBalance.toString(),
      oracleBalance: oracleBalance,
      lastUpdate: snapshot?.snapshot_timestamp || new Date().toISOString(),
      blockNumber: snapshot?.block_number || 0
    }
    
    return NextResponse.json(balanceData)
    
  } catch (error) {
    console.error('Balance API error:', error)
    return NextResponse.json({
      address: address.toLowerCase(),
      rbtc: '0',
      wrbtc: '0',
      oracle: '0',
      oracleBalance: 0,
      lastUpdate: new Date().toISOString(),
      error: 'Failed to fetch balance'
    })
  }
}