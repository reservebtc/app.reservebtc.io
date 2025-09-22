// app/api/yield-scales/loyalty/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    // Simulate loyalty data (in production, fetch from database)
    const joinDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    const daysInSystem = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let tier: 'bronze' | 'silver' | 'gold' | 'none' = 'none'
    let yieldBonus = 0
    let nextTierIn = 30
    
    if (daysInSystem >= 365) {
      tier = 'gold'
      yieldBonus = 50
      nextTierIn = 0
    } else if (daysInSystem >= 180) {
      tier = 'silver'
      yieldBonus = 25
      nextTierIn = 365 - daysInSystem
    } else if (daysInSystem >= 30) {
      tier = 'bronze'
      yieldBonus = 10
      nextTierIn = 180 - daysInSystem
    } else {
      nextTierIn = 30 - daysInSystem
    }
    
    const loyaltyData = {
      tier,
      timeInSystem: daysInSystem,
      nextTierIn,
      totalEarned: Math.floor(Math.random() * 50000) + 1000,
      yieldBonus,
      joinDate: joinDate.toISOString()
    }
    
    return NextResponse.json(loyaltyData)
  } catch (error) {
    return NextResponse.json({
      tier: 'none',
      timeInSystem: 0,
      nextTierIn: 30,
      totalEarned: 0,
      yieldBonus: 0,
      joinDate: ''
    })
  }
}