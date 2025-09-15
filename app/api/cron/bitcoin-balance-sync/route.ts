// app/api/cron/bitcoin-balance-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Lazy loading для сервисов - избегаем module-level imports
async function getServices() {
  const { mempoolService } = await import('@/lib/mempool-service');
  const { oracleService } = await import('@/lib/oracle-service');
  return { mempoolService, oracleService };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('⏰ CRON: Bitcoin balance sync job started at', new Date().toISOString());
    
    // Lazy load services to avoid module-level initialization
    const { mempoolService, oracleService } = await getServices();
    
    console.log('📡 CRON: Fetching users from Oracle Service...');
    const allUsers = await oracleService.getDecryptedUsers();
    
    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️ CRON: No users found in Oracle database');
      return NextResponse.json({
        success: true,
        message: 'No users to sync',
        stats: {
          totalUsers: 0,
          totalAddresses: 0,
          duration: Date.now() - startTime
        }
      });
    }
    
    console.log(`📊 CRON: Processing ${allUsers.length} users`);
    
    // Collect all unique Bitcoin addresses from ALL users
    const allAddresses = new Set<string>();
    let totalUserAddresses = 0;
    
    allUsers.forEach((user: any) => {
      let userAddressCount = 0;
      
      // Collect addresses from all possible fields
      if (user.bitcoinAddress) {
        allAddresses.add(user.bitcoinAddress);
        userAddressCount++;
      }
      
      if (user.bitcoinAddresses && Array.isArray(user.bitcoinAddresses)) {
        user.bitcoinAddresses.forEach((addr: string) => {
          if (addr) {
            allAddresses.add(addr);
            userAddressCount++;
          }
        });
      }
      
      if (user.btcAddress) {
        allAddresses.add(user.btcAddress);
        userAddressCount++;
      }
      
      if (user.btcAddresses && Array.isArray(user.btcAddresses)) {
        user.btcAddresses.forEach((addr: string) => {
          if (addr) {
            allAddresses.add(addr);
            userAddressCount++;
          }
        });
      }
      
      totalUserAddresses += userAddressCount;
      console.log(`   • User ${user.ethAddress?.slice(0,10)}...: ${userAddressCount} addresses`);
    });
    
    const uniqueAddresses = Array.from(allAddresses);
    console.log(`📊 CRON: Found ${uniqueAddresses.length} unique Bitcoin addresses`);
    console.log(`📊 CRON: Total addresses across all users: ${totalUserAddresses}`);
    
    if (uniqueAddresses.length === 0) {
      console.log('⚠️ CRON: No Bitcoin addresses to sync');
      return NextResponse.json({
        success: true,
        message: 'No Bitcoin addresses to sync',
        stats: {
          totalUsers: allUsers.length,
          totalAddresses: 0,
          duration: Date.now() - startTime
        }
      });
    }
    
    // Process ALL addresses in batches
    const BATCH_SIZE = 20;
    const totalBatches = Math.ceil(uniqueAddresses.length / BATCH_SIZE);
    
    let totalBalance = 0;
    let mainnetBalance = 0;
    let testnetBalance = 0;
    let successCount = 0;
    let failedCount = 0;
    let processedBatches = 0;
    
    console.log(`🔄 CRON: Processing ${uniqueAddresses.length} addresses in ${totalBatches} batches of ${BATCH_SIZE}`);
    
    for (let i = 0; i < uniqueAddresses.length; i += BATCH_SIZE) {
      const batch = uniqueAddresses.slice(i, Math.min(i + BATCH_SIZE, uniqueAddresses.length));
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`📦 CRON: Processing batch ${batchNumber}/${totalBatches} (${batch.length} addresses)`);
      
      try {
        // Process each address individually for better error handling
        for (const address of batch) {
          try {
            const balanceData = await mempoolService.getAddressBalance(address);
            if (balanceData && balanceData.balance !== undefined) {
              const balance = balanceData.balance;
              totalBalance += balance;
              
              // Determine network type
              if (address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
                testnetBalance += balance;
              } else {
                mainnetBalance += balance;
              }
              
              successCount++;
              console.log(`   ✅ Address ${address.slice(0,10)}...: ${balance} BTC`);
            } else {
              failedCount++;
              console.log(`   ⚠️ Address ${address.slice(0,10)}...: No balance data`);
            }
          } catch (error) {
            failedCount++;
            console.log(`   ❌ Address ${address.slice(0,10)}...: Failed to fetch`);
          }
        }
        
        processedBatches++;
        console.log(`   📊 Batch ${batchNumber} complete: ${successCount} successful out of ${i + batch.length} total`);
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < uniqueAddresses.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`   ❌ Batch ${batchNumber} failed completely:`, error);
        failedCount += batch.length;
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log('✅ CRON: Balance sync completed');
    console.log(`   • Duration: ${duration}ms`);
    console.log(`   • Users processed: ${allUsers.length}`);
    console.log(`   • Unique addresses: ${uniqueAddresses.length}`);
    console.log(`   • Successful fetches: ${successCount}`);
    console.log(`   • Failed fetches: ${failedCount}`);
    console.log(`   • Total BTC: ${totalBalance.toFixed(8)}`);
    console.log(`   • Mainnet BTC: ${mainnetBalance.toFixed(8)}`);
    console.log(`   • Testnet BTC: ${testnetBalance.toFixed(8)}`);
    
    return NextResponse.json({
      success: true,
      message: 'Bitcoin balance sync completed',
      stats: {
        totalUsers: allUsers.length,
        totalAddresses: uniqueAddresses.length,
        successfulFetches: successCount,
        failedFetches: failedCount,
        totalBTC: totalBalance.toFixed(8),
        mainnetBTC: mainnetBalance.toFixed(8),
        testnetBTC: testnetBalance.toFixed(8),
        processedBatches,
        duration
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ CRON: Bitcoin balance sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}