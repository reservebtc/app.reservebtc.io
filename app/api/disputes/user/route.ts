// app/api/disputes/user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.DISPUTE_ENCRYPTION_KEY || 'default-key-replace-in-production'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

function decryptData(encrypted: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return '[Encrypted]'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ disputes: [] })
    }

    const supabase = getSupabaseClient()
    
    const { data: disputes } = await supabase
      .from('balance_disputes')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('created_at', { ascending: false })

    // Decrypt user's own data
    const decryptedDisputes = disputes?.map(dispute => ({
      ...dispute,
      bitcoin_address: decryptData(dispute.bitcoin_address),
      description: decryptData(dispute.description)
    }))

    return NextResponse.json({
      disputes: decryptedDisputes || []
    })

  } catch (error) {
    return NextResponse.json({ disputes: [] })
  }
}