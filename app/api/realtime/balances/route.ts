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
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    const { data: snapshot } = await getSupabaseClient()
      .from('balance_snapshots')
      .select('rbtc_balance, wrbtc_balance, last_sats')
      .eq('user_address', address.toLowerCase())
      .order('snapshot_timestamp', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      address: address.toLowerCase(),
      rbtc: snapshot?.rbtc_balance || '0',
      wrbtc: snapshot?.wrbtc_balance || '0',
      lastSats: snapshot?.last_sats || '0',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Balances API error:', error)
    return NextResponse.json({ 
      address: request.url,
      rbtc: '0',
      wrbtc: '0',
      lastSats: '0',
      timestamp: new Date().toISOString()
    })
  }
}