'use client';
import { oracleService } from '@/lib/oracle-service';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export default function TestAddresses() {
  const [bitcoinAddresses, setBitcoinAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const [oracleData, setOracleData] = useState(null);
  const [oracleLoading, setOracleLoading] = useState(false);

  useEffect(() => {
    async function loadOracleData() {
      if (address) {
        setOracleLoading(true);
        try {
          const userData = await oracleService.getUserByAddress(address);
          setOracleData(userData);
        } catch (error) {
          console.error('Oracle load error:', error);
          setOracleData({ error: error.message });
        }
        setOracleLoading(false);
      }
    }
    loadOracleData();
  }, [address]);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Address Debug Page</h1>
      
      <div className="space-y-6">
        {/* User Profile Hook Data */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-green-400">useUserProfile Hook Data:</h2>
          <pre className="bg-black p-4 rounded text-xs text-green-300 overflow-x-auto">
            {JSON.stringify({ 
              bitcoinAddresses, 
              count: bitcoinAddresses?.length,
              isLoading,
              address
            }, null, 2)}
          </pre>
        </div>

        {/* Oracle Service Data */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-400">Oracle Service Data:</h2>
          {oracleLoading ? (
            <div className="text-yellow-400">Loading Oracle data...</div>
          ) : (
            <pre className="bg-black p-4 rounded text-xs text-blue-300 overflow-x-auto">
              {JSON.stringify(oracleData, null, 2)}
            </pre>
          )}
        </div>

        {/* Connection Status */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Connection Status:</h2>
          <div className="space-y-2 text-sm">
            <div>Connected Address: <span className="font-mono">{address || 'Not connected'}</span></div>
            <div>Profile Loading: <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{isLoading ? 'Yes' : 'No'}</span></div>
            <div>Oracle Loading: <span className={oracleLoading ? 'text-yellow-400' : 'text-green-400'}>{oracleLoading ? 'Yes' : 'No'}</span></div>
            <div>Has Bitcoin Addresses: <span className={bitcoinAddresses?.length > 0 ? 'text-green-400' : 'text-red-400'}>{bitcoinAddresses?.length > 0 ? 'Yes' : 'No'}</span></div>
          </div>
        </div>

        {/* Manual Oracle Test */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-purple-400">Manual Tests:</h2>
          <div className="space-y-2">
            <button 
              onClick={() => window.open('/api/oracle-test', '_blank')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-3"
            >
              Test Oracle API
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}