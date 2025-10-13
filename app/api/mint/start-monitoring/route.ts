// app/api/mint/start-monitoring/route.ts
// API endpoint to enable Bitcoin address monitoring after user clicks Mint
// This endpoint is called AFTER FeeVault deposit is confirmed

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { ethAddress, bitcoinAddress } = await request.json()

    // Validate inputs
    if (!ethAddress || !bitcoinAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Normalize addresses
    const normalizedEthAddress = ethAddress.toLowerCase()
    const normalizedBitcoinAddress = bitcoinAddress.trim()

    console.log(`🚀 START MONITORING: ETH ${normalizedEthAddress.slice(0, 10)}... → BTC ${normalizedBitcoinAddress.slice(0, 10)}...`)

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if address exists and is verified
    const { data: existingAddress, error: checkError } = await supabase
      .from('bitcoin_addresses')
      .select('*')
      .eq('eth_address', normalizedEthAddress)
      .eq('bitcoin_address', normalizedBitcoinAddress)
      .single()

    if (checkError || !existingAddress) {
      console.error('❌ Address not found or not verified:', checkError)
      return NextResponse.json(
        { success: false, error: 'Bitcoin address not verified. Please verify first.' },
        { status: 404 }
      )
    }

    // Check if already monitoring
    if (existingAddress.is_monitoring) {
      console.log('⚠️ Already monitoring this address')
      return NextResponse.json({
        success: true,
        message: 'Address is already being monitored',
        data: existingAddress
      })
    }

    // Enable monitoring
    const { data: updatedAddress, error: updateError } = await supabase
      .from('bitcoin_addresses')
      .update({
        is_monitoring: true,
        monitoring_started_at: new Date().toISOString()
      })
      .eq('eth_address', normalizedEthAddress)
      .eq('bitcoin_address', normalizedBitcoinAddress)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to enable monitoring:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to enable monitoring' },
        { status: 500 }
      )
    }

    console.log('✅ Monitoring enabled successfully')

    return NextResponse.json({
      success: true,
      message: 'Bitcoin address monitoring started',
      data: updatedAddress
    })

  } catch (error) {
    console.error('❌ Start monitoring error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}