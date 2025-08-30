'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useOracleSync, useUserBTCBalance, useOracleStatus } from '@/app/hooks/useOracleSync';
import { CONTRACTS } from '@/app/lib/contracts';
// UI Components - simplified implementation
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card text-card-foreground shadow-sm rounded-lg border ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled = false, className = '', size = 'default', variant = 'default' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'ghost';
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, type = 'text', id, className = '', step }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  id?: string;
  className?: string;
  step?: string;
}) => (
  <input
    id={id}
    type={type}
    step={step}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

const Label = ({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);

const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'destructive'; className?: string }) => (
  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'destructive' ? 'border-destructive/50 text-destructive' : 'border-transparent bg-primary text-primary-foreground'} ${className}`}>
    {children}
  </div>
);
import { AlertCircle, Check, RefreshCw, Zap } from 'lucide-react';
import { formatEther, parseUnits } from 'viem';

export default function OraclePage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  
  // Oracle hooks
  const { syncUserBalance, isLoading: isSyncing, isSuccess: syncSuccess, error: syncError } = useOracleSync();
  const { balance: btcBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useUserBTCBalance(address);
  const oracleStatus = useOracleStatus();
  
  // Form state for manual sync
  const [syncForm, setSyncForm] = useState({
    btcBalance: '',
    blockHeight: '',
  });

  const handleSync = async () => {
    if (!address || !syncForm.btcBalance || !syncForm.blockHeight) return;
    
    try {
      const balanceInSats = parseUnits(syncForm.btcBalance, 8); // BTC has 8 decimals
      await syncUserBalance({
        userAddress: address,
        newBalanceSats: balanceInSats,
        blockHeight: parseInt(syncForm.blockHeight),
      });
      
      // Refresh balance after sync
      setTimeout(() => {
        refetchBalance();
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Oracle Dashboard</CardTitle>
            <CardDescription>
              Connect your wallet to access oracle functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please connect your wallet to continue
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Oracle Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Manage BTC balance synchronization on MegaETH
          </p>
        </div>

        {/* Oracle Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Oracle Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Committee Address</Label>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {oracleStatus.committee}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Network Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={oracleStatus.isOnline ? 'default' : 'destructive'}>
                    {oracleStatus.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  {oracleStatus.isOnline && <Check className="h-4 w-4 text-green-500" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Min Confirmations</Label>
                <div className="text-lg font-semibold">
                  {oracleStatus.minConfirmations}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Fee per Sync</Label>
                <div className="text-lg font-semibold">
                  {formatEther(oracleStatus.maxFeePerSync)} ETH
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Balance Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Current Balances</CardTitle>
            <CardDescription>
              View your current ETH and synced BTC balances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ETH Balance</Label>
                <div className="text-2xl font-bold">
                  {ethBalance ? formatEther(ethBalance.value) : '0.00'} ETH
                </div>
                <p className="text-sm text-muted-foreground">
                  Used for gas fees and deposits
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Last Synced BTC Balance
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refetchBalance}
                    disabled={isLoadingBalance}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  </Button>
                </Label>
                <div className="text-2xl font-bold">
                  {btcBalance ? (Number(btcBalance) / 1e8).toFixed(8) : '0.00000000'} BTC
                </div>
                <p className="text-sm text-muted-foreground">
                  Synchronized from Bitcoin blockchain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Sync */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Balance Sync</CardTitle>
            <CardDescription>
              Manually synchronize BTC balance from Bitcoin blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="btcBalance">BTC Balance</Label>
                <Input
                  id="btcBalance"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={syncForm.btcBalance}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, btcBalance: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the current BTC balance from your wallet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockHeight">Block Height</Label>
                <Input
                  id="blockHeight"
                  type="number"
                  placeholder="870000"
                  value={syncForm.blockHeight}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, blockHeight: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Current Bitcoin network block height
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSync}
              disabled={isSyncing || !syncForm.btcBalance || !syncForm.blockHeight}
              className="w-full"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Sync BTC Balance
                </>
              )}
            </Button>

            {/* Sync Status Messages */}
            {syncSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">
                  Balance synchronized successfully!
                </span>
              </div>
            )}

            {syncError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 dark:text-red-200">
                  Sync failed: {syncError.message}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Addresses */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Addresses</CardTitle>
            <CardDescription>
              ReserveBTC protocol contracts on MegaETH Testnet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(CONTRACTS)
              .filter(([key]) => key.includes('_') && !['CHAIN_ID', 'RPC_URL'].includes(key))
              .map(([key, address]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <Label className="font-medium">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {address}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}