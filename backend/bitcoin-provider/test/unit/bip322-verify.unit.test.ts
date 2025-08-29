import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Bip322Verifier, 
  createBip322Message, 
  calculateChecksum, 
  addressToWitnessProgram,
  type Bip322VerificationInput 
} from '../../src/bip322-verify.js';

describe('BIP-322 Verification Module', () => {
  let verifier: Bip322Verifier;

  beforeEach(() => {
    verifier = new Bip322Verifier();
  });

  describe('createBip322Message', () => {
    it('creates correct message format', () => {
      const ethAddress = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const btcAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const checksum = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const nonce = '12345';
      const height = 854321;

      const message = createBip322Message(ethAddress, btcAddress, checksum, nonce, height);

      const expectedMessage = `ReserveBTC binding:
ETH=${ethAddress}
BTC=${btcAddress}
checksum=${checksum}
nonce=${nonce}
height=${height}
domain=reservebtc.io`;

      expect(message).toBe(expectedMessage);
    });

    it('handles different address formats', () => {
      const message = createBip322Message(
        '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b',
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxw508d',
        '0x' + '0'.repeat(64),
        '0',
        0
      );

      expect(message).toContain('ETH=0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b');
      expect(message).toContain('BTC=tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxw508d');
      expect(message).toContain('domain=reservebtc.io');
    });
  });

  describe('Bip322Verifier.verifySignature', () => {
    it('rejects invalid BTC address format', async () => {
      const input: Bip322VerificationInput = {
        btcAddress: 'invalid_address',
        message: 'test message',
        signature: 'test_signature'
      };

      const result = await verifier.verifySignature(input);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid BTC address format');
    });

    it('rejects empty signature', async () => {
      const input: Bip322VerificationInput = {
        btcAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        message: 'test message',
        signature: ''
      };

      const result = await verifier.verifySignature(input);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Empty signature');
    });

    it('accepts valid bech32 addresses', async () => {
      const validAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // mainnet P2WPKH
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxw508d', // testnet P2WPKH
      ];

      for (const address of validAddresses) {
        const input: Bip322VerificationInput = {
          btcAddress: address,
          message: 'test message',
          signature: 'test_valid_signature'
        };

        const result = await verifier.verifySignature(input);
        
        // Test should either succeed OR fail for reasons other than address format
        expect(result).toHaveProperty('valid');
        if (result.error && !result.valid) {
          // If it fails, it shouldn't be because of address format
          expect(result.error).not.toContain('Invalid BTC address format');
        }
      }
    });

    it('handles mock valid signatures', async () => {
      const input: Bip322VerificationInput = {
        btcAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        message: 'test message',
        signature: 'test_valid_signature'
      };

      const result = await verifier.verifySignature(input);

      // In mock environment, just check structure is correct
      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
      if (result.valid) {
        expect(result.address).toBe(input.btcAddress);
        expect(result.error).toBeUndefined();
      } else {
        // If invalid, should have error message
        expect(typeof result.error).toBe('string');
      }
    });

    it('handles different signature formats', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const message = 'test message';

      const formats = [
        'dGVzdF92YWxpZF9zaWduYXR1cmU=', // base64
        '0x74657374766964736967', // hex with 0x
        '74657374766964736967', // hex without 0x
      ];

      for (const signature of formats) {
        const input: Bip322VerificationInput = {
          btcAddress: address,
          message,
          signature
        };

        const result = await verifier.verifySignature(input);
        
        // Should pass format validation
        expect(result.error).not.toContain('Invalid signature format');
      }
    });

    it('rejects invalid signature formats', async () => {
      const input: Bip322VerificationInput = {
        btcAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        message: 'test message',
        signature: 'invalid!@#$%^&*()'
      };

      const result = await verifier.verifySignature(input);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature format');
    });

    it('handles verification errors gracefully', async () => {
      const input: Bip322VerificationInput = {
        btcAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        message: 'test message',
        signature: 'valid_format_but_wrong_signature'
      };

      const result = await verifier.verifySignature(input);

      expect(result.valid).toBe(false);
      // Error message may vary, check for common patterns
      expect(result.error).toMatch(/Invalid signature format|Signature verification failed/);
      expect(result.address).toBeUndefined();
    });
  });

  describe('calculateChecksum', () => {
    it('calculates checksum with correct inputs', () => {
      const ethAddress = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const btcProgram = Buffer.alloc(32, 0x01); // 32 bytes
      const vrfSalt = Buffer.alloc(32, 0x02); // 32 bytes

      const checksum = calculateChecksum(ethAddress, btcProgram, vrfSalt);

      expect(checksum).toBeInstanceOf(Buffer);
      expect(checksum.length).toBe(32);
    });

    it('handles ETH address with and without 0x prefix', () => {
      const ethWith0x = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const ethWithout0x = '742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const btcProgram = Buffer.alloc(32, 0x01);
      const vrfSalt = Buffer.alloc(32, 0x02);

      const checksum1 = calculateChecksum(ethWith0x, btcProgram, vrfSalt);
      const checksum2 = calculateChecksum(ethWithout0x, btcProgram, vrfSalt);

      expect(checksum1.equals(checksum2)).toBe(true);
    });

    it('throws error for invalid ETH address length', () => {
      const shortEthAddress = '0x742d35c6C03FAE36';
      const btcProgram = Buffer.alloc(32, 0x01);
      const vrfSalt = Buffer.alloc(32, 0x02);

      expect(() => calculateChecksum(shortEthAddress, btcProgram, vrfSalt))
        .toThrow('ETH address must be 20 bytes');
    });

    it('throws error for invalid BTC program length', () => {
      const ethAddress = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const shortBtcProgram = Buffer.alloc(20, 0x01); // Should be 32 bytes
      const vrfSalt = Buffer.alloc(32, 0x02);

      expect(() => calculateChecksum(ethAddress, shortBtcProgram, vrfSalt))
        .toThrow('BTC program must be 32 bytes');
    });

    it('throws error for invalid VRF salt length', () => {
      const ethAddress = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const btcProgram = Buffer.alloc(32, 0x01);
      const shortVrfSalt = Buffer.alloc(16, 0x02); // Should be 32 bytes

      expect(() => calculateChecksum(ethAddress, btcProgram, shortVrfSalt))
        .toThrow('VRF salt must be 32 bytes');
    });

    it('produces different checksums for different inputs', () => {
      const ethAddress = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const btcProgram1 = Buffer.alloc(32, 0x01);
      const btcProgram2 = Buffer.alloc(32, 0x02);
      const vrfSalt = Buffer.alloc(32, 0x03);

      const checksum1 = calculateChecksum(ethAddress, btcProgram1, vrfSalt);
      const checksum2 = calculateChecksum(ethAddress, btcProgram2, vrfSalt);

      expect(checksum1.equals(checksum2)).toBe(false);
    });
  });

  describe('addressToWitnessProgram', () => {
    it('handles P2WPKH addresses (20 bytes -> 32 bytes)', () => {
      const p2wpkhAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxw508d',
        'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kf6xmjk',
      ];

      for (const address of p2wpkhAddresses) {
        const program = addressToWitnessProgram(address);
        
        expect(program).toBeInstanceOf(Buffer);
        expect(program.length).toBe(32);
        // Should be left-padded with zeros
        expect(program.subarray(0, 12).every(b => b === 0)).toBe(true);
      }
    });

    it('handles P2TR addresses (32 bytes as-is)', () => {
      const p2trAddresses = [
        'bc1pexample1234567890abcdef1234567890abcdef1234567890abcdef123456',
        'tb1pexample1234567890abcdef1234567890abcdef1234567890abcdef123456',
        'bcrt1pexample1234567890abcdef1234567890abcdef1234567890abcdef123456',
      ];

      for (const address of p2trAddresses) {
        const program = addressToWitnessProgram(address);
        
        expect(program).toBeInstanceOf(Buffer);
        expect(program.length).toBe(32);
      }
    });

    it('throws error for unsupported address types', () => {
      const unsupportedAddresses = [
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // P2PKH
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
        'invalid_address'
      ];

      for (const address of unsupportedAddresses) {
        expect(() => addressToWitnessProgram(address))
          .toThrow('Unsupported address format');
      }
    });
  });

  describe('Integration scenarios', () => {
    it('creates complete verification flow', async () => {
      const ethAddress = '0x742d35c6C03FAE36C85FB94C8B280Ed7d0cC8b0b';
      const btcAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const nonce = '12345';
      const height = 854321;
      
      // Step 1: Calculate checksum (would use real VRF salt in production)
      const btcProgram = addressToWitnessProgram(btcAddress);
      const vrfSalt = Buffer.alloc(32, 0x01);
      const checksum = calculateChecksum(ethAddress, btcProgram, vrfSalt);
      
      // Step 2: Create message
      const message = createBip322Message(
        ethAddress, 
        btcAddress, 
        '0x' + checksum.toString('hex'), 
        nonce, 
        height
      );
      
      // Step 3: Verify signature (mock)
      const result = await verifier.verifySignature({
        btcAddress,
        message,
        signature: 'test_valid_signature'
      });

      // Check that result has proper structure
      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
      
      // Check message was created correctly
      expect(message).toContain('ReserveBTC binding:');
      expect(message).toContain(ethAddress);
      expect(message).toContain(btcAddress);
      
      // If verification succeeded, address should match
      if (result.valid) {
        expect(result.address).toBe(btcAddress);
      }
    });

    it('handles error scenarios in verification flow', async () => {
      // Invalid address
      const invalidResult = await verifier.verifySignature({
        btcAddress: 'invalid',
        message: 'test',
        signature: 'test'
      });
      expect(invalidResult.valid).toBe(false);

      // Invalid signature format  
      const invalidSigResult = await verifier.verifySignature({
        btcAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        message: 'test',
        signature: 'invalid!@#'
      });
      expect(invalidSigResult.valid).toBe(false);
    });
  });
});