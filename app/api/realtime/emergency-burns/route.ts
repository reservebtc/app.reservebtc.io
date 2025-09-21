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

    // Get emergency burns for user
    const { data: burns, error } = await getSupabaseClient()
      .from('emergency_burns')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('timestamp', { ascending: false })

    if (error && error.code !== 'PGRST116') { // Table exists but no data is ok
      console.error('Emergency burns query error:', error)
    }

    // Get transactions with emergency burn flag
    const { data: emergencyTransactions } = await getSupabaseClient()
      .from('transactions')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .eq('is_emergency_burn', true)
      .order('block_timestamp', { ascending: false })

    // Get total burns across system
    const { data: totalBurns } = await getSupabaseClient()
      .from('emergency_burns')
      .select('burned_amount')

    const totalBurnedAmount = totalBurns?.reduce(
      (sum, burn) => sum + (parseInt(burn.burned_amount) || 0), 
      0
    ) || 0

    return NextResponse.json({
      userBurns: burns || [],
      emergencyTransactions: emergencyTransactions || [],
      totalSystemBurns: totalBurnedAmount,
      hasEmergencyBurns: (burns?.length || 0) > 0 || (emergencyTransactions?.length || 0) > 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Emergency burns API error:', error)
    return NextResponse.json({
      userBurns: [],
      emergencyTransactions: [],
      totalSystemBurns: 0,
      hasEmergencyBurns: false,
      timestamp: new Date().toISOString()
    })
  }
}