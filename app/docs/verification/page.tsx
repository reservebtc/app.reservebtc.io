import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Signature, CheckCircle, AlertCircle, Copy, Eye, FileText, Shield, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Verification Process | ReserveBTC Documentation',
  description: 'Step-by-step guide to verifying Bitcoin address ownership using BIP-322 signatures for ReserveBTC token minting.',
  keywords: 'Bitcoin address verification, BIP-322 signature, ReserveBTC verification, Bitcoin ownership proof',
}

export default function VerificationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Bitcoin Address Verification</h1>
          <p className="text-lg text-muted-foreground">
            Learn how to verify ownership of your Bitcoin address using BIP-322 signatures 
            to mint ReserveBTC synthetic tokens without transferring your Bitcoin.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-200">Verification Overview</h2>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            Bitcoin address verification uses cryptographic signatures to prove you control a Bitcoin address 
            without revealing your private keys or moving your Bitcoin.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-sm">Secure</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">No private key exposure</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
              <Signature className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-sm">Cryptographic</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Mathematical proof</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold text-sm">Instant</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Immediate verification</p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Step-by-Step Verification</h2>

          {/* Step 1 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                1
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Connect Your EVM Wallet</h3>
                <p className="text-muted-foreground">
                  First, connect your MetaMask or other EVM wallet to the ReserveBTC interface.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">What happens:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your EVM address is identified</li>
                    <li>• Connection to MegaETH network is established</li>
                    <li>• Wallet permissions are granted</li>
                    <li>• Interface prepares for verification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                2
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Enter Your Bitcoin Address</h3>
                <p className="text-muted-foreground">
                  Provide the Bitcoin address you want to verify. This can be any address type.
                </p>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Supported Address Types:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1 text-green-700 dark:text-green-300">
                      <p>• <code className="bg-green-100 dark:bg-green-900 px-1 rounded">1...</code> Legacy (P2PKH)</p>
                      <p>• <code className="bg-green-100 dark:bg-green-900 px-1 rounded">3...</code> SegWit (P2SH)</p>
                    </div>
                    <div className="space-y-1 text-green-700 dark:text-green-300">
                      <p>• <code className="bg-green-100 dark:bg-green-900 px-1 rounded">bc1...</code> Native SegWit</p>
                      <p>• <code className="bg-green-100 dark:bg-green-900 px-1 rounded">bc1p...</code> Taproot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                3
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Generate Verification Message</h3>
                <p className="text-muted-foreground">
                  The system generates a unique verification message that includes your addresses and timestamp.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Sample Message Format:
                  </h4>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`ReserveBTC Verification
Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
EVM: 0x1234...5678
Timestamp: 1698765432`}</pre>
                  <div className="mt-2 flex items-center space-x-2">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Copy this message to sign with your Bitcoin wallet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                4
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Sign Message with Bitcoin Wallet</h3>
                <p className="text-muted-foreground">
                  Use your Bitcoin wallet to create a BIP-322 signature of the verification message.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Sparrow Wallet</h4>
                    <ol className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>1. Go to Tools → Sign/Verify Message</li>
                      <li>2. Select your Bitcoin address</li>
                      <li>3. Paste the verification message</li>
                      <li>4. Click "Sign Message"</li>
                      <li>5. Copy the generated signature</li>
                    </ol>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Electrum Wallet</h4>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>1. Go to Tools → Sign/Verify Message</li>
                      <li>2. Enter your Bitcoin address</li>
                      <li>3. Paste the verification message</li>
                      <li>4. Click "Sign"</li>
                      <li>5. Copy the signature output</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Important Notes
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Make sure you're signing with the exact address you entered</li>
                    <li>• Copy the message exactly as shown (including line breaks)</li>
                    <li>• Some wallets may require enabling BIP-322 in settings</li>
                    <li>• The signature will be a long base64-encoded string</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                5
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold">Submit Signature for Verification</h3>
                <p className="text-muted-foreground">
                  Paste the BIP-322 signature back into the ReserveBTC interface for verification.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Verification Process:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Paste your BIP-322 signature into the signature field</li>
                    <li>Click "Verify Signature" button</li>
                    <li>System validates signature cryptographically</li>
                    <li>Bitcoin balance is checked via blockchain APIs</li>
                    <li>User profile is created with verified address</li>
                    <li>Tokens become available for minting</li>
                  </ol>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">✅ Successful Verification</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Once verified, you'll see a confirmation message and your Bitcoin balance will be displayed. 
                    You can now mint synthetic tokens backed by your Bitcoin holdings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Common Verification Issues</h2>
          
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-red-800 dark:text-red-200">❌ "Signature Invalid"</h3>
              <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                <p><strong>Possible causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Message was modified or not copied exactly</li>
                  <li>Wrong address was used for signing</li>
                  <li>Wallet doesn't support BIP-322 properly</li>
                  <li>Signature was truncated when copying</li>
                </ul>
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Re-copy the message exactly as shown</li>
                  <li>Verify you're signing with the correct address</li>
                  <li>Try a different BIP-322 compatible wallet</li>
                  <li>Check that entire signature was copied</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-yellow-800 dark:text-yellow-200">⚠️ "Balance Not Found"</h3>
              <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p><strong>Possible causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Address has zero Bitcoin balance</li>
                  <li>Recent transaction not yet confirmed</li>
                  <li>Address format not recognized</li>
                  <li>Blockchain API temporarily unavailable</li>
                </ul>
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Ensure address has confirmed Bitcoin balance</li>
                  <li>Wait for recent transactions to confirm</li>
                  <li>Try again in a few minutes</li>
                  <li>Verify address format is correct</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">ℹ️ "Wallet Not Supported"</h3>
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <p><strong>Recommended alternatives:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Download Sparrow Wallet (best BIP-322 support)</li>
                  <li>Update Electrum to latest version</li>
                  <li>Import seed phrase to supported wallet temporarily</li>
                  <li>Use Bitcoin Core for advanced users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Security Best Practices
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">✅ Safe Practices</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Only sign messages you understand</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Verify message content before signing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Use official ReserveBTC interface only</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Keep wallet software updated</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Use hardware wallets when possible</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-red-600">❌ Avoid These</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Never sign messages from unknown sources</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Don't share signatures publicly</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Avoid custodial wallets for signing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Don't use unverified wallet software</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Never share private keys or seed phrases</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* What Happens After */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-green-800 dark:text-green-200">After Successful Verification</h2>
          <div className="space-y-4">
            <p className="text-green-700 dark:text-green-300">
              Once your Bitcoin address is verified, the Oracle system will continuously monitor 
              your Bitcoin balance and keep your synthetic tokens synchronized.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 text-center">
                <Eye className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold mb-1">Continuous Monitoring</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Balance checked every 5 minutes</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 text-center">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold mb-1">Auto-Sync</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Tokens updated automatically</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold mb-1">Ready for DeFi</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Participate in protocols</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Verification FAQ</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">How long does verification take?</h3>
              <p className="text-sm text-muted-foreground">
                Verification is instant once you submit a valid BIP-322 signature. 
                The cryptographic verification happens immediately.
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Can I verify multiple Bitcoin addresses?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can verify multiple Bitcoin addresses to the same EVM address. 
                Each address must be verified separately with its own BIP-322 signature.
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">What if my Bitcoin balance changes?</h3>
              <p className="text-sm text-muted-foreground">
                The Oracle system automatically detects balance changes and updates your token supply 
                accordingly. No action required on your part.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a minimum Bitcoin balance required?</h3>
              <p className="text-sm text-muted-foreground">
                No minimum balance is required for verification, but you need some Bitcoin to mint tokens. 
                Even small amounts (0.00000001 BTC) can be used.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/wallet-setup" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            ← Wallet Setup
          </Link>
          <Link 
            href="/docs/first-mint" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            First Mint Tutorial →
          </Link>
        </div>
      </div>
    </div>
  )
}