// hooks/use-professional-realtime.ts
// Professional React hooks for real-time ReserveBTC data

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { realtimeAPI } from '@/lib/professional-realtime';
import { toast } from 'sonner';

interface UserProfile {
  address: string;
  rbtcBalance: number;
  wrbtcBalance: number;
  lastSats: number;
  lastUpdate: number;
  blockNumber: number;
}

interface TransactionRecord {
  id: string;
  userAddress: string;
  type: string;
  amount: number;
  delta: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  status: string;
}

interface UserDataResponse {
  user: UserProfile | null;
  transactions: TransactionRecord[];
}

interface UserData {
  user: UserProfile | null;
  transactions: TransactionRecord[];
  loading: boolean;
  error: string | null;
}

interface BalanceData {
  rbtc: number;
  wrbtc: number;
  lastSats: number;
  loading: boolean;
  lastUpdate: Date | null;
}

interface TransactionData {
  data: TransactionRecord[];
  loading: boolean;
  error: string | null;
}

// Real-time user balance hook
export function useRealtimeUserData() {
  const { address } = useAccount();
  const [userData, setUserData] = useState<UserData>({
    user: null,
    transactions: [],
    loading: true,
    error: null
  });
  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!address) {
      setUserData(prev => ({ ...prev, loading: false }));
      return;
    }

    // Load initial data
    const loadData = async () => {
      try {
        const response = await realtimeAPI.getUserData(address) as UserDataResponse;
        setUserData({
          user: response.user || null,
          transactions: response.transactions || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to load user data' 
        }));
      }
    };

    loadData();

    // Subscribe to real-time updates
    subscriptionRef.current = realtimeAPI.subscribeToUser(
      address,
      (event: string, data: any) => {
        if (event === 'balanceUpdate') {
          setUserData(prev => ({
            ...prev,
            user: prev.user ? { ...prev.user, ...data } : data
          }));

          // Show notification
          toast.success('Balance Updated', {
            description: `New balance: ${data.rbtcBalance || 0} sats`,
            action: {
              label: 'View Dashboard',
              onClick: () => window.location.href = '/dashboard'
            }
          });
        }

        if (event === 'newTransaction') {
          setUserData(prev => ({
            ...prev,
            transactions: [data, ...prev.transactions.slice(0, 49)]
          }));

          // Show transaction notification
          toast.info(`${data.type} Transaction`, {
            description: `${data.amount} sats confirmed`,
            action: {
              label: 'View Transaction',
              onClick: () => window.open(
                `https://megaexplorer.xyz/tx/${data.txHash}`,
                '_blank'
              )
            }
          });
        }
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [address]);

  return userData;
}

// Real-time balance display hook
export function useRealtimeBalance() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<BalanceData>({
    rbtc: 0,
    wrbtc: 0,
    lastSats: 0,
    loading: true,
    lastUpdate: null
  });

  useEffect(() => {
    if (!address) {
      setBalance(prev => ({ ...prev, loading: false }));
      return;
    }

    const subscription = realtimeAPI.subscribeToUser(
      address,
      (event: string, data: any) => {
        if (event === 'balanceUpdate') {
          setBalance({
            rbtc: data.rbtcBalance || 0,
            wrbtc: data.wrbtcBalance || 0,
            lastSats: data.lastSats || 0,
            loading: false,
            lastUpdate: new Date()
          });
        }
      }
    );

    // Load initial balance
    realtimeAPI.getUserData(address).then((response) => {
      const data = response as UserDataResponse;
      if (data && data.user) {
        setBalance({
          rbtc: data.user.rbtcBalance || 0,
          wrbtc: data.user.wrbtcBalance || 0,
          lastSats: data.user.lastSats || 0,
          loading: false,
          lastUpdate: new Date()
        });
      } else {
        setBalance(prev => ({ ...prev, loading: false }));
      }
    }).catch(() => {
      setBalance(prev => ({ ...prev, loading: false }));
    });

    return subscription;
  }, [address]);

  return balance;
}

// Real-time transaction feed hook
export function useRealtimeTransactions(limit = 20) {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<TransactionData>({
    data: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!address) {
      setTransactions({ data: [], loading: false, error: null });
      return;
    }

    // Load initial transactions
    const loadTransactions = async () => {
      try {
        const response = await realtimeAPI.getUserData(address) as UserDataResponse;
        const txs = response.transactions || [];
        setTransactions({
          data: Array.isArray(txs) ? txs.slice(0, limit) : [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions({
          data: [],
          loading: false,
          error: 'Failed to load transactions'
        });
      }
    };

    loadTransactions();

    // Subscribe to new transactions
    const subscription = realtimeAPI.subscribeToUser(
      address,
      (event: string, data: any) => {
        if (event === 'newTransaction') {
          setTransactions(prev => ({
            ...prev,
            data: [data, ...prev.data.slice(0, limit - 1)]
          }));
        }
      }
    );

    return subscription;
  }, [address, limit]);

  return transactions;
}

// System status hook
export function useRealtimeStatus() {
  const [status, setStatus] = useState({
    isConnected: false,
    totalUsers: 0,
    totalTransactions: 0,
    uptime: 0
  });

  useEffect(() => {
    const updateStatus = () => {
      try {
        const currentStatus = realtimeAPI.getStatus();
        setStatus({
          isConnected: currentStatus.isConnected,
          totalUsers: 0, // Not provided by current API
          totalTransactions: currentStatus.processedTransactions,
          uptime: currentStatus.uptime
        });
      } catch (error) {
        console.error('Error getting status:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

// Balance formatting helper
export function useFormattedBalance() {
  return useCallback((sats: number) => {
    if (sats === 0) return '0';
    if (sats < 1000) return `${sats} sats`;
    if (sats < 100000) return `${(sats / 1000).toFixed(2)}k sats`;
    if (sats < 100000000) return `${(sats / 1000000).toFixed(4)} mBTC`;
    return `${(sats / 100000000).toFixed(8)} BTC`;
  }, []);
}

// Transaction type formatting
export function useTransactionFormatter() {
  return useCallback((type: string) => {
    const formats: Record<string, { emoji: string; color: string; label: string }> = {
      MINT: { emoji: '🟢', color: 'text-green-600', label: 'Mint' },
      BURN: { emoji: '🔴', color: 'text-red-600', label: 'Burn' },
      WRAP: { emoji: '📦', color: 'text-blue-600', label: 'Wrap' },
      UNWRAP: { emoji: '📂', color: 'text-purple-600', label: 'Unwrap' },
      DEPOSIT: { emoji: '💰', color: 'text-green-500', label: 'Deposit' },
      WITHDRAW: { emoji: '💸', color: 'text-orange-600', label: 'Withdraw' }
    };
    
    return formats[type] || {
      emoji: '⚪',
      color: 'text-gray-600',
      label: type
    };
  }, []);
}