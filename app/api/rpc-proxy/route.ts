// app/api/rpc-proxy/route.ts
// Professional RPC Proxy - Zero caching, CORS-safe

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const MEGAETH_RPC = 'https://carrot.megaeth.com/rpc'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 RPC PROXY: Request received', {
      method: body.method,
      params: body.params?.length || 0
    })
    
    // Unique ID to prevent any caching
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    const response = await fetch(MEGAETH_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: body.method,
        params: body.params || [],
        id: body.id || requestId
      }),
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('❌ RPC PROXY: MegaETH error', response.status)
      throw new Error(`MegaETH RPC error: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ RPC PROXY: Response received', {
      method: body.method,
      hasResult: !!data.result,
      hasError: !!data.error
    })

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ RPC PROXY: Fatal error:', error)
    
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal RPC proxy error'
        },
        id: null
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache'
    }
  })
}