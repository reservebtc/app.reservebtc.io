// app/api/verify-wallet/route.ts
// SECURITY ENHANCED: Timestamp validation + Whitespace protection + All fixes

import { NextRequest, NextResponse } from 'next/server'
import { BitcoinSignatureValidatorFixed } from '@/lib/bitcoin-signature-validator-fixed'

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
    
    // SECURITY FIX 1: Whitespace detection (MEDIUM severity)
    const cleanAddress = bitcoinAddress.trim()
    const cleanSignature = signature.trim()
    const cleanMessage = message.trim()
    
    // Reject if whitespace was present (leading/trailing)
    if (cleanAddress !== bitcoinAddress) {
      console.log('❌ Rejected: Address contains leading/trailing whitespace')
      return NextResponse.json({
        success: false,
        error: 'Invalid address format: whitespace detected'
      }, { status: 400 })
    }
    
    // SECURITY FIX 2: Timestamp validation (HIGH severity)
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/)
    
    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1], 10)
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const timestampDiff = currentTimestamp - messageTimestamp
      
      // Reject timestamps from future (> 60 seconds ahead)
      if (timestampDiff < -60) {
        console.log(`❌ Rejected: Timestamp is ${Math.abs(timestampDiff)}s in the future`)
        return NextResponse.json({
          success: false,
          error: 'Invalid timestamp: message is from the future'
        }, { status: 400 })
      }
      
      // Reject old timestamps (> 300 seconds = 5 minutes old)
      if (timestampDiff > 300) {
        console.log(`❌ Rejected: Timestamp is ${timestampDiff}s old (max 300s)`)
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
    
    // SQL injection protection
    if (cleanAddress.includes("'") || cleanAddress.includes('"') || cleanAddress.includes(';')) {
      console.log('❌ Rejected: SQL injection attempt detected')
      return NextResponse.json({
        success: false,
        error: 'Invalid characters in address'
      }, { status: 400 })
    }
    
    // DoS protection - message length
    if (cleanMessage.length > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Message too long'
      }, { status: 400 })
    }
    
    // DoS protection - signature length
    if (cleanSignature.length > 200) {
      return NextResponse.json({
        success: false,
        error: 'Signature too long'
      }, { status: 400 })
    }
    
    // Additional validation: Check Bitcoin address format
    const isValidFormat = /^(bc1|tb1|[13]|2)[a-zA-Z0-9]{25,62}$/.test(cleanAddress)
    if (!isValidFormat) {
      console.log('❌ Rejected: Invalid Bitcoin address format')
      return NextResponse.json({
        success: false,
        error: 'Invalid Bitcoin address format'
      }, { status: 400 })
    }
    
    // Case sensitivity check for bech32 addresses
    if (cleanAddress.startsWith('bc1') || cleanAddress.startsWith('tb1')) {
      if (cleanAddress !== cleanAddress.toLowerCase()) {
        console.log('❌ Rejected: Bech32 address must be lowercase')
        return NextResponse.json({
          success: false,
          error: 'Bech32 address must be lowercase'
        }, { status: 400 })
      }
    }
    
    // Signature verification
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
    
    // Detect address type for logging
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
          method: 'Multi-Format BIP-322/137'
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
    version: '2.1.0',
    security: 'enhanced',
    securityFeatures: [
      'Timestamp validation (±5min window)',
      'Whitespace detection',
      'SQL injection protection',
      'DoS protection (length limits)',
      'Case sensitivity enforcement',
      'Format validation'
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
    optionalFields: ['ethereumAddress'],
    timestampValidation: {
      maxAge: '300 seconds (5 minutes)',
      maxFuture: '60 seconds',
      required: 'recommended'
    }
  })
}