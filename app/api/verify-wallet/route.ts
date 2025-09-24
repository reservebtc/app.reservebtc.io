// app/api/verify-wallet/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { ProfessionalBitcoinValidator } from '@/lib/bitcoin-signature-validator-professional'

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
    
    console.log('🔐 API: Starting professional BIP-322 verification')
    console.log(`  Address: ${bitcoinAddress.substring(0, 15)}...`)
    
    // Security checks
    const securityCheck = ProfessionalBitcoinValidator.validateSecurity(
      bitcoinAddress,
      message,
      signature
    );
    
    if (!securityCheck.secure) {
      console.error('⚠️ Security check failed:', securityCheck.warnings);
      return NextResponse.json({
        success: false,
        error: 'Security validation failed',
        warnings: securityCheck.warnings
      }, { status: 400 })
    }
    
    // Address format validation
    if (!ProfessionalBitcoinValidator.validateAddressFormat(bitcoinAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Bitcoin address format'
      }, { status: 400 })
    }
    
    // Signature verification
    const validationResult = ProfessionalBitcoinValidator.verify(
      bitcoinAddress,
      message,
      signature
    );
    
    console.log('📊 Validation result:', {
      valid: validationResult.valid,
      method: validationResult.method,
      addressType: validationResult.addressType,
      network: validationResult.network,
      securityLevel: validationResult.securityLevel
    });
    
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: validationResult.error || 'Signature verification failed',
        details: {
          addressType: validationResult.addressType,
          network: validationResult.network,
          method: validationResult.method
        }
      }, { status: 400 })
    }
    
    // Log successful verification
    console.log(`✅ Verification successful:
      Address: ${bitcoinAddress}
      Type: ${validationResult.addressType}
      Network: ${validationResult.network}
      Security: ${validationResult.securityLevel}
      Method: ${validationResult.method}
    `);
    
    // Return success
    return NextResponse.json({
      success: true,
      data: {
        bitcoinAddress,
        ethereumAddress: ethereumAddress || '',
        verified: true,
        timestamp: new Date().toISOString(),
        validationDetails: {
          addressType: validationResult.addressType,
          network: validationResult.network,
          securityLevel: validationResult.securityLevel,
          method: validationResult.method
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ API: Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Professional BIP-322 Verification API',
    status: 'operational',
    version: '2.0.0',
    security: 'enhanced',
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