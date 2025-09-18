'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, CONTRACT_ABIS, FEE_CONFIG } from '@/app/lib/contracts';
import { getOracleAbi } from '@/app/lib/abi-utils';
import { Loader2, AlertCircle, CheckCircle, Wallet, Plus, Info, Activity } from 'lucide-react';
import { getUserFeeVaultHistory, saveFeeVaultDeposit } from '@/lib/transaction-storage';
import { useRealtimeUserData } from '@/hooks/use-professional-realtime';

// UI Badge component
interface BadgeProps {
  variant?: 'default' | 'outline'
  className?: string
  children: React.ReactNode
}

const Badge = ({ variant = 'default', className = '', children }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded'
  const variantClasses = variant === 'outline' 
    ? 'border border-muted text-muted-foreground bg-background'
    : 'bg-primary text-primary-foreground'
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  )
}

export function DepositFeeVault() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Real-time integration
  const userData = useRealtimeUserData();
  
  const [amount, setAmount] = useState('0.25');
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [feeVaultBalance, setFeeVaultBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [hasEverDeposited, setHasEverDeposited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Calculate recommended deposit based on expected operations
  const calculateRecommendedDeposit = (operations: number = 10) => {
    const avgSatoshis = 10_000_000; // 0.1 BTC
    const feePerOperation = avgSatoshis * FEE_CONFIG.WEI_PER_SAT;
    const SAFETY_MULTIPLIER = 2.5;
    const totalWei = feePerOperation * operations * SAFETY_MULTIPLIER;
    return formatEther(BigInt(totalWei));
  };

  const recommendedAmount = calculateRecommendedDeposit(10);

  // Real-time balance sync
  useEffect(() => {
    if (userData.user && !userData.loading) {
      // Safe type checking for feeVaultBalance
      const userFeeBalance = (userData.user as any).feeVaultBalance;
      if (userFeeBalance !== undefined) {
        const realtimeFeeBalance = formatEther(BigInt(userFeeBalance));
        console.log('📡 FEE_VAULT: Real-time balance update:', realtimeFeeBalance, 'ETH');
        
        // Update local state with real-time data
        setFeeVaultBalance(realtimeFeeBalance);
        
        if (parseFloat(realtimeFeeBalance) > 0) {
          setHasEverDeposited(true);
        }
      }
    }
  }, [userData]);

  // Check if user has ever deposited
  useEffect(() => {
    const checkDepositHistory = async () => {
      if (!address) return;
      
      try {
        const history = await getUserFeeVaultHistory(address);
        console.log('💰 Fee vault deposit history:', history);
        setHasEverDeposited(history.hasDeposited);
      } catch (error) {
        console.warn('⚠️ Failed to check deposit history:', error);
        const storageKey = `feeVault_deposited_${address}`;
        const hasDeposited = localStorage.getItem(storageKey) === 'true';
        setHasEverDeposited(hasDeposited);
      }
    };
    
    checkDepositHistory();
  }, [address]);

  // Fetch FeeVault balance with retry logic (fallback if real-time not available)
  const fetchFeeVaultBalance = async (retries = 3) => {
    if (!address || !publicClient) return;
    
    // Skip contract call if we have real-time data
    const userFeeBalance = userData.user ? (userData.user as any).feeVaultBalance : undefined;
    if (userData.user && !userData.loading && userFeeBalance !== undefined) {
      console.log('📡 FEE_VAULT: Using real-time balance, skipping contract call');
      return;
    }
    
    setIsLoadingBalance(true);
    
    for (let i = 0; i < retries; i++) {
      try {
        const balance = await publicClient.readContract({
          address: CONTRACTS.FEE_VAULT as `0x${string}`,
          abi: getOracleAbi(CONTRACT_ABIS.FEE_VAULT),
          functionName: 'balanceOf',
          args: [address],
        }) as unknown as bigint;
        
        const balanceInEth = formatEther(balance);
        setFeeVaultBalance(balanceInEth);
        
        if (parseFloat(balanceInEth) > 0) {
          setHasEverDeposited(true);
        }
        
        setIsLoadingBalance(false);
        return; // Success, exit
        
      } catch (err: any) {
        console.error(`Failed to fetch balance (attempt ${i + 1}/${retries}):`, err);
        
        // If rate limited, wait before retry
        if (err.message?.includes('429') || err.message?.includes('rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
        }
        
        if (i === retries - 1) {
          // Last attempt failed
          console.error('Failed to fetch FeeVault balance after retries');
          setIsLoadingBalance(false);
        }
      }
    }
  };

  useEffect(() => {
    fetchFeeVaultBalance();
    
    // Refresh after successful deposit
    if (status === 'success') {
      const timer = setTimeout(() => fetchFeeVaultBalance(), 3000);
      return () => clearTimeout(timer);
    }
  }, [address, publicClient, status]);

  const handleDeposit = async () => {
    if (!address || !walletClient || !publicClient) return;
    
    setIsDepositing(true);
    setStatus('pending');
    setError('');
    setRetryCount(0);
    
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add delay between retries
        if (attempt > 0) {
          console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after delay...`);
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        }
        
        // Try to deposit
        const hash = await walletClient.writeContract({
          address: CONTRACTS.FEE_VAULT as `0x${string}`,
          abi: getOracleAbi(CONTRACT_ABIS.FEE_VAULT),
          functionName: 'depositETH',
          args: [address],
          value: parseEther(amount),
          // Add gas limit to prevent compute unit issues
          gas: BigInt(100000),
        });
        
        setTxHash(hash);
        
        // Wait for confirmation with timeout
        const receipt = await Promise.race([
          publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 30000)
          )
        ]);
        
        setStatus('success');
        setHasEverDeposited(true);
        
        // Save to Oracle database
        try {
          await saveFeeVaultDeposit(address, amount, hash);
          console.log('✅ Fee deposit saved to Oracle database');
        } catch (error) {
          console.warn('⚠️ Failed to save to Oracle:', error);
          const storageKey = `feeVault_deposited_${address}`;
          localStorage.setItem(storageKey, 'true');
        }
        
        break; // Success, exit loop
        
      } catch (err: any) {
        console.error(`Deposit attempt ${attempt + 1} failed:`, err);
        setRetryCount(attempt + 1);
        
        // Check if it's a rate limit error
        if (err.message?.includes('429') || 
            err.message?.includes('rate limit') || 
            err.message?.includes('exceeds defined limit')) {
          
          if (attempt < maxRetries - 1) {
            setError(`Network busy. Retrying... (${attempt + 1}/${maxRetries})`);
            continue; // Try again
          } else {
            setError('Network is congested. Please try again in a few minutes.');
          }
        } else if (err.message?.includes('User denied')) {
          setError('Transaction cancelled by user');
          break; // Don't retry on user cancellation
        } else {
          setError(err.shortMessage || err.message || 'Transaction failed');
        }
        
        if (attempt === maxRetries - 1) {
          setStatus('error');
        }
      }
    }
    
    setIsDepositing(false);
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Wallet className="h-5 w-5" />
          <p>Please connect your wallet to deposit funds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 space-y-4 transition-all hover:border-primary/30">
      {/* Rate Limit Warning */}
      {error?.includes('Network') && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                MegaETH Network Congestion
              </p>
              <p className="text-orange-700 dark:text-orange-300 text-xs mt-1">
                The testnet is experiencing high traffic. Transactions may take longer than usual.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Warning Banner */}
      {hasEverDeposited && parseFloat(feeVaultBalance) < 0.01 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                ⚠️ Critical: Low Fee Vault Balance
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Your Fee Vault is nearly empty. Deposit at least 0.01 ETH to continue operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Why Do I Need to Deposit Funds?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The Fee Vault pays for Oracle operations that sync your Bitcoin with rBTC tokens.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span>Oracle Fee Vault</span>
            </h3>
            {!userData.loading && userData.user && (userData.user as any).feeVaultBalance !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                Live
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Your personal fee balance for protocol operations
          </p>
        </div>
        <div className="text-center sm:text-right">
          <div className="text-xs text-muted-foreground mb-1">Your Vault Balance</div>
          <div className="font-mono font-semibold mb-2">
            {(isLoadingBalance && userData.loading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className={parseFloat(feeVaultBalance) > 0.001 ? 'text-green-600' : 'text-yellow-600'}>
                {parseFloat(feeVaultBalance).toFixed(6)} ETH
              </span>
            )}
          </div>
          {!userData.loading && userData.user && (userData.user as any).feeVaultBalance !== undefined && (
            <div className="text-xs text-green-600">
              Real-time sync active
            </div>
          )}
        </div>
      </div>

      {status === 'idle' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deposit Amount</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 pr-16 border rounded-lg bg-background/50 backdrop-blur focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="0.01"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                ETH
              </div>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing || !amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all"
          >
            {isDepositing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Deposit{retryCount > 0 && ` (Retry ${retryCount})...`}</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Deposit {amount} ETH to Vault</span>
              </>
            )}
          </button>
        </>
      )}

      {status === 'success' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100">Deposit Successful!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {amount} ETH has been added to your Fee Vault
                {!userData.loading && (
                  <span className="block text-xs mt-1">Real-time balance will update automatically</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-100">Deposit Failed</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatus('idle');
              setError('');
              setRetryCount(0);
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}