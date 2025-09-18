import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    const response = await fetch(`https://oracle.reservebtc.io/user/${address.toLowerCase()}`)
    
    if (!response.ok) {
      return NextResponse.json({
        synced: false,
        lastSync: null,
        status: 'not_registered'
      })
    }

    const userData = await response.json()
    const lastSync = userData.registeredAt || null
    const syncAge = lastSync ? Date.now() - new Date(lastSync).getTime() : null
    const isRecent = syncAge ? syncAge < 300000 : false

    return NextResponse.json({
      synced: true,
      lastSync,
      syncAge,
      isRecent,
      status: isRecent ? 'active' : 'stale',
      userRegistered: true
    })

  } catch (error) {
    console.error('Sync status error:', error)
    return NextResponse.json({
      synced: false,
      lastSync: null,
      status: 'error'
    })
  }
}