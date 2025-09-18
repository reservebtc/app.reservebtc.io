import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    const { data: transactions, error } = await getSupabaseClient()
      .from('transactions')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('block_timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      address: address.toLowerCase(),
      transactions: transactions || [],
      count: transactions?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json({
      address: '',
      transactions: [],
      count: 0,
      timestamp: new Date().toISOString()
    })
  }
}