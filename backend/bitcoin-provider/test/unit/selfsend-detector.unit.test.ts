import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  SelfSendDetector, 
  SelfSendUtils,
  type SelfSendRequest, 
  type SelfSendResult,
  type TransactionDetails 
} from '../../src/selfsend-detector.js';
import { BitcoinRpc } from '../../src/bitcoin-rpc.js';

// Mock BitcoinRpc
vi.mock('../../src/bitcoin-rpc.js');

describe('Self-Send Detector Module', () => {
  let detector: SelfSendDetector;
  let mockRpc: vi.Mocked<BitcoinRpc>;

  beforeEach(() => {
    // Create properly mocked RPC
    mockRpc = {
      getRawTransaction: vi.fn(),
      getRawMempool: vi.fn().mockResolvedValue([]),
      getMempool: vi.fn(),
      getBlockHeight: vi.fn(),
      getBlockHash: vi.fn(),
      getBlock: vi.fn()
    } as vi.Mocked<BitcoinRpc>;
    
    detector = new SelfSendDetector(mockRpc);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('SelfSendUtils', () => {
    describe('estimateConfirmationTime', () => {
      it('calculates correct time for confirmations', () => {
        expect(SelfSendUtils.estimateConfirmationTime(1)).toBe(10 * 60 * 1000); // 10 minutes
        expect(SelfSendUtils.estimateConfirmationTime(6)).toBe(60 * 60 * 1000); // 1 hour
        expect(SelfSendUtils.estimateConfirmationTime(0)).toBe(0);
      });
    });

    describe('validateSelfSendRequest', () => {
      it('validates correct request', () => {
        const request: SelfSendRequest = {
          address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          minConfirmations: 3
        };

        const result = SelfSendUtils.validateSelfSendRequest(request);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('rejects empty address', () => {
        const request: SelfSendRequest = {
          address: '',
          minConfirmations: 3
        };

        const result = SelfSendUtils.validateSelfSendRequest(request);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Address is required');
      });

      it('rejects invalid address format', () => {
        const request: SelfSendRequest = {
          address: 'invalid_address',
          minConfirmations: 3
        };

        const result = SelfSendUtils.validateSelfSendRequest(request);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid Bitcoin address format');
      });

      it('accepts different Bitcoin address formats', () => {
        const addresses = [
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // mainnet bech32
          'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxw508d', // testnet bech32
          'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kf6xmjk', // regtest bech32
        ];

        for (const address of addresses) {
          const request: SelfSendRequest = { address, minConfirmations: 3 };
          const result = SelfSendUtils.validateSelfSendRequest(request);
          expect(result.valid).toBe(true);
        }
      });

      it('rejects invalid confirmation count', () => {
        const request: SelfSendRequest = {
          address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          minConfirmations: -1
        };

        const result = SelfSendUtils.validateSelfSendRequest(request);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid confirmation count');
      });

      it('rejects timeout out of range', () => {
        const request: SelfSendRequest = {
          address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          minConfirmations: 3,
          timeoutMs: 30000 // Too short
        };

        const result = SelfSendUtils.validateSelfSendRequest(request);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Timeout must be between');
      });
    });
  });

  describe('SelfSendDetector', () => {
    const validAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
    
    describe('verifySelfSend', () => {
      it('returns invalid for non-existent transaction', async () => {
        mockRpc.getRawTransaction.mockRejectedValue(new Error('Transaction not found'));

        const result = await detector.verifySelfSend(validAddress, 'nonexistent_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('Transaction not found');
      });

      it('validates self-send transaction correctly', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: {
              scriptPubKey: {
                address: validAddress
              }
            }
          }],
          vout: [{
            scriptPubKey: {
              address: validAddress
            },
            value: 0.001 // Valid amount
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'valid_txid', 3);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('confirmed');
        expect(result.txid).toBe('valid_txid');
        expect(result.confirmations).toBe(6);
      });

      it('identifies mempool transaction', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.001
          }],
          confirmations: 0 // In mempool
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'mempool_txid', 3);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('mempool');
        expect(result.confirmations).toBe(0);
      });

      it('identifies pending confirmation', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.001
          }],
          confirmations: 2 // Less than required 3
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'pending_txid', 3);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('pending');
        expect(result.confirmations).toBe(2);
      });

      it('rejects transaction with no input from address', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { 
              scriptPubKey: { 
                address: 'bc1qdifferent_address' // Wrong address
              } 
            }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.001
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'invalid_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('No inputs from the specified address');
      });

      it('rejects transaction with no output to address', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: 'bc1qdifferent_address' }, // Wrong address
            value: 0.001
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'invalid_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('No outputs to the specified address');
      });

      it('rejects transaction with amount too small', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.0000001 // Too small (< 600 sats)
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'invalid_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('Self-send amount too small');
      });

      it('rejects transaction with amount too large', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.1 // Too large (> 0.01 BTC)
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'invalid_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('Self-send amount too large');
      });

      it('handles multiple outputs with valid total', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [
            {
              scriptPubKey: { address: validAddress },
              value: 0.0008 // Part of the self-send
            },
            {
              scriptPubKey: { address: 'bc1qdifferent_address' },
              value: 0.0001 // Change or fee
            },
            {
              scriptPubKey: { address: validAddress },
              value: 0.0002 // More self-send
            }
          ],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'valid_txid', 3);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('confirmed');
        // Should sum outputs to same address: 0.0008 + 0.0002 = 0.001 BTC
      });
    });

    describe('startTracking', () => {
      it('returns tracking ID', async () => {
        const request: SelfSendRequest = {
          address: validAddress,
          minConfirmations: 3
        };

        const trackingId = await detector.startTracking(request, () => {});

        expect(trackingId).toMatch(/^selfsend_bc1q.*_\d+_[a-z0-9]+$/);
      });

      it('calls onUpdate when tracking expires', async () => {
        const request: SelfSendRequest = {
          address: validAddress,
          minConfirmations: 3,
          timeoutMs: 100 // Very short timeout
        };

        let updateResult: SelfSendResult | null = null;
        const onUpdate = vi.fn((result: SelfSendResult) => {
          updateResult = result;
        });

        await detector.startTracking(request, onUpdate);

        // Wait for timeout
        await new Promise(resolve => setTimeout(resolve, 150));

        expect(onUpdate).toHaveBeenCalled();
        expect(updateResult?.valid).toBe(false);
        expect(updateResult?.status).toBe('expired');
        expect(updateResult?.error).toContain('timeout');
      });

      it('can be stopped manually', async () => {
        const request: SelfSendRequest = {
          address: validAddress,
          minConfirmations: 3,
          timeoutMs: 5000
        };

        const onUpdate = vi.fn();
        const trackingId = await detector.startTracking(request, onUpdate);

        detector.stopTracking(trackingId);

        // Wait a bit to ensure no calls are made
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(onUpdate).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('handles RPC errors gracefully', async () => {
        mockRpc.getRawTransaction.mockRejectedValue(new Error('RPC connection failed'));

        const result = await detector.verifySelfSend(validAddress, 'test_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('Verification failed');
      });

      it('handles malformed transaction data', async () => {
        // Missing required fields
        mockRpc.getRawTransaction.mockResolvedValue({
          vin: undefined,
          vout: undefined,
          confirmations: 0
        });

        const result = await detector.verifySelfSend(validAddress, 'malformed_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
      });

      it('handles missing prevout data', async () => {
        const mockTransaction = {
          vin: [{
            txid: 'input_txid',
            vout: 0
            // Missing prevout data
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.001
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'no_prevout_txid', 3);

        expect(result.valid).toBe(false);
        expect(result.status).toBe('invalid');
        expect(result.error).toContain('No inputs from the specified address');
      });
    });

    describe('edge cases', () => {
      it('handles zero confirmation requirement', async () => {
        const mockTransaction = {
          vin: [{ 
            txid: 'input_txid', 
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.001
          }],
          confirmations: 0
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'mempool_txid', 0);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('confirmed'); // 0 confirmations required, so it's confirmed
      });

      it('handles exact minimum amount', async () => {
        const mockTransaction = {
          vin: [{ 
            txid: 'input_txid', 
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.000006 // Exactly 600 sats
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'min_amount_txid', 3);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('confirmed');
      });

      it('handles exact maximum amount', async () => {
        const mockTransaction = {
          vin: [{ 
            txid: 'input_txid', 
            vout: 0,
            prevout: { scriptPubKey: { address: validAddress } }
          }],
          vout: [{
            scriptPubKey: { address: validAddress },
            value: 0.01 // Exactly 0.01 BTC
          }],
          confirmations: 6
        };

        mockRpc.getRawTransaction.mockResolvedValue(mockTransaction);

        const result = await detector.verifySelfSend(validAddress, 'max_amount_txid', 3);

        expect(result.valid).toBe(true);
        expect(result.status).toBe('confirmed');
      });
    });
  });
});