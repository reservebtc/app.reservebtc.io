// app/api/realtime/disputes/route.ts
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

    const { data: disputes } = await getSupabaseClient()
      .from('balance_disputes')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('created_at', { ascending: false })

    return NextResponse.json({
      userDisputes: disputes || [],
      hasActiveDispute: disputes?.some(d => d.status === 'pending') || false,
      totalDisputes: disputes?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Disputes API error:', error)
    return NextResponse.json({
      userDisputes: [],
      hasActiveDispute: false,
      totalDisputes: 0,
      timestamp: new Date().toISOString()
    })
  }
}