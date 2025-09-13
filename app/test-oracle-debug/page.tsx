'use client';

import { useState } from 'react';

export default function OracleUserDebug() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Hardcoded test address
  const TEST_ADDRESS = '0xf45d5feefd7235d9872079d537f5796ba79b1e52';

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching user data for:', TEST_ADDRESS);
      
      // Import oracle service
      const { oracleService } = await import('@/lib/oracle-service');
      
      // Get raw user data
      const data = await oracleService.getUserByAddress(TEST_ADDRESS);
      
      if (data) {
        console.log('✅ User data received:', data);
        setUserData(data);
      } else {
        console.log('❌ No user data found');
        setError('No user data found for this address');
      }
    } catch (err: any) {
      console.error('❌ Error fetching user data:', err);
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Oracle User Card Debug</h1>
        <p className="text-muted-foreground">Direct Oracle Server Data Viewer</p>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Test User Address</h2>
        <div className="font-mono text-sm bg-muted px-4 py-2 rounded break-all">
          {TEST_ADDRESS}
        </div>
        
        <button
          onClick={fetchUserData}
          disabled={loading}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch User Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {userData && (
        <>
          {/* Summary Section */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📊 User Card Summary</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">BASIC INFO</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">ETH Address:</span>
                    <span className="ml-2 font-mono text-xs">{userData.ethAddress}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Registered:</span>
                    <span className="ml-2">{userData.registeredAt ? new Date(userData.registeredAt).toLocaleString() : 'N/A'}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Last Activity:</span>
                    <span className="ml-2">{userData.lastActivityAt ? new Date(userData.lastActivityAt).toLocaleString() : 'N/A'}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="ml-2">{userData.source || 'Unknown'}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">MINT & BALANCE INFO</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Last Synced Balance:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {userData.lastSyncedBalance || 0} sats
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">rBTC-SYNTH:</span>
                    <span className="ml-2 font-bold text-yellow-600">
                      {userData.lastSyncedBalance ? (userData.lastSyncedBalance / 100000000).toFixed(8) : '0.00000000'} BTC
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Transaction Count:</span>
                    <span className="ml-2">{userData.transactionCount || 0}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Verification Status:</span>
                    <span className="ml-2 text-green-600">{userData.verificationStatus || 'Unknown'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bitcoin Addresses */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Bitcoin Addresses</h2>
            
            <div className="space-y-4">
              {userData.bitcoinAddress && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">PRIMARY ADDRESS</h4>
                  <div className="font-mono text-sm bg-muted px-3 py-2 rounded">
                    {userData.bitcoinAddress}
                  </div>
                </div>
              )}
              
              {userData.bitcoinAddresses && userData.bitcoinAddresses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">ALL ADDRESSES ({userData.bitcoinAddresses.length})</h4>
                  <div className="space-y-1">
                    {userData.bitcoinAddresses.map((addr: string, idx: number) => (
                      <div key={idx} className="font-mono text-sm bg-muted px-3 py-2 rounded flex justify-between items-center">
                        <span>{addr}</span>
                        {userData.mintedAddresses?.includes(addr) && (
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">MINTED</span>
                        )}
                        {userData.monitoredAddresses?.includes(addr) && (
                          <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">MONITORED</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userData.mintedAddresses && userData.mintedAddresses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">MINTED ADDRESSES ({userData.mintedAddresses.length})</h4>
                  <div className="space-y-1">
                    {userData.mintedAddresses.map((addr: string, idx: number) => (
                      <div key={idx} className="font-mono text-sm bg-green-500/10 px-3 py-2 rounded">
                        {addr}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mint Transactions */}
          {userData.mintTransactions && Object.keys(userData.mintTransactions).length > 0 && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">💎 Mint Transactions</h2>
              <div className="space-y-2">
                {Object.entries(userData.mintTransactions).map(([address, txHash]: [string, any], idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <div>
                      <p className="font-mono text-xs">{address}</p>
                    </div>
                    <a 
                      href={`https://www.megaexplorer.xyz/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {typeof txHash === 'string' ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : 'View'}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Mint Hash */}
          {userData.lastMintHash && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">✅ Last Mint Transaction</h2>
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded">
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Transaction Hash:</span>
                </p>
                <a 
                  href={`https://www.megaexplorer.xyz/tx/${userData.lastMintHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 hover:underline break-all"
                >
                  {userData.lastMintHash}
                </a>
              </div>
            </div>
          )}

          {/* Transactions */}
          {userData.transactions && userData.transactions.length > 0 && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">📜 Transaction History ({userData.transactions.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userData.transactions.map((tx: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${
                        tx.type === 'MINT' ? 'text-green-600' : 
                        tx.type === 'BURN' ? 'text-red-600' : 
                        'text-blue-600'
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
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Complete Raw User Card Data</h2>
            <div className="bg-black rounded p-4 overflow-auto max-h-[600px]">
              <pre className="text-xs text-green-400">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Field Analysis */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Field Analysis</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(userData).map(([key, value]) => (
                <div key={key} className="p-3 bg-muted/30 rounded">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{key}</p>
                  <p className="text-sm font-mono break-all">
                    {value === null ? 'null' : 
                     value === undefined ? 'undefined' :
                     typeof value === 'object' ? JSON.stringify(value) : 
                     String(value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {Array.isArray(value) ? 'array' : typeof value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}