// app/api/rpc-proxy/route.ts
// Proxy for MegaETH RPC to avoid CORS issues

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward request to MegaETH RPC
    const response = await fetch('https://carrot.megaeth.com/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('RPC Proxy error:', error)
    return NextResponse.json(
      { error: 'RPC request failed' },
      { status: 500 }
    )
  }
}