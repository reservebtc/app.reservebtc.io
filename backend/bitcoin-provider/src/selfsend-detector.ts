import { BitcoinIndexer, NormalizedUtxo } from './bitcoin-indexer';
import { BitcoinRpc } from './bitcoin-rpc';

export interface SelfSendRequest {
  address: string;
  minConfirmations: number;
  timeoutMs?: number;
}

export interface SelfSendResult {
  valid: boolean;
  txid?: string;
  confirmations?: number;
  error?: string;
  status: 'pending' | 'mempool' | 'confirmed' | 'invalid' | 'expired';
}

export interface TransactionDetails {
  txid: string;
  inputs: Array<{
    txid: string;
    vout: number;
    address?: string;
  }>;
  outputs: Array<{
    address: string;
    value: number;
  }>;
  confirmations: number;
}

/**
 * Self-send detector for BTC address ownership verification
 * Detects transactions where inputs belong to address and at least one output goes to the same address
 */
export class SelfSendDetector {
  private indexer: BitcoinIndexer;
  private rpc: BitcoinRpc;
  private trackingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(rpc?: BitcoinRpc) {
    this.rpc = rpc || new BitcoinRpc();
    this.indexer = new BitcoinIndexer(this.rpc);
  }

  /**
   * Start tracking for self-send transaction for given address
   */
  async startTracking(
    request: SelfSendRequest,
    onUpdate: (result: SelfSendResult) => void
  ): Promise<string> {
    const trackingId = this.generateTrackingId(request.address);
    
    // Set timeout for tracking
    const timeoutMs = request.timeoutMs || 30 * 60 * 1000; // 30 minutes default
    const timeout = setTimeout(() => {
      onUpdate({
        valid: false,
        status: 'expired',
        error: 'Tracking timeout exceeded'
      });
      this.stopTracking(trackingId);
    }, timeoutMs);

    this.trackingTimeouts.set(trackingId, timeout);

    // Start mempool watching
    this.watchForSelfSend(request, onUpdate, trackingId);

    return trackingId;
  }

  /**
   * Stop tracking for given tracking ID
   */
  stopTracking(trackingId: string): void {
    const timeout = this.trackingTimeouts.get(trackingId);
    if (timeout) {
      clearTimeout(timeout);
      this.trackingTimeouts.delete(trackingId);
    }
  }

  /**
   * Check if a specific transaction is a valid self-send for the address
   */
  async verifySelfSend(address: string, txid: string, minConfirmations: number = 0): Promise<SelfSendResult> {
    try {
      const txDetails = await this.getTransactionDetails(txid);
      
      if (!txDetails) {
        return {
          valid: false,
          status: 'invalid',
          error: 'Transaction not found'
        };
      }

      const isSelfSend = this.validateSelfSendTransaction(address, txDetails);
      
      if (!isSelfSend.valid) {
        return {
          valid: false,
          status: 'invalid',
          error: isSelfSend.error
        };
      }

      const confirmations = txDetails.confirmations;
      
      if (confirmations >= minConfirmations) {
        return {
          valid: true,
          txid,
          confirmations,
          status: 'confirmed'
        };
      }

      if (confirmations === 0) {
        return {
          valid: true,
          txid,
          confirmations: 0,
          status: 'mempool'
        };
      }

      return {
        valid: true,
        txid,
        confirmations,
        status: 'pending'
      };

    } catch (error) {
      return {
        valid: false,
        status: 'invalid',
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async watchForSelfSend(
    request: SelfSendRequest,
    onUpdate: (result: SelfSendResult) => void,
    trackingId: string
  ): Promise<void> {
    
    // Watch mempool for new transactions
    const stopWatching = this.indexer.watchMempool(async ({ added, removed }) => {
      if (!this.trackingTimeouts.has(trackingId)) {
        stopWatching();
        return;
      }

      // Check each added transaction
      for (const txid of added) {
        const result = await this.verifySelfSend(request.address, txid, request.minConfirmations);
        
        if (result.valid && result.status !== 'invalid') {
          onUpdate(result);
          
          // If confirmed, we can stop watching
          if (result.status === 'confirmed') {
            this.stopTracking(trackingId);
            stopWatching();
            return;
          }
        }
      }
    });

    // Also check for existing unconfirmed transactions
    try {
      const mempoolResult = await this.rpc.getRawMempool(false);
      const mempool = Array.isArray(mempoolResult) ? mempoolResult : [];
      
      for (const txid of mempool) {
        const result = await this.verifySelfSend(request.address, txid, request.minConfirmations);
        if (result.valid && result.status !== 'invalid') {
          onUpdate(result);
          if (result.status === 'confirmed') {
            this.stopTracking(trackingId);
            stopWatching();
            return;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check existing mempool:', error);
    }
  }

  private async getTransactionDetails(txid: string): Promise<TransactionDetails | null> {
    try {
      // Get raw transaction
      const rawTx = await this.rpc.getRawTransaction(txid, true);
      
      // Handle malformed data
      if (!rawTx || !rawTx.vin || !rawTx.vout) {
        throw new Error('Malformed transaction data');
      }

      const inputs = rawTx.vin.map((vin: any) => ({
        txid: vin.txid,
        vout: vin.vout,
        address: vin.prevout?.scriptPubKey?.address || undefined
      }));

      const outputs = rawTx.vout.map((vout: any) => ({
        address: vout.scriptPubKey?.address || '',
        value: vout.value
      }));

      return {
        txid,
        inputs,
        outputs,
        confirmations: rawTx.confirmations || 0
      };

    } catch (error) {
      console.warn(`Failed to get transaction details for ${txid}:`, error);
      throw error; // Re-throw so verifySelfSend can handle it properly
    }
  }

  private validateSelfSendTransaction(
    address: string, 
    tx: TransactionDetails
  ): { valid: boolean; error?: string } {
    
    // Check if at least one input belongs to the address
    const hasInputFromAddress = tx.inputs.some(input => input.address === address);
    if (!hasInputFromAddress) {
      return {
        valid: false,
        error: 'No inputs from the specified address'
      };
    }

    // Check if at least one output goes to the same address
    const hasOutputToAddress = tx.outputs.some(output => output.address === address);
    if (!hasOutputToAddress) {
      return {
        valid: false,
        error: 'No outputs to the specified address'
      };
    }

    // Validate that it's actually spending from the address (not just having address in scriptSig)
    // Additional validation could be added here for more strict verification

    // Check minimum amount (should be reasonable, e.g., 600-2000 sats)
    const totalOutputToAddress = tx.outputs
      .filter(output => output.address === address)
      .reduce((sum, output) => sum + output.value, 0);

    const minSats = 600 / 100000000; // 600 sats in BTC
    const maxSats = 0.01; // Reasonable max for self-send
    
    if (totalOutputToAddress < minSats) {
      return {
        valid: false,
        error: `Self-send amount too small (minimum 600 sats)`
      };
    }

    if (totalOutputToAddress > maxSats) {
      return {
        valid: false,
        error: `Self-send amount too large (maximum 0.01 BTC)`
      };
    }

    return { valid: true };
  }

  private generateTrackingId(address: string): string {
    return `selfsend_${address}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Utility functions for self-send validation
 */
export class SelfSendUtils {
  
  /**
   * Estimate how long a self-send transaction should take to confirm
   */
  static estimateConfirmationTime(targetConfirmations: number): number {
    // Average block time is ~10 minutes
    return targetConfirmations * 10 * 60 * 1000; // milliseconds
  }

  /**
   * Validate self-send parameters before starting tracking
   */
  static validateSelfSendRequest(request: SelfSendRequest): { valid: boolean; error?: string } {
    if (!request.address || request.address.trim().length === 0) {
      return { valid: false, error: 'Address is required' };
    }

    // Basic bech32 format validation
    if (!request.address.match(/^(bc1|tb1|bcrt1)[a-z0-9]{39,59}$/)) {
      return { valid: false, error: 'Invalid Bitcoin address format' };
    }

    if (request.minConfirmations < 0 || request.minConfirmations > 100) {
      return { valid: false, error: 'Invalid confirmation count (0-100)' };
    }

    if (request.timeoutMs && (request.timeoutMs < 60000 || request.timeoutMs > 3600000)) {
      return { valid: false, error: 'Timeout must be between 1 minute and 1 hour' };
    }

    return { valid: true };
  }
}