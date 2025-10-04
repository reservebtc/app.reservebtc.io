// lib/bitcoin-validation.ts
/**
 * Bitcoin address validation utilities
 */

import * as bitcoin from 'bitcoinjs-lib'

export interface BitcoinAddressValidation {
  valid: boolean
  network: 'mainnet' | 'testnet' | 'unknown'
  type: string
  error?: string
}

/**
 * Validate Bitcoin address format and detect type
 */
export function validateBitcoinAddress(address: string): BitcoinAddressValidation {
  if (!address || typeof address !== 'string') {
    return {
      valid: false,
      network: 'unknown',
      type: 'invalid',
      error: 'Address is required'
    }
  }

  const cleanAddress = address.trim()

  try {
    // Detect network
    let network: 'mainnet' | 'testnet' = 'mainnet'
    if (cleanAddress.startsWith('tb1') || 
        cleanAddress.startsWith('m') || 
        cleanAddress.startsWith('n') || 
        cleanAddress.startsWith('2')) {
      network = 'testnet'
    }

    // Detect type and validate
    let type = 'unknown'

    if (cleanAddress.startsWith('bc1p') || cleanAddress.startsWith('tb1p')) {
      type = 'Taproot (P2TR)'
      bitcoin.address.fromBech32(cleanAddress)
    } else if (cleanAddress.startsWith('bc1q') || cleanAddress.startsWith('tb1q')) {
      type = 'Native SegWit (P2WPKH)'
      bitcoin.address.fromBech32(cleanAddress)
    } else if (cleanAddress.startsWith('bc1') || cleanAddress.startsWith('tb1')) {
      type = 'Native SegWit (bech32)'
      bitcoin.address.fromBech32(cleanAddress)
    } else if (cleanAddress.startsWith('3') || cleanAddress.startsWith('2')) {
      type = cleanAddress.startsWith('3') ? 'SegWit (P2SH-P2WPKH)' : 'Testnet SegWit (P2SH-P2WPKH)'
      bitcoin.address.fromBase58Check(cleanAddress)
    } else if (cleanAddress.startsWith('1') || cleanAddress.startsWith('m') || cleanAddress.startsWith('n')) {
      type = cleanAddress.startsWith('1') ? 'Legacy (P2PKH)' : 'Testnet Legacy (P2PKH)'
      bitcoin.address.fromBase58Check(cleanAddress)
    } else {
      return {
        valid: false,
        network: 'unknown',
        type: 'unknown',
        error: 'Unknown address format'
      }
    }

    return {
      valid: true,
      network,
      type
    }

  } catch (error: any) {
    return {
      valid: false,
      network: 'unknown',
      type: 'invalid',
      error: error.message || 'Invalid Bitcoin address'
    }
  }
}

/**
 * Get human-readable label for Bitcoin address type
 */
export function getBitcoinAddressTypeLabel(address: string): string {
  const validation = validateBitcoinAddress(address)
  
  if (!validation.valid) {
    return 'Invalid Address'
  }

  return `${validation.type} (${validation.network})`
}

/**
 * Check if address is testnet
 */
export function isTestnetAddress(address: string): boolean {
  const validation = validateBitcoinAddress(address)
  return validation.network === 'testnet'
}

/**
 * Check if address is mainnet
 */
export function isMainnetAddress(address: string): boolean {
  const validation = validateBitcoinAddress(address)
  return validation.network === 'mainnet'
}
