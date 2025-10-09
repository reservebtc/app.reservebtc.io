// app/api/rpc-proxy/route.ts
// Proxy for MegaETH RPC to avoid CORS issues (NO CACHE!)

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'  // 🔥 CRITICAL: Disable Next.js cache
export const revalidate = 0  // 🔥 CRITICAL: No caching

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 🔥 Add unique cache buster to RPC URL
    const cacheBuster = `?_t=${Date.now()}&_r=${Math.random().toString(36).substring(7)}`
    
    // Forward request to MegaETH RPC with cache buster
    const response = await fetch(`https://carrot.megaeth.com/rpc${cacheBuster}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',  // 🔥 No cache
        'Pragma': 'no-cache'
      },
      cache: 'no-store',  // 🔥 Disable fetch cache
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    // 🔥 Return with no-cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('RPC Proxy error:', error)
    return NextResponse.json(
      { error: 'RPC request failed' },
      { status: 500 }
    )
  }
}