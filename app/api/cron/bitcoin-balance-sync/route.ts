import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('⏰ CRON: Bitcoin balance sync started');
    
    // Динамический импорт сервисов
    const { mempoolService } = await import('@/lib/mempool-service');
    const { oracleService } = await import('@/lib/oracle-service');
    
    const allUsers = await oracleService.getDecryptedUsers();
    
    if (!allUsers || allUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to sync',
        duration: Date.now() - startTime
      });
    }
    
    console.log(`📊 Processing ${allUsers.length} users`);
    
    const allAddresses = new Set<string>();
    
    allUsers.forEach((user: any) => {
      if (user.bitcoinAddress) allAddresses.add(user.bitcoinAddress);
      if (user.bitcoinAddresses && Array.isArray(user.bitcoinAddresses)) {
        user.bitcoinAddresses.forEach((addr: string) => {
          if (addr) allAddresses.add(addr);
        });
      }
      if (user.btcAddress) allAddresses.add(user.btcAddress);
      if (user.btcAddresses && Array.isArray(user.btcAddresses)) {
        user.btcAddresses.forEach((addr: string) => {
          if (addr) allAddresses.add(addr);
        });
      }
    });
    
    const uniqueAddresses = Array.from(allAddresses);
    console.log(`Found ${uniqueAddresses.length} addresses`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const address of uniqueAddresses) {
      try {
        const balance = await mempoolService.getAddressBalance(address);
        if (balance) {
          successCount++;
          console.log(`✅ ${address.slice(0,10)}...: ${balance.balance} BTC`);
        } else {
          failedCount++;
        }
      } catch (e) {
        failedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        users: allUsers.length,
        addresses: uniqueAddresses.length,
        successful: successCount,
        failed: failedCount
      },
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}