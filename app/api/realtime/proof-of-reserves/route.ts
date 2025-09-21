// app/api/realtime/proof-of-reserves/route.ts
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
    // Get latest proof of reserves
    const { data: latestProof } = await getSupabaseClient()
      .from('proof_of_reserves')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get totals from balance snapshots
    const { data: totals } = await getSupabaseClient()
      .from('balance_snapshots')
      .select('rbtc_balance, last_sats')

    const totalRBTC = totals?.reduce((sum, row) => sum + (parseInt(row.rbtc_balance) || 0), 0) || 0
    const totalSats = totals?.reduce((sum, row) => sum + (parseInt(row.last_sats) || 0), 0) || 0

    return NextResponse.json({
      latestProof: latestProof || null,
      currentTotals: {
        totalRBTC,
        totalSats,
        backingRatio: totalSats > 0 ? (totalRBTC / totalSats * 100).toFixed(2) : '100.00'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Proof of reserves API error:', error)
    return NextResponse.json({
      latestProof: null,
      currentTotals: {
        totalRBTC: 0,
        totalSats: 0,
        backingRatio: '100.00'
      },
      timestamp: new Date().toISOString()
    })
  }
}