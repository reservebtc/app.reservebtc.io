/**
 * Health Check API Endpoint
 * Provides system status monitoring for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🏥 HEALTH: Running health check...')
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: { status: 'healthy', response_time: '0ms' },
        oracle: { status: 'unknown', response_time: 'N/A' } as any,
        mempool: { status: 'unknown', response_time: 'N/A' } as any,
        cron: { status: 'unknown', last_run: 'N/A' } as any
      },
      version: '1.0.0',
      deployment: {
        environment: process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'unknown',
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'
      }
    }

    // Test Oracle Server connectivity
    try {
      const oracleUrl = process.env.NEXT_PUBLIC_ORACLE_BASE_URL || 'https://oracle.reservebtc.io'
      const oracleStart = Date.now()
      
      const oracleResponse = await fetch(`${oracleUrl}/status`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ReserveBTC-HealthCheck/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      const oracleTime = Date.now() - oracleStart
      healthStatus.services.oracle = {
        status: oracleResponse.ok ? 'healthy' : 'unhealthy',
        response_time: `${oracleTime}ms`
      }
      
      console.log(`🔮 HEALTH: Oracle status - ${healthStatus.services.oracle.status} (${oracleTime}ms)`)
      
    } catch (oracleError) {
      console.warn('⚠️ HEALTH: Oracle connectivity check failed:', oracleError)
      healthStatus.services.oracle = {
        status: 'unhealthy',
        response_time: 'timeout',
        error: 'Connection failed'
      }
    }

    // Test Mempool.space connectivity
    try {
      const mempoolStart = Date.now()
      
      const mempoolResponse = await fetch('https://mempool.space/api/v1/fees/recommended', {
        method: 'GET',
        headers: {
          'User-Agent': 'ReserveBTC-HealthCheck/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      const mempoolTime = Date.now() - mempoolStart
      healthStatus.services.mempool = {
        status: mempoolResponse.ok ? 'healthy' : 'unhealthy',
        response_time: `${mempoolTime}ms`
      }
      
      console.log(`💰 HEALTH: Mempool status - ${healthStatus.services.mempool.status} (${mempoolTime}ms)`)
      
    } catch (mempoolError) {
      console.warn('⚠️ HEALTH: Mempool connectivity check failed:', mempoolError)
      healthStatus.services.mempool = {
        status: 'unhealthy',
        response_time: 'timeout',
        error: 'Connection failed'
      }
    }

    // Check Cron Job status
    try {
      // Check if cron secret is configured
      const cronSecret = process.env.CRON_SECRET
      healthStatus.services.cron = {
        status: cronSecret ? 'configured' : 'not_configured',
        last_run: 'monitoring_required'
      }
      
      console.log(`⏰ HEALTH: Cron status - ${healthStatus.services.cron.status}`)
      
    } catch (cronError) {
      console.warn('⚠️ HEALTH: Cron check failed:', cronError)
      healthStatus.services.cron = {
        status: 'error',
        error: 'Check failed'
      }
    }

    // Calculate overall health
    const healthyServices = Object.values(healthStatus.services).filter(
      service => service.status === 'healthy' || service.status === 'configured'
    ).length
    const totalServices = Object.keys(healthStatus.services).length
    
    if (healthyServices === totalServices) {
      healthStatus.status = 'healthy'
    } else if (healthyServices >= totalServices / 2) {
      healthStatus.status = 'degraded'
    } else {
      healthStatus.status = 'unhealthy'
    }

    const responseTime = Date.now() - startTime
    healthStatus.services.frontend.response_time = `${responseTime}ms`
    
    console.log(`✅ HEALTH: Overall status - ${healthStatus.status} (${responseTime}ms total)`)
    
    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthStatus, { status: statusCode })
    
  } catch (error) {
    console.error('❌ HEALTH: Health check failed:', error)
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        frontend: { status: 'error', response_time: `${Date.now() - startTime}ms` }
      }
    }
    
    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Support HEAD requests for load balancer health checks
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check without external API calls
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}