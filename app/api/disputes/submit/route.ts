// app/api/disputes/submit/route.ts 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.DISPUTE_ENCRYPTION_KEY || 'default-key-replace-in-production'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

function encryptData(data: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function isValidBitcoinAddress(address: string): boolean {
  const patterns = [
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    /^(bc1|tb1)[a-z0-9]{39,59}$/,
    /^[2mn][a-km-zA-HJ-NP-Z1-9]{33}$/
  ]
  return patterns.some(pattern => pattern.test(address))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_address, 
      bitcoin_address, 
      reported_balance, 
      oracle_balance, 
      description 
    } = body

    // Validation
    if (!user_address || !bitcoin_address || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!isValidBitcoinAddress(bitcoin_address)) {
      return NextResponse.json(
        { error: 'Invalid Bitcoin address format' },
        { status: 400 }
      )
    }

    // Encrypt sensitive data
    const encryptedDescription = encryptData(description)
    const encryptedBitcoinAddress = encryptData(bitcoin_address)

    const supabase = getSupabaseClient()
    
    // Check for existing pending dispute
    const { data: existing } = await supabase
      .from('balance_disputes')
      .select('id')
      .eq('user_address', user_address.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending dispute' },
        { status: 400 }
      )
    }

    // Create new dispute
    const { data, error } = await supabase
      .from('balance_disputes')
      .insert({
        user_address: user_address.toLowerCase(),
        bitcoin_address: encryptedBitcoinAddress,
        reported_balance: parseInt(reported_balance || '0'),
        oracle_balance: parseInt(oracle_balance || '0'),
        description: encryptedDescription,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      disputeId: data[0]?.id,
      message: 'Dispute submitted successfully'
    })

  } catch (error) {
    console.error('Dispute submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit dispute' },
      { status: 500 }
    )
  }
}