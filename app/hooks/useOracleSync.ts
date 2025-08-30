'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, CONTRACT_ABIS } from '@/app/lib/contracts';
import { parseEther } from 'viem';

export interface OracleSyncParams {
  userAddress: `0x${string}`;
  newBalanceSats: bigint;
  blockHeight: number;
  timestamp?: number;
}

export interface OracleSyncResult {
  hash?: `0x${string}`;
  isLoading: boolean;
  isSuccess: boolean;
  error?: Error;
}

export function useOracleSync() {
  const [syncResult, setSyncResult] = useState<OracleSyncResult>({
    isLoading: false,
    isSuccess: false,
  });

  const { writeContract } = useWriteContract();

  const syncUserBalance = useCallback(async ({ 
    userAddress, 
    newBalanceSats, 
    blockHeight, 
    timestamp 
  }: OracleSyncParams) => {
    try {
      setSyncResult({ isLoading: true, isSuccess: false });

      // Use current timestamp if not provided
      const syncTimestamp = timestamp || Math.floor(Date.now() / 1000);

      // Call oracle sync function
      const hash = await writeContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
        functionName: 'sync',
        args: [
          userAddress,
          newBalanceSats, // uint64 newBalanceSats
          blockHeight, // uint32 height  
          BigInt(syncTimestamp), // uint64 timestamp
        ],
      });

      setSyncResult({ 
        isLoading: false, 
        isSuccess: true, 
        hash 
      });

      return hash;
    } catch (error) {
      console.error('Oracle sync failed:', error);
      setSyncResult({ 
        isLoading: false, 
        isSuccess: false, 
        error: error as Error 
      });
      throw error;
    }
  }, [writeContract]);

  return {
    syncUserBalance,
    ...syncResult,
  };
}

// Hook for reading user's last synced BTC balance
export function useUserBTCBalance(userAddress?: `0x${string}`) {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!userAddress) return;
    
    try {
      setIsLoading(true);
      
      // This would typically use useReadContract, but for demo purposes
      // we'll show the structure. In a real app, you'd use wagmi's useReadContract
      console.log('Fetching BTC balance for user:', userAddress);
      
      // Placeholder - replace with actual contract call
      const lastSats = BigInt(0); // await readContract call
      
      setBalance(lastSats);
    } catch (error) {
      console.error('Failed to fetch user BTC balance:', error);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  return {
    balance,
    isLoading,
    refetch: fetchBalance,
  };
}

// Oracle status and configuration hook
export function useOracleStatus() {
  const [status, setStatus] = useState({
    committee: CONTRACTS.ORACLE_COMMITTEE,
    minConfirmations: 1,
    maxFeePerSync: parseEther('0.01'),
    isOnline: true, // This would be determined by actual oracle monitoring
  });

  return {
    ...status,
    refresh: () => {
      // Refresh oracle status from contracts
      console.log('Refreshing oracle status...');
    },
  };
}