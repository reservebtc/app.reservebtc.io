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
    
    // Return valid structure even without address or Supabase
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: {
          userDisputes: [],
          hasActiveDispute: false,
          totalDisputes: 0
        },
        timestamp: new Date().toISOString()
      })
    }

    let userDisputes = []
    let hasActiveDispute = false
    let totalDisputes = 0

    if (address) {
      const { data: disputes } = await supabase
        .from('balance_disputes')
        .select('*')
        .eq('user_address', address.toLowerCase())
        .order('created_at', { ascending: false })

      userDisputes = disputes || []
      hasActiveDispute = disputes?.some(d => d.status === 'pending') || false
      totalDisputes = disputes?.length || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        userDisputes: userDisputes,
        hasActiveDispute: hasActiveDispute,
        totalDisputes: totalDisputes
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Disputes API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch disputes',
      data: {
        userDisputes: [],
        hasActiveDispute: false,
        totalDisputes: 0
      },
      timestamp: new Date().toISOString()
    })
  }
}