import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client directly in the route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qoudozwmecstoxrqopqf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdWRvendtZWNzdG94cnFvcHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MTk3NTgsImV4cCI6MjA1NzA5NTc1OH0.NNEurre3vb38TbM7P28NRJSRiiwTGyjRM1Ig9Lmwbdo'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { twitterHandle, githubUsername, ethAddress } = body

    // Validate input
    if (!twitterHandle || !githubUsername || !ethAddress) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate ETH address format
    if (!ethAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      )
    }

    // Get IP address for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Clean up inputs
    const cleanTwitter = twitterHandle.replace('@', '').trim().toLowerCase()
    const cleanGithub = githubUsername.trim().toLowerCase()

    // Check for duplicates in last 24 hours
    const { data: existingRequests, error: checkError } = await supabase
      .from('faucet_requests')
      .select('id')
      .or(`eth_address.eq.${ethAddress.toLowerCase()},twitter_handle.eq.${cleanTwitter},github_username.eq.${cleanGithub}`)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (checkError) {
      console.error('Error checking duplicates:', checkError)
      // Continue anyway - better to allow than to block
    } else if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a request in the last 24 hours. Please wait.' },
        { status: 429 }
      )
    }

    // Insert new request
    const { data: newRequest, error: insertError } = await supabase
      .from('faucet_requests')
      .insert([{
        twitter_handle: cleanTwitter,
        github_username: cleanGithub,
        eth_address: ethAddress.toLowerCase(),
        ip_address: ip,
        user_agent: userAgent,
        status: 'pending'
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      
      // Check for specific errors
      if (insertError.code === '42501') {
        return NextResponse.json(
          { error: 'Database permission error. Please contact support.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Database error: ${insertError.message || 'Failed to submit request'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully! You will receive 0.005 ETH within 24 hours after verification.',
      requestId: newRequest.id
    })

  } catch (error) {
    console.error('Faucet request error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}