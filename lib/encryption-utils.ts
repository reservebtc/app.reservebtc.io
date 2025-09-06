/**
 * Professional encryption utilities for sensitive data protection
 * 
 * Uses AES-GCM encryption with user-derived keys for maximum security.
 * BIP-322 signatures are encrypted using a deterministic key derived from user's ETH address.
 */

import { keccak256, toHex, fromHex } from 'viem'

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256,
  ivLength: 12, // 96 bits for GCM
  tagLength: 16, // 128 bits authentication tag
  iterations: 100000, // PBKDF2 iterations
  saltLength: 32
}

/**
 * Generate a deterministic encryption key from user's ETH address
 * This ensures the same user can always decrypt their own data
 */
async function deriveUserKey(userAddress: string, salt: Uint8Array): Promise<CryptoKey> {
  // Use user's ETH address + a constant as password material
  const addressHash = keccak256(userAddress.toLowerCase() as `0x${string}`)
  const passwordMaterial = new TextEncoder().encode(addressHash + 'ReserveBTC-Security-v1')
  
  // Import password material as key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordMaterial,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derive actual AES key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  )
  
  return derivedKey
}

/**
 * Encrypt sensitive data (like BIP-322 signatures)
 */
export async function encryptSensitiveData(
  data: string, 
  userAddress: string
): Promise<string> {
  try {
    console.log('🔒 Encrypting sensitive data for user:', userAddress.substring(0, 10) + '...')
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength))
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength))
    
    // Derive encryption key
    const key = await deriveUserKey(userAddress, salt)
    
    // Encrypt the data
    const encodedData = new TextEncoder().encode(data)
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv
      },
      key,
      encodedData
    )
    
    // Combine salt + iv + encrypted data into single payload
    const payload = new Uint8Array(
      ENCRYPTION_CONFIG.saltLength + 
      ENCRYPTION_CONFIG.ivLength + 
      encryptedData.byteLength
    )
    
    payload.set(salt, 0)
    payload.set(iv, ENCRYPTION_CONFIG.saltLength)
    payload.set(new Uint8Array(encryptedData), ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength)
    
    // Return base64 encoded payload
    const encryptedString = btoa(String.fromCharCode.apply(null, Array.from(payload)))
    console.log('✅ Data encrypted successfully')
    
    return encryptedString
  } catch (error) {
    console.error('❌ Encryption failed:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

/**
 * Decrypt sensitive data 
 */
export async function decryptSensitiveData(
  encryptedData: string, 
  userAddress: string
): Promise<string> {
  try {
    console.log('🔓 Decrypting sensitive data for user:', userAddress.substring(0, 10) + '...')
    
    // Decode base64 payload
    const payload = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    )
    
    // Extract salt, IV, and encrypted data
    const salt = payload.slice(0, ENCRYPTION_CONFIG.saltLength)
    const iv = payload.slice(
      ENCRYPTION_CONFIG.saltLength, 
      ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
    )
    const encrypted = payload.slice(ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength)
    
    // Derive the same encryption key
    const key = await deriveUserKey(userAddress, salt)
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv
      },
      key,
      encrypted
    )
    
    // Convert back to string
    const decryptedString = new TextDecoder().decode(decryptedData)
    console.log('✅ Data decrypted successfully')
    
    return decryptedString
  } catch (error) {
    console.error('❌ Decryption failed:', error)
    throw new Error('Failed to decrypt sensitive data')
  }
}

/**
 * Check if a string appears to be encrypted data
 */
export function isEncryptedData(data: string): boolean {
  try {
    // Encrypted data should be base64 and have minimum expected length
    const minLength = Math.ceil((ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + 32) * 4 / 3)
    
    if (data.length < minLength) return false
    
    // Try to decode as base64
    atob(data)
    return true
  } catch {
    return false
  }
}

/**
 * Securely hash data for verification without revealing original
 */
export function createSecureHash(data: string): string {
  const hash = keccak256(new TextEncoder().encode(data) as any)
  return hash
}

/**
 * Migrate existing plaintext signature to encrypted format
 */
export async function migrateSignatureToEncrypted(
  plainTextSignature: string,
  userAddress: string
): Promise<string> {
  // If it's already encrypted, return as-is
  if (isEncryptedData(plainTextSignature)) {
    console.log('🔄 Signature already encrypted, skipping migration')
    return plainTextSignature
  }
  
  // If it's empty or invalid, return as-is
  if (!plainTextSignature || plainTextSignature.length < 10) {
    console.log('⚠️ Invalid signature data, skipping encryption')
    return plainTextSignature
  }
  
  console.log('🔄 Migrating plaintext signature to encrypted format')
  return await encryptSensitiveData(plainTextSignature, userAddress)
}

/**
 * Safe signature retrieval with automatic decryption
 */
export async function getDecryptedSignature(
  storedSignature: string,
  userAddress: string
): Promise<string> {
  try {
    // If it looks encrypted, decrypt it
    if (isEncryptedData(storedSignature)) {
      return await decryptSensitiveData(storedSignature, userAddress)
    }
    
    // If it's plaintext, return as-is (backward compatibility)
    return storedSignature
  } catch (error) {
    console.warn('⚠️ Failed to decrypt signature, returning as-is:', error)
    return storedSignature
  }
}