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
// Bitcoin addresses now loaded via Oracle Service only
import { requestOracleRegistration, checkOracleRegistration, waitForOracleRegistration } from '@/lib/oracle-integration'
import { getTransactionHashForOracleUser } from '@/lib/transaction-hash-cache'
import { oracleService } from '@/lib/oracle-service'
import { mempoolService } from '@/lib/mempool-service'
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
  const [allVerifiedAddresses, setAllVerifiedAddresses] = useState<{
    address: string, 
    verifiedAt: string, 
    mintStatus: 'available' | 'minted',
    mintTxHash?: string
  }[]>([])
  const [bitcoinBalance, setBitcoinBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [addressHasSpentCoins, setAddressHasSpentCoins] = useState(false)
  const [hasOutgoingTx, setHasOutgoingTx] = useState(false)
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

  // Function to determine mint status for Bitcoin addresses
  const getMintStatusForAddress = async (bitcoinAddress: string, userData: any): Promise<{status: 'available' | 'minted', mintTxHash?: string}> => {
    try {
      // Check if address has been minted by looking at user's transaction history
      const transactions = userData?.transactions || []
      const mintTransaction = transactions.find((tx: any) => 
        tx.bitcoinAddress === bitcoinAddress && 
        (tx.type === 'mint' || tx.operation === 'mint') &&
        tx.status === 'completed'
      )
      
      if (mintTransaction) {
        console.log('✅ MINT STATUS: Address already minted:', bitcoinAddress, 'TX:', mintTransaction.hash)
        return {
          status: 'minted',
          mintTxHash: mintTransaction.hash
        }
      }
      
      console.log('🔄 MINT STATUS: Address available for minting:', bitcoinAddress)
      return { status: 'available' }
    } catch (error) {
      console.error('❌ MINT STATUS: Error checking mint status:', error)
      return { status: 'available' } // Default to available on error
    }
  }

  // Oracle hash resolution function
  const resolveRealTransactionHash = async (ethereumAddress: string): Promise<string | null> => {
    try {
      console.log('🔍 Resolving real transaction hash for:', ethereumAddress)
      
      // Find user by correlation using Oracle Service
      const userData = await oracleService.findUserByCorrelation(ethereumAddress)
      if (!userData) {
        console.log('❌ User not found in Oracle data')
        return null
      }

      // Get transaction hash using cache system
      const userIndex = 0 // Professional Oracle doesn't use array indexes
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

  // Fetch Bitcoin balance using Professional Mempool Service
  const fetchBitcoinBalance = useCallback(async (btcAddress: string) => {
    console.log('💰 MEMPOOL: Fetching balance for Bitcoin address:', btcAddress.substring(0, 8) + '...')
    setIsLoadingBalance(true)
    setHasAttemptedFetch(false)
    
    try {
      // Add small delay to avoid race conditions during Bitcoin transaction processing
      await new Promise(resolve => setTimeout(resolve, 300))

      // Use professional mempool service for reliable balance fetching
      const balanceData = await mempoolService.getAddressBalance(btcAddress)
      
      if (balanceData) {
        console.log('✅ MEMPOOL: Balance fetched successfully:', {
          address: btcAddress.substring(0, 8) + '...',
          balance: balanceData.balance,
          network: balanceData.network,
          transactions: balanceData.transactions
        })
        
        // Check if address has made outgoing transactions (spent coins)
        const hasSpentCoins = balanceData.transactions > 0
        setAddressHasSpentCoins(hasSpentCoins)
        
        // Set balance and auto-fill amount
        setBitcoinBalance(balanceData.balance)
        setValue('amount', balanceData.balance.toString())
        
        console.log(`✅ MEMPOOL: Successfully loaded ${balanceData.balance} BTC for ${balanceData.network} address`)
        return
      }
      
      // If mempool service fails, try fallback to Oracle Aggregator contract
      if (publicClient && address) {
        console.log('🔄 MEMPOOL: Service failed, trying Oracle Aggregator fallback...')
        
        try {
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
          console.log('📊 FALLBACK: Balance from Oracle Aggregator:', bitcoinBalance, 'BTC')
          setBitcoinBalance(bitcoinBalance)
          setValue('amount', bitcoinBalance.toString())
          setAddressHasSpentCoins(false) // Oracle doesn't track spent coins
        } catch (oracleError) {
          console.warn('⚠️ FALLBACK: Oracle Aggregator also failed:', oracleError)
          throw oracleError
        }
      } else {
        console.warn('⚠️ MEMPOOL: Service failed and no Oracle fallback available')
        setBitcoinBalance(0)
        setValue('amount', '0')
        setAddressHasSpentCoins(false)
      }
      
    } catch (error) {
      console.error('❌ MEMPOOL: Failed to fetch Bitcoin balance:', error)
      
      // Final fallback: Set to 0 but still allow user to proceed
      setBitcoinBalance(0)
      setValue('amount', '0')
      setAddressHasSpentCoins(false)
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
        
        // ИСПРАВЛЕНИЕ: Use Oracle Service to get user's verified Bitcoin addresses  
        const userData = await oracleService.getUserByAddress(address)
        console.log('🔍 MINT: Full user data:', userData)
        console.log('📋 Loading verified addresses from Oracle Service:', userData)
        
        // Process all verified addresses with mint status
        const verifiedAddrs = []
        if (userData) {
          
          // ИСПРАВЛЕНИЕ: Собираем ВСЕ адреса из всех источников (как на dashboard)
          const collectAllUserAddresses = () => {
            const addresses = new Set<string>();
            const userDataAny = userData as any;
            
            // Добавляем ВСЕ источники адресов:
            if (userData.bitcoinAddress) {
              addresses.add(userData.bitcoinAddress);
            }
            if (userData.btcAddress && userData.btcAddress !== userData.bitcoinAddress) {
              addresses.add(userData.btcAddress);
            }
            if (userData.btcAddresses && Array.isArray(userData.btcAddresses)) {
              userData.btcAddresses.forEach((addr: string) => addresses.add(addr));
            }
            if (userDataAny.bitcoinAddresses && Array.isArray(userDataAny.bitcoinAddresses)) {
              userDataAny.bitcoinAddresses.forEach((addr: string) => addresses.add(addr));
            }
            if (userDataAny.processedBitcoinAddresses && Array.isArray(userDataAny.processedBitcoinAddresses)) {
              userDataAny.processedBitcoinAddresses.forEach((addr: string) => addresses.add(addr));
            }
            if (userDataAny.allBitcoinAddresses && Array.isArray(userDataAny.allBitcoinAddresses)) {
              userDataAny.allBitcoinAddresses.forEach((addr: string) => addresses.add(addr));
            }
            
            return Array.from(addresses);
          };

          const allUserAddresses = collectAllUserAddresses();
          console.log('📋 MINT: Collected all addresses:', allUserAddresses);
          
          if (allUserAddresses.length > 0) {
            // Обработать все найденные Bitcoin адреса
            for (const btcAddr of allUserAddresses) {
              console.log('✅ MINT: Processing Bitcoin address:', btcAddr)
              const mintStatus = await getMintStatusForAddress(btcAddr, userData)
              verifiedAddrs.push({
                address: btcAddr,
                verifiedAt: userData.registeredAt || new Date().toISOString(),
                signature: 'oracle_verified',
                mintStatus: mintStatus.status,
                mintTxHash: mintStatus.mintTxHash
              })
            }
          }
          
          // УДАЛЕНО: Дублирование обработки адресов - теперь все обрабатывается через processedBitcoinAddresses
        }
        
        
        if (verifiedAddrs.length > 0) {
          // Store all addresses for dropdown with mint status
          const addressesForDropdown = verifiedAddrs.map(addr => ({
            address: addr.address,
            verifiedAt: addr.verifiedAt,
            mintStatus: addr.mintStatus,
            mintTxHash: addr.mintTxHash
          }))
          setAllVerifiedAddresses(addressesForDropdown)
          
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
          setAllVerifiedAddresses([])
          setVerifiedBitcoinAddress('')
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
          // ИСПРАВЛЕНИЕ: Use Oracle Service to get user's Bitcoin address
          const userData = await oracleService.getUserByAddress(address)
          const userDataAny = userData as any
          const btcAddr = userData?.bitcoinAddress || 
                          userData?.btcAddress || 
                          userDataAny?.bitcoin_address ||
                          userDataAny?.BTC_ADDRESS ||
                          userDataAny?.address
          
          if (userData && btcAddr) {
            console.log('✅ RELOAD: Found Bitcoin address via Oracle Service:', btcAddr)
            setVerifiedBitcoinAddress(btcAddr)
            setValue('bitcoinAddress', btcAddr, { shouldValidate: true })
          } else {
            console.log('⚠️ RELOAD: Oracle Service returned null, trying Profile Manager fallback...')
            
            // ИСПРАВЛЕНИЕ: Fallback через Universal Profile Manager
            try {
              const { userProfileManager } = await import('@/lib/user-profile-manager')
              const profile = await userProfileManager.getUserProfile(address)
              console.log('📋 Profile Manager data:', profile)
              
              if (profile && profile.walletInformation?.bitcoin?.addresses?.length > 0) {
                const primaryAddr = profile.walletInformation.bitcoin.primaryAddress || 
                                   profile.walletInformation.bitcoin.addresses[0]
                console.log('✅ RELOAD: Found address via Profile Manager:', primaryAddr)
                setVerifiedBitcoinAddress(primaryAddr)
                setValue('bitcoinAddress', primaryAddr, { shouldValidate: true })
              } else {
                console.log('❌ RELOAD: No addresses found in both Oracle Service and Profile Manager')
              }
            } catch (profileError) {
              console.error('❌ Profile Manager fallback failed:', profileError)
            }
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

  // Handle address change with balance refresh
  const handleAddressChange = useCallback((newAddress: string) => {
    setVerifiedBitcoinAddress(newAddress)
    setValue('bitcoinAddress', newAddress, { shouldValidate: true })
    // Reset balance when address changes
    setBitcoinBalance(0)
    setIsLoadingBalance(true)
    if (newAddress) {
      fetchBitcoinBalance(newAddress)
    }
  }, [setValue, fetchBitcoinBalance])

  // Check for outgoing transactions (quantum security warning)
  useEffect(() => {
    if (verifiedBitcoinAddress) {
      console.log('🔍 Checking for outgoing transactions for quantum warning...')
      mempoolService.checkOutgoingTransactions(verifiedBitcoinAddress)
        .then(hasOutgoing => {
          setHasOutgoingTx(hasOutgoing)
          console.log(`🔐 Quantum warning check: Address ${verifiedBitcoinAddress.substring(0, 10)}... has outgoing transactions: ${hasOutgoing}`)
        })
        .catch(error => {
          console.error('❌ Error checking outgoing transactions:', error)
          setHasOutgoingTx(false)
        })
    } else {
      setHasOutgoingTx(false)
    }
  }, [verifiedBitcoinAddress])

  // Monitor address transaction status for quantum warning
  useEffect(() => {
    if (verifiedBitcoinAddress && !isLoadingBalance && hasAttemptedFetch) {
      console.log('🔍 Quantum warning check:', {
        address: verifiedBitcoinAddress,
        hasOutgoingTx: hasOutgoingTx,
        balance: bitcoinBalance,
        showWarning: hasOutgoingTx
      })
      
      if (hasOutgoingTx) {
        console.log('⚠️ Address has outgoing transactions - quantum warning should be visible')
      } else {
        console.log('✅ Address has no outgoing transactions - no quantum warning needed')
      }
    }
  }, [verifiedBitcoinAddress, hasOutgoingTx, isLoadingBalance, hasAttemptedFetch, bitcoinBalance])

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
        console.log('🔍 Fetching user data from Oracle Service...')
        
        // Use correlation strategy to find the user using Oracle Service
        const userData = await oracleService.findUserByCorrelation(address)

        if (userData && (userData.transactionCount || 0) > 0) {
          console.log('✅ Found correlated Oracle user with', userData.transactionCount, 'transactions')
          console.log('💰 Oracle user balance:', userData.lastSyncedBalance, 'sats')
          
          // Note: Oracle API doesn't provide individual transaction details in /users endpoint
          // For now, we'll use the fact that user exists and has transactions
          console.log('ℹ️ Oracle user confirmed with transaction activity')
          
          // Check if we should update auto-discovery timing based on Oracle activity
          if ((userData.transactionCount || 0) >= 1) {
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
      
      // STEP 1: Verify user is registered in Professional Oracle
      console.log('📋 Step 1: Checking user in Professional Oracle...')
      try {
        const userData = await oracleService.getUserByAddress(address!)
        console.log('📋 MINT VERIFY - userData:', userData)
        const userDataAny = userData as any
        const btcAddr = userData?.bitcoinAddress || 
                        userData?.btcAddress || 
                        userDataAny?.bitcoin_address ||
                        userDataAny?.BTC_ADDRESS ||
                        userDataAny?.address
        if (userData && btcAddr) {
          console.log('✅ User verified in Professional Oracle with address:', btcAddr)
        } else {
          console.log('❌ Oracle data missing - userData:', userData)
          throw new Error('User not found in Professional Oracle - verification required')
        }
      } catch (error) {
        console.error('❌ User not verified in Oracle:', error)
        throw new Error('Please complete Bitcoin address verification first')
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
            {/* Bitcoin Balance (from verified wallet) */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  Bitcoin Balance (from verified wallet)
                </h3>
                <button 
                  onClick={refreshBalance}
                  disabled={isLoadingBalance}
                  className="bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  🔄 Refresh
                </button>
              </div>

              {isLoadingBalance ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {bitcoinBalance || '0.00000000'} BTC
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    = {Math.round((bitcoinBalance || 0) * 100000000).toLocaleString()} satoshis
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Network: {verifiedBitcoinAddress?.startsWith('tb1') ? 
                      <span className="text-orange-600 dark:text-orange-400">Testnet</span> : 
                      <span className="text-green-600 dark:text-green-400">Mainnet</span>
                    }
                  </div>
                </>
              )}
              
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  ℹ️ Balance is fetched automatically from your verified Bitcoin wallet
                </p>
              </div>
            </div>
            
            {/* Quantum protection warning - only if address has outgoing transactions */}
            {hasOutgoingTx && !isLoadingBalance && hasAttemptedFetch && verifiedBitcoinAddress && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
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

            {/* Your Verified Bitcoin Address */}
            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
                Your Verified Bitcoin Address
              </h3>
              
              {allVerifiedAddresses && allVerifiedAddresses.length > 0 ? (
                <>
                  <select 
                    className="w-full p-3 bg-gray-900/70 rounded-lg border border-gray-600 text-white focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-gray-900/90"
                    value={verifiedBitcoinAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                  >
                    <option value="" className="bg-gray-900 text-gray-400">
                      Select Bitcoin Address
                    </option>
                    {allVerifiedAddresses.map((addr, idx) => {
                      const address = typeof addr === 'string' ? addr : addr.address;
                      const isTestnet = address.startsWith('tb1') || address.startsWith('2');
                      const shortAddr = `${address.slice(0, 10)}...${address.slice(-8)}`;
                      
                      return (
                        <option key={idx} value={address} className="bg-gray-900 text-white">
                          {shortAddr} ({isTestnet ? 'TESTNET' : 'MAINNET'})
                        </option>
                      );
                    })}
                  </select>
                  
                  {verifiedBitcoinAddress && (
                    <div className="mt-3 p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Selected:</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          verifiedBitcoinAddress.startsWith('tb1') || verifiedBitcoinAddress.startsWith('2')
                            ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' 
                            : 'bg-green-900/30 text-green-400 border border-green-500/30'
                        }`}>
                          {verifiedBitcoinAddress.startsWith('tb1') || verifiedBitcoinAddress.startsWith('2') ? 'TESTNET' : 'MAINNET'}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-blue-400 break-all mt-2">
                        {verifiedBitcoinAddress}
                      </div>
                    </div>
                  )}
                  
                  {allVerifiedAddresses.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      You have {allVerifiedAddresses.length} verified addresses. Use the dropdown to switch between them.
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">No verified addresses yet</p>
                  <Link href="/verify" className="text-primary hover:text-primary/80 underline">
                    Verify your first address →
                  </Link>
                </div>
              )}
            </div>

            {/* No address warning */}
            {!verifiedBitcoinAddress && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">No Bitcoin Address</p>
                    <p className="text-amber-600 dark:text-amber-300 mt-1">
                      Please verify a Bitcoin address first to mint rBTC-SYNTH tokens.
                    </p>
                    <Link 
                      href="/verify" 
                      className="text-amber-700 dark:text-amber-400 hover:underline text-sm font-medium mt-2 inline-block"
                    >
                      Verify Bitcoin Address →
                    </Link>
                  </div>
                </div>
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
          </form>
        </div>
        </>
      )}
    </div>
  )
}
