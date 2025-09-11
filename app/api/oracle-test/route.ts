import { oracleService } from '@/lib/oracle-service'

export async function GET() {
  try {
    console.log('🔐 ORACLE TEST API: Starting test...')
    
    const users = await oracleService.getDecryptedUsers()
    
    if (!users || users.length === 0) {
      return Response.json({
        success: false,
        error: 'No users found from Oracle',
        userCount: 0,
        timestamp: new Date().toISOString()
      })
    }

    // Test actual getUserByAddress method to see processed addresses
    const firstUserEthAddress = users[0].ethAddress
    const processedUser = firstUserEthAddress ? await oracleService.getUserByAddress(firstUserEthAddress) : users[0]
    
    // Analyze first user for debugging
    const sampleUser = processedUser || users[0]
    const sampleUserAny = sampleUser as any
    
    return Response.json({
      success: true,
      userCount: users.length,
      timestamp: new Date().toISOString(),
      sampleUser: {
        hasEthAddress: !!sampleUser.ethAddress,
        ethAddress: sampleUser.ethAddress ? 
          `${sampleUser.ethAddress.slice(0, 8)}...${sampleUser.ethAddress.slice(-6)}` : null,
        hasBitcoinAddress: !!(sampleUser.btcAddress || sampleUser.bitcoinAddress || sampleUser.btcAddresses),
        bitcoinFields: {
          btcAddress: !!sampleUser.btcAddress,
          bitcoinAddress: !!sampleUser.bitcoinAddress,
          btcAddresses: !!(sampleUser.btcAddresses?.length),
          bitcoinAddresses: !!(sampleUserAny.bitcoinAddresses?.length),
          bitcoin_addresses: !!(sampleUserAny.bitcoin_addresses?.length)
        },
        processedBitcoinAddresses: sampleUserAny.processedBitcoinAddresses?.length || 0,
        totalFields: Object.keys(sampleUser).length,
        availableFields: Object.keys(sampleUser)
      },
      allUsersInfo: {
        usersWithEthAddress: users.filter(u => u.ethAddress).length,
        usersWithBitcoinAddress: users.filter(u => 
          u.btcAddress || u.bitcoinAddress || u.btcAddresses?.length
        ).length,
        totalAddresses: users.reduce((total, user) => {
          const userAny = user as any
          const addresses = [
            user.btcAddress,
            user.bitcoinAddress,
            ...(user.btcAddresses || []),
            ...(userAny.bitcoinAddresses || []),
            ...(userAny.bitcoin_addresses || [])
          ].filter(Boolean)
          return total + addresses.length
        }, 0)
      }
    })
  } catch (error) {
    console.error('❌ ORACLE TEST API: Error:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}