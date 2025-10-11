import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    // Server-side variables
    MEGAETH_PRIVATE_RPC: process.env.MEGAETH_PRIVATE_RPC || 'NOT SET',
    MEGAETH_PRIVATE_WS: process.env.MEGAETH_PRIVATE_WS || 'NOT SET',
    
    // Client-side variables
    NEXT_PUBLIC_MEGAETH_PRIVATE_RPC: process.env.NEXT_PUBLIC_MEGAETH_PRIVATE_RPC || 'NOT SET',
    
    // Check if they contain the private path
    hasPrivatePath: {
      rpc: (process.env.MEGAETH_PRIVATE_RPC || '').includes('/mafia/'),
      ws: (process.env.MEGAETH_PRIVATE_WS || '').includes('/mafia/')
    }
  })
}