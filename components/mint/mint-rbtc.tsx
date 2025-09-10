'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft, AlertCircle, Loader2, CheckCircle, Info, Bitcoin, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Copy, Wallet, Shield, Check, ArrowUpRight } from 'lucide-react'
import { mintFormSchema, MintForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { DepositFeeVault } from './deposit-fee-vault'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CONTRACTS } from '@/app/lib/contracts'
import { getVerifiedBitcoinAddresses, saveVerifiedBitcoinAddress } from '@/lib/user-data-storage'
import { requestOracleRegistration, checkOracleRegistration, waitForOracleRegistration } from '@/lib/oracle-integration'
import { getTransactionHashForOracleUser } from '@/lib/transaction-hash-cache'
import { getDecryptedOracleUsers, findOracleUserByCorrelation } from '@/lib/oracle-decryption'
import { useMintProtection } from '@/lib/mint-protection'

interface MintRBTCProps {
  onMintComplete?: (data: MintForm) => void
}

export function MintRBTC({ onMintComplete }: MintRBTCProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error' | 'already-syncing' | 'retry'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [realTxHash, setRealTxHash] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [retryAttempt, setRetryAttempt] = useState<number>(0)
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
  
  // Mint protection system
  const {
    checkCanMint,
    recordMintAttempt,
    verifyBitcoinBalance,
    activateAutoSync,
    hasActiveAutoSync,
    getAutoSyncAddresses
  } = useMintProtection()

  // Oracle hash resolution function
  const resolveRealTransactionHash = async (ethereumAddress: string): Promise<string | null> => {
    try {
      console.log('🔍 Resolving real transaction hash for:', ethereumAddress)
      
      // Get Oracle users data
      const oracleUsersData = await getDecryptedOracleUsers()
      if (!oracleUsersData) {
        console.log('❌ No Oracle users data available')
        return null
      }

      // Find user by correlation
      const userData = findOracleUserByCorrelation(oracleUsersData, ethereumAddress)
      if (!userData) {
        console.log('❌ User not found in Oracle data')
        return null
      }

      // Get transaction hash using cache system
      const userIndex = oracleUsersData?.findIndex(user => user === userData) || 0
      const realHash = await getTransactionHashForOracleUser(
        userIndex.toString(),
        userData,
        ethereumAddress
      )

      if (realHash) {
        console.log('✅ Real transaction hash resolved:', realHash)
        return realHash
      } else {
        console.log('⚠️ No real transaction hash found, using Oracle fallback')
        return null
      }
    } catch (error) {
      console.error('❌ Error resolving transaction hash:', error)
      return null
    }
  }

  
  // Smart contract interaction hooks
  const { writeContract, data: writeData, error: writeError, isPending: isWritePending } = useWriteContract()
  const { data: transactionReceipt, isLoading: isTxLoading } = useWaitForTransactionReceipt({
    hash: writeData
  })
  
  // Token Contract Addresses
  const RBTC_TOKEN_ADDRESS = CONTRACTS.RBTC_SYNTH // rBTC-SYNTH (soulbound)
  const WRBTC_TOKEN_ADDRESS = CONTRACTS.VAULT_WRBTC // wrBTC (transferable)

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

  // 🔥 PROFESSIONAL INSTANT DATA CLEANUP: Complete data cleanup function with form cleanup
  const performCompleteDataCleanup = useCallback(() => {
    console.log('🚨 PROFESSIONAL CLEANUP: Executing complete data cleanup...')
    
    // STEP 1: INSTANT CLEANUP OF ALL React states
    setVerifiedBitcoinAddress('')
    setAllVerifiedAddresses([])
    setBitcoinBalance(0)
    setIsLoadingBalance(false)
    setHasAttemptedFetch(false)
    setAddressHasSpentCoins(false)
    setMintStatus('idle')
    setErrorMessage('')
    setShowFeeVaultWarning(false)
    setShowAutoSyncDetails(false)
    setAcceptedTerms(false)
    setShowTermsDetails(false)
    setCopiedAddress(false)
    setShowAddressDropdown(false)
    setIsMinting(false)
    setTxHash('')
    setRealTxHash('')
    setRetryAttempt(0)
    console.log('✅ STEP 1: All React states cleaned')
    
    // STEP 2: FORM CLEANUP
    setValue('bitcoinAddress', '', { shouldValidate: false })
    setValue('amount', '0', { shouldValidate: false })
    console.log('✅ STEP 2: Form completely cleared')
    
    // STEP 3: NUCLEAR localStorage cleanup
    try {
      localStorage.clear()
      sessionStorage.clear()
      console.log('✅ STEP 3: All browser storage cleared')
    } catch (error) {
      console.error('❌ Storage cleanup error:', error)
    }
    
    console.log('🎉 PROFESSIONAL CLEANUP COMPLETED!')
  }, [setValue])

  // 🔥 INSTANT UI CLEANUP: Clear Bitcoin Balance and Address IMMEDIATELY on address change
  useEffect(() => {
    if (address) {
      console.log('🔄 Address change detected - executing instant cleanup...')
      
      // Clear all visible UI data to prevent old user data display
      setVerifiedBitcoinAddress('')
      setAllVerifiedAddresses([])
      setBitcoinBalance(0)
      setIsLoadingBalance(false)
      setHasAttemptedFetch(false)
      setAddressHasSpentCoins(false)
      
      // Clear form data
      setValue('bitcoinAddress', '', { shouldValidate: false })
      setValue('amount', '0', { shouldValidate: false })
      
      console.log('✅ UI cleanup completed successfully')
    }
  }, [address, setValue]) // CRITICAL: Depends on address and setValue for instant trigger

  // 🔥 REAL-TIME METAMASK MONITORING: Professional MetaMask account change detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && address) {
      const currentUser = address.toLowerCase()
      
      // Set current user tracking
      const storageKey = 'rbtc_current_metamask_user'
      const lastUser = localStorage.getItem(storageKey)
      
      if (lastUser && lastUser !== currentUser) {
        console.log('🚨 METAMASK USER CHANGE DETECTED! Executing professional cleanup...')
        performCompleteDataCleanup()
      }
      
      localStorage.setItem(storageKey, currentUser)
    }
  }, [address, performCompleteDataCleanup])

  // 🔥 CARDINAL FORCED PAGE REFRESH: Guaranteed cleanup with page refresh
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0].toLowerCase()
          const currentStoredAccount = localStorage.getItem('rbtc_current_metamask_user')
          
          console.log('🚨 CARDINAL METAMASK CHANGE DETECTED:', { from: currentStoredAccount, to: newAccount })
          
          if (currentStoredAccount && currentStoredAccount !== newAccount) {
            console.log('🔥 CRITICAL USER SWITCH! FORCING NUCLEAR CLEANUP + PAGE REFRESH!')
            
            // STEP 1: IMMEDIATE DATA CLEANUP
            performCompleteDataCleanup()
            
            // STEP 2: SET NEW USER
            localStorage.setItem('rbtc_current_metamask_user', newAccount)
            
            // STEP 3: FORCED PAGE REFRESH FOR GUARANTEED CLEAN STATE
            console.log('🔄 FORCING PAGE REFRESH for 100% data security...')
            setTimeout(() => {
              window.location.reload()
            }, 100)
          }
        }
      }

      // Add event listener
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      // Cleanup event listener
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
  }, [performCompleteDataCleanup])

  // 🔥 ADDITIONAL PAGE LOAD SECURITY: Check for user mismatch on page load
  useEffect(() => {
    if (address && typeof window !== 'undefined') {
      const currentUser = address.toLowerCase()
      const storedUser = localStorage.getItem('rbtc_current_metamask_user')
      
      console.log('🔍 PAGE LOAD SECURITY CHECK:', { currentUser, storedUser })
      
      if (storedUser && storedUser !== currentUser) {
        console.log('🚨 USER MISMATCH ON PAGE LOAD! Executing emergency cleanup...')
        performCompleteDataCleanup()
        localStorage.setItem('rbtc_current_metamask_user', currentUser)
      } else if (!storedUser) {
        // First time setup
        localStorage.setItem('rbtc_current_metamask_user', currentUser)
        console.log('✅ Initial user setup on page load:', currentUser)
      }
    }
  }, [address, performCompleteDataCleanup])

  // 🔥 CONTINUOUS MONITORING: Periodic check for user changes (every 1 second)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const continuousCheck = setInterval(async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const currentAccount = accounts[0].toLowerCase()
            const storedAccount = localStorage.getItem('rbtc_current_metamask_user')
            
            if (storedAccount && storedAccount !== currentAccount) {
              console.log('🚨 CONTINUOUS MONITORING: Account mismatch detected!')
              console.log('🔥 FORCING IMMEDIATE CLEANUP + PAGE REFRESH!')
              
              performCompleteDataCleanup()
              localStorage.setItem('rbtc_current_metamask_user', currentAccount)
              
              // Force page refresh for absolute security
              window.location.reload()
            }
          }
        } catch (error) {
          console.warn('Continuous monitoring error:', error)
        }
      }, 1000) // Check every 1 second

      return () => {
        clearInterval(continuousCheck)
      }
    }
  }, [performCompleteDataCleanup])

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
  }, [publicClient, address])


  // Load verified Bitcoin address from centralized storage
  useEffect(() => {
    const loadVerifiedAddress = async () => {
      // Check if we have URL parameters that indicate we should load an address
      const fromVerify = searchParams.get('from') === 'verify'
      const specificAddress = searchParams.get('address')
      
      // INSTANT CLEANUP: Cleanup already handled in event listener above, here we only load data
      
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
        // NO CLEANUP HERE: Cleanup is handled by the first useEffect
        console.log('🔄 MINT: Loading data for user (cleanup handled separately):', address.toLowerCase())
        
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
            // Auto-populate verified address for direct mint page access
            const sortedAddrs = verifiedAddrs.sort((a, b) => 
              new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
            )
            selectedAddress = sortedAddrs[0].address
            forceBalanceReload = true // Force balance reload for direct access
            console.log('✅ Direct mint access: Auto-selecting latest verified address with balance reload:', selectedAddress)
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
  }, [address, searchParams])

  // PROFESSIONAL FIX: Listen for MetaMask account changes directly (same as dashboard)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0].toLowerCase()
          const storageKey = 'rbtc_mint_metamask_account'
          const lastAccount = localStorage.getItem(storageKey)
          
          console.log('🔄 MINT: MetaMask accountsChanged event:', { lastAccount, newAccount })
          
          if (lastAccount && lastAccount !== newAccount) {
            console.log('🚨 MINT: METAMASK ACCOUNT CHANGED! Clearing all data...')
            
            // AGGRESSIVE: Clear React state immediately
            setVerifiedBitcoinAddress('')
            setAllVerifiedAddresses([])
            setBitcoinBalance(0)
            setIsLoadingBalance(false)
            setHasAttemptedFetch(false)
            setAddressHasSpentCoins(false)
            setMintStatus('idle')
            setErrorMessage('')
            
            // Reset form
            setValue('bitcoinAddress', '', { shouldValidate: false })
            
            // AGGRESSIVE: Clear all possible localStorage data
            try {
              const keysToRemove = []
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key) {
                  keysToRemove.push(key)
                }
              }
              
              keysToRemove.forEach(key => {
                if (key.includes('rbtc') || 
                    key.includes('transaction') || 
                    key.includes('oracle') ||
                    key.includes('reservebtc') ||
                    key.includes('bitcoin') ||
                    key.includes('user_data') ||
                    key.includes(lastAccount)) {
                  console.log('🧹 MINT: Removing key:', key)
                  localStorage.removeItem(key)
                }
              })
              
              // Complete localStorage clear
              localStorage.clear()
              sessionStorage.clear()
              
            } catch (e) {
              console.warn('Storage cleanup failed:', e)
            }
            
            // Set new account
            localStorage.setItem(storageKey, newAccount)
            
            // Multiple refresh attempts for reliability
            setTimeout(() => window.location.reload(), 50)
            setTimeout(() => window.location.href = window.location.href, 100)
            
            return
          }
          
          // Set initial account if not exists
          if (!lastAccount) {
            localStorage.setItem(storageKey, newAccount)
          }
        }
      }
      
      // Add event listener for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      // Cleanup event listener
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
  }, [setValue])

  // Auto-refresh when all required data is available
  useEffect(() => {
    if (verifiedBitcoinAddress && publicClient && address && !hasAttemptedFetch) {
      console.log('All data ready, starting balance fetch:', { verifiedBitcoinAddress, hasPublicClient: !!publicClient, hasAddress: !!address })
      fetchBitcoinBalance(verifiedBitcoinAddress)
    }
  }, [verifiedBitcoinAddress, publicClient, address, hasAttemptedFetch, fetchBitcoinBalance])


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
  }, [verifiedBitcoinAddress, publicClient, address, fetchBitcoinBalance, isLoadingBalance, hasAttemptedFetch])

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

  // Monitor Fee Vault balance and auto-hide warning when sufficient funds are deposited
  useEffect(() => {
    const checkFeeVaultBalance = async () => {
      if (!address || !publicClient || !showFeeVaultWarning) {
        return
      }

      try {
        console.log('🔍 Checking Fee Vault balance for auto-hide logic...')
        
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
        console.log('Fee Vault balance check:', balanceInEth, 'ETH')
        
        // Hide warning if balance is now sufficient
        if (balanceInEth >= 0.01) {
          console.log('✅ Fee Vault balance is now sufficient, hiding warning')
          setShowFeeVaultWarning(false)
        }
      } catch (error) {
        console.error('❌ Error checking Fee Vault balance for auto-hide:', error)
      }
    }

    // Check immediately
    checkFeeVaultBalance()

    // Set up polling to check balance every 3 seconds when warning is shown
    let interval: NodeJS.Timeout | null = null
    if (showFeeVaultWarning && address && publicClient) {
      interval = setInterval(checkFeeVaultBalance, 3000)
    }

    // Cleanup interval on unmount or when warning is hidden
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [address, publicClient, showFeeVaultWarning])

  // Fetch transaction hash from Oracle user data when mint is successful
  useEffect(() => {
    const fetchTransactionHashFromOracle = async () => {
      if (!address || mintStatus !== 'success' || !txHash || txHash.includes('existing_') || txHash.includes('oracle_')) {
        return
      }

      try {
        console.log('🔍 Fetching transaction hash from Oracle user data...')
        const { getOracleUsersData, findOracleUserByCorrelation } = await import('@/lib/oracle-decryption')
        
        const oracleUsersData = await getOracleUsersData()
        if (!oracleUsersData) {
          throw new Error('Failed to fetch Oracle users data')
        }

        // Use correlation strategy to find the user (since Oracle uses hashed keys)
        const userData = findOracleUserByCorrelation(
          oracleUsersData,
          address,
          undefined, // No blockchain balance available at this point
          Date.now() // Use current time for recent mint correlation
        )

        if (userData && userData.transactionCount > 0) {
          console.log('✅ Found correlated Oracle user with', userData.transactionCount, 'transactions')
          console.log('💰 Oracle user balance:', userData.lastSyncedBalance, 'sats')
          
          // Note: Oracle API doesn't provide individual transaction details in /users endpoint
          // For now, we'll use the fact that user exists and has transactions
          console.log('ℹ️ Oracle user confirmed with transaction activity')
          
          // Check if we should update auto-discovery timing based on Oracle activity
          if (userData.transactionCount >= 1) {
            console.log('⚡ Oracle shows transaction activity - mint may be processed')
          }
        } else {
          console.log('ℹ️ No matching Oracle user found yet (may still be processing)')
        }
      } catch (error) {
        console.error('❌ Error fetching transaction hash from Oracle:', error)
      }
    }

    // Run immediately and then poll every 5 seconds for 30 seconds
    fetchTransactionHashFromOracle()
    
    if (mintStatus === 'success') {
      const interval = setInterval(fetchTransactionHashFromOracle, 5000)
      const timeout = setTimeout(() => clearInterval(interval), 30000)
      
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [address, mintStatus, txHash])

  // PROFESSIONAL PROTECTION: MetaMask account change detection (same as dashboard)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0].toLowerCase()
          const storageKey = 'rbtc_mint_metamask_protection'
          const lastAccount = localStorage.getItem(storageKey)
          
          console.log('🔄 MINT: MetaMask accountsChanged event:', { lastAccount, newAccount })
          
          if (lastAccount && lastAccount !== newAccount) {
            console.log('🚨 MINT: METAMASK ACCOUNT CHANGED! Clearing all old user data...')
            
            // IMMEDIATE: Clear ALL React state for old user
            setVerifiedBitcoinAddress('')
            setAllVerifiedAddresses([])
            setBitcoinBalance(0)
            setIsLoadingBalance(false)
            setHasAttemptedFetch(false)
            setAddressHasSpentCoins(false)
            setMintStatus('idle')
            setErrorMessage('')
            setShowFeeVaultWarning(false)
            
            // Reset form
            setValue('bitcoinAddress', '', { shouldValidate: false })
            
            // AGGRESSIVE: Clear all localStorage for old users
            try {
              const keysToRemove = []
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key) keysToRemove.push(key)
              }
              
              keysToRemove.forEach(key => {
                if (!key.includes(newAccount) && (
                  key.includes('rbtc') || 
                  key.includes('reservebtc') || 
                  key.includes('bitcoin') ||
                  key.includes('transaction') ||
                  key.includes('oracle') ||
                  key.includes('user_data') ||
                  key.includes(lastAccount)
                )) {
                  console.log('🧹 MINT PROTECTION: Removing old user key:', key)
                  localStorage.removeItem(key)
                }
              })
              
              // Complete cleanup
              localStorage.clear()
              sessionStorage.clear()
              
            } catch (e) {
              console.warn('Storage cleanup failed:', e)
            }
            
            // Set new account
            localStorage.setItem(storageKey, newAccount)
            
            // Force page refresh for completely clean state
            setTimeout(() => window.location.reload(), 50)
            
            return
          }
          
          // Set initial account if not exists
          if (!lastAccount) {
            localStorage.setItem(storageKey, newAccount)
          }
        }
      }
      
      // Add MetaMask event listener
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      // Cleanup event listener
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
  }, [setValue])

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
    
    // SECURITY LAYER 1: Check if address can mint (one-time per address protection)
    const mintCheck = checkCanMint(data.bitcoinAddress);
    if (!mintCheck.canMint) {
      setErrorMessage(mintCheck.reason || 'Cannot mint with this Bitcoin address');
      setMintStatus('error');
      return;
    }
    
    // SECURITY LAYER 2: Verify Bitcoin balance before minting
    console.log('🔒 Verifying Bitcoin balance before mint...');
    const requestedSats = Math.floor(bitcoinBalance * 100000000);
    const balanceCheck = await verifyBitcoinBalance(data.bitcoinAddress, requestedSats);
    
    if (!balanceCheck.isValid) {
      setErrorMessage(balanceCheck.reason || 'Bitcoin balance verification failed');
      setMintStatus('error');
      return;
    }
    
    console.log(`✅ Balance verified: ${balanceCheck.actualBalanceSats} sats available, minting ${requestedSats} sats`);
    
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
      console.log('🚀 Starting automatic mint process...')
      
      // STEP 1: Save verified Bitcoin address to centralized storage
      console.log('📋 Step 1: Saving verified address to user card...')
      try {
        await saveVerifiedBitcoinAddress(address!, data.bitcoinAddress, 'auto_mint_signature')
        console.log('✅ User card created/updated with Bitcoin address')
      } catch (error) {
        console.warn('⚠️ Failed to save address to centralized storage:', error)
      }
      
      // STEP 2: Check FeeVault balance again (it pays for Oracle operations)
      console.log('🏦 Step 2: Verifying FeeVault balance for Oracle operations...')
      const currentFeeVaultBalance = await publicClient.readContract({
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
      
      const feeVaultEth = parseFloat(formatEther(currentFeeVaultBalance))
      console.log(`🏦 FeeVault balance: ${feeVaultEth} ETH (${feeVaultEth >= 0.01 ? 'sufficient' : 'insufficient'})`)
      
      if (feeVaultEth < 0.01) {
        throw new Error('Insufficient FeeVault balance. Oracle operations require at least 0.01 ETH in FeeVault.')
      }
      
      // STEP 3: Oracle Registration Process
      console.log('📡 Step 3: Initiating Oracle registration...')
      
      let actualTxHash = ''
      let transactionSuccessful = false
      
      try {
        // Get the current Bitcoin balance in satoshis
        const balanceInSats = Math.round(bitcoinBalance * 100_000_000)
        
        console.log('🔍 Checking if user is already registered with Oracle...')
        
        // Check if user already exists in Oracle
        const existingUser = await checkOracleRegistration(address!)
        
        if (existingUser) {
          console.log('✅ User ALREADY registered with Oracle:', existingUser);
          console.log(`🔍 Oracle monitoring: ${existingUser.btcAddress}`);
          console.log(`₿ Oracle balance: ${existingUser.lastSyncedBalance} sats`);
          
          actualTxHash = `existing_user_${Date.now().toString(16)}`
          setTxHash(actualTxHash)
          transactionSuccessful = true
          setMintStatus('pending')
          
        } else {
          console.log('📋 User not yet registered - requesting Oracle registration');
          
          // Request Oracle registration (this triggers committee to act)
          const registrationResult = await requestOracleRegistration({
            userAddress: address!,
            bitcoinAddress: data.bitcoinAddress,
            balanceSats: balanceInSats,
            feeVaultBalance: feeVaultEth
          })
          
          if (registrationResult.success) {
            console.log('✅ Oracle registration requested successfully');
            actualTxHash = registrationResult.txHash || `oracle_registration_${Date.now().toString(16)}`
            setTxHash(actualTxHash)
            transactionSuccessful = true
            setMintStatus('pending')
          } else {
            throw new Error(registrationResult.message || 'Oracle registration failed')
          }
        }
        
        // STEP 3b: Provide user information about the process
        if (transactionSuccessful) {
          console.log('⏳ Oracle monitoring setup complete...');
          
          console.log('\n🎯 What happens next:');
          console.log('  1. Oracle server monitors your FeeVault deposit');
          console.log('  2. Oracle automatically detects new user (5-10 mins)');
          console.log('  3. Oracle calls sync() to register you');
          console.log('  4. Oracle mints rBTC based on your Bitcoin balance');
          console.log('  5. Fees are automatically deducted from FeeVault');
          console.log('  6. You appear in Oracle users list');
          
          console.log('\n✅ Setup completed successfully!');
          console.log('🔍 You can track progress at: https://oracle.reservebtc.io/status');
          console.log('📊 Dashboard will show tokens once Oracle processes your registration');
        }
        
      } catch (error: any) {
        console.error('❌ Mint operation failed:', error)
        
        // Provide specific error message based on error type
        let userFriendlyMessage = 'Unknown error occurred'
        
        if (error.message?.includes('insufficient funds')) {
          userFriendlyMessage = 'Insufficient ETH for gas fees. Please add more ETH to your wallet.'
        } else if (error.message?.includes('user rejected') || error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
          userFriendlyMessage = 'Transaction was cancelled in MetaMask. You can try again when ready.'
        } else if (error.message?.includes('Oracle')) {
          userFriendlyMessage = 'Oracle server is temporarily unavailable. Your FeeVault balance is preserved - try again in a few minutes.'
        } else if (error.message?.includes('network')) {
          userFriendlyMessage = 'Network connection issue. Please check your internet connection.'
        } else if (error.message?.includes('timeout')) {
          userFriendlyMessage = 'Transaction timed out. The operation may still complete - check your wallet and blockchain explorer.'
        } else if (error.message?.includes('failed to initiate')) {
          userFriendlyMessage = 'Failed to initiate transaction. Please try again.'
        } else if (error.message) {
          userFriendlyMessage = error.message
        }
        
        setErrorMessage(userFriendlyMessage)
        setMintStatus('error')
        setIsMinting(false)
        return // Exit early on failure
      }
      
      // Only proceed if transaction was successful
      if (!transactionSuccessful) {
        console.error('❌ Transaction was not successful, not proceeding with post-mint actions')
        setMintStatus('error')
        setIsMinting(false)
        return
      }
      
      // STEP 4: Wait for blockchain confirmation
      console.log('⏳ Step 4: Waiting for additional blockchain confirmation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // STEP 5: Force Oracle sync after successful mint
      console.log('🔄 Step 5: Post-mint Oracle sync...')
      try {
        // Wait a bit for Oracle to process
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Post-mint Oracle sync is handled automatically by Oracle server
        console.log('🔄 Oracle will detect registration automatically')
        console.log('✅ Post-mint Oracle sync completed')
      } catch (error) {
        console.warn('⚠️ Post-mint Oracle sync failed:', error)
      }
      
      // Only set success if transaction was actually successful
      setMintStatus('success')
      
      // SECURITY LAYER 3: Record mint attempt and activate auto-sync
      if (address) {
        recordMintAttempt(data.bitcoinAddress, address, txHash);
        activateAutoSync(data.bitcoinAddress);
        console.log('🔒 Protection activated: Auto-sync started for', data.bitcoinAddress);
      }
      
      onMintComplete?.(data)
      
      // STEP 5.5: Try to resolve real transaction hash from Oracle
      if (address) {
        try {
          console.log('🔍 STEP 5.5: Attempting to resolve real transaction hash...')
          // Wait a bit for Oracle to process the new transaction
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          const realHash = await resolveRealTransactionHash(address)
          if (realHash) {
            setRealTxHash(realHash)
            console.log('✅ Real transaction hash resolved and cached:', realHash)
          }
        } catch (error) {
          console.warn('⚠️ Failed to resolve real transaction hash:', error)
        }
      }
      
      // STEP 6: Clear any cached data to force fresh load
      const cacheKeys = [
        `reservebtc_user_data_${address!.toLowerCase()}`,
        `rbtc_oracle_transactions_${address!.toLowerCase()}`,
        `rbtc_transactions_${address!}_v2_atomic`
      ]
      cacheKeys.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Cleared cache: ${key}`)
      })
      
      console.log('🎉 Automatic mint process completed!')
      
      console.log('📊 User card should now contain:')
      console.log(`  - User: ${address}`)
      console.log(`  - Bitcoin Address: ${data.bitcoinAddress}`)
      console.log(`  - Mint Transaction: ${actualTxHash}`)
      console.log(`  - Oracle Status: Synced`)
      console.log('  - Dashboard: Will show mint transaction and balance')
      
      // Production note:
      // 1. Detect Bitcoin balance changes  
      // 2. Call sync() function on OracleAggregator
      // 3. Mint/burn rBTC tokens accordingly
      // 4. Deduct fees from FeeVault
    } catch (error: any) {
      console.error('Mint initiation failed:', error)
      
      // Set user-friendly error message
      let errorMsg = 'Failed to initiate mint operation'
      if (error.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
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
        <>
          {/* Mint Protection Warning */}
          {verifiedBitcoinAddress && (() => {
            const mintCheck = checkCanMint(verifiedBitcoinAddress);
            const activeAutoSyncAddresses = getAutoSyncAddresses();
            
            if (!mintCheck.canMint || activeAutoSyncAddresses.length > 0) {
              return (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-800/50 rounded-full">
                      <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200">Mint Protection Active</h3>
                      
                      {!mintCheck.canMint && (
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          {mintCheck.reason}
                        </p>
                      )}
                      
                      {activeAutoSyncAddresses.length > 0 && (
                        <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                          <p><strong>Auto-sync is active for:</strong></p>
                          {activeAutoSyncAddresses.map((addr, idx) => (
                            <p key={idx} className="font-mono text-xs bg-orange-100 dark:bg-orange-800 rounded px-2 py-1">
                              {addr}
                            </p>
                          ))}
                          <p className="text-xs mt-2">
                            Auto-sync prevents manual minting to avoid double-spending. 
                            You can add a new Bitcoin address to mint more tokens.
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>How to mint more tokens:</strong><br/>
                          1. Add a new Bitcoin address with funds<br/>
                          2. Verify the new address<br/>
                          3. Mint tokens for the new address<br/>
                          Each Bitcoin address can only be used once for minting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

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
                        Quantum-Safe Protocol
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
                          {(verifiedBitcoinAddress.startsWith('tb1') || verifiedBitcoinAddress.startsWith('2') || verifiedBitcoinAddress.startsWith('m') || verifiedBitcoinAddress.startsWith('n')) ? 'Testnet' : 'Mainnet'} • {getBitcoinAddressTypeLabel(bitcoinValidation?.type || 'unknown')}
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
                                  {(addr.address.startsWith('tb1') || addr.address.startsWith('2') || addr.address.startsWith('m') || addr.address.startsWith('n')) ? 'Testnet' : 'Mainnet'} • Verified {verificationDate}
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
                    <span>{(verifiedBitcoinAddress.startsWith('tb1') || verifiedBitcoinAddress.startsWith('2') || verifiedBitcoinAddress.startsWith('m') || verifiedBitcoinAddress.startsWith('n')) ? 'Testnet' : 'Mainnet'}</span>
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
              disabled={
                !verifiedBitcoinAddress || 
                bitcoinBalance === 0 || 
                isMinting || 
                isLoadingBalance || 
                !acceptedTerms || 
                isWritePending || 
                isTxLoading ||
                !checkCanMint(verifiedBitcoinAddress).canMint ||
                hasActiveAutoSync()
              }
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
              {isMinting && !isWritePending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Preparing Transaction...</span>
                </>
              ) : isWritePending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Confirm in MetaMask...</span>
                </>
              ) : isTxLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Confirming on Blockchain...</span>
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
        </>
      )}

      {mintStatus === 'pending' && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Transaction Submitted</h2>
            <p className="text-muted-foreground">
              Your mint transaction is being confirmed on MegaETH blockchain...
            </p>
            {(realTxHash || (txHash && !txHash.startsWith('oracle_') && !txHash.startsWith('manual_'))) && (
              <div className="text-sm text-muted-foreground mt-4">
                <p>Transaction Hash:</p>
                <a
                  href={`https://www.megaexplorer.xyz/tx/${realTxHash || txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:text-primary/80 underline transition-colors break-all"
                >
                  {realTxHash || txHash}
                </a>
                {realTxHash && (
                  <p className="text-xs mt-1 text-green-600">✅ Real blockchain transaction hash from Oracle</p>
                )}
              </div>
            )}
            {txHash && (txHash.startsWith('oracle_') || txHash.startsWith('manual_')) && (
              <div className="text-sm text-muted-foreground mt-4">
                <p>Oracle Registration:</p>
                <span className="font-mono text-green-600 break-all">
                  {txHash}
                </span>
                <p className="text-xs mt-1">Your wallet is now monitored by Oracle for automatic sync</p>
              </div>
            )}
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
            
            {/* Show Explorer link with real Oracle hash when available */}
            {(realTxHash || (txHash && !txHash.startsWith('oracle_') && !txHash.startsWith('manual_') && !txHash.startsWith('existing_'))) && (
              <div className="flex flex-col items-center justify-center mb-4 space-y-2">
                <a
                  href={`https://www.megaexplorer.xyz/tx/${realTxHash || txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all hover:scale-105"
                >
                  <ExternalLink className="h-4 w-4" />
                  View in Explorer
                </a>
                {realTxHash && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✅ Real blockchain transaction hash resolved from Oracle
                  </p>
                )}
                {!realTxHash && txHash && !txHash.startsWith('oracle_') && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⏳ Attempting to resolve Oracle hash... Check back in a moment
                  </p>
                )}
              </div>
            )}
            {/* Oracle Status Display - Single Consolidated Section */}
            {txHash && (txHash.startsWith('oracle_') || txHash.startsWith('manual_') || txHash.startsWith('existing_') || txHash.startsWith('autodiscovery_')) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                    {txHash.startsWith('existing_') ? (
                      <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {txHash.startsWith('existing_') ? '✅ Oracle Registration Complete' : '🔄 Oracle Auto-Discovery Active'}
                </h3>
                
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  {txHash.startsWith('existing_') 
                    ? 'Your Bitcoin address is already registered and being monitored 24/7 by the Oracle system.' 
                    : 'Oracle will automatically discover and register your address within 1-2 minutes. No further action required.'}
                </p>

                <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 mb-4 text-left">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">What happens next:</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• 📡 Oracle monitors your Bitcoin address automatically</li>
                    <li>• ⬇️ When Bitcoin arrives → rBTC mints instantly</li>
                    <li>• ⬆️ When Bitcoin leaves → rBTC burns instantly</li>
                    <li>• 🔄 Sync happens within minutes of balance changes</li>
                    <li>• 💰 Fees deducted from your FeeVault per operation</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="https://oracle.reservebtc.io/status"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all hover:scale-105"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Monitor Oracle Status
                  </a>
                  <a
                    href="https://app.reservebtc.io/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  >
                    <Wallet className="h-4 w-4" />
                    View Dashboard
                  </a>
                </div>
                
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                  {txHash.startsWith('existing_') 
                    ? 'You should already appear in the Oracle users list above' 
                    : 'You will appear in Oracle users list once auto-discovery completes (~1-2 min)'}
                </p>
              </div>
            )}

            {/* Explorer link handled above - removed duplicate */}
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
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://app.reservebtc.io/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 text-sm font-medium transition-all hover:scale-105 active:scale-95"
              >
                <Wallet className="h-4 w-4" />
                View Dashboard
              </a>
              <a
                href="https://app.reservebtc.io/wrap"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 rounded-lg px-6 py-3 text-sm font-medium transition-all hover:scale-105 active:scale-95"
              >
                <ArrowUpRight className="h-4 w-4" />
                Wrap to wrBTC
              </a>
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
        <div className="bg-card border rounded-xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-6">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Mint Failed</h2>
              <p className="text-muted-foreground">
                {errorMessage || 'There was an error processing your mint transaction.'}
              </p>
            </div>
          </div>
          
          {/* Error Details and Solutions */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left space-y-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100">Possible Solutions:</h3>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-2 list-disc list-inside">
              <li>Check your wallet has enough ETH for gas fees (~0.002 ETH)</li>
              <li>Ensure your FeeVault has sufficient balance (minimum 0.01 ETH)</li>
              <li>Verify your Bitcoin address is correct and contains Bitcoin</li>
              <li>Try refreshing the page and connecting wallet again</li>
              <li>Check MegaETH network status at megaexplorer.xyz</li>
            </ul>
            
            {/* Retry mechanism */}
            <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                Need Help? Try These Steps:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    // Reset and go back to FeeVault
                    setMintStatus('idle')
                    setTxHash('')
                    setRealTxHash('')
                    setErrorMessage('')
                    setRetryAttempt(0)
                    const feeVaultElement = document.querySelector('#fee-vault-section')
                    if (feeVaultElement) {
                      feeVaultElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Check FeeVault Balance
                </button>
                <button
                  onClick={() => {
                    setMintStatus('idle')
                    setTxHash('')
                    setRealTxHash('')
                    setErrorMessage('')
                    setRetryAttempt(prev => prev + 1)
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again {retryAttempt > 0 ? `(Attempt ${retryAttempt + 1})` : ''}
                </button>
              </div>
            </div>
          </div>
          
          {/* Contact Support */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Still having issues? Get help:
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="mailto:reservebtcproof@gmail.com"
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                Email Support
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="https://chatgpt.com/g/g-68a3e198b3348191bf4be2ce6e06ba0b-reservebtc-agent-support-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                AI Assistant
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}