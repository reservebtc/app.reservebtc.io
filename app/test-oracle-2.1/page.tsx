'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function TestOracle21() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullData, setShowFullData] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    async function loadOracleData() {
      try {
        setLoading(true);
        
        // Test Oracle server status
        console.log('Testing Oracle 2.1.0 server...');
        const oracleStatusResponse = await fetch('https://oracle.reservebtc.io/status');
        const oracleStatus = await oracleStatusResponse.json();
        
        // Test Oracle service with current user if connected
        let userOracleData = null;
        if (isConnected && address) {
          console.log('Testing Oracle service for current user...');
          const { oracleService } = await import('@/lib/oracle-service');
          
          // Get user data
          const userData = await oracleService.getUserByAddress(address);
          if (userData) {
            const bitcoinAddresses = oracleService.getUserBitcoinAddresses(userData);
            userOracleData = {
              user: userData,
              bitcoinAddresses: bitcoinAddresses,
              addressCount: bitcoinAddresses.length
            };
          }
        }
        
        setData({
          timestamp: new Date().toISOString(),
          oracleStatus,
          userOracleData,
          connectionStatus: {
            isConnected,
            address: address || null
          }
        });
      } catch (err) {
        console.error('Oracle 2.1 test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    loadOracleData();
  }, [address, isConnected]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Testing Oracle 2.1.0</h1>
          <p className="text-muted-foreground">Loading test results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Oracle 2.1.0 Test Results</h1>
        <p className="text-muted-foreground">Your Personal Oracle Data</p>
        <div className="text-sm text-muted-foreground mt-2">
          Test conducted at: {data?.timestamp}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Oracle Server Status */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Oracle Server Status
          </h2>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(data?.oracleStatus, null, 2)}
            </pre>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Version:</span>
              <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                {data?.oracleStatus?.version || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                data?.oracleStatus?.status === 'operational' 
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {data?.oracleStatus?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* User Oracle Data */}
        {data?.connectionStatus?.isConnected && (
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                data?.userOracleData ? 'bg-green-500' : 'bg-gray-500'
              }`}></span>
              Your Oracle Data
            </h2>
            
            <div className="mb-4">
              <span className="font-medium">Connected Address:</span>
              <span className="font-mono text-sm ml-2 bg-muted px-2 py-1 rounded">
                {data.connectionStatus.address}
              </span>
            </div>

            {data?.userOracleData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Bitcoin Addresses:</span>
                    <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-sm">
                      {data.userOracleData.addressCount} address{data.userOracleData.addressCount !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Your Bitcoin Addresses:</h4>
                  {data.userOracleData.bitcoinAddresses.length > 0 ? (
                    <div className="space-y-1">
                      {data.userOracleData.bitcoinAddresses.map((addr: string, i: number) => {
                        const isMinted = data.userOracleData.user?.mintedAddresses?.includes(addr) || 
                                        data.userOracleData.user?.monitoredAddresses?.includes(addr);
                        return (
                          <div key={i} className="font-mono text-sm bg-muted px-3 py-2 rounded flex items-center justify-between">
                            <span>{addr}</span>
                            <div className="flex items-center gap-2">
                              {isMinted && (
                                <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                                  MINTED
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {addr.startsWith('tb1') || addr.startsWith('m') || addr.startsWith('n') || addr.startsWith('2') 
                                  ? 'TESTNET' 
                                  : 'MAINNET'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                      No Bitcoin addresses found for this user
                    </div>
                  )}
                </div>

                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Show raw user data
                  </summary>
                  <div className="bg-muted/50 rounded-lg p-4 mt-2">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(data.userOracleData.user, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  No Oracle data found for your address
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Verify a Bitcoin address to appear in Oracle 2.1.0
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mint Status & Synth Tokens */}
        {data?.connectionStatus?.isConnected && data?.userOracleData?.user && (
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              🪙 Synthetic Token Status
            </h2>
            
            <div className="space-y-4">
              {/* Last Mint Transaction */}
              {data.userOracleData.user.lastMintHash && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-600 mb-2">✅ LAST MINT TRANSACTION</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Transaction Hash:</span>
                      <a 
                        href={`https://www.megaexplorer.xyz/tx/${data.userOracleData.user.lastMintHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline font-mono text-xs"
                      >
                        {data.userOracleData.user.lastMintHash}
                      </a>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 text-green-600 font-semibold">SUCCESS</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Token Balances */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">TOKEN BALANCES</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded">
                    <p className="text-xs text-muted-foreground mb-1">rBTC-SYNTH (Soulbound)</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {data.userOracleData.user.lastSyncedBalance 
                        ? (data.userOracleData.user.lastSyncedBalance / 100000000).toFixed(8)
                        : '0.00000000'} BTC
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.userOracleData.user.lastSyncedBalance || 0} satoshis
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded">
                    <p className="text-xs text-muted-foreground mb-1">wrBTC (Transferable)</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {data.userOracleData.user.wrbtcBalance || '0.00000000'} BTC
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wrapped tokens
                    </p>
                  </div>
                </div>
              </div>

              {/* Monitored Addresses */}
              {(data.userOracleData.user.mintedAddresses?.length > 0 || 
                data.userOracleData.user.monitoredAddresses?.length > 0) && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-600 mb-2">📡 MONITORED ADDRESSES</h4>
                  <div className="space-y-1">
                    {[...(data.userOracleData.user.mintedAddresses || []), 
                      ...(data.userOracleData.user.monitoredAddresses || [])]
                      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
                      .map((addr: string, idx: number) => (
                      <div key={idx} className="font-mono text-xs bg-white/50 dark:bg-black/50 px-2 py-1 rounded">
                        {addr}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Oracle automatically syncs these addresses 24/7
                  </p>
                </div>
              )}

              {/* Transaction History */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">TRANSACTION HISTORY</h4>
                {data.userOracleData.user.transactions && data.userOracleData.user.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {data.userOracleData.user.transactions.slice(0, 5).map((tx: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            tx.type === 'MINT' ? 'text-green-600' : 
                            tx.type === 'BURN' ? 'text-red-600' : 
                            tx.type === 'SYNC' ? 'text-blue-600' :
                            'text-purple-600'
                          }`}>
                            {tx.type}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {tx.amount} sats
                          </span>
                          {tx.timestamp && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {tx.hash && (
                          <a 
                            href={`https://www.megaexplorer.xyz/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-500 hover:underline"
                          >
                            View TX →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions recorded yet</p>
                )}
              </div>

              {/* Raw Full Data Button */}
              <button
                onClick={() => setShowFullData(!showFullData)}
                className="w-full mt-4 py-2 bg-muted hover:bg-muted/80 rounded text-sm transition-colors"
              >
                {showFullData ? 'Hide' : 'Show'} Complete User Card Data
              </button>
              
              {showFullData && (
                <div className="mt-4 p-4 bg-black rounded text-xs text-green-400 overflow-auto max-h-96">
                  <pre>{JSON.stringify(data.userOracleData.user, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {!data?.connectionStatus?.isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-600 mb-2">Wallet Not Connected</h3>
            <p className="text-yellow-600 text-sm">
              Connect your MetaMask wallet to see your Oracle data and mint status.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Your Oracle Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                data?.oracleStatus?.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></span>
              <span>Oracle Server: {data?.oracleStatus?.status === 'operational' ? 'Online ✅' : 'Issues detected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                data?.connectionStatus?.isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}></span>
              <span>Wallet: {data?.connectionStatus?.isConnected ? 'Connected ✅' : 'Not connected'}</span>
            </div>
            {data?.userOracleData && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Bitcoin Addresses: {data.userOracleData.addressCount} verified ✅</span>
                </div>
                {data.userOracleData.user?.lastSyncedBalance > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span>Synth Tokens: {(data.userOracleData.user.lastSyncedBalance / 100000000).toFixed(8)} rBTC minted ✅</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}