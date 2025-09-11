'use client';

import { useState } from 'react';
import { BIP322NativeValidator } from '@/lib/bip322-native-validator';

export default function DebugSignature() {
  const [address, setAddress] = useState('tb1qtkj7hlhv9drfwe2mupq0yt9m6fsungkjjv5lr4');
  const [message, setMessage] = useState('I own this Bitcoin address');
  const [signature, setSignature] = useState('Hwto0J1mi7Q/EzZTMVlgMSsyA3W4qFZCwoB3Rp31cRL7f7p5xB6tC0DqKHtWjADwLS9yYa586DgoHnv+ubFST70=');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const testSignature = async () => {
    setLoading(true);
    try {
      const validationResult = BIP322NativeValidator.verify(address, message, signature);
      setResult(validationResult);
    } catch (error) {
      setResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setLoading(false);
  };
  
  const testCases = [
    {
      name: 'Testnet SegWit Example',
      address: 'tb1qtkj7hlhv9drfwe2mupq0yt9m6fsungkjjv5lr4',
      message: 'I own this Bitcoin address',
      signature: 'Hwto0J1mi7Q/EzZTMVlgMSsyA3W4qFZCwoB3Rp31cRL7f7p5xB6tC0DqKHtWjADwLS9yYa586DgoHnv+ubFST70='
    },
    {
      name: 'ReserveBTC Verification Message',
      address: 'tb1qtest123456789',
      message: `ReserveBTC Wallet Verification
Timestamp: ${Math.floor(Date.now() / 1000)}
MegaETH Address: 0x1234567890123456789012345678901234567890
I confirm ownership of this Bitcoin address for use with ReserveBTC protocol.`,
      signature: 'SIGNATURE_HERE'
    }
  ];
  
  const loadTestCase = (testCase: any) => {
    setAddress(testCase.address);
    setMessage(testCase.message);
    setSignature(testCase.signature);
    setResult(null);
  };
  
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Bitcoin Signature Debug Tool</h1>
        <p className="text-muted-foreground">Test BIP-322 signature validation with bitcoinjs-message</p>
      </div>
      
      {/* Test Cases */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Test Cases</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {testCases.map((testCase, index) => (
            <button
              key={index}
              onClick={() => loadTestCase(testCase)}
              className="p-3 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors"
            >
              <div className="font-medium">{testCase.name}</div>
              <div className="text-sm text-muted-foreground font-mono">
                {testCase.address.substring(0, 20)}...
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Input Form */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Signature Validation Test</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Bitcoin Address</label>
          <input 
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Enter Bitcoin address (1..., 3..., bc1..., tb1...)"
            className="w-full p-3 border rounded-lg bg-background"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter the message that was signed"
            rows={4}
            className="w-full p-3 border rounded-lg bg-background"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Signature (Base64)</label>
          <textarea 
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="Enter the Base64 signature from your Bitcoin wallet"
            rows={3}
            className="w-full p-3 border rounded-lg bg-background font-mono"
          />
        </div>
        
        <button 
          onClick={testSignature}
          disabled={loading || !address || !message || !signature}
          className="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Validating...' : 'Test Signature'}
        </button>
      </div>
      
      {/* Results */}
      {result && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Validation Result</h2>
          
          <div className={`p-4 rounded-lg border-2 ${
            result.valid 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-2xl ${result.valid ? 'text-green-600' : 'text-red-600'}`}>
                {result.valid ? '✅' : '❌'}
              </span>
              <span className={`font-bold text-lg ${
                result.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {result.valid ? 'SIGNATURE VALID' : 'SIGNATURE INVALID'}
              </span>
            </div>
            
            {result.method && (
              <div className="text-sm mb-1">
                <span className="font-medium">Validation method:</span> {result.method}
              </div>
            )}
            
            {result.addressType && (
              <div className="text-sm mb-1">
                <span className="font-medium">Address type:</span> {result.addressType}
              </div>
            )}
            
            {result.error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                <span className="font-medium">Error:</span> {result.error}
              </div>
            )}
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show raw validation result
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-muted/50 rounded-xl p-6">
        <h3 className="font-semibold mb-2">How to test signatures:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Copy a Bitcoin address from your wallet</li>
          <li>Sign a message using your Bitcoin wallet (Sparrow, Electrum, etc.)</li>
          <li>Copy the resulting Base64 signature</li>
          <li>Paste all three values above and click "Test Signature"</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Note:</span> This tool uses the same validation logic as the ReserveBTC verification system.
            All signature validation is done client-side for security.
          </p>
        </div>
      </div>
    </div>
  );
}