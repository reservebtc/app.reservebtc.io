import { oracleService } from '@/lib/oracle-service'

export async function GET() {
  try {
    console.log('🔍 ORACLE STRUCTURE: Analyzing data structure...')
    
    const users = await oracleService.getDecryptedUsers()
    
    if (!users || users.length === 0) {
      return Response.json({
        success: false,
        error: 'No users found from Oracle',
        totalUsers: 0
      })
    }

    // Analyze structure of each user
    const userStructures = users.map((user, index) => {
      const userAny = user as any
      
      return {
        userIndex: index,
        ethAddress: user.ethAddress ? 
          `${user.ethAddress.slice(0, 8)}...${user.ethAddress.slice(-6)}` : null,
          
        // Check all possible Bitcoin address fields
        hasBitcoinAddress: !!user.bitcoinAddress,
        hasBtcAddress: !!user.btcAddress, 
        hasBtcAddresses: !!(user.btcAddresses?.length),
        hasBitcoinAddresses: !!(userAny.bitcoinAddresses?.length),
        hasBitcoin_addresses: !!(userAny.bitcoin_addresses?.length),
        
        // Show actual values (first few chars only for privacy)
        singleAddress: user.bitcoinAddress ? 
          `${user.bitcoinAddress.slice(0, 12)}...${user.bitcoinAddress.slice(-8)}` : null,
        btcAddress: user.btcAddress ?
          `${user.btcAddress.slice(0, 12)}...${user.btcAddress.slice(-8)}` : null,
          
        // Array lengths
        btcAddressesCount: user.btcAddresses?.length || 0,
        bitcoinAddressesCount: userAny.bitcoinAddresses?.length || 0,
        bitcoin_addressesCount: userAny.bitcoin_addresses?.length || 0,
        
        // Show array contents (truncated for privacy)
        btcAddressesArray: user.btcAddresses?.map(addr => 
          `${addr.slice(0, 12)}...${addr.slice(-8)}`
        ) || [],
        bitcoinAddressesArray: userAny.bitcoinAddresses?.map((addr: string) => 
          `${addr.slice(0, 12)}...${addr.slice(-8)}`
        ) || [],
        
        // All available fields
        totalFields: Object.keys(user).length,
        allFields: Object.keys(user)
      }
    })

    // Summary analysis
    const summary = {
      totalUsers: users.length,
      usersWithSingleAddress: userStructures.filter(u => u.hasBitcoinAddress || u.hasBtcAddress).length,
      usersWithArrays: userStructures.filter(u => u.hasBtcAddresses || u.hasBitcoinAddresses || u.hasBitcoin_addresses).length,
      totalAddressFields: userStructures.reduce((total, user) => {
        return total + (user.hasBitcoinAddress ? 1 : 0) + 
                      (user.hasBtcAddress ? 1 : 0) + 
                      user.btcAddressesCount + 
                      user.bitcoinAddressesCount + 
                      user.bitcoin_addressesCount
      }, 0)
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      userStructures,
      // Recommendations
      recommendations: {
        shouldUseArrays: summary.usersWithSingleAddress > 0 && summary.usersWithArrays === 0,
        migrationNeeded: summary.usersWithSingleAddress > 0,
        preferredField: 'bitcoinAddresses', // Standardize on this field
        issueFound: summary.usersWithArrays === 0 ? 'Oracle only stores single addresses, not arrays' : null
      }
    })
  } catch (error) {
    console.error('❌ ORACLE STRUCTURE: Error analyzing structure:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}