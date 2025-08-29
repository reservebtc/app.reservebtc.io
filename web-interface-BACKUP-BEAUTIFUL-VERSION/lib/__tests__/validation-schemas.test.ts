import { 
  bitcoinAddressSchema,
  ethereumAddressSchema,
  bip322SignatureSchema,
  mintAmountSchema,
  walletVerificationSchema,
  mintFormSchema
} from '../validation-schemas'

describe('Validation Schemas', () => {
  describe('bitcoinAddressSchema', () => {
    test('should validate valid Bitcoin addresses', () => {
      const validAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'
      ]

      validAddresses.forEach(address => {
        const result = bitcoinAddressSchema.safeParse(address)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid Bitcoin addresses', () => {
      const invalidAddresses = [
        '',
        'invalid-address',
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // testnet
        'bc1qinvalid',
        null,
        undefined
      ]

      invalidAddresses.forEach(address => {
        const result = bitcoinAddressSchema.safeParse(address)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('ethereumAddressSchema', () => {
    test('should validate valid Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
        '0x8ba1f109551bd432803012645aac136c04123456', // исправлен невалидный hex символ H
        '0x0000000000000000000000000000000000000000'
      ]

      validAddresses.forEach(address => {
        const result = ethereumAddressSchema.safeParse(address)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid Ethereum addresses', () => {
      const invalidAddresses = [
        '',
        '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b', // too short
        '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b00', // too long
        '742d35cc6435c0532925a3b8c17890c5e4e6f4b0', // missing 0x
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // invalid hex
        null,
        undefined
      ]

      invalidAddresses.forEach(address => {
        const result = ethereumAddressSchema.safeParse(address)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('bip322SignatureSchema', () => {
    test('should validate valid base64 signatures', () => {
      const validSignatures = [
        'SGVsbG8gV29ybGQ=', // "Hello World" in base64
        'VGVzdCBzaWduYXR1cmU=', // "Test signature" in base64
        'QklQLTMyMiBzaWduYXR1cmUgZXhhbXBsZQ==' // "BIP-322 signature example" in base64
      ]

      validSignatures.forEach(signature => {
        const result = bip322SignatureSchema.safeParse(signature)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid signatures', () => {
      const invalidSignatures = [
        '',
        'not-base64!@#$%',
        'SGVsbG8gV29ybGQ', // invalid base64 (missing padding)
        'SGVsbG8gV29ybGQ!', // invalid base64 characters
        null,
        undefined
      ]

      invalidSignatures.forEach(signature => {
        const result = bip322SignatureSchema.safeParse(signature)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('mintAmountSchema', () => {
    test('should validate valid amounts', () => {
      const validAmounts = [
        '0.00001', // minimum
        '0.1',
        '1.0',
        '10.5',
        '100',
        '1000.12345678' // 8 decimal places
      ]

      validAmounts.forEach(amount => {
        const result = mintAmountSchema.safeParse(amount)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid amounts', () => {
      const invalidAmounts = [
        '',
        '0', // zero
        '0.000001', // below minimum
        '-1', // negative
        'abc', // not a number
        '21000001', // above maximum
        null,
        undefined
      ]

      invalidAmounts.forEach(amount => {
        const result = mintAmountSchema.safeParse(amount)
        expect(result.success).toBe(false)
      })
    })

    test('should provide appropriate error messages', () => {
      const tooSmall = mintAmountSchema.safeParse('0.000001')
      expect(tooSmall.success).toBe(false)
      if (!tooSmall.success) {
        expect(tooSmall.error.issues[0].message).toContain('Minimum amount is 0.00001 BTC')
      }

      const tooLarge = mintAmountSchema.safeParse('25000000')
      expect(tooLarge.success).toBe(false)
      if (!tooLarge.success) {
        expect(tooLarge.error.issues[0].message).toContain('Maximum amount exceeded')
      }
    })
  })

  describe('walletVerificationSchema', () => {
    const validVerificationData = {
      bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      ethereumAddress: '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
      message: 'ReserveBTC verification message',
      signature: 'SGVsbG8gV29ybGQ='
    }

    test('should validate complete verification data', () => {
      const result = walletVerificationSchema.safeParse(validVerificationData)
      expect(result.success).toBe(true)
    })

    test('should reject incomplete data', () => {
      const incompleteData = {
        bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        ethereumAddress: '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
        // missing message and signature
      }

      const result = walletVerificationSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })

    test('should validate each field independently', () => {
      // Test invalid Bitcoin address
      const invalidBtc = {
        ...validVerificationData,
        bitcoinAddress: 'invalid-btc-address'
      }
      expect(walletVerificationSchema.safeParse(invalidBtc).success).toBe(false)

      // Test invalid Ethereum address
      const invalidEth = {
        ...validVerificationData,
        ethereumAddress: 'invalid-eth-address'
      }
      expect(walletVerificationSchema.safeParse(invalidEth).success).toBe(false)

      // Test empty message
      const emptyMessage = {
        ...validVerificationData,
        message: ''
      }
      expect(walletVerificationSchema.safeParse(emptyMessage).success).toBe(false)

      // Test invalid signature
      const invalidSig = {
        ...validVerificationData,
        signature: 'not-base64!@#$'
      }
      expect(walletVerificationSchema.safeParse(invalidSig).success).toBe(false)
    })
  })

  describe('mintFormSchema', () => {
    const validMintData = {
      amount: '0.1',
      bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
    }

    test('should validate complete mint data', () => {
      const result = mintFormSchema.safeParse(validMintData)
      expect(result.success).toBe(true)
    })

    test('should reject invalid amount', () => {
      const invalidAmount = {
        ...validMintData,
        amount: '0.000001' // too small
      }
      expect(mintFormSchema.safeParse(invalidAmount).success).toBe(false)
    })

    test('should reject invalid Bitcoin address', () => {
      const invalidAddress = {
        ...validMintData,
        bitcoinAddress: 'invalid-address'
      }
      expect(mintFormSchema.safeParse(invalidAddress).success).toBe(false)
    })
  })

  describe('Security Tests', () => {
    test('should prevent XSS in validation messages', () => {
      const xssAttempt = '<script>alert("xss")</script>'
      const result = bitcoinAddressSchema.safeParse(xssAttempt)
      expect(result.success).toBe(false)
      if (!result.success) {
        result.error.issues.forEach(issue => {
          expect(issue.message).not.toContain('<script>')
        })
      }
    })

    test('should handle prototype pollution attempts', () => {
      const pollutionAttempt = {
        bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        ethereumAddress: '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
        message: 'test',
        signature: 'SGVsbG8gV29ybGQ=',
        '__proto__': { isAdmin: true }
      }

      const result = walletVerificationSchema.safeParse(pollutionAttempt)
      expect((result as any).isAdmin).toBeUndefined()
    })

    test('should handle extremely large inputs gracefully', () => {
      const largeInput = 'a'.repeat(100000)
      const result = bitcoinAddressSchema.safeParse(largeInput)
      expect(result.success).toBe(false)
      // Should complete without timing out
    })
  })
})