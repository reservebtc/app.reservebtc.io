// app/api/oracle/operations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

// Hash sensitive data for privacy
function anonymizeAddress(address: string): string {
  if (!address) return 'anonymous'
  const hash = crypto.createHash('sha256').update(address).digest('hex')
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`
}

function anonymizeAmount(amount: number): string {
  if (!amount) return 'N/A'
  if (amount < 10000) return '< 10k'
  if (amount < 100000) return '10k-100k'
  if (amount < 1000000) return '100k-1M'
  return '> 1M'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const filter = searchParams.get('filter') || 'all'
    
    const supabase = getSupabaseClient()
    
    // Build query
    let query = supabase
      .from('oracle_operations_log')
      .select('id, timestamp, action, consensus_reached, sources_used, created_at')
      
    // Apply filters
    if (filter !== 'all') {
      query = query.eq('action', filter.toUpperCase())
    }
    
    // Get data with pagination
    const { data: operations, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit)
    
    if (error) throw error
    
    // Anonymize all sensitive data
    const sanitizedOperations = operations?.map(op => ({
      id: op.id,
      timestamp: op.timestamp,
      action: op.action,
      consensus_reached: op.consensus_reached,
      sources_count: Array.isArray(op.sources_used) ? op.sources_used.length : 0,
      // Remove any sensitive data
      user_address: 'encrypted',
      amount: 'encrypted',
      tx_hash: 'encrypted'
    })) || []
    
    // Get aggregated stats
    const { data: statsData } = await supabase
      .from('oracle_operations_log')
      .select('action, consensus_reached')
    
    const stats = {
      total: statsData?.length || 0,
      mints: statsData?.filter(s => s.action === 'MINT').length || 0,
      burns: statsData?.filter(s => s.action === 'BURN').length || 0,
      syncs: statsData?.filter(s => s.action === 'SYNC').length || 0,
      consensus_rate: statsData?.length ? 
        ((statsData.filter(s => s.consensus_reached).length / statsData.length) * 100).toFixed(1) : 
        '100.0'
    }
    
    return NextResponse.json({
      operations: sanitizedOperations,
      stats,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: sanitizedOperations.length === limit
      }
    })
    
  } catch (error) {
    console.error('Oracle operations API error:', error)
    return NextResponse.json({
      operations: [],
      stats: {
        total: 0,
        mints: 0,
        burns: 0,
        syncs: 0,
        consensus_rate: '0'
      },
      pagination: {
        limit: 50,
        offset: 0,
        total: 0,
        hasMore: false
      }
    })
  }
}