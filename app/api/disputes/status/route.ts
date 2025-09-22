// app/api/disputes/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const disputeId = searchParams.get('id')
    const userAddress = searchParams.get('user')

    if (!disputeId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('balance_disputes')
      .select('id, status, created_at, resolved_at, auto_verification')
      .eq('id', disputeId)
      .eq('user_address', userAddress.toLowerCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Calculate resolution time if resolved
    let resolutionTime = null
    if (data.resolved_at) {
      const created = new Date(data.created_at)
      const resolved = new Date(data.resolved_at)
      const hours = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60))
      resolutionTime = `${hours} hours`
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      resolved_at: data.resolved_at,
      resolution_time: resolutionTime,
      verification: {
        sources_checked: data.auto_verification?.sources_checked || 0,
        consensus_reached: data.auto_verification?.consensus_reached || false
      }
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}