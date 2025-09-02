import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// Same file location as main route
const REQUESTS_FILE = process.env.NODE_ENV === 'production' 
  ? path.join(os.tmpdir(), 'faucet-requests.json')
  : path.join(process.cwd(), 'monitoring', 'faucet-requests.json')

export async function GET(req: NextRequest) {
  // Simple auth check - you can add a secret token here
  const authToken = req.headers.get('authorization')
  
  // Optional: Add basic auth for security
  // if (authToken !== `Bearer ${process.env.ADMIN_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }
  
  try {
    let requests = []
    try {
      const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8')
      requests = JSON.parse(fileContent)
    } catch (error) {
      // File doesn't exist, return empty array
      requests = []
    }
    
    // Return all requests
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Could not export requests' },
      { status: 500 }
    )
  }
}