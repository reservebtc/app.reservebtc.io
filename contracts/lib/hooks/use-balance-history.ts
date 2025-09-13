// Hook for fetching balance history
import useSWR from 'swr';

interface BalanceSnapshot {
  id: number;
  user_address: string;
  block_number: number;
  rbtc_balance: string;
  wrbtc_balance: string;
  last_sats: string;
  snapshot_timestamp: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useBalanceHistory(address?: string, period: string = '30d') {
  const { data, error, isLoading } = useSWR<{ snapshots: BalanceSnapshot[] }>(
    address ? `/api/v2/balance/${address}?period=${period}` : null,
    fetcher,
    {
      refreshInterval: 60000 // Refresh every minute
    }
  );

  return {
    snapshots: data?.snapshots || [],
    isLoading,
    error
  };
}