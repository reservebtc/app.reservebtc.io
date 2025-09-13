// Hook for fetching transaction history from indexed data
import useSWR from 'swr';
import { useState } from 'react';

interface Transaction {
  id: number;
  tx_hash: string;
  block_number: number;
  block_timestamp: string;
  user_address: string;
  tx_type: string;
  amount: string;
  delta: string;
  fee_wei: string;
  gas_used: string;
  metadata?: any;
}

interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useTransactionHistory(address?: string) {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, error, isLoading, mutate } = useSWR<TransactionResponse>(
    address ? `/api/v2/transactions/${address}?page=${page}&limit=${limit}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true
    }
  );

  const loadMore = () => {
    if (data && page < data.pagination.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  return {
    transactions: data?.transactions || [],
    pagination: data?.pagination,
    isLoading,
    error,
    loadMore,
    refresh: mutate
  };
}