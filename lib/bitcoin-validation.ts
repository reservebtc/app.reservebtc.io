// lib/bitcoin-validation.ts
/**
 * Bitcoin address validation utilities
 */

import * as bitcoin from 'bitcoinjs-lib'

export interface BitcoinAddressValidation {
  valid: boolean
  network: 'mainnet' | 'testnet' | 'unknown'
  type: 'taproot' | 'segwit' | 'legacy' | 'unknown'
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
      type: 'unknown',
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

    // Reject testnet addresses
    if (network === 'testnet') {
      return {
        valid: false,
        network: 'unknown',
        type: 'unknown',
        error: 'Only mainnet Bitcoin addresses are supported'
      }
    }

    // Detect type and validate
    let type: 'taproot' | 'segwit' | 'legacy' | 'unknown' = 'unknown'

    if (cleanAddress.startsWith('bc1p')) {
      type = 'taproot'
      bitcoin.address.fromBech32(cleanAddress)
    } else if (cleanAddress.startsWith('bc1q') || cleanAddress.startsWith('bc1')) {
      type = 'segwit'
      bitcoin.address.fromBech32(cleanAddress)
    } else if (cleanAddress.startsWith('3') || cleanAddress.startsWith('1')) {
      type = 'legacy'
      bitcoin.address.fromBase58Check(cleanAddress)
    } else {
      return {
        valid: false,
        network: 'unknown',
        type: 'unknown',
        error: 'Invalid Bitcoin address format'
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
      type: 'unknown',
      error: 'Invalid Bitcoin address format'
    }
  }
}

/**
 * Get human-readable label for Bitcoin address type
 */
export function getBitcoinAddressTypeLabel(type: 'taproot' | 'segwit' | 'legacy' | 'unknown'): string {
  switch (type) {
    case 'taproot':
      return 'Taproot (bc1p...)'
    case 'segwit':
      return 'SegWit (bc1q...)'
    case 'legacy':
      return 'Legacy (1.../3...)'
    default:
      return 'Unknown'
  }
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

/**
 * Simple helper for quick validation
 */
export function isValidBitcoinAddress(address: string): boolean {
  return validateBitcoinAddress(address).valid
}