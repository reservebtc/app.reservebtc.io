// app/api/yield-scales/metrics/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simulate fetching metrics (replace with real data)
    const metrics = {
      scales: {
        usdt: 100, // Always 100%
        rbtc: Math.floor(Math.random() * 150) + 20 // Dynamic 20-170%
      },
      currentYield: 0,
      participants: Math.floor(Math.random() * 100) + 10,
      totalLocked: Math.floor(Math.random() * 1000000) + 100000,
      totalDistributed: Math.floor(Math.random() * 50000) + 5000
    }
    
    // Calculate yield based on scales
    metrics.currentYield = (metrics.scales.usdt * metrics.scales.rbtc * 0.002) / 100
    
    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json({
      scales: { usdt: 100, rbtc: 0 },
      currentYield: 0,
      participants: 0,
      totalLocked: 0,
      totalDistributed: 0
    })
  }
}