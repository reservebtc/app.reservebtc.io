import { 
  validateBitcoinAddress, 
  getBitcoinAddressTypeLabel,
  BitcoinValidationResult 
} from '../bitcoin-validation'

describe('Bitcoin Address Validation', () => {
  describe('validateBitcoinAddress', () => {
    describe('Valid Addresses', () => {
      test('should validate valid Taproot address', () => {
        const result = validateBitcoinAddress('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297')
        expect(result.isValid).toBe(true)
        expect(result.type).toBe('taproot')
        expect(result.error).toBeUndefined()
      })

      test('should validate valid SegWit address', () => {
        const result = validateBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
        expect(result.isValid).toBe(true)
        expect(result.type).toBe('segwit')
        expect(result.error).toBeUndefined()
      })

      test('should validate valid Legacy P2PKH address', () => {
        const result = validateBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
        expect(result.isValid).toBe(true)
        expect(result.type).toBe('legacy')
        expect(result.error).toBeUndefined()
      })

      test('should validate valid Legacy P2SH address', () => {
        const result = validateBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
        expect(result.isValid).toBe(true)
        expect(result.type).toBe('legacy')
        expect(result.error).toBeUndefined()
      })
    })

    describe('Invalid Addresses', () => {
      test('should reject empty string', () => {
        const result = validateBitcoinAddress('')
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
        expect(result.error).toBe('Address is required')
      })

      test('should reject null input', () => {
        const result = validateBitcoinAddress(null as any)
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
        expect(result.error).toBe('Address is required')
      })

      test('should reject undefined input', () => {
        const result = validateBitcoinAddress(undefined as any)
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
        expect(result.error).toBe('Address is required')
      })

      test('should reject invalid format', () => {
        const result = validateBitcoinAddress('invalid-bitcoin-address')
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
        expect(result.error).toBe('Invalid Bitcoin address format')
      })

      test('should reject testnet addresses', () => {
        const result = validateBitcoinAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
        expect(result.error).toBe('Only mainnet Bitcoin addresses are supported')
      })

      test('should reject addresses with wrong checksum', () => {
        const result = validateBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5')
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
        expect(result.error).toBe('Invalid Bitcoin address format')
      })

      test('should handle whitespace properly', () => {
        const result = validateBitcoinAddress('  bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4  ')
        expect(result.isValid).toBe(true)
        expect(result.type).toBe('segwit')
      })
    })

    describe('Edge Cases', () => {
      test('should handle very long invalid string', () => {
        const longString = 'a'.repeat(1000)
        const result = validateBitcoinAddress(longString)
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
      })

      test('should handle special characters', () => {
        const result = validateBitcoinAddress('bc1q<script>alert("xss")</script>')
        expect(result.isValid).toBe(false)
        expect(result.type).toBe('unknown')
      })

      test('should handle mixed case correctly', () => {
        const result = validateBitcoinAddress('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4')
        expect(result.isValid).toBe(false) // Bech32 is case-sensitive
        expect(result.type).toBe('unknown')
      })
    })
  })

  describe('getBitcoinAddressTypeLabel', () => {
    test('should return correct labels for each type', () => {
      expect(getBitcoinAddressTypeLabel('taproot')).toBe('Taproot (bc1p...)')
      expect(getBitcoinAddressTypeLabel('segwit')).toBe('SegWit (bc1q...)')
      expect(getBitcoinAddressTypeLabel('legacy')).toBe('Legacy (1.../3...)')
      expect(getBitcoinAddressTypeLabel('unknown')).toBe('Unknown')
    })

    test('should handle invalid type gracefully', () => {
      expect(getBitcoinAddressTypeLabel('invalid' as any)).toBe('Unknown')
    })
  })

  describe('Security Tests', () => {
    test('should not be vulnerable to prototype pollution', () => {
      const maliciousAddress = '{"__proto__":{"isAdmin":true}}'
      const result = validateBitcoinAddress(maliciousAddress)
      expect(result.isValid).toBe(false)
      expect((result as any).isAdmin).toBeUndefined()
    })

    test('should handle SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const result = validateBitcoinAddress(sqlInjection)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    test('should sanitize XSS attempts in error messages', () => {
      const xssAttempt = '<img src="x" onerror="alert(1)">'
      const result = validateBitcoinAddress(xssAttempt)
      expect(result.isValid).toBe(false)
      expect(result.error).not.toContain('<script>')
      expect(result.error).not.toContain('onerror')
    })
  })

  describe('Performance Tests', () => {
    test('should validate addresses within reasonable time', () => {
      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        validateBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      }
      const end = Date.now()
      expect(end - start).toBeLessThan(1000) // Should complete in under 1 second
    })

    test('should handle concurrent validations', async () => {
      const addresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'
      ]

      const promises = addresses.map(addr => 
        Promise.resolve(validateBitcoinAddress(addr))
      )

      const results = await Promise.all(promises)
      results.forEach(result => {
        expect(result.isValid).toBe(true)
      })
    })
  })
})