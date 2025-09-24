// app/api/yield-scales/participant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }
    
    // Check if user is participant
    const { data: participant } = await supabase
      .from('yield_scales_participants')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .single()
    
    if (participant) {
      return NextResponse.json({
        isParticipant: true,
        participantType: participant.participant_type || 'bitcoin_holder',
        yieldEarned: parseFloat(participant.yield_earned || '0'),
        yieldClaimed: parseFloat(participant.yield_claimed || '0'),
        joinedAt: participant.joined_at,
        participantCount: 'encrypted' // Privacy protection
      })
    }
    
    // Check if user has rBTC balance (potential participant)
    const { data: balance } = await supabase
      .from('balance_snapshots')
      .select('rbtc_balance')
      .eq('user_address', address.toLowerCase())
      .order('snapshot_timestamp', { ascending: false })
      .limit(1)
      .single()
    
    return NextResponse.json({
      isParticipant: false,
      participantType: null,
      yieldEarned: 0,
      yieldClaimed: 0,
      eligibleToJoin: balance && parseInt(balance.rbtc_balance) > 0,
      participantCount: 'encrypted'
    })
    
  } catch (error) {
    console.error('Participant API error:', error)
    return NextResponse.json({ 
      isParticipant: false,
      participantType: null,
      yieldEarned: 0,
      yieldClaimed: 0,
      participantCount: 'encrypted'
    })
  }
}