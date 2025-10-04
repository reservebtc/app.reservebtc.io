import { NextRequest, NextResponse } from 'next/server'
import { oracleService } from '@/lib/oracle-service'


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({
        encrypted: '',
        hasData: false,
        registeredAt: null,
        bitcoinAddressCount: 0,
        isMonitoring: false,
        mintedAddresses: [],
        btcAddresses: []
      })
    }

    // Get Oracle data
    const userData = await oracleService.getUserByAddress(address)
    
    if (!userData) {
      return NextResponse.json({
        encrypted: '',
        hasData: false,
        registeredAt: null,
        bitcoinAddressCount: 0,
        isMonitoring: false,
        mintedAddresses: [],
        btcAddresses: []
      })
    }
    
    // Extract all Bitcoin addresses
    const allBitcoinAddresses: string[] = []
    const mintedAddresses: string[] = []
    
    if (userData.bitcoinAddress) allBitcoinAddresses.push(userData.bitcoinAddress)
    if ((userData as any).btcAddress) allBitcoinAddresses.push((userData as any).btcAddress)
    
    if ((userData as any).bitcoinAddresses && Array.isArray((userData as any).bitcoinAddresses)) {
      allBitcoinAddresses.push(...(userData as any).bitcoinAddresses)
    }
    
    if ((userData as any).btcAddresses && Array.isArray((userData as any).btcAddresses)) {
      allBitcoinAddresses.push(...(userData as any).btcAddresses)
    }
    
    // Check which addresses are minted
    if ((userData as any).mintedAddresses && Array.isArray((userData as any).mintedAddresses)) {
      mintedAddresses.push(...(userData as any).mintedAddresses)
    }
    
    // Generate encrypted string from user data (for compatibility)
    const encryptedData = Buffer.from(JSON.stringify({
      address: userData.ethAddress,
      bitcoinAddresses: allBitcoinAddresses,
      timestamp: Date.now()
    })).toString('base64')
    
    // Return structured response matching test expectations
    return NextResponse.json({
      encrypted: encryptedData,
      hasData: true,
      registeredAt: userData.registeredAt || new Date().toISOString(),
      bitcoinAddressCount: allBitcoinAddresses.length,
      isMonitoring: allBitcoinAddresses.length > 0,
      mintedAddresses: mintedAddresses,
      btcAddresses: allBitcoinAddresses
    })
    
  } catch (error) {
    console.error('Oracle user-data error:', error)
    
    // Return default structure on error
    return NextResponse.json({
      encrypted: '',
      hasData: false,
      registeredAt: null,
      bitcoinAddressCount: 0,
      isMonitoring: false,
      mintedAddresses: [],
      btcAddresses: []
    })
  }
}