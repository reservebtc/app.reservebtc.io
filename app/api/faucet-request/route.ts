import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Private file to store requests (not in repo)
const REQUESTS_FILE = path.join(process.cwd(), 'monitoring', 'faucet-requests.json')

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json()
    const { twitterHandle, githubUsername, ethAddress, timestamp } = body

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

    // Clean up inputs
    const cleanTwitter = twitterHandle.replace('@', '').trim()
    const cleanGithub = githubUsername.trim()

    // Create request object
    const request = {
      id: Date.now().toString(),
      twitterHandle: cleanTwitter,
      githubUsername: cleanGithub,
      ethAddress: ethAddress.toLowerCase(),
      timestamp,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: 'pending',
      verified: false
    }

    // Load existing requests
    let requests = []
    try {
      const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8')
      requests = JSON.parse(fileContent)
    } catch (error) {
      // File doesn't exist yet, will create it
      // Create monitoring directory if it doesn't exist
      const monitoringDir = path.dirname(REQUESTS_FILE)
      try {
        await fs.mkdir(monitoringDir, { recursive: true })
      } catch (mkdirError) {
        // Directory might already exist
      }
    }

    // Check for duplicate requests in last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentRequests = requests.filter((r: any) => {
      const requestTime = new Date(r.timestamp).getTime()
      return requestTime > oneDayAgo && (
        r.ethAddress === request.ethAddress ||
        r.twitterHandle === request.twitterHandle ||
        r.githubUsername === request.githubUsername
      )
    })

    if (recentRequests.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a request in the last 24 hours. Please wait.' },
        { status: 429 }
      )
    }

    // Add new request
    requests.push(request)

    // Save to file
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2))

    // Log for monitoring
    console.log('New faucet request:', {
      twitter: cleanTwitter,
      github: cleanGithub,
      address: ethAddress,
      time: timestamp
    })

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      requestId: request.id
    })

  } catch (error) {
    console.error('Faucet request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check request status (optional)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requestId = searchParams.get('id')
  
  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID required' },
      { status: 400 }
    )
  }

  try {
    const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8')
    const requests = JSON.parse(fileContent)
    const request = requests.find((r: any) => r.id === requestId)

    if (!request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: request.status,
      verified: request.verified,
      timestamp: request.timestamp
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not retrieve request status' },
      { status: 500 }
    )
  }
}