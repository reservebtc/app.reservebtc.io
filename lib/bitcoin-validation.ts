import { validate } from 'bitcoin-address-validation'

export type BitcoinAddressType = 'legacy' | 'segwit' | 'taproot' | 'unknown'

export interface BitcoinValidationResult {
  isValid: boolean
  type: BitcoinAddressType
  error?: string
}

export function validateBitcoinAddress(address: string): BitcoinValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      type: 'unknown',
      error: 'Address is required'
    }
  }

  // Trim whitespace
  const trimmedAddress = address.trim()

  try {
    const isValid = validate(trimmedAddress)
    
    if (!isValid) {
      return {
        isValid: false,
        type: 'unknown',
        error: 'Invalid Bitcoin address format'
      }
    }

    // Check for testnet addresses and reject them
    if (trimmedAddress.startsWith('tb1') || 
        trimmedAddress.startsWith('m') || 
        trimmedAddress.startsWith('n') || 
        trimmedAddress.startsWith('2')) {
      return {
        isValid: false,
        type: 'unknown',
        error: 'Only mainnet Bitcoin addresses are supported'
      }
    }

    // Determine address type (mainnet only)
    let type: BitcoinAddressType = 'unknown'
    
    if (trimmedAddress.startsWith('bc1p')) {
      type = 'taproot' // Bech32m (P2TR)
    } else if (trimmedAddress.startsWith('bc1q')) {
      type = 'segwit' // Bech32 (P2WPKH/P2WSH)
    } else if (trimmedAddress.startsWith('1')) {
      type = 'legacy' // P2PKH (mainnet)
    } else if (trimmedAddress.startsWith('3')) {
      type = 'legacy' // P2SH (mainnet)
    }

    // Allow only mainnet addresses
    if (!trimmedAddress.match(/^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/)) {
      return {
        isValid: false,
        type,
        error: 'Invalid Bitcoin address format'
      }
    }

    return {
      isValid: true,
      type
    }
  } catch (error) {
    return {
      isValid: false,
      type: 'unknown',
      error: 'Failed to validate address'
    }
  }
}

export function getBitcoinAddressTypeLabel(type: BitcoinAddressType): string {
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