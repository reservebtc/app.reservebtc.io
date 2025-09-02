'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, CONTRACT_ABIS, FEE_CONFIG } from '@/app/lib/contracts';
import { getOracleAbi } from '@/app/lib/abi-utils';
import { Loader2, AlertCircle, CheckCircle, Wallet, Plus, Info } from 'lucide-react';

export function DepositFeeVault() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState('0.25');
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [feeVaultBalance, setFeeVaultBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [hasEverDeposited, setHasEverDeposited] = useState(false);

  // Calculate recommended deposit based on expected operations
  const calculateRecommendedDeposit = (operations: number = 10) => {
    // IMPORTANT: Must cover both mint AND burn operations!
    // Based on FEE_CONFIG: 0.1% + 1 gwei per satoshi
    // Assuming average BTC balance change of 0.1 BTC (10M satoshis)
    const avgSatoshis = 10_000_000; // 0.1 BTC
    const feePerOperation = avgSatoshis * FEE_CONFIG.WEI_PER_SAT; // 1 gwei per sat
    
    // Multiply by 2.5x to ensure burn capability (mint + burn + safety margin)
    const SAFETY_MULTIPLIER = 2.5;
    const totalWei = feePerOperation * operations * SAFETY_MULTIPLIER;
    return formatEther(BigInt(totalWei));
  };

  const recommendedAmount = calculateRecommendedDeposit(10);

  // Check if user has ever deposited (from localStorage)
  useEffect(() => {
    if (address) {
      const storageKey = `feeVault_deposited_${address}`;
      const hasDeposited = localStorage.getItem(storageKey) === 'true';
      setHasEverDeposited(hasDeposited);
    }
  }, [address]);

  // Fetch FeeVault balance
  useEffect(() => {
    const fetchFeeVaultBalance = async () => {
      if (!address || !publicClient) return;
      
      setIsLoadingBalance(true);
      try {
        const balance = await publicClient.readContract({
          address: CONTRACTS.FEE_VAULT as `0x${string}`,
          abi: getOracleAbi(CONTRACT_ABIS.FEE_VAULT),
          functionName: 'balances',
          args: [address],
        }) as unknown as bigint;
        const balanceInEth = formatEther(balance);
        setFeeVaultBalance(balanceInEth);
        
        // Check if user has ever deposited (balance > 0 or had balance before)
        if (parseFloat(balanceInEth) > 0) {
          setHasEverDeposited(true);
          // Save to localStorage that this user has deposited
          const storageKey = `feeVault_deposited_${address}`;
          localStorage.setItem(storageKey, 'true');
        }
      } catch (err) {
        console.error('Failed to fetch FeeVault balance:', err);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchFeeVaultBalance();
    // Refresh after successful deposit
    if (status === 'success') {
      const timer = setTimeout(fetchFeeVaultBalance, 2000);
      return () => clearTimeout(timer);
    }
  }, [address, publicClient, status]);

  const handleDeposit = async () => {
    if (!address || !walletClient || !publicClient) return;
    
    setIsDepositing(true);
    setStatus('pending');
    setError('');
    
    try {
      // Call registerAndPrepay function with proper arguments
      const hash = await walletClient.writeContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
        functionName: 'registerAndPrepay',
        args: [
          address,
          0, // method parameter (uint8)
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}` // checksum (bytes32)
        ],
        value: parseEther(amount),
      });
      
      setTxHash(hash);
      
      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });
      
      setStatus('success');
      setHasEverDeposited(true); // Mark that user has deposited
      // Save to localStorage
      const storageKey = `feeVault_deposited_${address}`;
      localStorage.setItem(storageKey, 'true');
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err.message || 'Failed to deposit');
      setStatus('error');
    } finally {
      setIsDepositing(false);
    }
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
      {/* Critical Warning Banner - Only show for users who have deposited before */}
      {hasEverDeposited && parseFloat(feeVaultBalance) < 0.01 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                ⚠️ Critical: Low Fee Vault Balance
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Your Fee Vault is nearly empty. Without sufficient funds, you will NOT be able to:
              </p>
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                <li>Mint new rBTC tokens</li>
                <li>Burn rBTC back to Bitcoin</li>
                <li>Sync Oracle updates</li>
              </ul>
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                Deposit at least 0.25 ETH to ensure uninterrupted operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Information Banner - Always Show */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Why Do I Need to Deposit Funds?
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p>
                The Fee Vault pays for Oracle operations that keep your Bitcoin and rBTC synchronized:
              </p>
              <ul className="space-y-1 list-disc list-inside ml-2">
                <li><strong>Minting:</strong> Oracle verifies your Bitcoin balance before creating rBTC</li>
                <li><strong>Burning:</strong> Oracle confirms burn before releasing your Bitcoin</li>
                <li><strong>Updates:</strong> Continuous sync between Bitcoin and MegaETH networks</li>
              </ul>
              <div className="mt-3 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                  💡 <strong>Important:</strong> If your Fee Vault runs empty, ALL operations will stop working. 
                  You won't be able to mint new rBTC or burn existing rBTC back to Bitcoin until you refill the vault.
                </p>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white/50 dark:bg-gray-900/50 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">Minimum:</span>
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">0.01 ETH</span>
                  <span className="text-gray-500 dark:text-gray-500">~5 operations</span>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/50 rounded p-2 ring-2 ring-blue-500/50">
                  <span className="text-gray-600 dark:text-gray-400">Recommended:</span>
                  <span className="block font-semibold text-blue-700 dark:text-blue-300">0.25 ETH</span>
                  <span className="text-gray-500 dark:text-gray-500">~100 operations</span>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/50 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">Maximum:</span>
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">0.5 ETH</span>
                  <span className="text-gray-500 dark:text-gray-500">~200 operations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Oracle Fee Vault</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Your personal fee balance for protocol operations
          </p>
        </div>
        <div className="text-center sm:text-right">
          <div className="text-xs text-muted-foreground mb-1">Your Vault Balance</div>
          <div className="font-mono font-semibold mb-2">
            {isLoadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className={parseFloat(feeVaultBalance) > 0.001 ? 'text-green-600' : 'text-yellow-600'}>
                {parseFloat(feeVaultBalance).toFixed(6)} ETH
              </span>
            )}
          </div>
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
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Wallet: {balance ? formatEther(balance.value).slice(0, 8) : '0'} ETH
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setAmount('0.01')}
                  className="text-primary hover:underline text-xs"
                >
                  Min (0.01)
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('0.25')}
                  className="text-primary hover:underline text-xs font-medium"
                >
                  Recommended (0.25)
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('0.5')}
                  className="text-primary hover:underline text-xs"
                >
                  Max (0.5)
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing || !amount || parseFloat(amount) <= 0 || (balance && parseFloat(amount) > parseFloat(formatEther(balance.value)))}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isDepositing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Deposit...</span>
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

      {status === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">Transaction Pending</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Waiting for confirmation...</p>
            </div>
          </div>
          {txHash && (
            <a
              href={`https://megaexplorer.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs text-yellow-600 hover:underline"
            >
              View on Explorer →
            </a>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100">Deposit Successful!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {amount} ETH has been added to your Fee Vault
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatus('idle');
              setTxHash('');
            }}
            className="mt-3 text-sm text-green-600 hover:underline font-medium"
          >
            Make another deposit →
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-100">Deposit Failed</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error || 'Transaction was rejected or failed'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatus('idle');
              setError('');
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}