// app/api/verify-wallet/route.ts
// PRODUCTION READY - Full duplicate check via Supabase

import { NextRequest, NextResponse } from 'next/server'
import { BitcoinSignatureValidatorFixed } from '@/lib/bitcoin-signature-validator-fixed'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization of Supabase client
let supabase: any = null

function getSupabaseClient() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabase
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bitcoinAddress, ethereumAddress, message, signature } = body
    
    // Input validation
    if (!bitcoinAddress || !message || !signature) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    console.log('🔐 API: Starting BIP-322 verification')
    console.log(`  Address: ${bitcoinAddress.substring(0, 15)}...`)
    
    // Clean inputs
    const cleanAddress = bitcoinAddress.trim()
    const cleanSignature = signature.trim()
    const cleanMessage = message.trim()
    
    // SECURITY: Whitespace detection
    if (cleanAddress !== bitcoinAddress) {
      console.log('❌ Rejected: Address contains leading/trailing whitespace')
      return NextResponse.json({
        success: false,
        error: 'Invalid address format: whitespace detected'
      }, { status: 400 })
    }
    
    // SECURITY: Timestamp validation
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/)

    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1], 10)
      
      // Validate timestamp is a reasonable number
      if (isNaN(messageTimestamp) || messageTimestamp <= 0) {
        console.log('❌ Rejected: Invalid timestamp format')
        return NextResponse.json({
          success: false,
          error: 'Invalid timestamp format'
        }, { status: 400 })
      }
      
      // Check timestamp is not absurdly far in future (year 2100)
      const maxReasonableTimestamp = 4102444800 // Jan 1, 2100
      if (messageTimestamp > maxReasonableTimestamp) {
        console.log(`❌ Rejected: Timestamp ${messageTimestamp} is unreasonably far in future`)
        return NextResponse.json({
          success: false,
          error: 'Invalid timestamp: unreasonably far in future'
        }, { status: 400 })
      }
      
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const timestampDiff = currentTimestamp - messageTimestamp
      
      // Must not be more than 60 seconds in the future
      if (timestampDiff < -60) {
        console.log(`❌ Rejected: Timestamp is ${Math.abs(timestampDiff)}s in the future`)
        return NextResponse.json({
          success: false,
          error: 'Invalid timestamp: message is from the future'
        }, { status: 400 })
      }
      
      // Must not be older than 1 hour
      if (timestampDiff > 3600) {
        console.log(`❌ Rejected: Timestamp is ${timestampDiff}s old (max 3600s)`)
        return NextResponse.json({
          success: false,
          error: 'Invalid timestamp: message is too old'
        }, { status: 400 })
      }
      
      console.log(`✅ Timestamp valid: ${timestampDiff}s old`)
    }
    
    // Basic security checks
    if (cleanSignature.length < 64) {
      return NextResponse.json({
        success: false,
        error: 'Signature too short'
      }, { status: 400 })
    }
    
    if (cleanAddress.includes("'") || cleanAddress.includes('"') || cleanAddress.includes(';')) {
      console.log('❌ Rejected: SQL injection attempt detected')
      return NextResponse.json({
        success: false,
        error: 'Invalid characters in address'
      }, { status: 400 })
    }
    
    if (cleanMessage.length > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Message too long'
      }, { status: 400 })
    }
    
    if (cleanSignature.length > 200) {
      return NextResponse.json({
        success: false,
        error: 'Signature too long'
      }, { status: 400 })
    }
    
    // Bitcoin address format validation
    const isValidFormat = /^(bc1|tb1|[13]|2)[a-zA-Z0-9]{25,62}$/.test(cleanAddress)
    if (!isValidFormat) {
      console.log('❌ Rejected: Invalid Bitcoin address format')
      return NextResponse.json({
        success: false,
        error: 'Invalid Bitcoin address format'
      }, { status: 400 })
    }
    
    // Bech32 case sensitivity
    if (cleanAddress.startsWith('bc1') || cleanAddress.startsWith('tb1')) {
      if (cleanAddress !== cleanAddress.toLowerCase()) {
        console.log('❌ Rejected: Bech32 address must be lowercase')
        return NextResponse.json({
          success: false,
          error: 'Bech32 address must be lowercase'
        }, { status: 400 })
      }
    }
    
    // ========================================================================
    // PRODUCTION: Check for duplicate Bitcoin address in database
    // ========================================================================
    
    const client = getSupabaseClient()
    
    if (!client) {
      console.log('⚠️ Database unavailable - skipping duplicate check')
      // Continue without duplicate check in test environment
    } else {
      console.log('🔍 Checking for duplicate Bitcoin address...')
      
      const { data: existingAddress, error: dbError } = await client
        .from('bitcoin_addresses')
        .select('bitcoin_address, eth_address, verified_at')
        .eq('bitcoin_address', cleanAddress)
        .single()
      
      if (dbError && dbError.code !== 'PGRST116') {
        console.error('❌ Database error:', dbError)
        return NextResponse.json({
          success: false,
          error: 'Database error occurred'
        }, { status: 500 })
      }
      
      if (existingAddress) {
        console.log('❌ Bitcoin address already registered')
        console.log(`  Previously registered: ${existingAddress.verified_at}`)
        console.log(`  Associated ETH address: ${existingAddress.eth_address}`)
        
        return NextResponse.json({
          success: false,
          error: 'Bitcoin address already verified',
          details: {
            message: 'This Bitcoin address has already been verified by another user',
            registeredAt: existingAddress.verified_at,
            cannotRegisterTwice: true
          }
        }, { status: 409 })
      }
      
      console.log('✅ Bitcoin address is available for registration')
    }
    
    // ========================================================================
    // Signature verification
    // ========================================================================
    
    const isValid = BitcoinSignatureValidatorFixed.verify(
      cleanAddress,
      cleanMessage,
      cleanSignature
    )
    
    if (!isValid) {
      console.log('❌ Signature verification failed')
      return NextResponse.json({
        success: false,
        error: 'Signature verification failed'
      }, { status: 400 })
    }
    
    // ========================================================================
    // SECURITY FIX: Message structure and binding validation
    // Prevents signature replay attacks
    // ========================================================================
    
    const messageValidation = {
      hasVerificationHeader: cleanMessage.includes('ReserveBTC Wallet Verification'),
      hasTimestamp: /Timestamp:\s*\d+/.test(cleanMessage),
      hasEthAddress: ethereumAddress ? cleanMessage.includes(`MegaETH Address: ${ethereumAddress}`) : true,
      hasConfirmation: cleanMessage.includes('I confirm ownership')
    }
    
    const allFieldsValid = Object.values(messageValidation).every(v => v === true)
    
    if (!allFieldsValid) {
      console.log('❌ Message structure validation failed')
      console.log('  Validation details:', messageValidation)
      return NextResponse.json({
        success: false,
        error: 'Message structure validation failed',
        details: 'The signed message does not match the expected format'
      }, { status: 400 })
    }
    
    // ETH address binding check
    if (ethereumAddress && !cleanMessage.includes(ethereumAddress)) {
      console.log('❌ Ethereum address mismatch')
      return NextResponse.json({
        success: false,
        error: 'Ethereum address in message does not match provided address'
      }, { status: 400 })
    }
    
    console.log('✅ Signature and message binding verified')
    
    // ========================================================================
    // Save verified address to database
    // ========================================================================
    
    if (client) {
          // TEMPORARY DEBUG - Remove after fixing
          const dataToInsert = {
            bitcoin_address: cleanAddress,
            eth_address: ethereumAddress || null,
            network: cleanAddress.startsWith('tb1') || cleanAddress.startsWith('2') ? 'testnet' : 'mainnet',
            verified_at: new Date().toISOString(),
            is_monitoring: false
          }
          
          console.log('🔍 DEBUG: Data to insert:', JSON.stringify(dataToInsert, null, 2))
          console.log('🔍 DEBUG: Table name: bitcoin_addresses')
          
          const { error: insertError } = await client
            .from('bitcoin_addresses')
            .insert(dataToInsert)
          
          if (insertError) {
            console.error('❌ DEBUG: Insert failed!')
            console.error('   Error code:', insertError.code)
            console.error('   Error message:', insertError.message)
            console.error('   Error hint:', insertError.hint)
            console.error('   Error details:', insertError.details)
            console.error('   Full error object:', JSON.stringify(insertError, null, 2))
            
            return NextResponse.json({
              success: false,
              error: 'Failed to save verification',
              debug: {
                code: insertError.code,
                message: insertError.message,
                hint: insertError.hint
              }
            }, { status: 500 })
          }
          
          console.log('✅ Bitcoin address saved to database')
        }
    
    // ========================================================================
    // Detect address type for response
    // ========================================================================
    
    let addressType = 'Unknown'
    let network = 'mainnet'
    
    if (cleanAddress.startsWith('bc1q') || cleanAddress.startsWith('tb1q')) {
      addressType = 'Native SegWit (P2WPKH)'
    } else if (cleanAddress.startsWith('bc1p') || cleanAddress.startsWith('tb1p')) {
      addressType = 'Taproot (P2TR)'
    } else if (cleanAddress.startsWith('3')) {
      addressType = 'SegWit (P2SH-P2WPKH)'
    } else if (cleanAddress.startsWith('1')) {
      addressType = 'Legacy (P2PKH)'
    }
    
    if (cleanAddress.startsWith('tb1') || cleanAddress.startsWith('2') || 
        cleanAddress.startsWith('m') || cleanAddress.startsWith('n')) {
      network = 'testnet'
    }
    
    console.log(`✅ Verification successful:
      Address: ${cleanAddress}
      Type: ${addressType}
      Network: ${network}
    `)
    
    // Return success
    return NextResponse.json({
      success: true,
      data: {
        bitcoinAddress: cleanAddress,
        ethereumAddress: ethereumAddress || '',
        verified: true,
        timestamp: new Date().toISOString(),
        validationDetails: {
          addressType,
          network,
          securityLevel: 'high',
          method: 'Multi-Format BIP-322/137',
          duplicateCheck: client ? 'passed' : 'skipped',
          messageBinding: 'verified'
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ API: Fatal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'BIP-322 Verification API',
    status: 'operational',
    version: '2.3.0',
    security: 'production-grade',
    securityFeatures: [
      'Timestamp validation (1 hour window for testing)',
      'Whitespace detection',
      'SQL injection protection',
      'DoS protection (length limits)',
      'Case sensitivity enforcement',
      'Format validation',
      'Duplicate address prevention',
      'Message binding verification',
      'Database-backed duplicate check'
    ],
    methods: ['BIP-322', 'BIP-137', 'Legacy'],
    supportedAddressTypes: [
      'Legacy (P2PKH)',
      'SegWit (P2SH-P2WPKH)', 
      'Native SegWit (P2WPKH)',
      'Taproot (P2TR)'
    ],
    networks: ['mainnet', 'testnet'],
    requiredFields: ['bitcoinAddress', 'message', 'signature'],
    optionalFields: ['ethereumAddress']
  })
}