import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase configuration missing, returning empty data')
    return null
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    const supabase = getSupabaseClient()
    
    // Return valid structure even without Supabase
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: {
          userBurns: [],
          emergencyTransactions: [],
          totalSystemBurns: 0,
          hasEmergencyBurns: false
        },
        timestamp: new Date().toISOString()
      })
    }

    let userBurns = []
    let emergencyTransactions = []
    
    if (address) {
      const { data: burns } = await supabase
        .from('emergency_burns')
        .select('*')
        .eq('user_address', address.toLowerCase())
        .order('timestamp', { ascending: false })
      
      userBurns = burns || []

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_address', address.toLowerCase())
        .eq('is_emergency_burn', true)
        .order('block_timestamp', { ascending: false })
      
      emergencyTransactions = txs || []
    }

    const { data: totalBurns } = await supabase
      .from('emergency_burns')
      .select('burned_amount')

    const totalBurnedAmount = totalBurns?.reduce(
      (sum, burn) => sum + (parseInt(burn.burned_amount) || 0), 
      0
    ) || 0

    return NextResponse.json({
      success: true,
      data: {
        userBurns: userBurns,
        emergencyTransactions: emergencyTransactions,
        totalSystemBurns: totalBurnedAmount,
        hasEmergencyBurns: userBurns.length > 0 || emergencyTransactions.length > 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Emergency burns API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch emergency burns',
      data: {
        userBurns: [],
        emergencyTransactions: [],
        totalSystemBurns: 0,
        hasEmergencyBurns: false
      },
      timestamp: new Date().toISOString()
    })
  }
}