/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '../verify-wallet/route'

// Mock the validation schema
jest.mock('@/lib/validation-schemas', () => ({
  walletVerificationSchema: {
    safeParse: jest.fn(),
  },
}))

import { walletVerificationSchema } from '@/lib/validation-schemas'

describe('/api/verify-wallet', () => {
  const mockValidationData = {
    bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    ethereumAddress: '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
    message: 'ReserveBTC verification message',
    signature: 'SGVsbG8gV29ybGQ=',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should verify valid wallet data successfully', async () => {
    // Mock successful validation
    ;(walletVerificationSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: mockValidationData,
    })

    const request = new NextRequest('http://localhost:3000/api/verify-wallet', {
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
  })

  test('should reject invalid input data', async () => {
    ;(walletVerificationSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: {
        issues: [
          { message: 'Invalid Bitcoin address format', path: ['bitcoinAddress'] },
        ],
      },
    })

    const invalidData = {
      ...mockValidationData,
      bitcoinAddress: 'invalid-address',
    }

    const request = new NextRequest('http://localhost:3000/api/verify-wallet', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  test('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/verify-wallet', {
      method: 'POST',
      body: 'invalid-json',
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})