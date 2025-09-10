'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, CONTRACT_ABIS, FEE_CONFIG } from '@/app/lib/contracts';
import { getOracleAbi } from '@/app/lib/abi-utils';
import { Loader2, AlertCircle, CheckCircle, Wallet, Plus, Info, ArrowRight } from 'lucide-react';
import { getUserFeeVaultHistory, saveFeeVaultDeposit } from '@/lib/transaction-storage';

interface VerificationFeeVaultProps {
  onDepositComplete?: () => void;
  showAsStep?: boolean;
}

export function VerificationFeeVault({ onDepositComplete, showAsStep = true }: VerificationFeeVaultProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState('0.01');
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [feeVaultBalance, setFeeVaultBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [hasEverDeposited, setHasEverDeposited] = useState(false);

  // Calculate recommended deposit for verification (smaller amount)
  const calculateRecommendedDeposit = () => {
    // For verification, user only needs enough for potential sync() calls
    // Much smaller amount than full mint/burn operations
    return '0.01'; // 0.01 ETH should be enough for sync operations
  };

  const recommendedAmount = calculateRecommendedDeposit();

  // Load FeeVault balance
  const loadFeeVaultBalance = async () => {
    if (!address || !publicClient) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await publicClient.readContract({
        address: CONTRACTS.FEE_VAULT as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.FEE_VAULT),
        functionName: 'balanceOf',
        args: [address],
      }) as unknown as bigint;
      
      const balanceEth = formatEther(balance as bigint);
      setFeeVaultBalance(balanceEth);
      console.log('💰 VERIFICATION: FeeVault balance loaded:', balanceEth, 'ETH');
    } catch (error) {
      console.error('❌ VERIFICATION: Failed to load FeeVault balance:', error);
      setFeeVaultBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Check deposit history
  useEffect(() => {
    const checkDepositHistory = async () => {
      if (!address) return;
      
      try {
        const history = await getUserFeeVaultHistory(address);
        setHasEverDeposited(history.hasDeposited);
        console.log('💰 VERIFICATION: Deposit history:', history.hasDeposited ? 'EXISTS' : 'NONE');
      } catch (error) {
        console.log('⚠️ VERIFICATION: Could not check deposit history');
      }
    };

    checkDepositHistory();
    loadFeeVaultBalance();
  }, [address]);

  // Refresh balance when needed
  useEffect(() => {
    if (status === 'success') {
      // Refresh balance after successful deposit
      setTimeout(loadFeeVaultBalance, 2000);
    }
  }, [status]);

  const handleDeposit = async () => {
    if (!address || !walletClient || !publicClient) {
      setError('Please connect your wallet');
      return;
    }

    const depositAmount = parseEther(amount);
    
    if (balance && depositAmount > balance.value) {
      setError(`Insufficient ETH balance. You have ${formatEther(balance.value)} ETH`);
      return;
    }

    if (depositAmount < parseEther('0.001')) {
      setError('Minimum deposit is 0.001 ETH');
      return;
    }

    setIsDepositing(true);
    setError('');
    setStatus('pending');
    
    try {
      console.log('💰 VERIFICATION: Starting FeeVault deposit...');
      console.log('💰 VERIFICATION: Amount:', amount, 'ETH');
      console.log('💰 VERIFICATION: FeeVault contract:', CONTRACTS.FEE_VAULT);

      // Call depositETH function directly on FeeVault contract
      const hash = await walletClient.writeContract({
        address: CONTRACTS.FEE_VAULT as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.FEE_VAULT),
        functionName: 'depositETH',
        args: [],
        value: depositAmount,
      });

      console.log('📝 VERIFICATION: FeeVault deposit transaction:', hash);
      setTxHash(hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2 
      });

      if (receipt.status === 'success') {
        console.log('✅ VERIFICATION: FeeVault deposit successful!');
        setStatus('success');
        
        // Save deposit record
        try {
          await saveFeeVaultDeposit(address, amount, hash);
          console.log('📊 VERIFICATION: Deposit saved to database');
        } catch (saveError) {
          console.log('⚠️ VERIFICATION: Could not save deposit record:', saveError);
        }

        // Notify parent component
        if (onDepositComplete) {
          onDepositComplete();
        }

        // Refresh balance
        await loadFeeVaultBalance();
        
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('❌ VERIFICATION: FeeVault deposit failed:', error);
      setError(error.message || 'Deposit failed');
      setStatus('error');
    } finally {
      setIsDepositing(false);
    }
  };

  const currentBalance = parseFloat(feeVaultBalance);
  const hasMinimumBalance = currentBalance >= 0.005; // 0.005 ETH minimum for sync operations

  if (!isConnected) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Wallet className="h-4 w-4" />
          <span className="text-sm">Connect wallet to manage FeeVault</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {showAsStep && (
        <div className="flex items-center justify-between">
          <label className="font-medium">Optional: Top up FeeVault for future operations</label>
          <span className="text-xs text-muted-foreground">Required for sync operations</span>
        </div>
      )}

      {/* Current Balance Display */}
      <div className="bg-muted/50 rounded p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current FeeVault Balance:</span>
          <div className="flex items-center gap-2">
            {isLoadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="font-mono font-medium">{parseFloat(feeVaultBalance).toFixed(4)} ETH</span>
                {hasMinimumBalance ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </>
            )}
          </div>
        </div>
        
        {hasMinimumBalance ? (
          <p className="text-xs text-green-600 mt-1">
            ✅ Sufficient balance for verification sync operations
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Low balance - consider depositing for future operations
          </p>
        )}
      </div>

      {/* Deposit Form */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Deposit Amount (ETH)</label>
          <div className="mt-1">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isDepositing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Recommended: {recommendedAmount} ETH for verification operations
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <div className="text-sm">
              <p>✅ Deposit successful!</p>
              {txHash && (
                <a
                  href={`https://explorer.megaeth.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  View transaction →
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={isDepositing || !amount || parseFloat(amount) < 0.001}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDepositing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Depositing...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Deposit to FeeVault</span>
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">What is FeeVault?</p>
            <p>FeeVault covers gas fees for Oracle operations like sync(). While not required for verification, having a balance enables automatic Oracle profile updates when your Bitcoin balance changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}