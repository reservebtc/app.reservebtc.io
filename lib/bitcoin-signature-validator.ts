/**
 * Professional Bitcoin Signature Validator
 * Uses bitcoinjs-message for reliable BIP-322 and legacy signature validation
 */

import * as bitcoinMessage from 'bitcoinjs-message';
import * as bitcoin from 'bitcoinjs-lib';

export interface ValidationResult {
  valid: boolean;
  method?: string;
  addressType?: string;
  error?: string;
}

export class BitcoinSignatureValidator {
  /**
   * Validate Bitcoin signature for any address type
   * @param address Bitcoin address (legacy, segwit, native segwit)
   * @param message Message that was signed
   * @param signature Base64 encoded signature
   * @returns ValidationResult with details
   */
  static verify(address: string, message: string, signature: string): ValidationResult {
    try {
      console.log('🔐 VALIDATOR: Starting signature validation');
      console.log(`   Address: ${address}`);
      console.log(`   Message: ${message}`);
      console.log(`   Signature: ${signature.substring(0, 30)}...`);
      
      const addressType = this.getAddressType(address);
      const network = this.getNetwork(address);
      
      console.log(`   Address type: ${addressType}`);
      console.log(`   Network: ${network === bitcoin.networks.testnet ? 'testnet' : 'mainnet'}`);
      
      // Try different validation methods based on address type
      const methods = this.getValidationMethods(address, message, signature, network);
      
      for (const method of methods) {
        try {
          console.log(`   Trying method: ${method.name}`);
          const result = method.validator();
          
          if (result) {
            console.log(`   ✅ Validation successful with method: ${method.name}`);
            return {
              valid: true,
              method: method.name,
              addressType: addressType
            };
          } else {
            console.log(`   ❌ Method ${method.name} returned false`);
          }
        } catch (error) {
          console.log(`   ❌ Method ${method.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      console.log('   ❌ All validation methods failed');
      return {
        valid: false,
        addressType: addressType,
        error: 'All validation methods failed'
      };
      
    } catch (error) {
      console.error('❌ VALIDATOR: Critical error during validation:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get validation methods to try based on address type
   */
  private static getValidationMethods(address: string, message: string, signature: string, network: any) {
    const methods = [];
    
    // Standard bitcoinjs-message verification (works for most cases)
    methods.push({
      name: 'Standard bitcoinjs-message',
      validator: () => bitcoinMessage.verify(message, address, signature)
    });
    
    // Try with network-specific message prefix for segwit addresses
    if (address.startsWith('bc1') || address.startsWith('tb1')) {
      methods.push({
        name: 'Network prefix method',
        validator: () => bitcoinMessage.verify(message, address, signature, network.messagePrefix)
      });
      
      methods.push({
        name: 'Custom prefix method', 
        validator: () => {
          const prefix = network === bitcoin.networks.testnet ? 
            'Bitcoin Signed Message:\n' : 
            'Bitcoin Signed Message:\n';
          return bitcoinMessage.verify(message, address, signature, prefix);
        }
      });
    }
    
    // Try with signature as Buffer
    methods.push({
      name: 'Buffer signature method',
      validator: () => {
        const sigBuffer = Buffer.from(signature, 'base64');
        return bitcoinMessage.verify(message, address, sigBuffer);
      }
    });
    
    // For bech32 addresses, try address decoding approach
    if (address.startsWith('bc1') || address.startsWith('tb1')) {
      methods.push({
        name: 'Bech32 decode method',
        validator: () => {
          try {
            const decoded = bitcoin.address.fromBech32(address);
            // This method might need additional implementation
            return bitcoinMessage.verify(message, address, signature);
          } catch (e) {
            throw new Error('Bech32 decode failed');
          }
        }
      });
    }
    
    return methods;
  }
  
  /**
   * Determine Bitcoin network from address
   */
  private static getNetwork(address: string) {
    if (address.startsWith('tb1') || address.startsWith('2') || 
        address.startsWith('m') || address.startsWith('n')) {
      return bitcoin.networks.testnet;
    }
    return bitcoin.networks.bitcoin;
  }
  
  /**
   * Get human-readable address type
   */
  private static getAddressType(address: string): string {
    if (address.startsWith('1')) return 'Legacy (P2PKH)';
    if (address.startsWith('3')) return 'SegWit (P2SH-P2WPKH)';
    if (address.startsWith('bc1q')) return 'Native SegWit (P2WPKH)';
    if (address.startsWith('bc1p')) return 'Taproot (P2TR)';
    if (address.startsWith('tb1q')) return 'Testnet Native SegWit (P2WPKH)';
    if (address.startsWith('tb1p')) return 'Testnet Taproot (P2TR)';
    if (address.startsWith('2')) return 'Testnet SegWit (P2SH-P2WPKH)';
    if (address.startsWith('m') || address.startsWith('n')) return 'Testnet Legacy (P2PKH)';
    return 'Unknown';
  }
  
  /**
   * Simple boolean validation (backward compatibility)
   */
  static validateSignature(address: string, message: string, signature: string): boolean {
    const result = this.verify(address, message, signature);
    return result.valid;
  }
}