import { z } from 'zod'
import { validateBitcoinAddress } from './bitcoin-validation'

export const bitcoinAddressSchema = z
  .string()
  .min(1, 'Bitcoin address is required')
  .refine((address) => {
    const result = validateBitcoinAddress(address)
    return result.isValid
  }, {
    message: 'Invalid Bitcoin address format'
  })

export const ethereumAddressSchema = z
  .string()
  .min(1, 'Ethereum address is required')
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')

export const bip322SignatureSchema = z
  .string()
  .min(1, 'BIP-322 signature is required')
  .refine((signature) => {
    try {
      // Basic base64 validation
      return btoa(atob(signature)) === signature
    } catch {
      return false
    }
  }, {
    message: 'Invalid BIP-322 signature format'
  })

export const mintAmountSchema = z
  .string()
  .min(1, 'Amount is required')
  .refine((amount) => {
    const num = parseFloat(amount)
    return !isNaN(num) && num >= 0.00001
  }, {
    message: 'Minimum amount is 0.00001 BTC'
  })
  .refine((amount) => {
    const num = parseFloat(amount)
    return !isNaN(num) && num <= 21_000_000
  }, {
    message: 'Maximum amount exceeded'
  })

export const walletVerificationSchema = z.object({
  bitcoinAddress: bitcoinAddressSchema,
  ethereumAddress: ethereumAddressSchema,
  message: z.string().min(1, 'Message is required'),
  signature: bip322SignatureSchema,
})

export const mintFormSchema = z.object({
  amount: mintAmountSchema,
  bitcoinAddress: bitcoinAddressSchema,
})

export type WalletVerificationForm = z.infer<typeof walletVerificationSchema>
export type MintForm = z.infer<typeof mintFormSchema>