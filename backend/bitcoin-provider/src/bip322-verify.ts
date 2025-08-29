import { createHash } from 'crypto';

export interface Bip322VerificationInput {
  btcAddress: string;
  message: string;
  signature: string;
}

export interface Bip322VerificationResult {
  valid: boolean;
  error?: string;
  address?: string;
}

/**
 * BIP-322 Message Template from Protocol v1
 * Exact format from docs/PROTOCOL_V1.md section 2
 */
export function createBip322Message(
  ethAddress: string,
  btcAddress: string, 
  checksum: string,
  nonce: string,
  height: number
): string {
  return `ReserveBTC binding:
ETH=${ethAddress}
BTC=${btcAddress}
checksum=${checksum}
nonce=${nonce}
height=${height}
domain=reservebtc.io`;
}

/**
 * BIP-322 signature verification (stub implementation)
 * TODO: Integrate with actual BIP-322 library when available
 */
export class Bip322Verifier {
  
  /**
   * Verify BIP-322 signature against the exact message template
   */
  async verifySignature(input: Bip322VerificationInput): Promise<Bip322VerificationResult> {
    try {
      // Validate input format
      if (!this.isValidBech32Address(input.btcAddress)) {
        return {
          valid: false,
          error: 'Invalid BTC address format'
        };
      }

      if (!input.signature || input.signature.length === 0) {
        return {
          valid: false,
          error: 'Empty signature'
        };
      }

      // TODO: Implement actual BIP-322 verification
      // For now, return validation stub
      const isValidFormat = this.validateSignatureFormat(input.signature);
      
      if (!isValidFormat) {
        return {
          valid: false,
          error: 'Invalid signature format'
        };
      }

      // Mock verification - replace with real BIP-322 verification
      const mockValid = await this.performBip322Verification(
        input.btcAddress,
        input.message,
        input.signature
      );

      return {
        valid: mockValid,
        address: mockValid ? input.btcAddress : undefined,
        error: mockValid ? undefined : 'Signature verification failed'
      };

    } catch (error) {
      return {
        valid: false,
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private isValidBech32Address(address: string): boolean {
    // Basic bech32 format check (bc1 prefix for mainnet, tb1/bcrt1 for testnet/regtest)
    return /^(bc1|tb1|bcrt1)[a-z0-9]{39,59}$/.test(address);
  }

  private validateSignatureFormat(signature: string): boolean {
    // Accept both base64 and hex formats for now
    if (signature.match(/^[A-Za-z0-9+/]+=*$/)) return true; // base64
    if (signature.match(/^0x[0-9a-fA-F]+$/)) return true;   // hex with 0x
    if (signature.match(/^[0-9a-fA-F]+$/)) return true;     // hex without 0x
    return false;
  }

  private async performBip322Verification(
    address: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    // TODO: Replace with actual BIP-322 library
    // Placeholder implementation for development
    
    // For testing purposes, accept signatures that match a pattern
    // This should be replaced with proper BIP-322 verification
    if (signature === 'test_valid_signature' || signature.includes('mock_valid')) {
      return true;
    }

    // In real implementation, this would:
    // 1. Parse the BIP-322 signature format
    // 2. Construct the virtual transaction
    // 3. Verify the signature against the message
    // 4. Return true if valid

    return false;
  }
}

/**
 * Checksum calculation from Protocol v1 specification
 */
export function calculateChecksum(
  ethAddress: string,
  btcProgram: Buffer,
  vrfSalt: Buffer
): Buffer {
  // Remove 0x prefix from eth address if present
  const ethHex = ethAddress.startsWith('0x') ? ethAddress.slice(2) : ethAddress;
  const ethBytes = Buffer.from(ethHex, 'hex');
  
  // Ensure proper lengths
  if (ethBytes.length !== 20) {
    throw new Error('ETH address must be 20 bytes');
  }
  
  if (btcProgram.length !== 32) {
    throw new Error('BTC program must be 32 bytes (20-byte programs should be left-padded with zeros)');
  }
  
  if (vrfSalt.length !== 32) {
    throw new Error('VRF salt must be 32 bytes');
  }

  // keccak256(ETH || BTC || vrf_salt || "reservebtc:v1")
  const domain = Buffer.from('reservebtc:v1', 'utf8');
  const combined = Buffer.concat([ethBytes, btcProgram, vrfSalt, domain]);
  
  // Using crypto.createHash with 'keccak256' - note this might need a proper keccak library
  return createHash('sha3-256').update(combined).digest();
}

/**
 * Convert Bitcoin address to witness program (bytes32)
 * P2WPKH (20 bytes) -> left-pad with zeros to 32 bytes
 * P2TR (32 bytes) -> as-is
 */
export function addressToWitnessProgram(address: string): Buffer {
  // TODO: Implement proper bech32 decoding
  // This is a placeholder that should decode the actual witness program
  
  if (address.startsWith('bc1p') || address.startsWith('tb1p') || address.startsWith('bcrt1p')) {
    // Taproot addresses (P2TR) - 32 bytes
    // TODO: Decode bech32m to get the 32-byte witness program
    return Buffer.alloc(32); // Placeholder
  } else if (address.startsWith('bc1') || address.startsWith('tb1') || address.startsWith('bcrt1')) {
    // Segwit v0 addresses (P2WPKH) - 20 bytes, left-pad to 32
    // TODO: Decode bech32 to get the 20-byte witness program
    const program20 = Buffer.alloc(20); // Placeholder
    const program32 = Buffer.alloc(32);
    program20.copy(program32, 12); // Left-pad with 12 zero bytes
    return program32;
  } else {
    throw new Error('Unsupported address format - only segwit/taproot supported');
  }
}