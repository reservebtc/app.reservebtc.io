// app/api/disputes/public/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

function getDiscrepancyRange(reported: number, oracle: number): string {
  const diff = Math.abs(reported - oracle)
  
  if (diff < 1000) return 'Minor (< 1k sats)'
  if (diff < 10000) return 'Small (1k - 10k sats)'
  if (diff < 100000) return 'Medium (10k - 100k sats)'
  return 'Large (> 100k sats)'
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: disputes } = await supabase
      .from('balance_disputes')
      .select('status, created_at, resolved_at, reported_balance, oracle_balance')
      .order('created_at', { ascending: false })
      .limit(20)

    // Anonymize all data
    const anonymizedDisputes = disputes?.map(dispute => ({
      status: dispute.status,
      time_ago: getTimeAgo(dispute.created_at),
      discrepancy_range: getDiscrepancyRange(
        dispute.reported_balance || 0,
        dispute.oracle_balance || 0
      ),
      resolution_time: dispute.resolved_at ? 
        `${Math.floor((new Date(dispute.resolved_at).getTime() - new Date(dispute.created_at).getTime()) / (1000 * 60 * 60))} hours` :
        null
    }))

    return NextResponse.json({
      disputes: anonymizedDisputes || []
    })

  } catch (error) {
    return NextResponse.json({ disputes: [] })
  }
}