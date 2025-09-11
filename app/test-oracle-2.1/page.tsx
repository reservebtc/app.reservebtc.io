'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function TestOracle21() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    async function loadOracleData() {
      try {
        setLoading(true);
        
        // Test Oracle server status
        console.log('Testing Oracle 2.1.0 server...');
        const oracleStatusResponse = await fetch('https://oracle.reservebtc.io/status');
        const oracleStatus = await oracleStatusResponse.json();
        
        // Test array fix API
        console.log('Testing array fix API...');
        const arrayTestResponse = await fetch('/api/test-array-fix');
        const arrayTestData = await arrayTestResponse.json();
        
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
          arrayTest: arrayTestData,
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
        <p className="text-muted-foreground">Bitcoin Address Arrays Support Testing</p>
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

        {/* Array Fix Test Results */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              data?.arrayTest?.testResult?.isArraySupportWorking
                ? 'bg-green-500'
                : 'bg-yellow-500'
            }`}></span>
            Bitcoin Address Arrays Test
          </h2>
          
          {data?.arrayTest?.testResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Array Support:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    data.arrayTest.testResult.isArraySupportWorking
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {data.arrayTest.testResult.isArraySupportWorking ? '✅ Working' : '⚠️ Needs Update'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {data.arrayTest.testResult.status}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">User Statistics</h4>
                  <div className="text-sm space-y-1">
                    <div>Total users: {data.arrayTest.fixAnalysis?.totalUsers}</div>
                    <div>Single addresses only: {data.arrayTest.fixAnalysis?.usersWithSingleAddressesOnly}</div>
                    <div>Multiple addresses: {data.arrayTest.fixAnalysis?.usersWithMultipleAddresses}</div>
                    <div>Array support: {data.arrayTest.fixAnalysis?.usersWithArraySupport}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  <div className="text-sm">
                    {data.arrayTest.recommendations?.nextSteps?.map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show raw test data
            </summary>
            <div className="bg-muted/50 rounded-lg p-4 mt-2">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(data?.arrayTest, null, 2)}
              </pre>
            </div>
          </details>
        </div>

        {/* User Oracle Data */}
        {data?.connectionStatus?.isConnected && (
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                data?.userOracleData ? 'bg-green-500' : 'bg-gray-500'
              }`}></span>
              Your Oracle Data (Connected User)
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
                  <h4 className="font-medium">Address List:</h4>
                  {data.userOracleData.bitcoinAddresses.length > 0 ? (
                    <div className="space-y-1">
                      {data.userOracleData.bitcoinAddresses.map((addr: string, i: number) => (
                        <div key={i} className="font-mono text-sm bg-muted px-3 py-2 rounded flex items-center justify-between">
                          <span>{addr}</span>
                          <span className="text-xs text-muted-foreground">
                            {addr.startsWith('tb1') || addr.startsWith('m') || addr.startsWith('n') || addr.startsWith('2') 
                              ? 'TESTNET' 
                              : 'MAINNET'}
                          </span>
                        </div>
                      ))}
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

        {!data?.connectionStatus?.isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-600 mb-2">Wallet Not Connected</h3>
            <p className="text-yellow-600 text-sm">
              Connect your MetaMask wallet to test your personal Oracle data with Bitcoin address arrays support.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Test Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                data?.oracleStatus?.version === '2.1.0' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></span>
              <span>Oracle Server: {data?.oracleStatus?.version === '2.1.0' ? 'Updated to 2.1.0 ✅' : 'Needs update'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                data?.arrayTest?.testResult?.isArraySupportWorking ? 'bg-green-500' : 'bg-yellow-500'
              }`}></span>
              <span>Array Support: {data?.arrayTest?.testResult?.isArraySupportWorking ? 'Working ✅' : 'Migration needed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                data?.connectionStatus?.isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}></span>
              <span>User Connection: {data?.connectionStatus?.isConnected ? 'Connected ✅' : 'Not connected'}</span>
            </div>
            {data?.userOracleData && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>User Data: Found {data.userOracleData.addressCount} Bitcoin address{data.userOracleData.addressCount !== 1 ? 'es' : ''} ✅</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}