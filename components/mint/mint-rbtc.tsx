'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft, AlertCircle, Loader2, CheckCircle, Info, Bitcoin, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Copy, Wallet, Shield, Check } from 'lucide-react'
import { mintFormSchema, MintForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { DepositFeeVault } from './deposit-fee-vault'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CONTRACTS } from '@/app/lib/contracts'
import { getVerifiedBitcoinAddresses } from '@/lib/user-data-storage'
import { requestOracleSync } from '@/lib/transaction-storage'

interface MintRBTCProps {
  onMintComplete?: (data: MintForm) => void
}

export function MintRBTC({ onMintComplete }: MintRBTCProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error' | 'already-syncing'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [verifiedBitcoinAddress, setVerifiedBitcoinAddress] = useState<string>('')
  const [allVerifiedAddresses, setAllVerifiedAddresses] = useState<{address: string, verifiedAt: string}[]>([])
  const [bitcoinBalance, setBitcoinBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [addressHasSpentCoins, setAddressHasSpentCoins] = useState(false)
  const [showFeeVaultWarning, setShowFeeVaultWarning] = useState(false)
  const [showAutoSyncDetails, setShowAutoSyncDetails] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsDetails, setShowTermsDetails] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  
  // Token Contract Addresses
  const RBTC_TOKEN_ADDRESS = '0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB' // rBTC-SYNTH (soulbound)
  const WRBTC_TOKEN_ADDRESS = '0xa10FC332f12d102Dddf431F8136E4E89279EFF87' // wrBTC (transferable)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<MintForm>({
    resolver: zodResolver(mintFormSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '0',
      bitcoinAddress: ''
    }
  })

  const amount = watch('amount')
  const bitcoinAddress = watch('bitcoinAddress')
  const bitcoinValidation = verifiedBitcoinAddress ? validateBitcoinAddress(verifiedBitcoinAddress) : null

  // Fetch Bitcoin balance for specific Bitcoin address using existing Oracle infrastructure
  const fetchBitcoinBalance = useCallback(async (btcAddress: string) => {
    console.log('🔍 Fetching balance for specific Bitcoin address:', btcAddress)
    setIsLoadingBalance(true)
    setHasAttemptedFetch(false)
    
    try {
      // For direct Bitcoin API, we don't need Ethereum address
      console.log('Starting Bitcoin balance fetch, Ethereum address available:', !!address)

      // Add small delay to avoid race conditions during Bitcoin transaction processing
      await new Promise(resolve => setTimeout(resolve, 500))

      // Try to get balance directly from Bitcoin blockchain for this specific address
      console.log('🌐 Fetching Bitcoin balance directly from blockchain for:', btcAddress)
      
      try {
        // Use Blockstream API for testnet (tb1 addresses)
        const isTestnet = btcAddress.startsWith('tb1') || btcAddress.startsWith('2') || btcAddress.startsWith('m') || btcAddress.startsWith('n')
        const apiUrl = isTestnet 
          ? `https://blockstream.info/testnet/api/address/${btcAddress}`
          : `https://blockstream.info/api/address/${btcAddress}`
        
        console.log('🔗 Using Bitcoin API:', apiUrl)
        
        const bitcoinResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'ReserveBTC-Frontend/1.0'
          }
        })

        if (bitcoinResponse.ok) {
          const bitcoinData = await bitcoinResponse.json()
          console.log('⚡ Bitcoin API response:', bitcoinData)
          
          const balanceInSats = bitcoinData.chain_stats?.funded_txo_sum || 0
          const spentInSats = bitcoinData.chain_stats?.spent_txo_sum || 0
          const currentBalanceInSats = balanceInSats - spentInSats
          
          // Check if address has made outgoing transactions (spent coins)
          const hasSpentCoins = spentInSats > 0
          console.log('🔍 Address transaction analysis:', {
            received: balanceInSats,
            spent: spentInSats,
            currentBalance: currentBalanceInSats,
            hasSpentCoins
          })
          
          setAddressHasSpentCoins(hasSpentCoins)
          
          const bitcoinBalance = currentBalanceInSats / 100000000 // Convert sats to BTC
          console.log('✅ Direct Bitcoin balance for', btcAddress, ':', bitcoinBalance, 'BTC')
          setBitcoinBalance(bitcoinBalance)
          setValue('amount', bitcoinBalance.toString())
          return
        } else {
          console.log('⚠️ Bitcoin API failed, trying Oracle fallback...')
        }
      } catch (bitcoinError) {
        console.log('⚠️ Bitcoin API error, trying Oracle fallback:', bitcoinError)
      }

      // Fallback: Try Oracle system (only if we have Ethereum address and publicClient)
      if (publicClient && address) {
        console.log('🔄 Fallback: Using Oracle Aggregator contract...')
        
        const lastSats = await publicClient.readContract({
          address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
          abi: [
            {
              name: 'lastSats',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'user', type: 'address' }],
              outputs: [{ name: '', type: 'uint64' }]
            }
          ],
          functionName: 'lastSats',
          args: [address]
        })
        
        const bitcoinBalance = Number(lastSats) / 100000000 // Convert sats to BTC
        console.log('📊 Fallback balance from Oracle Aggregator:', bitcoinBalance, 'BTC')
        setBitcoinBalance(bitcoinBalance)
        setValue('amount', bitcoinBalance.toString())
      } else {
        console.log('⚠️ No fallback available - missing Ethereum connection')
        setBitcoinBalance(0)
        setValue('amount', '0')
      }
    } catch (error) {
      console.error('❌ Failed to fetch Bitcoin balance:', error)
      // Fallback to 0
      setBitcoinBalance(0)
      setValue('amount', '0')
    } finally {
      setIsLoadingBalance(false)
      setHasAttemptedFetch(true)
    }
  }, [publicClient, address, setValue])

  // Load verified Bitcoin address from centralized storage
  useEffect(() => {
    const loadVerifiedAddress = async () => {
      // Check if we have URL parameters that indicate we should load an address
      const fromVerify = searchParams.get('from') === 'verify'
      const specificAddress = searchParams.get('address')
      
      // If no address but we have URL params, try to load anyway for Bitcoin balance
      if (!address && !specificAddress) {
        console.log('⏳ Waiting for Ethereum address or URL params...')
        return
      }
      
      // If we have URL params but no Ethereum address, we can still fetch Bitcoin balance
      if (specificAddress && !address) {
        console.log('📱 No Ethereum address yet, but we have Bitcoin address from URL:', specificAddress)
        setVerifiedBitcoinAddress(specificAddress)
        setValue('bitcoinAddress', specificAddress, { shouldValidate: true })
        setBitcoinBalance(0)
        setIsLoadingBalance(true)
        setHasAttemptedFetch(false)
        setAddressHasSpentCoins(false)
        fetchBitcoinBalance(specificAddress)
        return
      }
      
      if (!address) return
      
      try {
        const verifiedAddrs = await getVerifiedBitcoinAddresses(address)
        console.log('📋 Loading verified addresses from centralized storage:', verifiedAddrs)
        
        if (verifiedAddrs.length > 0) {
          // Store all addresses for dropdown
          setAllVerifiedAddresses(verifiedAddrs.map(addr => ({
            address: addr.address,
            verifiedAt: addr.verifiedAt
          })))
          
          // Check if coming from verification page or if there's a specific address in URL
          const fromVerify = searchParams.get('from') === 'verify'
          const specificAddress = searchParams.get('address')
          
          let selectedAddress = ''
          let forceBalanceReload = false
          
          if (specificAddress) {
            // Always use the specific address from URL, even if it's newly verified
            selectedAddress = specificAddress
            forceBalanceReload = true // Force balance reload for URL address
            console.log('✅ Using address from URL parameter (forcing balance reload):', selectedAddress)
          } else if (fromVerify) {
            // If coming from verification page, use the most recently verified address
            const sortedAddrs = verifiedAddrs.sort((a, b) => 
              new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
            )
            selectedAddress = sortedAddrs[0].address
            forceBalanceReload = true // Force balance reload from verification
            console.log('✅ Coming from verification page, selecting latest (forcing balance reload):', selectedAddress)
          } else {
            // Default to latest verified address
            const sortedAddrs = verifiedAddrs.sort((a, b) => 
              new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
            )
            selectedAddress = sortedAddrs[0].address
            console.log('✅ Auto-selecting latest verified address:', selectedAddress)
          }
          
          // Force reset balance and loading state when address changes
          if (forceBalanceReload || selectedAddress !== verifiedBitcoinAddress) {
            console.log('🔄 Forcing balance reset and reload for address:', selectedAddress)
            setBitcoinBalance(0) // Reset balance immediately
            setIsLoadingBalance(true) // Show loading state
            setHasAttemptedFetch(false) // Reset fetch state
            setAddressHasSpentCoins(false) // Reset spent coins state
          }
          
          setVerifiedBitcoinAddress(selectedAddress)
          setValue('bitcoinAddress', selectedAddress, { shouldValidate: true })
          
          // Immediately fetch balance for the new address if we have URL params (works without address)
          if (selectedAddress && (forceBalanceReload || selectedAddress !== verifiedBitcoinAddress)) {
            console.log('🚀 Immediately fetching balance for new address from URL:', selectedAddress)
            fetchBitcoinBalance(selectedAddress)
          }
        } else {
          console.log('⚠️ No verified Bitcoin address found')
          setHasAttemptedFetch(true)
        }
      } catch (error) {
        console.error('❌ Error loading verified addresses:', error)
        setHasAttemptedFetch(true)
      }
    }
    
    loadVerifiedAddress()
  }, [address, setValue, searchParams])

  // Auto-refresh when all required data is available
  useEffect(() => {
    if (verifiedBitcoinAddress && publicClient && address && !hasAttemptedFetch) {
      console.log('All data ready, starting balance fetch:', { verifiedBitcoinAddress, hasPublicClient: !!publicClient, hasAddress: !!address })
      fetchBitcoinBalance(verifiedBitcoinAddress)
    }
  }, [verifiedBitcoinAddress, publicClient, address, hasAttemptedFetch, fetchBitcoinBalance])

  // Reload balance when Bitcoin address changes (but not on initial load from URL)
  useEffect(() => {
    // Only run if we have a previous address (not initial load)
    if (verifiedBitcoinAddress && publicClient && address && hasAttemptedFetch) {
      console.log('💰 Bitcoin address changed after initial load, reloading balance for:', verifiedBitcoinAddress)
      setHasAttemptedFetch(false) // Reset fetch state
      fetchBitcoinBalance(verifiedBitcoinAddress)
    }
  }, [verifiedBitcoinAddress, publicClient, address, fetchBitcoinBalance, hasAttemptedFetch])


  // Refresh balance - force refresh regardless of current state
  const refreshBalance = useCallback(() => {
    console.log('🔄 Manual Refresh button clicked')
    console.log('Current state:', { 
      verifiedBitcoinAddress, 
      hasPublicClient: !!publicClient, 
      hasAddress: !!address,
      isLoadingBalance,
      hasAttemptedFetch
    })
    
    if (!verifiedBitcoinAddress && address) {
      // Try to reload from centralized storage first
      const reloadAddress = async () => {
        try {
          const verifiedAddrs = await getVerifiedBitcoinAddresses(address)
          if (verifiedAddrs.length > 0) {
            const firstAddress = verifiedAddrs[0].address
            console.log('🔄 Reloading address from centralized storage:', firstAddress)
            setVerifiedBitcoinAddress(firstAddress)
            setValue('bitcoinAddress', firstAddress, { shouldValidate: true })
          }
        } catch (error) {
          console.error('❌ Failed to reload address:', error)
        }
      }
      reloadAddress()
      return // Exit early to let the address reload complete
    }
    
    if (verifiedBitcoinAddress && publicClient && address) {
      console.log('🔄 Triggering balance fetch')
      setHasAttemptedFetch(false)
      fetchBitcoinBalance(verifiedBitcoinAddress)
    } else {
      console.warn('❌ No Bitcoin address available for refresh')
      return
    }
  }, [verifiedBitcoinAddress, publicClient, address, fetchBitcoinBalance, setValue, isLoadingBalance, hasAttemptedFetch])

  // Monitor address transaction status for quantum warning
  useEffect(() => {
    if (verifiedBitcoinAddress && !isLoadingBalance && hasAttemptedFetch) {
      console.log('🔍 Quantum warning check:', {
        address: verifiedBitcoinAddress,
        hasSpentCoins: addressHasSpentCoins,
        balance: bitcoinBalance,
        showWarning: addressHasSpentCoins
      })
      
      if (addressHasSpentCoins) {
        console.log('⚠️ Address has spent coins - quantum warning should be visible')
      } else {
        console.log('✅ Address has no outgoing transactions - no quantum warning')
      }
    }
  }, [verifiedBitcoinAddress, addressHasSpentCoins, isLoadingBalance, hasAttemptedFetch, bitcoinBalance])

  // Convert BTC to satoshis (now using bitcoinBalance instead of amount)
  const amountInSatoshis = bitcoinBalance ? Math.round(bitcoinBalance * 100_000_000) : 0
  
  // Copy token address to clipboard
  const copyTokenAddress = async () => {
    try {
      await navigator.clipboard.writeText(RBTC_TOKEN_ADDRESS)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const onSubmit = async (data: MintForm) => {
    console.log('Mint form submitted with data:', {
      amount: data.amount,
      bitcoinAddress: data.bitcoinAddress,
      verifiedBitcoinAddress,
      bitcoinBalance,
      address
    })
    
    // Check if Oracle sync was already initiated
    const syncInitiated = localStorage.getItem(`oracle_sync_initiated_${address}`)
    if (syncInitiated === 'true') {
      console.log('Oracle sync already initiated for this address')
      // Oracle is already syncing automatically, show info message
      setMintStatus('already-syncing')
      return
    }
    
    // Check actual FeeVault balance from contract
    try {
      const feeVaultBalance = await publicClient.readContract({
        address: CONTRACTS.FEE_VAULT as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }) as unknown as bigint
      
      const balanceInEth = parseFloat(formatEther(feeVaultBalance))
      console.log('Actual FeeVault balance:', balanceInEth, 'ETH for address:', address)
      
      // Require minimum 0.01 ETH in Fee Vault
      if (balanceInEth < 0.01) {
        console.log(`FeeVault balance ${balanceInEth} ETH is below minimum 0.01 ETH, showing warning`)
        setShowFeeVaultWarning(true)
        
        // Smooth scroll to FeeVault component with a slight delay for visual feedback
        setTimeout(() => {
          const feeVaultElement = document.querySelector('#fee-vault-section')
          if (feeVaultElement) {
            // Add visual highlight effect
            feeVaultElement.classList.add('ring-2', 'ring-amber-500', 'ring-offset-2')
            feeVaultElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            
            // Remove highlight after animation
            setTimeout(() => {
              feeVaultElement.classList.remove('ring-2', 'ring-amber-500', 'ring-offset-2')
            }, 3000)
          }
        }, 100)
        return
      }
      
      console.log(`✅ FeeVault has sufficient balance: ${balanceInEth} ETH`)
    } catch (error) {
      console.error('❌ Error checking FeeVault balance:', error)
      // Fallback to warning if we can't check balance
      setShowFeeVaultWarning(true)
      return
    }

    console.log('FeeVault verified, proceeding with mint')
    setIsMinting(true)
    setMintStatus('pending')
    setShowFeeVaultWarning(false)

    try {
      // For the first mint, we just need to ensure FeeVault has balance
      // The Oracle will automatically sync when it detects Bitcoin balance changes
      // This is a simulation for testnet - in production, the Oracle service handles this
      
      console.log('Starting mint simulation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate a mock transaction hash for testnet
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`
      
      setTxHash(mockTxHash)
      setMintStatus('success')
      
      // Store that initial mint was triggered
      localStorage.setItem(`oracle_sync_initiated_${address}`, 'true')
      
      onMintComplete?.(data)
      
      // Note: In production, the Oracle will automatically:
      // 1. Detect Bitcoin balance changes  
      // 2. Call sync() function on OracleAggregator
      // 3. Mint/burn rBTC tokens accordingly
      // 4. Deduct fees from FeeVault
    } catch (error) {
      console.error('Mint initiation failed:', error)
      setMintStatus('error')
    } finally {
      setIsMinting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-500">
        <div className="p-3 bg-destructive/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold">Wallet Not Connected</h1>
        <p className="text-muted-foreground">
          Please connect your wallet to continue with the minting process.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* FeeVault Section with Title */}
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Wallet className="h-8 w-8 text-amber-600 dark:text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              Oracle Fee Vault
            </span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Fund your vault to enable automatic Bitcoin synchronization
          </p>
        </div>
        
        {/* Deposit FeeVault Component */}
        <div id="fee-vault-section" className="transition-all duration-300 rounded-xl">
          <DepositFeeVault />
        </div>
      </div>
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground">THEN</span>
        </div>
      </div>
      
      {/* Mint Section */}
      <div className="text-center space-y-4">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Bitcoin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-500 via-primary to-blue-600 bg-clip-text text-transparent">
            Mint rBTC Token
          </span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Initialize automatic minting of 1:1 backed rBTC on MegaETH
        </p>
      </div>

      {mintStatus === 'idle' && (
        <div className="bg-card border rounded-xl p-8 space-y-6">
          <form onSubmit={(e) => {
            e.preventDefault()
            console.log('Form submit prevented, calling onSubmit directly')
            // Call onSubmit directly with current values
            onSubmit({
              amount: bitcoinBalance.toString(),
              bitcoinAddress: verifiedBitcoinAddress
            })
          }} className="space-y-6">
            {/* Bitcoin Balance from Verified Wallet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Bitcoin className="h-4 w-4" />
                  Bitcoin Balance (from verified wallet)
                </label>
                <button
                  type="button"
                  onClick={refreshBalance}
                  disabled={isLoadingBalance}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={bitcoinBalance.toFixed(8)}
                  className="w-full px-4 py-3 border rounded-lg bg-muted/50 cursor-not-allowed pr-16 font-mono"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  BTC
                </div>
              </div>
              {amountInSatoshis > 0 && (
                <div className="text-sm text-muted-foreground">
                  = {amountInSatoshis.toLocaleString()} satoshis
                </div>
              )}
              {/* Loading spinner for balance */}
              {isLoadingBalance && verifiedBitcoinAddress && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Checking Bitcoin balance...
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quantum protection warning - only if address has spent coins (made outgoing transactions) */}
              {addressHasSpentCoins && !isLoadingBalance && hasAttemptedFetch && verifiedBitcoinAddress && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400 text-xl flex-shrink-0">🔐</div>
                    <div className="space-y-3 flex-1">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        Quantum-Safe Protocol: Address Balance Empty
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        <strong>Important:</strong> This address has made an outgoing transaction, exposing its public key on the blockchain. 
                        For quantum security, Bitcoin automatically moves funds to new addresses after any spending transaction.
                      </p>
                      <div className="bg-blue-100/50 dark:bg-blue-800/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">🛡️ Quantum Protection Explained:</p>
                        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400 ml-2">
                          <li>• <strong>Incoming only:</strong> Safe from quantum attacks (public key hidden)</li>
                          <li>• <strong>After spending:</strong> Public key revealed, theoretically vulnerable</li>
                          <li>• <strong>Best practice:</strong> Use fresh addresses for receiving</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Next Steps:</p>
                        <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3">
                          <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                            <strong>Recommended:</strong> Verify a new address from your wallet that contains Bitcoin and has never made outgoing transactions.
                          </p>
                          <Link 
                            href="/verify" 
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all"
                          >
                            <Shield className="h-3 w-3" />
                            Verify Quantum-Safe Address
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                ℹ️ Balance is fetched automatically from your verified Bitcoin wallet
              </p>
            </div>

            {/* Verified Bitcoin Address Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Verified Bitcoin Address</label>
              
              {/* Current selected address display */}
              <div className="relative">
                {verifiedBitcoinAddress ? (
                  <div className="w-full px-4 py-3 border rounded-lg bg-background font-mono text-sm flex items-center justify-between group">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Bitcoin className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm truncate">
                          {verifiedBitcoinAddress}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {verifiedBitcoinAddress.startsWith('tb1') ? 'Testnet' : 'Mainnet'} • {getBitcoinAddressTypeLabel(bitcoinValidation?.type || 'unknown')}
                        </div>
                      </div>
                    </div>
                    
                    {allVerifiedAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors ml-3"
                      >
                        <span className="text-xs font-medium text-primary">
                          {allVerifiedAddresses.length} addresses
                        </span>
                        <ChevronDown className={`h-4 w-4 text-primary transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 border rounded-lg bg-muted/50 cursor-not-allowed font-mono text-sm text-muted-foreground">
                    No verified address
                  </div>
                )}
                
                {/* Dropdown menu */}
                {showAddressDropdown && allVerifiedAddresses.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b mb-2">
                        Select Bitcoin Address ({allVerifiedAddresses.length} verified)
                      </div>
                      {allVerifiedAddresses.map((addr, index) => {
                        const isSelected = addr.address === verifiedBitcoinAddress
                        const isLatest = index === 0 // Addresses are sorted by verifiedAt desc
                        const verificationDate = new Date(addr.verifiedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        
                        return (
                          <button
                            key={addr.address}
                            type="button"
                            onClick={() => {
                              console.log('🔄 Dropdown: Address selected, switching to:', addr.address)
                              
                              // Reset balance state immediately to show loading
                              setBitcoinBalance(0)
                              setIsLoadingBalance(true)
                              setHasAttemptedFetch(false)
                              setAddressHasSpentCoins(false)
                              
                              // Update address state
                              setVerifiedBitcoinAddress(addr.address)
                              setValue('bitcoinAddress', addr.address, { shouldValidate: true })
                              setShowAddressDropdown(false)
                              
                              // Force refresh balance for new address
                              if (addr.address) {
                                console.log('🔄 Dropdown: Force fetching balance for new address:', addr.address)
                                fetchBitcoinBalance(addr.address)
                              }
                            }}
                            className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center justify-between hover:bg-muted/50 ${
                              isSelected ? 'bg-primary/10 ring-1 ring-primary/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <div className={`p-1 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                                  <Bitcoin className={`h-3 w-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-sm truncate">
                                    {addr.address}
                                  </span>
                                  {isLatest && (
                                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded font-medium">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {addr.address.startsWith('tb1') ? 'Testnet' : 'Mainnet'} • Verified {verificationDate}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Verification status */}
              {bitcoinValidation?.isValid && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified {getBitcoinAddressTypeLabel(bitcoinValidation.type)}</span>
                </div>
              )}
              
              {/* No address warning */}
              {!verifiedBitcoinAddress && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">No Verified Address</p>
                      <p className="text-amber-700 dark:text-amber-300 mt-1">
                        You need to verify at least one Bitcoin address to mint rBTC.
                      </p>
                      <Link 
                        href="/verify" 
                        className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Shield className="h-3 w-3" />
                        Verify Address
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Multiple addresses info */}
              {allVerifiedAddresses.length > 1 && (
                <div className="text-xs text-blue-600 flex items-center space-x-1">
                  <Info className="h-3 w-3" />
                  <span>You have {allVerifiedAddresses.length} verified addresses. Click the button above to switch between them.</span>
                </div>
              )}
            </div>

            {/* Mint Summary */}
            {bitcoinBalance > 0 && verifiedBitcoinAddress && (
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Mint Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Your Bitcoin balance:</span>
                    <span className="font-mono">{bitcoinBalance.toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>rBTC to receive:</span>
                    <span className="font-mono">{bitcoinBalance.toFixed(8)} rBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange rate:</span>
                    <span>1:1</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Network:</span>
                    <span>{verifiedBitcoinAddress.startsWith('tb1') ? 'Testnet' : 'Mainnet'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* FeeVault Warning - Show inline when trying to mint without deposit */}
            {showFeeVaultWarning && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-500 dark:border-amber-600 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-full animate-pulse">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                      Action Required: Deposit to Fee Vault First
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Before you can mint rBTC, you need to deposit ETH to the Fee Vault. This covers Oracle fees for automatic Bitcoin synchronization.
                    </p>
                    <div className="flex items-center justify-between bg-white/60 dark:bg-gray-900/60 rounded-lg p-3">
                      <div className="text-xs space-y-1">
                        <p className="text-amber-700 dark:text-amber-300 font-medium">Quick deposit options:</p>
                        <p className="text-amber-600 dark:text-amber-400">• Minimum: 0.01 ETH</p>
                        <p className="text-amber-600 dark:text-amber-400">• Recommended: 0.25 ETH</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const feeVaultElement = document.querySelector('#fee-vault-section')
                          if (feeVaultElement) {
                            feeVaultElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all')
                            feeVaultElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            setTimeout(() => {
                              feeVaultElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
                            }, 3000)
                          }
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Go to Fee Vault
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="accept-terms" className="flex-1 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    I accept the Terms of Service and understand the risks
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTermsDetails(!showTermsDetails)}
                    className="ml-2 text-primary hover:text-primary/80 underline text-xs"
                  >
                    {showTermsDetails ? 'Hide' : 'Read'} Terms
                  </button>
                </label>
              </div>
              
              {showTermsDetails && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-md space-y-3 text-xs text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-top duration-300">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      ⚖️ Legal Disclaimer & Terms of Service:
                    </p>
                    <ul className="space-y-2 list-disc list-inside ml-2">
                      <li>
                        <strong>Decentralized Protocol:</strong> ReserveBTC is a fully decentralized protocol with no central authority, company address, or custodial control.
                      </li>
                      <li>
                        <strong>Non-Custodial:</strong> Your Bitcoin remains in your wallet at all times. We never have access to your private keys or funds.
                      </li>
                      <li>
                        <strong>Automatic Synchronization:</strong> By clicking "Mint", you authorize automatic minting/burning of rBTC based on your Bitcoin balance changes.
                      </li>
                      <li>
                        <strong>Oracle Fees:</strong> Small fees (~0.001 ETH per sync) will be automatically deducted from your Fee Vault for each operation.
                      </li>
                      <li>
                        <strong>User Responsibility:</strong> You are solely responsible for:
                        <ul className="mt-1 ml-4 space-y-1">
                          <li>• Maintaining sufficient ETH in your Fee Vault</li>
                          <li>• Securing your Bitcoin and Ethereum wallets</li>
                          <li>• Understanding blockchain transaction risks</li>
                          <li>• Tax obligations in your jurisdiction</li>
                        </ul>
                      </li>
                      <li>
                        <strong>No Warranties:</strong> The protocol is provided "as is" without warranties of any kind. Smart contracts are immutable and cannot be modified.
                      </li>
                      <li>
                        <strong>Risk Acknowledgment:</strong> You acknowledge risks including but not limited to: smart contract bugs, Oracle failures, network congestion, and market volatility.
                      </li>
                      <li>
                        <strong>Jurisdiction:</strong> You confirm that using this protocol is legal in your jurisdiction and you comply with all applicable laws.
                      </li>
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ By accepting these terms, you acknowledge full understanding and assumption of all risks associated with using this decentralized protocol.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!verifiedBitcoinAddress || bitcoinBalance === 0 || isMinting || isLoadingBalance || !acceptedTerms}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
              onClick={() => {
                console.log('Button clicked, checking conditions:', {
                  verifiedBitcoinAddress,
                  bitcoinBalance,
                  isMinting,
                  isLoadingBalance,
                  acceptedTerms
                })
              }}
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Initiating Mint...</span>
                </>
              ) : isLoadingBalance ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading Balance...</span>
                </>
              ) : !verifiedBitcoinAddress ? (
                <span>Please Verify Bitcoin Address First</span>
              ) : bitcoinBalance === 0 ? (
                <span>No Bitcoin Balance Available</span>
              ) : !acceptedTerms ? (
                <span>Please Accept Terms to Continue</span>
              ) : (
                <span>Mint {bitcoinBalance.toFixed(8)} rBTC & Start Auto-Sync</span>
              )}
            </button>

            {/* Auto-Sync Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      🚀 Automatic Synchronization
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      After first mint, Oracle will automatically track your Bitcoin balance forever
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAutoSyncDetails(!showAutoSyncDetails)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  Details
                  {showAutoSyncDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              
              {showAutoSyncDetails && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top duration-300">
                  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 space-y-3">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200">
                      How Automatic Synchronization Works:
                    </h5>
                    <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                        <div>
                          <p className="font-medium">Bitcoin Deposits → Automatic Minting</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            When BTC arrives in your wallet, rBTC is automatically minted to your MegaETH address
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                        <div>
                          <p className="font-medium">Bitcoin Withdrawals → Automatic Burning</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            When BTC leaves your wallet, rBTC is automatically burned from your balance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                        <div>
                          <p className="font-medium">24/7 Oracle Monitoring</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Oracle continuously monitors Bitcoin blockchain and syncs changes within minutes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-100/70 dark:bg-amber-900/30 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                          ⚠️ Keep Fee Vault Funded
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Oracle deducts small fees (~0.001 ETH) for each sync operation. If your Fee Vault runs empty, 
                          automatic sync will pause until refilled. Monitor your balance above!
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                    💡 Pro tip: Deposit 0.25 ETH to Fee Vault for ~100 automatic operations
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {mintStatus === 'pending' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-yellow-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Transaction Found</h2>
            <p className="text-muted-foreground">
              Your mint transaction is being processed on MegaETH...
            </p>
          </div>
        </div>
      )}

      {mintStatus === 'success' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Mint Successful!</h2>
            <p className="text-muted-foreground">
              Your rBTC tokens have been minted successfully.
            </p>
            {txHash && (
              <div className="text-sm text-muted-foreground">
                Transaction:{' '}
                <a
                  href={`https://megaexplorer.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:text-primary/80 underline transition-colors"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3 justify-center">
            <a
              href={`https://megaexplorer.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
            <button
              onClick={() => {
                setMintStatus('idle')
                setTxHash('')
                // Reset form for next mint
                setAcceptedTerms(false)
                setShowFeeVaultWarning(false)
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
            >
              Mint More
            </button>
          </div>
          
          {/* Next Steps Instructions */}
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 text-left space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Next Steps: Add rBTC to Your Wallet
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  To see your rBTC tokens in MetaMask, you need to add the token contract:
                </p>
                
                <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 space-y-3">
                  <ol className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                      <span>Open MetaMask and click on "Import tokens" at the bottom</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                      <span>Select "Custom token" tab</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                      <div className="flex-1">
                        <span>Paste the rBTC token contract address:</span>
                        <div className="mt-2 flex items-center space-x-2">
                          <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all">
                            {RBTC_TOKEN_ADDRESS}
                          </code>
                          <button
                            onClick={copyTokenAddress}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                            title="Copy address"
                          >
                            {copiedAddress ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {copiedAddress && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                            ✓ Address copied to clipboard!
                          </p>
                        )}
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
                      <span>Token symbol will auto-populate as "rBTC-SYNTH"</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">5.</span>
                      <span>Decimals will auto-populate as "8" (Bitcoin standard)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">6.</span>
                      <span>Click "Next" then "Import" to add the token</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-amber-100/70 dark:bg-amber-900/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      <p className="font-medium mb-1">Important Notes:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Your rBTC balance will automatically update as Bitcoin moves in/out of your wallet</li>
                        <li>Keep your FeeVault funded for continuous automatic synchronization</li>
                        <li>rBTC-SYNTH is a <strong>soulbound</strong> token - it cannot be transferred to other addresses</li>
                        <li>rBTC balance is always tied to your Bitcoin wallet and updates automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* wrBTC Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-800/50 rounded-full">
                      <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        💡 Need Transferable Tokens? Use wrBTC!
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        If you need to transfer your Bitcoin value on MegaETH:
                      </p>
                      <ol className="space-y-2 text-xs text-purple-800 dark:text-purple-200 ml-4">
                        <li className="flex items-start space-x-1">
                          <span className="font-bold">1.</span>
                          <span>Wrap your rBTC into wrBTC (Wrapped Reserve BTC)</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="font-bold">2.</span>
                          <div className="flex-1">
                            <span>Add wrBTC token to MetaMask:</span>
                            <div className="mt-1 flex items-center space-x-2">
                              <code className="px-2 py-1 bg-purple-100 dark:bg-purple-800/50 rounded text-xs font-mono">
                                {WRBTC_TOKEN_ADDRESS}
                              </code>
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(WRBTC_TOKEN_ADDRESS)
                                    // Simple feedback without additional state
                                  } catch (err) {
                                    console.error('Failed to copy wrBTC address:', err)
                                  }
                                }}
                                className="p-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                                title="Copy wrBTC address"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="font-bold">3.</span>
                          <span>wrBTC can be transferred like any ERC-20 token</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="font-bold">4.</span>
                          <span>Redeem wrBTC back to rBTC anytime (1:1 ratio)</span>
                        </li>
                      </ol>
                      <p className="text-xs text-purple-600 dark:text-purple-400 italic mt-2">
                        Note: wrBTC is fully backed by rBTC and can be freely transferred between addresses
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mintStatus === 'already-syncing' && (
        <div className="bg-card border rounded-xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Automatic Sync Active</h2>
              <p className="text-muted-foreground">
                Oracle is already automatically syncing your Bitcoin balance.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                <strong>✅ Good news!</strong> Your wallet is already in automatic sync mode.
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-2">
                <li>• Oracle monitors your Bitcoin wallet 24/7</li>
                <li>• When BTC arrives → rBTC mints automatically</li>
                <li>• When BTC leaves → rBTC burns automatically</li>
                <li>• No manual intervention needed</li>
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                ⚠️ Keep your FeeVault funded to ensure continuous operation
              </p>
            </div>

            {/* Next Steps - Add Tokens to MetaMask */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 text-left max-w-2xl mx-auto">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-full">
                  <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">
                    Next Steps: View Your Tokens in MetaMask
                  </h3>
                  
                  {/* rBTC Token */}
                  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                      1. Add rBTC-SYNTH (Soulbound, auto-syncs with Bitcoin)
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                        {RBTC_TOKEN_ADDRESS}
                      </code>
                      <button
                        onClick={copyTokenAddress}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                        title="Copy rBTC address"
                      >
                        {copiedAddress ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Symbol: rBTC-SYNTH | Decimals: 8 | Non-transferable
                    </p>
                  </div>

                  {/* wrBTC Token */}
                  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      2. Add wrBTC (Transferable wrapped version)
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                        {WRBTC_TOKEN_ADDRESS}
                      </code>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(WRBTC_TOKEN_ADDRESS)
                            // Quick visual feedback
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                        title="Copy wrBTC address"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Symbol: wrBTC | Decimals: 8 | Transferable ERC-20
                    </p>
                  </div>

                  {/* How to wrap info */}
                  <div className="bg-amber-50/70 dark:bg-amber-900/20 rounded-lg p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <strong>💡 Tip:</strong> You can wrap rBTC → wrBTC anytime to make it transferable, 
                      then unwrap back to rBTC when needed (1:1 ratio, no fees).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setMintStatus('idle')
              router.push('/dashboard')
            }}
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      )}

      {mintStatus === 'error' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Mint Failed</h2>
            <p className="text-muted-foreground">
              There was an error processing your mint transaction. Please try again.
            </p>
          </div>
          <button
            onClick={() => {
              setMintStatus('idle')
              setTxHash('')
            }}
            className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

    </div>
  )
}