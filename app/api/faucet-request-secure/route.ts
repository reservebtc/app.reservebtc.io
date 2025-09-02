import { NextRequest, NextResponse } from 'next/server'
import { createFaucetRequest } from '@/lib/supabase-client'

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

    try {
      // Create request in Supabase
      const newRequest = await createFaucetRequest({
        twitter_handle: cleanTwitter,
        github_username: cleanGithub,
        eth_address: ethAddress.toLowerCase(),
        ip_address: ip,
        user_agent: userAgent,
        status: 'pending'
      })

      return NextResponse.json({
        success: true,
        message: 'Request submitted successfully! You will receive 0.005 ETH within 24 hours after verification.',
        requestId: newRequest.id
      })

    } catch (dbError: any) {
      // Handle duplicate request error
      if (dbError.message?.includes('24 hours')) {
        return NextResponse.json(
          { error: 'You have already submitted a request in the last 24 hours. Please wait.' },
          { status: 429 }
        )
      }

      throw dbError
    }

  } catch (error) {
    console.error('Faucet request error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}