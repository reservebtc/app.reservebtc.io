/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '../verify-wallet/route'

// Mock the professional validator
jest.mock('@/lib/bitcoin-signature-validator-fixed', () => ({
  BitcoinSignatureValidatorFixed: {
    verify: jest.fn().mockReturnValue(true)
  }
}))

describe('/api/verify-wallet', () => {
  const ethereumAddress = '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0'
  const bitcoinAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
  
  // Generate valid message structure
  const createValidMessage = (ethAddr: string) => {
    const timestamp = Math.floor(Date.now() / 1000)
    return `ReserveBTC Wallet Verification
Timestamp: ${timestamp}
MegaETH Address: ${ethAddr}
I confirm ownership of this Bitcoin address`
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should verify valid wallet data successfully', async () => {
    const validMessage = createValidMessage(ethereumAddress)
    
    const mockValidationData = {
      bitcoinAddress,
      ethereumAddress,
      message: validMessage,
      signature: 'AkcwRAIgM2gBAQqvZX15ZHdwrkiukIzXPjWyFjPVJ2RsJLhflFcCIH4QKrYacvb35fj5zT2pNNdgK3vQD/ASnJ+r9W36hVqhASECx/EgAxlkQpQ9hcrNjhB3m1gp2fIHqOQc3XjNa6jVzQ1dGw==',
    }

    const request = new NextRequest('https://app.reservebtc.io/api/verify-wallet', {
      method: 'POST',
      body: JSON.stringify(mockValidationData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.verified).toBe(true)
  })

  test('should reject invalid input data', async () => {
    const { BitcoinSignatureValidatorFixed } = require('@/lib/bitcoin-signature-validator-fixed')
    BitcoinSignatureValidatorFixed.verify.mockReturnValue(false)

    const invalidData = {
      bitcoinAddress: 'invalid-address',
      ethereumAddress,
      message: createValidMessage(ethereumAddress),
      signature: 'invalid-signature',
    }

    const request = new NextRequest('https://app.reservebtc.io/api/verify-wallet', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    // Reset mock
    BitcoinSignatureValidatorFixed.verify.mockReturnValue(true)
  })

  test('should handle malformed JSON', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const request = new NextRequest('https://app.reservebtc.io/api/verify-wallet', {
      method: 'POST',
      body: 'invalid-json',
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    
    consoleSpy.mockRestore()
  })

  test('should reject message without required structure', async () => {
    const invalidMessage = {
      bitcoinAddress,
      ethereumAddress,
      message: 'Simple message without structure',
      signature: 'AkcwRAIgM2gBAQqvZX15ZHdwrkiukIzXPjWyFjPVJ2RsJLhflFcCIH4QKrYacvb35fj5zT2pNNdgK3vQD/ASnJ+r9W36hVqhASECx/EgAxlkQpQ9hcrNjhB3m1gp2fIHqOQc3XjNa6jVzQ1dGw==',
    }

    const request = new NextRequest('https://app.reservebtc.io/api/verify-wallet', {
      method: 'POST',
      body: JSON.stringify(invalidMessage),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})