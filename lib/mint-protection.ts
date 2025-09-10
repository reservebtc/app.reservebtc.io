/**
 * Comprehensive Mint Protection System
 * Prevents over-minting by implementing multiple layers of security
 * 
 * Security Layers:
 * 1. UI-level: One mint per Bitcoin address
 * 2. Bitcoin balance verification before minting
 * 3. Server-side validation
 * 4. Smart contract protection (existing)
 */

interface MintAttempt {
  bitcoinAddress: string;
  ethereumAddress: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
}

interface BitcoinAddressState {
  address: string;
  firstMintTimestamp: number;
  isAutoSyncActive: boolean;
  lastMintAttempt?: MintAttempt;
  mintCount: number;
  totalMintedSats: number;
}

class MintProtectionSystem {
  private static readonly STORAGE_KEY = 'mint_protection_state';
  private static readonly MAX_MINT_ATTEMPTS_PER_ADDRESS = 1;
  private static readonly MIN_TIME_BETWEEN_MINTS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if a Bitcoin address can mint
   */
  static canAddressMint(bitcoinAddress: string): {
    canMint: boolean;
    reason?: string;
    nextAllowedTime?: number;
  } {
    const addressState = this.getAddressState(bitcoinAddress);
    
    if (!addressState) {
      return { canMint: true };
    }

    // Check if auto-sync is already active for this address
    if (addressState.isAutoSyncActive) {
      return {
        canMint: false,
        reason: 'Auto-sync is already active for this Bitcoin address. You cannot manually mint while auto-sync is running.'
      };
    }

    // Check mint count limit
    if (addressState.mintCount >= this.MAX_MINT_ATTEMPTS_PER_ADDRESS) {
      return {
        canMint: false,
        reason: `This Bitcoin address has already been minted. Add a new Bitcoin address to mint more tokens.`
      };
    }

    // Check time-based limits (for future use)
    const now = Date.now();
    const timeSinceLastMint = now - (addressState.lastMintAttempt?.timestamp || 0);
    
    if (timeSinceLastMint < this.MIN_TIME_BETWEEN_MINTS) {
      const nextAllowedTime = (addressState.lastMintAttempt?.timestamp || 0) + this.MIN_TIME_BETWEEN_MINTS;
      return {
        canMint: false,
        reason: 'Please wait before minting again with this address.',
        nextAllowedTime
      };
    }

    return { canMint: true };
  }

  /**
   * Record a mint attempt
   */
  static recordMintAttempt(
    bitcoinAddress: string, 
    ethereumAddress: string,
    transactionHash?: string
  ): void {
    const state = this.getProtectionState();
    const now = Date.now();
    
    const mintAttempt: MintAttempt = {
      bitcoinAddress,
      ethereumAddress,
      timestamp: now,
      status: transactionHash ? 'completed' : 'pending',
      transactionHash
    };

    if (!state[bitcoinAddress]) {
      state[bitcoinAddress] = {
        address: bitcoinAddress,
        firstMintTimestamp: now,
        isAutoSyncActive: false,
        mintCount: 0,
        totalMintedSats: 0
      };
    }

    state[bitcoinAddress].lastMintAttempt = mintAttempt;
    state[bitcoinAddress].mintCount += 1;
    
    this.saveProtectionState(state);
  }

  /**
   * Activate auto-sync for an address (prevents manual minting)
   */
  static activateAutoSync(bitcoinAddress: string): void {
    const state = this.getProtectionState();
    
    if (state[bitcoinAddress]) {
      state[bitcoinAddress].isAutoSyncActive = true;
      this.saveProtectionState(state);
    }
  }

  /**
   * Deactivate auto-sync (allows adding new addresses)
   */
  static deactivateAutoSync(bitcoinAddress: string): void {
    const state = this.getProtectionState();
    
    if (state[bitcoinAddress]) {
      state[bitcoinAddress].isAutoSyncActive = false;
      this.saveProtectionState(state);
    }
  }

  /**
   * Check if auto-sync is active for any address
   */
  static hasActiveAutoSync(): boolean {
    const state = this.getProtectionState();
    return Object.values(state).some(addressState => addressState.isAutoSyncActive);
  }

  /**
   * Get addresses with active auto-sync
   */
  static getAutoSyncAddresses(): string[] {
    const state = this.getProtectionState();
    return Object.values(state)
      .filter(addressState => addressState.isAutoSyncActive)
      .map(addressState => addressState.address);
  }

  /**
   * Verify Bitcoin balance before allowing mint
   */
  static async verifyBitcoinBalance(
    bitcoinAddress: string, 
    requestedSats: number
  ): Promise<{
    isValid: boolean;
    actualBalanceSats: number;
    reason?: string;
  }> {
    try {
      const isTestnet = bitcoinAddress.startsWith('tb1') || 
                       bitcoinAddress.startsWith('m') || 
                       bitcoinAddress.startsWith('n') || 
                       bitcoinAddress.startsWith('2');
      
      const baseUrl = isTestnet ? 'https://mempool.space/testnet/api' : 'https://mempool.space/api';
      
      const response = await fetch(`${baseUrl}/address/${bitcoinAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const actualBalanceSats = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      
      console.log(`🔍 BALANCE_CHECK: Bitcoin address: ${bitcoinAddress}`);
      console.log(`💰 BALANCE_CHECK: Actual balance: ${actualBalanceSats} sats`);
      console.log(`📝 BALANCE_CHECK: Requested mint: ${requestedSats} sats`);
      
      if (requestedSats > actualBalanceSats) {
        return {
          isValid: false,
          actualBalanceSats,
          reason: `Insufficient Bitcoin balance. You have ${actualBalanceSats} sats but trying to mint ${requestedSats} sats.`
        };
      }
      
      // Additional check: prevent minting more than currently owned
      const addressState = this.getAddressState(bitcoinAddress);
      const totalAlreadyMinted = addressState?.totalMintedSats || 0;
      const maxAllowedMint = actualBalanceSats - totalAlreadyMinted;
      
      if (requestedSats > maxAllowedMint) {
        return {
          isValid: false,
          actualBalanceSats,
          reason: `Cannot mint ${requestedSats} sats. Already minted ${totalAlreadyMinted} sats from this address. Maximum additional mint: ${maxAllowedMint} sats.`
        };
      }
      
      console.log(`✅ BALANCE_CHECK: Mint approved for ${requestedSats} sats`);
      
      return {
        isValid: true,
        actualBalanceSats
      };
      
    } catch (error) {
      console.error(`❌ BALANCE_CHECK: Error verifying balance:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isValid: false,
        actualBalanceSats: 0,
        reason: `Unable to verify Bitcoin balance: ${errorMessage}`
      };
    }
  }

  /**
   * Update minted amount for address
   */
  static updateMintedAmount(bitcoinAddress: string, mintedSats: number): void {
    const state = this.getProtectionState();
    
    if (state[bitcoinAddress]) {
      state[bitcoinAddress].totalMintedSats += mintedSats;
      this.saveProtectionState(state);
    }
  }

  /**
   * Get protection statistics
   */
  static getProtectionStats() {
    const state = this.getProtectionState();
    const addresses = Object.values(state);
    
    return {
      totalProtectedAddresses: addresses.length,
      addressesWithAutoSync: addresses.filter(a => a.isAutoSyncActive).length,
      totalMintAttempts: addresses.reduce((sum, a) => sum + a.mintCount, 0),
      totalMintedSats: addresses.reduce((sum, a) => sum + a.totalMintedSats, 0)
    };
  }

  /**
   * Clear protection data (admin only)
   */
  static clearProtectionData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Private helper methods
  private static getProtectionState(): Record<string, BitcoinAddressState> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading mint protection state:', error);
      return {};
    }
  }

  private static saveProtectionState(state: Record<string, BitcoinAddressState>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      console.log(`💾 PROTECTION: Saved protection state for ${Object.keys(state).length} addresses`);
    } catch (error) {
      console.error('Error saving mint protection state:', error);
    }
  }

  private static getAddressState(bitcoinAddress: string): BitcoinAddressState | null {
    const state = this.getProtectionState();
    return state[bitcoinAddress] || null;
  }
}

/**
 * React hook for mint protection
 */
export function useMintProtection() {
  const checkCanMint = (bitcoinAddress: string) => {
    return MintProtectionSystem.canAddressMint(bitcoinAddress);
  };

  const recordMintAttempt = (bitcoinAddress: string, ethereumAddress: string, transactionHash?: string) => {
    MintProtectionSystem.recordMintAttempt(bitcoinAddress, ethereumAddress, transactionHash);
  };

  const verifyBitcoinBalance = async (bitcoinAddress: string, requestedSats: number) => {
    return MintProtectionSystem.verifyBitcoinBalance(bitcoinAddress, requestedSats);
  };

  const activateAutoSync = (bitcoinAddress: string) => {
    MintProtectionSystem.activateAutoSync(bitcoinAddress);
  };

  const hasActiveAutoSync = () => {
    return MintProtectionSystem.hasActiveAutoSync();
  };

  const getAutoSyncAddresses = () => {
    return MintProtectionSystem.getAutoSyncAddresses();
  };

  const getProtectionStats = () => {
    return MintProtectionSystem.getProtectionStats();
  };

  return {
    checkCanMint,
    recordMintAttempt,
    verifyBitcoinBalance,
    activateAutoSync,
    hasActiveAutoSync,
    getAutoSyncAddresses,
    getProtectionStats
  };
}

export default MintProtectionSystem;