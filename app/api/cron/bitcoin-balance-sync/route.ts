/**
 * Vercel Cron Job: Bitcoin Balance Synchronization
 * Runs every 15 seconds to keep Bitcoin balances up to date
 * Updates balances for all verified addresses in Oracle database
 */

import { NextRequest, NextResponse } from 'next/server'
import { mempoolService } from '@/lib/mempool-service'
import { oracleService } from '@/lib/oracle-service'

// Verify this is a legitimate cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.warn('⚠️ CRON: CRON_SECRET environment variable not set')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('⏰ CRON: Bitcoin balance sync job started')
    
    // Verify cron request authenticity
    if (!verifyCronRequest(request)) {
      console.error('❌ CRON: Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get all users from Oracle Service
    console.log('📡 CRON: Fetching all users from Oracle Service...')
    const allUsers = await oracleService.getDecryptedUsers()
    
    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️ CRON: No users found in Oracle database')
      return NextResponse.json({
        success: true,
        message: 'No users to sync',
        users: 0,
        addresses: 0,
        duration: Date.now() - startTime
      })
    }
    
    // Collect all unique Bitcoin addresses
    const allAddresses = new Set<string>()
    const userAddressMap: Record<string, string[]> = {}
    
    allUsers.forEach(user => {
      const userAddresses: string[] = []
      
      // Add primary Bitcoin address
      if (user.btcAddress) {
        allAddresses.add(user.btcAddress)
        userAddresses.push(user.btcAddress)
      }
      
      // Add additional Bitcoin addresses
      if (user.btcAddresses && Array.isArray(user.btcAddresses)) {
        user.btcAddresses.forEach(addr => {
          if (addr && addr !== user.btcAddress) {
            allAddresses.add(addr)
            userAddresses.push(addr)
          }
        })
      }
      
      if (userAddresses.length > 0 && user.ethAddress) {
        userAddressMap[user.ethAddress] = userAddresses
      }
    })
    
    const uniqueAddresses = Array.from(allAddresses)
    console.log(`📊 CRON: Found ${uniqueAddresses.length} unique Bitcoin addresses from ${allUsers.length} users`)
    
    if (uniqueAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Bitcoin addresses to sync',
        users: allUsers.length,
        addresses: 0,
        duration: Date.now() - startTime
      })
    }
    
    // Fetch aggregated balances using mempool service
    console.log('💰 CRON: Fetching Bitcoin balances from mempool.space...')
    const balanceResults = await mempoolService.getAggregatedBalance(uniqueAddresses)
    
    // Prepare balance update results
    const syncResults = {
      totalUsers: allUsers.length,
      totalAddresses: uniqueAddresses.length,
      successfulFetches: balanceResults.successfulFetches,
      totalBalance: balanceResults.totalBalance,
      mainnetBalance: balanceResults.networks.mainnet,
      testnetBalance: balanceResults.networks.testnet,
      failedFetches: uniqueAddresses.length - balanceResults.successfulFetches,
      userSyncSuccess: 0,
      userSyncFailed: 0
    }
    
    console.log(`✅ CRON: Balance sync completed:`)
    console.log(`   • Users: ${syncResults.totalUsers}`)
    console.log(`   • Addresses: ${syncResults.totalAddresses}`)
    console.log(`   • Successful fetches: ${syncResults.successfulFetches}`)
    console.log(`   • Total BTC: ${syncResults.totalBalance}`)
    console.log(`   • Mainnet BTC: ${syncResults.mainnetBalance}`)
    console.log(`   • Testnet BTC: ${syncResults.testnetBalance}`)
    
    // Note: In a full implementation, you would update the Oracle database here
    // with the new balance information. Since we're working with a read-only
    // Oracle service for security, we're just logging the results.
    
    const duration = Date.now() - startTime
    console.log(`⏱️ CRON: Sync completed in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      message: 'Bitcoin balance sync completed',
      results: syncResults,
      duration,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ CRON: Bitcoin balance sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Only allow GET requests for cron jobs
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}