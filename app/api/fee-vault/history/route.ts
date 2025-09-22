// app/api/fee-vault/history/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    // Simulate fee history (in production, fetch from blockchain/database)
    const history = Array.from({ length: 5 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      fee: 0.0001,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
      action: 'SYNC'
    }))

    return NextResponse.json({ history })
  } catch (error) {
    return NextResponse.json({ history: [] })
  }
}