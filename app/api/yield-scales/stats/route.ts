// app/api/yield-scales/stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

// Helper functions
async function getTotalRBTCSupply(): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('balance_snapshots')
      .select('rbtc_balance')
      .order('snapshot_timestamp', { ascending: false })
      .limit(1)
      .single()
    
    return data?.rbtc_balance || 0
  } catch {
    return 0
  }
}

async function getTotalUSDTDeposits(): Promise<number> {
  // Simulated - in production would query partner protocols
  return Math.floor(Math.random() * 5000000) + 1000000
}

async function getPeakRBTCSupply(): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('balance_snapshots')
      .select('rbtc_balance')
      .order('rbtc_balance', { ascending: false })
      .limit(1)
      .single()
    
    return data?.rbtc_balance || 1000000
  } catch {
    return 1000000
  }
}

async function getTotalParticipants(): Promise<string> {
  // Never expose real user count for privacy
  return 'encrypted'
}

async function getBTCPrice(): Promise<number> {
  // In production, fetch from price oracle
  return 45000
}

export async function GET() {
  try {
    // Get current data
    const totalRBTC = await getTotalRBTCSupply()
    const totalUSDT = await getTotalUSDTDeposits()
    const peakRBTC = await getPeakRBTCSupply()
    const btcPrice = await getBTCPrice()
    
    // Calculate scales balance
    const rbtcScale = peakRBTC > 0 ? Math.min(200, (totalRBTC / peakRBTC) * 100) : 0
    const usdtScale = 100 // Always 100%
    
    // Calculate current yield rate
    const baseYieldRate = 5 // 5% base rate
    const scaleFactor = (usdtScale / 100) * (rbtcScale / 100)
    const currentYieldRate = scaleFactor * baseYieldRate
    
    // Calculate TVL
    const rbtcValueUSD = (totalRBTC * btcPrice) / 100000000
    const totalTVL = totalUSDT + rbtcValueUSD
    
    const stats = {
      scalesBalance: {
        usdtScale: Math.round(usdtScale),
        rbtcScale: Math.round(rbtcScale)
      },
      currentYieldRate: parseFloat(currentYieldRate.toFixed(2)),
      totalParticipants: await getTotalParticipants(),
      totalTVL: Math.round(totalTVL),
      breakdown: {
        totalRBTC: totalRBTC,
        totalUSDT: totalUSDT,
        btcPrice: btcPrice
      },
      performance: {
        last24h: (Math.random() * 10 - 5).toFixed(2),
        last7d: (Math.random() * 20 - 10).toFixed(2),
        last30d: (Math.random() * 30 - 15).toFixed(2)
      },
      lastUpdated: new Date().toISOString()
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({
      scalesBalance: {
        usdtScale: 100,
        rbtcScale: 0
      },
      currentYieldRate: 0,
      totalParticipants: 'encrypted',
      totalTVL: 0,
      breakdown: {
        totalRBTC: 0,
        totalUSDT: 0,
        btcPrice: 0
      },
      performance: {
        last24h: "0",
        last7d: "0",
        last30d: "0"
      },
      lastUpdated: new Date().toISOString()
    })
  }
}