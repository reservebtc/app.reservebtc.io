import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()
    

    console.error('🚨 PRODUCTION ERROR:', JSON.stringify(errorData, null, 2))
    

    // await supabase.from('error_logs').insert(errorData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}