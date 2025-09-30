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

    // Check if user is YieldScales participant
    const { data: participant, error } = await getSupabaseClient()
      .from('yield_scales_participants')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('YieldScales query error:', error)
    }

    // Get YieldScales system stats
    const { data: allParticipants } = await getSupabaseClient()
      .from('yield_scales_participants')
      .select('participant_type, loyalty_tier')

    const stats = {
      totalParticipants: allParticipants?.length || 0,
      bitcoinHolders: allParticipants?.filter(p => p.participant_type === 0).length || 0,
      traders: allParticipants?.filter(p => p.participant_type === 1).length || 0,
      bronzeTier: allParticipants?.filter(p => p.loyalty_tier === 0).length || 0,
      silverTier: allParticipants?.filter(p => p.loyalty_tier === 1).length || 0,
      goldTier: allParticipants?.filter(p => p.loyalty_tier === 2).length || 0
    }

    // Check user's rBTC balance for eligibility
    const { data: balanceSnapshot } = await getSupabaseClient()
      .from('balance_snapshots')
      .select('rbtc_balance')
      .eq('user_address', address.toLowerCase())
      .order('snapshot_timestamp', { ascending: false })
      .limit(1)
      .single()

    const isEligible = (balanceSnapshot?.rbtc_balance || 0) > 0

    return NextResponse.json({
      isParticipant: !!participant,
      isEligible,
      participantData: participant || null,
      currentBalance: balanceSnapshot?.rbtc_balance || '0',
      systemStats: stats,
      yieldScalesContract: '0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('YieldScales API error:', error)
    return NextResponse.json({
      isParticipant: false,
      isEligible: false,
      participantData: null,
      currentBalance: '0',
      systemStats: {
        totalParticipants: 0,
        bitcoinHolders: 0,
        traders: 0,
        bronzeTier: 0,
        silverTier: 0,
        goldTier: 0
      },
      yieldScalesContract: '0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8',
      timestamp: new Date().toISOString()
    })
  }
}