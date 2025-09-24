import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase config missing')
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  
  try {
    // Return empty array if no address
    if (!address) {
      return NextResponse.json([])
    }

    const supabase = getSupabaseClient()
    
    // Get transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('block_timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json([])
    }

    // Return array of transactions directly for test compatibility
    const formattedTransactions = (transactions || []).map(tx => ({
      tx_hash: tx.tx_hash,
      block_number: tx.block_number,
      block_timestamp: tx.block_timestamp,
      user_address: tx.user_address,
      tx_type: tx.tx_type,
      amount: tx.amount?.toString() || '0',
      delta: tx.delta?.toString() || '0',
      fee_wei: tx.fee_wei?.toString() || '0',
      bitcoin_address: tx.bitcoin_address,
      gas_used: tx.gas_used,
      gas_price: tx.gas_price?.toString() || '0',
      status: tx.status || 'confirmed',
      metadata: tx.metadata || {}
    }))
    
    return NextResponse.json(formattedTransactions)

  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json([])
  }
}

// POST endpoint for compatibility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = body.address || body.userAddress
    
    if (!address) {
      return NextResponse.json([])
    }
    
    const url = new URL(request.url)
    url.searchParams.set('address', address)
    url.searchParams.set('limit', body.limit || '10')
    
    return GET(new NextRequest(url.toString()))
  } catch {
    return NextResponse.json([])
  }
}