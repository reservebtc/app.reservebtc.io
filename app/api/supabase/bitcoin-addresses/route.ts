import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ethAddress = searchParams.get('eth_address')
    const bitcoinAddress = searchParams.get('bitcoin_address')
    const isMonitoring = searchParams.get('is_monitoring')
    
    if (!ethAddress && !bitcoinAddress) {
      return NextResponse.json(
        { success: false, error: 'eth_address or bitcoin_address required' },
        { status: 400 }
      )
    }

    console.log('🔍 SUPABASE API: Query params:', { ethAddress, bitcoinAddress, isMonitoring })
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let query = supabase
      .from('bitcoin_addresses')
      .select('*')
    
    if (ethAddress) {
      query = query.eq('eth_address', ethAddress.toLowerCase())
    }
    
    if (bitcoinAddress) {
      query = query.eq('bitcoin_address', bitcoinAddress)
    }
    
    if (isMonitoring === 'true') {
      query = query.eq('is_monitoring', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ SUPABASE API Error:', error)
      throw error
    }
    
    console.log(`✅ SUPABASE API: Found ${data?.length || 0} addresses`)

    return NextResponse.json({
      success: true,
      addresses: data || []
    })

  } catch (error: any) {
    console.error('❌ SUPABASE API Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch addresses',
        addresses: []
      },
      { status: 500 }
    )
  }
}
