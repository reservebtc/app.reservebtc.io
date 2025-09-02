import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { twitterHandle, githubUsername, ethAddress } = body

    // Basic validation
    if (!twitterHandle || !githubUsername || !ethAddress) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Direct Supabase API call using service key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qoudozwmecstoxrqopqf.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseKey) {
      console.error('SUPABASE_SERVICE_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const requestData = {
      twitter_handle: twitterHandle.replace('@', '').trim().toLowerCase(),
      github_username: githubUsername.trim().toLowerCase(),
      eth_address: ethAddress.toLowerCase(),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      status: 'pending'
    }

    // Make direct REST API call to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/faucet_requests`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Supabase error:', errorText)
      
      // Check if it's RLS error
      if (errorText.includes('row-level security') || errorText.includes('RLS')) {
        return NextResponse.json(
          { 
            error: 'Database configuration error. Please run the SQL fix in Supabase Dashboard.',
            details: 'RLS policies need to be updated. Check fix-supabase-rls.sql'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save request to database', details: errorText },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully! You will receive 0.005 ETH within 24 hours after verification.',
      requestId: data[0]?.id || 'pending'
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}