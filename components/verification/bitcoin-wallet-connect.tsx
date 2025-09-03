'use client'

import { useState, useEffect } from 'react'
import { Wallet, CheckCircle, AlertCircle, Loader2, Smartphone, ExternalLink } from 'lucide-react'

interface BitcoinWallet {
  name: string
  icon: string
  detected: boolean
  address?: string
  type?: 'taproot' | 'segwit' | 'legacy' | 'unknown'
}

interface BitcoinWalletConnectProps {
  onWalletConnected?: (wallet: { name: string; address: string }) => void
  onSignMessage?: (signature: string) => void
}

export function BitcoinWalletConnect({ onWalletConnected, onSignMessage }: BitcoinWalletConnectProps) {
  const [wallets, setWallets] = useState<BitcoinWallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect available wallets and mobile device
  useEffect(() => {
    const checkWallets = () => {
      const detected: BitcoinWallet[] = []

      // Check for Phantom - multiple possible locations
      const phantomProvider = typeof window !== 'undefined' && (
        (window as any).phantom?.bitcoin || 
        (window as any).phantom?.solana || 
        (window as any).phantom
      )
      
      if (phantomProvider) {
        detected.push({
          name: 'Phantom',
          icon: '👻',
          detected: true
        })
      } else {
        detected.push({
          name: 'Phantom',
          icon: '👻',
          detected: false
        })
      }

      // Check for Exodus
      if (typeof window !== 'undefined' && (window as any).exodus?.bitcoin) {
        detected.push({
          name: 'Exodus',
          icon: '💼',
          detected: true
        })
      } else {
        detected.push({
          name: 'Exodus',
          icon: '💼',
          detected: false
        })
      }

      setWallets(detected)
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }

    checkWallets()
    checkMobile()

    // Listen for wallet injection
    const interval = setInterval(checkWallets, 1000)
    return () => clearInterval(interval)
  }, [])

  const connectPhantom = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Check if Phantom is available
      if (!(window as any).phantom) {
        throw new Error('Phantom wallet not detected. Please install Phantom browser extension.')
      }

      const phantom = (window as any).phantom
      console.log('Phantom detected:', phantom)

      // Wait for Phantom to initialize
      await new Promise(resolve => setTimeout(resolve, 200))

      let bitcoinAPI = null
      let accounts = null

      // Find Bitcoin API
      if (phantom.bitcoin && typeof phantom.bitcoin === 'object') {
        bitcoinAPI = phantom.bitcoin
        console.log('Found bitcoin API at phantom.bitcoin')
      } else if (phantom.solana?.bitcoin && typeof phantom.solana.bitcoin === 'object') {
        bitcoinAPI = phantom.solana.bitcoin
        console.log('Found bitcoin API at phantom.solana.bitcoin')
      }

      if (!bitcoinAPI) {
        throw new Error('Bitcoin is not enabled in Phantom. Please go to Settings → Developer Settings → Enable Bitcoin')
      }

      // New approach: Try to get accounts without triggering requestAccounts
      try {
        console.log('Checking Bitcoin API methods:', Object.keys(bitcoinAPI))
        
        // First check if we already have accounts stored
        if (bitcoinAPI.accounts && Array.isArray(bitcoinAPI.accounts) && bitcoinAPI.accounts.length > 0) {
          console.log('Found existing accounts:', bitcoinAPI.accounts)
          accounts = bitcoinAPI.accounts
        }
        // Try getAccounts if available (doesn't trigger popup)
        else if (typeof bitcoinAPI.getAccounts === 'function') {
          console.log('Trying getAccounts...')
          accounts = await bitcoinAPI.getAccounts()
          console.log('Got accounts:', accounts)
        }
        // Try to access publicKey directly
        else if (bitcoinAPI.publicKey) {
          console.log('Found publicKey directly:', bitcoinAPI.publicKey)
          accounts = [bitcoinAPI.publicKey]
        }
        
        // If no accounts yet, we need to trigger connection
        if (!accounts || (Array.isArray(accounts) && accounts.length === 0)) {
          console.log('No existing accounts, need to connect...')
          
          // Try connect first (less likely to error)
          if (typeof bitcoinAPI.connect === 'function') {
            console.log('Using connect method')
            const result = await bitcoinAPI.connect()
            console.log('Connect result:', result)
            accounts = result?.accounts || result?.publicKey || [result]
          }
          // Only use requestAccounts as last resort
          else if (typeof bitcoinAPI.requestAccounts === 'function') {
            console.log('Using requestAccounts as last resort...')
            // Wrap in try-catch to handle btc.js error
            try {
              accounts = await bitcoinAPI.requestAccounts()
            } catch (reqErr: any) {
              console.error('requestAccounts failed:', reqErr)
              // Try to extract any available account info
              if (bitcoinAPI.accounts) {
                accounts = bitcoinAPI.accounts
              } else if (bitcoinAPI.publicKey) {
                accounts = [bitcoinAPI.publicKey]
              } else {
                throw reqErr
              }
            }
          }
        }
        
        // Store the bitcoinAPI for signing later
        if (accounts && accounts.length > 0) {
          (window as any).__phantomBitcoinAPI = bitcoinAPI
          console.log('Stored Bitcoin API for signing')
        }
        
      } catch (err: any) {
        console.error('Connection attempt failed:', err)
        
        // Check if btc.js error
        if (err.toString().includes('btc.js') || err.message?.includes('Unexpected')) {
          console.log('btc.js error detected, checking for alternative access...')
          
          // Last attempt: Check if we can access the provider differently
          if (phantom.solana && typeof phantom.solana === 'object') {
            const solanaProvider = phantom.solana
            if (solanaProvider._bitcoin || solanaProvider.bitcoin) {
              const altBitcoinAPI = solanaProvider._bitcoin || solanaProvider.bitcoin
              console.log('Found alternative Bitcoin API')
              
              if (altBitcoinAPI.accounts) {
                accounts = altBitcoinAPI.accounts
                (window as any).__phantomBitcoinAPI = altBitcoinAPI
              } else if (altBitcoinAPI.publicKey) {
                accounts = [altBitcoinAPI.publicKey]
                ;(window as any).__phantomBitcoinAPI = altBitcoinAPI
              }
            }
          }
          
          if (!accounts) {
            throw new Error('Unable to connect to Phantom Bitcoin. The wallet may need to be unlocked or Bitcoin needs to be enabled in settings.')
          }
        } else {
          throw err
        }
      }

      const handleAccounts = (accs: any) => {
        console.log('Processing accounts:', accs)
        
        let address = null
        
        // Extract address from various formats
        if (typeof accs === 'string') {
          address = accs
        } else if (Array.isArray(accs) && accs.length > 0) {
          const first = accs[0]
          if (typeof first === 'string') {
            address = first
          } else if (first && typeof first === 'object') {
            address = first.address || first.publicKey || first.toString?.()
          }
        } else if (accs && typeof accs === 'object') {
          address = accs.address || accs.publicKey || accs.toString?.()
        }
        
        if (!address) {
          throw new Error('No Bitcoin address received from Phantom')
        }
        
        console.log('Bitcoin address:', address)
        
        setSelectedWallet('Phantom')
        setWallets(prev => prev.map(w => 
          w.name === 'Phantom' 
            ? { ...w, address: address, type: 'unknown' }
            : w
        ))
        
        if (onWalletConnected) {
          onWalletConnected({
            name: 'Phantom',
            address: address
          })
        }
      }
      
      if (accounts) {
        handleAccounts(accounts)
      } else {
        throw new Error('No response from Phantom wallet')
      }
      
    } catch (err: any) {
      console.error('Phantom connection failed:', err)
      
      let errorMessage = 'Failed to connect Phantom wallet'
      
      if (err.message?.includes('not detected')) {
        errorMessage = 'Phantom wallet not found. Please install it from phantom.app'
      } else if (err.message?.includes('User rejected')) {
        errorMessage = 'Connection cancelled by user'
      } else if (err.message?.includes('not enabled')) {
        errorMessage = 'Please enable Bitcoin in Phantom: Settings → Developer Settings → Bitcoin'
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Connection timed out. Please try again.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectExodus = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const provider = (window as any).exodus?.bitcoin

      if (!provider) {
        throw new Error('Exodus wallet not detected. Please install Exodus wallet.')
      }

      // Request connection
      const accounts = await provider.request({ method: 'bitcoin_requestAccounts' })
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        
        setSelectedWallet('Exodus')
        onWalletConnected?.({
          name: 'Exodus',
          address: address
        })

        // Update wallet info
        setWallets(prev => prev.map(w => 
          w.name === 'Exodus' 
            ? { ...w, address: address }
            : w
        ))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Exodus wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const signMessageWithWallet = async (message: string) => {
    if (!selectedWallet) {
      setError('Please connect a wallet first')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      let signature = ''

      if (selectedWallet === 'Phantom') {
        // Use the stored Bitcoin API from connection
        const provider = (window as any).__phantomBitcoinAPI || (window as any).phantom?.bitcoin
        const wallet = wallets.find(w => w.name === 'Phantom')
        
        if (!provider || !wallet?.address) {
          throw new Error('Phantom wallet not properly connected')
        }

        console.log('Signing BIP-322 message with Phantom...')
        console.log('Provider methods:', Object.keys(provider).filter(k => typeof provider[k] === 'function'))
        
        // Try different signing methods for BIP-322
        try {
          if (typeof provider.signMessage === 'function') {
            // Standard BIP-322 signing
            console.log('Using signMessage for BIP-322')
            const result = await provider.signMessage(wallet.address, new TextEncoder().encode(message))
            signature = result.signature || result
          } else if (typeof provider.sign === 'function') {
            // Alternative signing method
            console.log('Using sign method')
            const result = await provider.sign(message, wallet.address)
            signature = result.signature || result
          } else if (typeof provider.request === 'function') {
            // RPC-style signing
            console.log('Using request method for signing')
            const result = await provider.request({
              method: 'signMessage',
              params: [wallet.address, message]
            })
            signature = result.signature || result
          } else {
            throw new Error('No signing method available in Phantom Bitcoin API')
          }
        } catch (signErr: any) {
          console.error('Signing error:', signErr)
          throw new Error(`BIP-322 signing failed: ${signErr.message}`)
        }
        
        console.log('BIP-322 signature obtained:', signature)
      } else if (selectedWallet === 'Exodus') {
        const provider = (window as any).exodus?.bitcoin
        const wallet = wallets.find(w => w.name === 'Exodus')
        
        if (!provider || !wallet?.address) {
          throw new Error('Exodus wallet not properly connected')
        }

        // Sign message using Exodus
        signature = await provider.signMessage({
          address: wallet.address,
          message: message
        })
      }

      if (signature) {
        onSignMessage?.(signature)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign message')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Wallet Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Bitcoin Wallet Connection</span>
          </h3>
          {selectedWallet && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Connected</span>
            </span>
          )}
        </div>

        {/* Important Notice - Mainnet Only */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                ⚠️ Bitcoin Mainnet Only
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                <strong>Phantom and Exodus only support Bitcoin mainnet addresses.</strong> For Bitcoin testnet, please use manual entry with Sparrow, Electrum, or Bitcoin Core wallets that support testnet.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Warning */}
        {isMobile && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Mobile Device Detected
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  For best experience, use the Phantom or Exodus mobile app with WalletConnect, or switch to desktop.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Phantom Wallet */}
          <div className={`border rounded-lg p-4 transition-all ${
            selectedWallet === 'Phantom' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallets.find(w => w.name === 'Phantom')?.icon}</span>
                <div>
                  <h4 className="font-semibold">Phantom</h4>
                  <p className="text-xs text-muted-foreground">Recommended</p>
                </div>
              </div>
              {wallets.find(w => w.name === 'Phantom')?.detected ? (
                <span className="text-xs text-green-600 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Detected</span>
                </span>
              ) : (
                <span className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Not found</span>
                </span>
              )}
            </div>

            {wallets.find(w => w.name === 'Phantom')?.address && (
              <div className="mb-3 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                {wallets.find(w => w.name === 'Phantom')?.address}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={connectPhantom}
                disabled={isConnecting || selectedWallet === 'Phantom'}
                className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
              >
                {selectedWallet === 'Phantom' ? 'Connected' : 'Connect Phantom'}
              </button>
              
              {/* BIP-322 Sign button */}
              {selectedWallet === 'Phantom' && wallets.find(w => w.name === 'Phantom')?.address && (
                <button
                  onClick={async () => {
                    const message = document.querySelector<HTMLTextAreaElement>('textarea[name="message"]')?.value
                    if (!message) {
                      setError('Please enter a message to sign')
                      return
                    }
                    await signMessageWithWallet(message)
                  }}
                  disabled={isConnecting}
                  className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
                >
                  Sign BIP-322 Message
                </button>
              )}
            </div>
            
            {/* Show reconnect message if Phantom has issues */}
            {error?.includes('Unable to connect') && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-900 mb-2">Connection Issue</p>
                <p className="text-xs text-amber-800">Please ensure:</p>
                <ul className="list-disc list-inside text-xs text-amber-700 space-y-1 mt-1">
                  <li>Phantom wallet is unlocked</li>
                  <li>Bitcoin is enabled in Settings</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
            )}

            {!wallets.find(w => w.name === 'Phantom')?.detected && (
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center space-x-1 text-xs text-primary hover:underline"
              >
                <span>Install Phantom</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Exodus Wallet */}
          <div className={`border rounded-lg p-4 transition-all ${
            selectedWallet === 'Exodus' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallets.find(w => w.name === 'Exodus')?.icon}</span>
                <div>
                  <h4 className="font-semibold">Exodus</h4>
                  <p className="text-xs text-muted-foreground">Alternative</p>
                </div>
              </div>
              {wallets.find(w => w.name === 'Exodus')?.detected ? (
                <span className="text-xs text-green-600 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Detected</span>
                </span>
              ) : (
                <span className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Not found</span>
                </span>
              )}
            </div>

            {wallets.find(w => w.name === 'Exodus')?.address && (
              <div className="mb-3 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                {wallets.find(w => w.name === 'Exodus')?.address}
              </div>
            )}

            <button
              onClick={connectExodus}
              disabled={isConnecting || selectedWallet === 'Exodus'}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {selectedWallet === 'Exodus' ? 'Connected' : 'Connect Exodus'}
            </button>

            {!wallets.find(w => w.name === 'Exodus')?.detected && (
              <a
                href="https://www.exodus.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center space-x-1 text-xs text-primary hover:underline"
              >
                <span>Install Exodus</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Error Message - hide for Phantom-specific issues as they're shown inline */}
        {error && !error.includes('Phantom Bitcoin connection') && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {isConnecting && (
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Connecting wallet...</span>
          </div>
        )}
      </div>
    </div>
  )
}