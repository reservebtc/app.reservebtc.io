'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft, AlertCircle, Loader2, CheckCircle, Info, Bitcoin, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Copy, Wallet, Shield, Check, ArrowUpRight, Activity } from 'lucide-react'
import { mintFormSchema, MintForm } from '@/lib/validation-schemas'
import { validateBitcoinAddress, getBitcoinAddressTypeLabel } from '@/lib/bitcoin-validation'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatEther, parseEther, encodePacked, keccak256, toBytes } from 'viem'
import { toast } from 'sonner'
import { DepositFeeVault } from './deposit-fee-vault'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CONTRACTS, CONTRACT_ABIS } from '@/app/lib/contracts'
import { oracleService } from '@/lib/oracle-service'
import { mempoolService } from '@/lib/mempool-service'
import { useMintProtection } from '@/lib/mint-protection'
import { useRealtimeUserData } from '@/lib/professional-realtime-hooks'

interface OracleUserData {
  ethAddress?: string;
  bitcoinAddress?: string;
  btcAddress?: string;
  btcAddresses?: string[];
  bitcoinAddresses?: string[];
  mintedAddresses?: string[];
  monitoredAddresses?: string[];
  mintTransactions?: Record<string, string>;
  registeredAt?: string;
  lastActivityAt?: string;
  lastSyncedBalance?: number;
  transactionCount?: number;
  verificationStatus?: string;
  source?: string;
}

interface MintRBTCProps {
  onMintComplete?: (data: MintForm) => void
}

interface BadgeProps {
  variant?: 'default' | 'outline'
  className?: string
  children: React.ReactNode
}

const Badge = ({ variant = 'default', className = '', children }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded'
  const variantClasses = variant === 'outline' 
    ? 'border border-muted text-muted-foreground bg-background'
    : 'bg-primary text-primary-foreground'
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  )
}

export function MintRBTC({ onMintComplete }: MintRBTCProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [mintTxHash, setMintTxHash] = useState<string>('')
  const [verifiedBitcoinAddress, setVerifiedBitcoinAddress] = useState<string>('')
  const [allVerifiedAddresses, setAllVerifiedAddresses] = useState<{
    address: string, 
    verifiedAt: string, 
    mintStatus: 'available' | 'minted',
    mintTxHash?: string
  }[]>([])
  
  // 🔥 ONLY REAL ORACLE BALANCE - NO CACHE
  const [currentBalance, setCurrentBalance] = useState<string>('0')
  const [isBalanceLoading, setIsBalanceLoading] = useState(true)
  const [isBalanceRefreshing, setIsBalanceRefreshing] = useState(false)
  
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [hasOutgoingTx, setHasOutgoingTx] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [feeVaultBalance, setFeeVaultBalance] = useState<number>(0)
  const [isAddressMonitored, setIsAddressMonitored] = useState<boolean>(false)
  const [monitoredAddressesMap, setMonitoredAddressesMap] = useState<Map<string, boolean>>(new Map())
  const [hasAnyActiveMonitoring, setHasAnyActiveMonitoring] = useState<boolean>(false)
  const [currentOracleBalance, setCurrentOracleBalance] = useState<number>(0)
  const [realActiveMonitoring, setRealActiveMonitoring] = useState<boolean>(false)
  const [forceRefresh, setForceRefresh] = useState<number>(0)
  
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const userData = useRealtimeUserData()
  
  const {
    checkCanMint,
    getAutoSyncAddresses
  } = useMintProtection()

  const {
    setValue,
    formState: { errors }
  } = useForm<MintForm>({
    resolver: zodResolver(mintFormSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '0',
      bitcoinAddress: ''
    }
  })

  // 🔥 CRITICAL: Format balance from actual Oracle state (NO CACHE)
  const formattedBitcoinBalance = useMemo(() => {
    if (isBalanceLoading) {
      console.log('⏳ MINT: Balance loading...')
      return '0.00000000'
    }
    
    const sats = Number(currentBalance) || 0
    const btc = sats / 100000000
    
    console.log('💰 MINT: Current balance - Sats:', sats, 'BTC:', btc.toFixed(8))
    
    return btc.toFixed(8)
  }, [currentBalance, isBalanceLoading])

  // 🔥 PRODUCTION-GRADE: Load balance with direct RPC calls (no cache)
  const loadCurrentBalance = useCallback(async (): Promise<{ sats: number, btc: string }> => {
    if (!address) {
      console.log('⚠️ MINT: No address')
      return { sats: 0, btc: '0.00000000' }
    }

    console.log('🔄 MINT: Loading current balance from Oracle contract...')
    console.log('🔍 MINT: Current address:', address)
    setIsBalanceRefreshing(true)
    
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`📡 MINT: Attempt ${attempt}/${MAX_RETRIES}`)
        
        // 🔥 USE API ENDPOINT to bypass CORS
        const response = await fetch(`/api/blockchain/balance?address=${address}&_t=${Date.now()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load balance')
        }
        
        const balanceInSats = Number(data.balance)
        const balanceStr = balanceInSats.toString()
        const btcBalance = data.btc
        
        console.log(`✅ MINT: Fresh Oracle balance loaded: ${balanceInSats} sats = ${btcBalance} BTC`)
        console.log(`💰 MINT: Setting balance to: ${balanceStr} sats`)
        
        setCurrentBalance(balanceStr)
        setCurrentOracleBalance(balanceInSats / 1e8)
        
        return { sats: balanceInSats, btc: btcBalance }
        
      } catch (error) {
        console.error(`❌ MINT: Attempt ${attempt} failed:`, error)
        
        if (attempt === MAX_RETRIES) {
          console.error('❌ MINT: All retry attempts exhausted')
          setCurrentBalance('0')
          setCurrentOracleBalance(0)
          return { sats: 0, btc: '0.00000000' }
        }
        
        const delay = RETRY_DELAY * attempt
        console.log(`⏳ MINT: Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } finally {
        if (attempt === MAX_RETRIES) {
          setIsBalanceRefreshing(false)
          setIsBalanceLoading(false)
        }
      }
    }
    
    setIsBalanceRefreshing(false)
    setIsBalanceLoading(false)
    return { sats: 0, btc: '0.00000000' }
  }, [address])

  const performCompleteDataCleanup = useCallback(() => {
    console.log('🧹 MINT: Performing complete data cleanup')
    setVerifiedBitcoinAddress('')
    setAllVerifiedAddresses([])
    setCurrentBalance('0')
    setIsBalanceLoading(false)
    setHasAttemptedFetch(false)
    setMintStatus('idle')
    setMintTxHash('')
    setMonitoredAddressesMap(new Map())
    setHasAnyActiveMonitoring(false)
    setCurrentOracleBalance(0)
    setRealActiveMonitoring(false)
    setValue('bitcoinAddress', '', { shouldValidate: false })
    setValue('amount', '0', { shouldValidate: false })
  }, [setValue])

  useEffect(() => {
    if (address) {
      performCompleteDataCleanup()
    }
  }, [address, performCompleteDataCleanup])

  useEffect(() => {
    if (userData.userData && !userData.loading) {
      console.log('📡 MINT: Real-time user data update - rBTC balance:', (userData.userData as any).rbtcBalance)

      const realtimeOracleBalance = ((userData.userData as any).rbtcBalance || 0) / 100000000
      if (realtimeOracleBalance !== currentOracleBalance) {
        setCurrentOracleBalance(realtimeOracleBalance)
        setHasAnyActiveMonitoring(realtimeOracleBalance > 0)
        setRealActiveMonitoring(realtimeOracleBalance > 0)
        
        if (realtimeOracleBalance === 0 && hasAnyActiveMonitoring) {
          console.log('📡 MINT: Real-time detected monitoring ended')
          setMonitoredAddressesMap(new Map())
          setIsAddressMonitored(false)
          setAllVerifiedAddresses(prev => prev.map(addr => ({
            ...addr,
            mintStatus: 'available' as const
          })))
          toast.info('Monitoring stopped. You can now mint another address.')
        }
      }
    }
  }, [userData, currentOracleBalance, hasAnyActiveMonitoring])

  const checkIfUserHasActiveMonitoring = useCallback(async (): Promise<{ hasMonitoring: boolean, oracleBalance: number }> => {
    if (!address) return { hasMonitoring: false, oracleBalance: 0 };
    
    try {
      console.log('🔍 MINT: Checking if user has active monitoring')
      
      // 🔥 USE DIRECT BALANCE LOAD
      const balanceResult = await loadCurrentBalance()
      
      const hasMonitoring = balanceResult.sats > 0
      console.log(`🔍 MINT: User lastSats: ${balanceResult.sats}, Oracle BTC: ${balanceResult.btc}, has monitoring: ${hasMonitoring}`)
      
      return { hasMonitoring, oracleBalance: balanceResult.sats / 1e8 }
    } catch (error) {
      console.error('❌ MINT: Failed to check monitoring status:', error)
      return { hasMonitoring: false, oracleBalance: 0 }
    }
  }, [address, loadCurrentBalance])

  const checkRealActiveMonitoring = useCallback(async (addresses: Set<string>, oracleBalance: number): Promise<boolean> => {
    if (oracleBalance === 0) return false;
    
    for (const btcAddr of Array.from(addresses)) {
      try {
        const balanceData = await mempoolService.getAddressBalance(btcAddr)
        if (balanceData && Math.abs(balanceData.balance - oracleBalance) < 0.00000001) {
          console.log(`✅ MINT: Found real monitored address: ${btcAddr} with balance ${balanceData.balance} BTC matching Oracle`)
          return true;
        }
      } catch (err) {
        console.error(`Error checking balance for ${btcAddr}:`, err)
      }
    }
    
    console.log('⚠️ MINT: Oracle has balance but no matching Bitcoin address - monitoring ended')
    return false;
  }, []);

  useEffect(() => {
    const loadVerifiedAddresses = async () => {
      const specificAddress = searchParams.get('address')
      
      if (!address) return
      
      console.log('📋 MINT: Loading verified addresses for user:', address, 'forceRefresh:', forceRefresh)
      
      try {
        // 🔥 LOAD REAL BALANCE FIRST
        const balanceResult = await loadCurrentBalance()
        
        const effectiveHasMonitoring = balanceResult.sats > 0
        const effectiveOracleBalance = balanceResult.sats / 1e8
        
        setHasAnyActiveMonitoring(effectiveHasMonitoring)
        console.log(`📋 MINT: Monitoring check - has monitoring: ${effectiveHasMonitoring}, balance: ${effectiveOracleBalance} BTC`)
        
        const userData = await oracleService.getUserByAddress(address) as OracleUserData | null
        
        const verifiedAddrs: {
          address: string;
          verifiedAt: string;
          mintStatus: 'available' | 'minted';
          mintTxHash?: string;
        }[] = []
        
        const monitoringMap = new Map<string, boolean>()
        
        if (userData) {
          console.log('📋 MINT: Oracle user data received')
          
          const allAddresses = new Set<string>()
          if (userData.bitcoinAddress) allAddresses.add(userData.bitcoinAddress)
          if (userData.btcAddress) allAddresses.add(userData.btcAddress)
          if (userData.bitcoinAddresses?.length) {
            userData.bitcoinAddresses.forEach(addr => allAddresses.add(addr))
          }
          if (userData.btcAddresses?.length) {
            userData.btcAddresses.forEach(addr => allAddresses.add(addr))
          }
          
          let realMonitoring = false;
          if (effectiveHasMonitoring && effectiveOracleBalance > 0) {
            realMonitoring = await checkRealActiveMonitoring(allAddresses, effectiveOracleBalance);
            setRealActiveMonitoring(realMonitoring);
            
            if (realMonitoring) {
              for (const btcAddr of Array.from(allAddresses)) {
                try {
                  const balanceData = await mempoolService.getAddressBalance(btcAddr)
                  if (balanceData && Math.abs(balanceData.balance - effectiveOracleBalance) < 0.00000001) {
                    monitoringMap.set(btcAddr, true)
                    console.log(`✅ MINT: Address ${btcAddr} is actively monitored`)
                    break
                  }
                } catch (err) {
                  console.error(`Error checking ${btcAddr}:`, err)
                }
              }
            }
          } else {
            setRealActiveMonitoring(false);
          }
          
          for (const btcAddr of Array.from(allAddresses)) {
            const isMonitored = monitoringMap.has(btcAddr)
            verifiedAddrs.push({
              address: btcAddr,
              verifiedAt: userData.registeredAt || new Date().toISOString(),
              mintStatus: isMonitored ? 'minted' : 'available',
              mintTxHash: userData.mintTransactions?.[btcAddr]
            })
          }
        }
        
        setMonitoredAddressesMap(monitoringMap)
        
        if (verifiedAddrs.length > 0) {
          setAllVerifiedAddresses(verifiedAddrs)
          
          const selectedAddress = specificAddress || verifiedAddrs[0].address
          
          setVerifiedBitcoinAddress(selectedAddress)
          setValue('bitcoinAddress', selectedAddress, { shouldValidate: true })
          
          const isSelectedMonitored = monitoringMap.has(selectedAddress)
          setIsAddressMonitored(isSelectedMonitored)
          
          console.log(`📋 MINT: Selected address ${selectedAddress}, monitored: ${isSelectedMonitored}`)
          
          setValue('amount', balanceResult.btc)
        }
      } catch (error) {
        console.error('❌ MINT: Error loading verified addresses:', error)
      }
    }
    
    loadVerifiedAddresses()
  }, [address, searchParams, setValue, loadCurrentBalance, checkRealActiveMonitoring, forceRefresh])

  const refreshBalance = useCallback(() => {
    if (verifiedBitcoinAddress) {
      console.log('🔄 MINT: Refreshing balance for:', verifiedBitcoinAddress)
      loadCurrentBalance()
    }
  }, [verifiedBitcoinAddress, loadCurrentBalance])

  const handleAddressChange = useCallback(async (newAddress: string) => {
    console.log('🔄 MINT: Changing to address:', newAddress)
    
    setVerifiedBitcoinAddress(newAddress)
    setValue('bitcoinAddress', newAddress, { shouldValidate: true })
    setCurrentBalance('0')
    setIsBalanceLoading(true)
    
    const isMonitored = monitoredAddressesMap.has(newAddress)
    setIsAddressMonitored(isMonitored)
    
    console.log(`🔄 MINT: Address ${newAddress} monitoring status: ${isMonitored}`)
    
    if (newAddress) {
      await loadCurrentBalance()
    }
  }, [setValue, monitoredAddressesMap, loadCurrentBalance])

  useEffect(() => {
    if (verifiedBitcoinAddress) {
      mempoolService.checkOutgoingTransactions(verifiedBitcoinAddress)
        .then(hasOutgoing => {
          setHasOutgoingTx(hasOutgoing)
        })
        .catch(() => {
          setHasOutgoingTx(false)
        })
    }
  }, [verifiedBitcoinAddress])

  useEffect(() => {
    const checkFeeVaultBalance = async () => {
      if (!address || !publicClient) return

      try {
        const balance = await publicClient.readContract({
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
        
        const balanceInEth = parseFloat(formatEther(balance))
        setFeeVaultBalance(balanceInEth)
        console.log(`💰 MINT: Fee vault balance: ${balanceInEth} ETH`)
      } catch (error) {
        console.error('❌ MINT: Failed to check fee vault balance:', error)
        setFeeVaultBalance(0)
      }
    }

    checkFeeVaultBalance()
    const interval = setInterval(checkFeeVaultBalance, 5000)
    return () => clearInterval(interval)
  }, [address, publicClient])

  // 🔥 BACKGROUND REFRESH every 30 seconds
  useEffect(() => {
    if (!address) return

    const interval = setInterval(() => {
      console.log('🔄 MINT: Background balance refresh...')
      loadCurrentBalance()
    }, 30000)

    return () => clearInterval(interval)
  }, [address, loadCurrentBalance])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const onSubmit = async (data: MintForm) => {
    console.log('🚀 MINT: Starting mint process for address:', data.bitcoinAddress);
    
    const currentBtcBalance = Number(currentBalance) / 1e8
    
    if (currentBtcBalance === 0 || !currentBtcBalance) {
      toast.error(
        <div className="flex flex-col gap-2">
          <strong>Cannot Mint with Zero Balance</strong>
          <p className="text-sm">Please fund your Bitcoin address before minting.</p>
        </div>
      );
      return;
    }
    
    if (realActiveMonitoring) {
      toast.warning(
        <div className="flex flex-col gap-2">
          <strong>Monitoring Already Active</strong>
          <p className="text-sm">Wait for current balance to reach zero before minting another address.</p>
        </div>
      );
      return;
    }
    
    setIsMinting(true);
    setMintStatus('pending');
    
    try {
      if (feeVaultBalance < 0.001) {
        toast.error('Please deposit at least 0.001 ETH to FeeVault first');
        setIsMinting(false);
        setMintStatus('idle');
        return;
      }

      console.log('🚀 MINT: Calling Oracle API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/oracle/register-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          bitcoinAddress: data.bitcoinAddress,
          initialBalance: Number(currentBalance)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to register with Oracle');
      }
      
      const result = await response.json();
      
      if (result.success && result.transactionHash) {
        setMintTxHash(result.transactionHash);
        setMintStatus('success');
        
        const newMonitoringMap = new Map<string, boolean>();
        newMonitoringMap.set(data.bitcoinAddress, true);
        setMonitoredAddressesMap(newMonitoringMap);
        
        setAllVerifiedAddresses(prev => prev.map(addr => ({
          ...addr,
          mintStatus: addr.address === data.bitcoinAddress ? 'minted' as const : 'available' as const,
          mintTxHash: addr.address === data.bitcoinAddress ? result.transactionHash : undefined
        })));
        
        setIsAddressMonitored(true);
        setHasAnyActiveMonitoring(true);
        setRealActiveMonitoring(true);
        
        setTimeout(() => {
          console.log('🔄 MINT: Triggering post-mint data refresh...')
          setForceRefresh(prev => prev + 1)
        }, 2000);
        
        toast.success(
          <div className="flex flex-col gap-2">
            <strong>✅ Monitoring Activated!</strong>
            <p className="text-sm">Transaction sent successfully</p>
            <a 
              href={`https://www.megaexplorer.xyz/tx/${result.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              View on Explorer →
            </a>
          </div>,
          { duration: 5000 }
        );
        
        console.log('✅ MINT: Transaction sent:', result.transactionHash);
        console.log('   Real-time system will update balances automatically');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
        
        if (onMintComplete) {
          onMintComplete(data);
        }
      } else {
        throw new Error('Oracle registration failed - no transaction hash');
      }
      
    } catch (error: any) {
      console.error('❌ MINT: Failed:', error);
      
      if (error.name === 'AbortError') {
        toast.warning(
          <div className="flex flex-col gap-2">
            <strong>Request Timeout</strong>
            <p className="text-sm">The request took too long. Your transaction may still be processing.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs"
              >
                Check Dashboard
              </button>
              <button
                onClick={() => {
                  setMintStatus('idle');
                  setIsMinting(false);
                }}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-xs"
              >
                Try Again
              </button>
            </div>
          </div>,
          { duration: 10000 }
        );
        setMintStatus('idle');
        setIsMinting(false);
      } else {
        toast.error(
          <div className="flex flex-col gap-2">
            <strong>Registration Failed</strong>
            <p className="text-sm">{error.message}</p>
          </div>
        );
        setMintStatus('error');
        setIsMinting(false);
        
        setTimeout(() => {
          setMintStatus('idle');
        }, 3000);
      }
    }
  };

  const handleMintButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const currentBtcBalance = Number(currentBalance) / 1e8
    
    if (currentBtcBalance === 0 || !currentBtcBalance) {
      toast.error(
        <div className="flex flex-col gap-2">
          <strong>Cannot Mint with Zero Balance</strong>
          <p className="text-sm">Please fund your Bitcoin address first.</p>
        </div>
      );
      return;
    }
    
    if (isAddressMonitored) {
      toast.info('This address already has monitoring active.');
      return;
    }
    
    if (realActiveMonitoring) {
      toast.info(
        <div className="flex flex-col gap-2">
          <strong>Another Address is Being Monitored</strong>
          <p className="text-sm">Current Oracle balance: {currentOracleBalance.toFixed(8)} BTC. Wait for it to reach zero.</p>
        </div>
      );
      return;
    }
    
    if (feeVaultBalance < 0.001) {
      document.getElementById('fee-vault-section')?.scrollIntoView({ behavior: 'smooth' });
      toast.error('Please deposit ETH to Fee Vault first');
      return;
    }
    
    if (verifiedBitcoinAddress && isConnected && address) {
      onSubmit({
        amount: formattedBitcoinBalance,
        bitcoinAddress: verifiedBitcoinAddress
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
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
        
        <div id="fee-vault-section" className="transition-all duration-300 rounded-xl">
          <DepositFeeVault />
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground">THEN</span>
        </div>
      </div>
      
      <div className="text-center space-y-4">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Bitcoin className="h-8 w-8 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-500 via-primary to-blue-600 bg-clip-text text-transparent">
              Mint rBTC Token
            </span>
          </h1>
          {!isBalanceLoading && Number(currentBalance) > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              Live
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Initialize automatic minting of 1:1 backed rBTC on MegaETH
        </p>
      </div>

      {mintStatus === 'idle' && (
        <div className="bg-card border rounded-xl p-8 space-y-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
              {isBalanceRefreshing && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
                  <div className="h-full bg-primary animate-pulse w-full" />
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  Bitcoin Balance (from verified wallet)
                </h3>
                <div className="flex items-center gap-2">
                  {!isBalanceLoading && Number(currentBalance) > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-green-500" />
                      Real-time
                    </Badge>
                  )}
                  <button 
                    type="button"
                    onClick={refreshBalance}
                    disabled={isBalanceRefreshing || !verifiedBitcoinAddress}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors disabled:opacity-50 hover:scale-105 transform"
                    title="Refresh balance"
                  >
                    <RefreshCw className={`h-4 w-4 ${isBalanceRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isBalanceLoading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {formattedBitcoinBalance} BTC
                    </div>
                    {isBalanceRefreshing && (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    = {Number(currentBalance).toLocaleString()} satoshis
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
                  Balance is fetched automatically from your verified Bitcoin wallet
                  {!isBalanceLoading && Number(currentBalance) > 0 && (
                    <span className="text-green-600"> • Real-time sync active</span>
                  )}
                </p>
              </div>
            </div>
            
            {hasOutgoingTx && verifiedBitcoinAddress && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 dark:text-blue-400 text-xl flex-shrink-0">🔐</div>
                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      Quantum-Safe Protocol
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      <strong>Important:</strong> This address has made an outgoing transaction. Bitcoin's quantum protection has moved ALL your funds to new addresses under your seed phrase. This is normal - your funds are safe on new addresses. Verify a fresh address to continue monitoring.
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
            )}
            
            <div className="bg-card border rounded-xl p-6 relative z-10">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
                Your Verified Bitcoin Address
              </h3>
              
              {allVerifiedAddresses && allVerifiedAddresses.length > 0 ? (
                <>
                  <div className="space-y-3">
                    <div 
                      className="relative custom-dropdown"
                      style={{ isolation: 'isolate' }}
                    >
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full p-4 bg-muted/30 hover:bg-muted/50 border border-border rounded-xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary relative z-20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {verifiedBitcoinAddress ? (
                              <div className="space-y-1">
                                <div className="font-mono text-sm text-foreground font-medium">
                                  {`${verifiedBitcoinAddress.slice(0, 12)}...${verifiedBitcoinAddress.slice(-10)}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {verifiedBitcoinAddress.startsWith('tb1') ? '🟠 testnet' : '🟢 mainnet'}
                                  {monitoredAddressesMap.has(verifiedBitcoinAddress) && ' • ✅ Monitoring Active'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                📍 Select Bitcoin Address
                              </div>
                            )}
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {isDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0"
                            style={{ zIndex: 9998 }}
                            onClick={() => setIsDropdownOpen(false)}
                          />
                          <div 
                            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
                            style={{
                              maxHeight: '240px',
                              overflowY: 'auto',
                              zIndex: 9999
                            }}
                          >
                            {allVerifiedAddresses.map((addr, idx) => {
                              const address = typeof addr === 'string' ? addr : addr.address;
                              const isTestnet = address.startsWith('tb1');
                              const shortAddr = `${address.slice(0, 12)}...${address.slice(-10)}`;
                              const hasActiveMonitoring = monitoredAddressesMap.has(address);
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    handleAddressChange(address);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-muted/70"
                                >
                                  <div className="space-y-1">
                                    <div className="font-mono text-sm text-foreground font-medium">
                                      {shortAddr}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {isTestnet ? '🟠 testnet' : '🟢 mainnet'}
                                      {hasActiveMonitoring && ' • ✅ Monitoring Active'}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {verifiedBitcoinAddress && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="font-mono text-xs text-foreground/80 break-all">
                        {verifiedBitcoinAddress}
                      </div>
                    </div>
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

            {allVerifiedAddresses.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Important: One Address Monitoring Limit
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      • Only one Bitcoin address can be monitored at a time
                      • You can verify multiple addresses but activate monitoring for one
                      • When balance reaches zero, monitoring stops automatically
                      • You can then mint another address with balance
                    </p>
                    {hasAnyActiveMonitoring && currentOracleBalance > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2">
                        Current Oracle balance: {currentOracleBalance.toFixed(8)} BTC
                        {!isBalanceLoading && (
                          <span className="text-green-600"> • Real-time monitoring active</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {verifiedBitcoinAddress && !isBalanceLoading && (
              <div className="space-y-4 relative z-0">
                <button
                  type="button"
                  onClick={handleMintButtonClick}
                  disabled={!verifiedBitcoinAddress || isMinting || feeVaultBalance < 0.001}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                    isAddressMonitored
                      ? 'bg-green-600 cursor-not-allowed'
                      : realActiveMonitoring
                        ? 'bg-yellow-600 cursor-not-allowed'
                        : Number(currentBalance) === 0
                          ? 'bg-gray-600 cursor-not-allowed'
                          : feeVaultBalance < 0.001 
                            ? 'bg-gray-700 hover:bg-gray-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                >
                  {isAddressMonitored ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Already Monitoring ✅
                    </div>
                  ) : realActiveMonitoring ? (
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Another Address Already Monitoring
                    </div>
                  ) : isMinting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Activating Oracle Monitoring...
                    </div>
                  ) : Number(currentBalance) === 0 ? (
                    'No Bitcoin Balance to Mint'
                  ) : (
                    `Mint ${formattedBitcoinBalance} rBTC-SYNTH`
                  )}
                </button>

                {isAddressMonitored && (
                  <div className="p-4 bg-green-900/20 dark:bg-green-900/20 bg-green-100 border border-green-500/30 dark:border-green-500/30 border-green-400 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-green-400 dark:text-green-400 text-green-600 text-xl">✅</div>
                      <div className="flex-1">
                        <p className="text-green-400 dark:text-green-400 text-green-800 text-sm font-medium mb-2">
                          This Address Already Being Monitored
                        </p>
                        <p className="text-green-300/60 dark:text-green-300/60 text-green-700 text-xs">
                          The Oracle system automatically mints/burns tokens based on balance changes.
                          {!isBalanceLoading && (
                            <span className="block mt-1 text-green-600">Real-time sync is active for your tokens.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {realActiveMonitoring && !isAddressMonitored && currentOracleBalance > 0 && (
                  <div className="p-4 bg-yellow-900/20 dark:bg-yellow-900/20 bg-yellow-100 border border-yellow-500/30 dark:border-yellow-500/30 border-yellow-400 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-yellow-400 dark:text-yellow-400 text-yellow-600 text-xl">⚠️</div>
                      <div className="flex-1">
                        <p className="text-yellow-400 dark:text-yellow-400 text-yellow-800 text-sm font-medium mb-2">
                          Another Address is Being Monitored
                        </p>
                        <p className="text-yellow-300/60 dark:text-yellow-300/60 text-yellow-700 text-xs">
                          Current Oracle balance: {currentOracleBalance.toFixed(8)} BTC. 
                          Wait for it to reach zero to mint this address.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasAnyActiveMonitoring && !realActiveMonitoring && currentOracleBalance > 0 && (
                  <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-orange-400 text-xl">⚠️</div>
                      <div className="flex-1">
                        <p className="text-orange-400 text-sm font-medium mb-2">
                          Oracle has stale balance
                        </p>
                        <p className="text-orange-300/60 text-xs">
                          Oracle shows {currentOracleBalance.toFixed(8)} BTC but no address matches. 
                          You can mint this address.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {feeVaultBalance < 0.001 && (
                  <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-orange-400 text-xl">⚠️</div>
                      <div className="flex-1">
                        <p className="text-orange-400 text-sm font-medium mb-2">
                          Deposit at least 0.001 ETH to Fee Vault to enable minting
                        </p>
                        <p className="text-orange-300/80 text-xs mb-3">
                          Current balance: {feeVaultBalance.toFixed(4)} ETH (need: 0.001 ETH)
                        </p>
                        <button
                          type="button"
                          onClick={() => document.getElementById('fee-vault-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          Go to Fee Vault Deposit
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {feeVaultBalance >= 0.001 && Number(currentBalance) > 0 && !isAddressMonitored && !realActiveMonitoring && (
                  <div className="p-4 bg-green-900/20 dark:bg-green-900/20 bg-green-100 border border-green-500/30 dark:border-green-500/30 border-green-400 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-green-400 dark:text-green-400 text-green-600 text-xl">✅</div>
                      <div className="flex-1">
                        <p className="text-green-400 dark:text-green-400 text-green-800 text-sm font-medium mb-1">
                          Ready to mint rBTC-SYNTH tokens
                        </p>
                        <p className="text-green-300/80 dark:text-green-300/80 text-green-700 text-xs">
                          Fee Vault: {feeVaultBalance.toFixed(4)} ETH • Bitcoin: {formattedBitcoinBalance} BTC
                          {!isBalanceLoading && (
                            <span className="block mt-1">Real-time sync will be activated after minting.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {mintStatus === 'pending' && (
        <div className="bg-card border rounded-xl p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h3 className="text-xl font-bold">Activating Oracle Monitoring...</h3>
            <p className="text-muted-foreground">
              Oracle is registering your Bitcoin address for automatic synchronization.
            </p>
          </div>
        </div>
      )}

      {mintStatus === 'success' && (
        <div className="bg-card border rounded-xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold">Monitoring Activated!</h3>
            <p className="text-muted-foreground">
              Your Bitcoin address is now being monitored 24/7. Tokens will be minted and burned automatically.
            </p>
            {mintTxHash && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
                <a 
                  href={`https://www.megaexplorer.xyz/tx/${mintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline flex items-center justify-center gap-1"
                >
                  {`${mintTxHash.slice(0, 10)}...${mintTxHash.slice(-8)}`}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Real-time monitoring is now active. Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}

      {mintStatus === 'error' && (
        <div className="bg-card border rounded-xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold">Mint Failed</h3>
            <p className="text-muted-foreground">
              Failed to activate monitoring. Please try again.
            </p>
            <button
              onClick={() => setMintStatus('idle')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all"
            >
              Try Again
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}