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
    isMonitored: boolean,
    realBitcoinBalance: number
  }[]>([])
  
  // 🔥 PRODUCTION FIX: Only show REAL Bitcoin balance from Mempool API
  const [realBitcoinBalance, setRealBitcoinBalance] = useState<number>(0)
  const [isBalanceLoading, setIsBalanceLoading] = useState(true)
  const [isBalanceRefreshing, setIsBalanceRefreshing] = useState(false)
  
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [hasOutgoingTx, setHasOutgoingTx] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [feeVaultBalance, setFeeVaultBalance] = useState<number>(0)
  const [hasAnyActiveMonitoring, setHasAnyActiveMonitoring] = useState<boolean>(false)
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

  // 🔥 PRODUCTION FIX: Format balance from REAL Bitcoin balance (Mempool API)
  const formattedBitcoinBalance = useMemo(() => {
    if (isBalanceLoading) {
      console.log('⏳ MINT: Balance loading...')
      return '0.00000000'
    }
    
    const btc = realBitcoinBalance || 0
    console.log('💰 MINT: Real Bitcoin balance:', btc.toFixed(8), 'BTC')
    
    return btc.toFixed(8)
  }, [realBitcoinBalance, isBalanceLoading])

  // 🔥 PRODUCTION: Load REAL Bitcoin balance from Mempool API
  const loadRealBitcoinBalance = useCallback(async (bitcoinAddr: string): Promise<number> => {
    if (!bitcoinAddr) {
      console.log('⚠️ MINT: No Bitcoin address provided')
      return 0
    }

    console.log('🔄 MINT: Loading REAL Bitcoin balance from Mempool API for:', bitcoinAddr)
    setIsBalanceRefreshing(true)
    
    try {
      const balanceData = await mempoolService.getAddressBalance(bitcoinAddr)
      
      if (balanceData && typeof balanceData.balance === 'number') {
        const btcBalance = balanceData.balance
        console.log(`✅ MINT: Real Bitcoin balance loaded: ${btcBalance.toFixed(8)} BTC`)
        
        setRealBitcoinBalance(btcBalance)
        return btcBalance
      } else {
        console.log('⚠️ MINT: Mempool returned no balance data')
        setRealBitcoinBalance(0)
        return 0
      }
    } catch (error) {
      console.error('❌ MINT: Failed to load Bitcoin balance from Mempool:', error)
      setRealBitcoinBalance(0)
      return 0
    } finally {
      setIsBalanceRefreshing(false)
      setIsBalanceLoading(false)
    }
  }, [])

  const performCompleteDataCleanup = useCallback(() => {
    console.log('🧹 MINT: Performing complete data cleanup')
    setVerifiedBitcoinAddress('')
    setAllVerifiedAddresses([])
    setRealBitcoinBalance(0)
    setIsBalanceLoading(false)
    setHasAttemptedFetch(false)
    setMintStatus('idle')
    setMintTxHash('')
    setHasAnyActiveMonitoring(false)
    setValue('bitcoinAddress', '', { shouldValidate: false })
    setValue('amount', '0', { shouldValidate: false })
  }, [setValue])

  useEffect(() => {
    if (address) {
      performCompleteDataCleanup()
    }
  }, [address, performCompleteDataCleanup])

  // 🔥 PRODUCTION: Check if user has active monitoring from Supabase
  const checkActiveMonitoring = useCallback(async (): Promise<boolean> => {
    if (!address) return false
    
    try {
      console.log('🔍 MINT: Checking active monitoring from Supabase')
      
      const response = await fetch(`/api/supabase/bitcoin-addresses?eth_address=${address}&is_monitoring=true`)
      
      if (!response.ok) {
        console.log('⚠️ MINT: Failed to check monitoring status')
        return false
      }
      
      const data = await response.json()
      const hasMonitoring = data.addresses && data.addresses.length > 0
      
      console.log(`🔍 MINT: User has active monitoring: ${hasMonitoring}`)
      return hasMonitoring
      
    } catch (error) {
      console.error('❌ MINT: Failed to check monitoring status:', error)
      return false
    }
  }, [address])

  useEffect(() => {
    const loadVerifiedAddresses = async () => {
      const specificAddress = searchParams.get('address')
      
      if (!address) return
      
      console.log('📋 MINT: Loading verified addresses for user:', address)
      
      try {
        // 🔥 PRODUCTION: Check active monitoring from Supabase
        const hasMonitoring = await checkActiveMonitoring()
        setHasAnyActiveMonitoring(hasMonitoring)
        
        // Load user data from Oracle
        const userData = await oracleService.getUserByAddress(address) as OracleUserData | null
        
        const verifiedAddrs: {
          address: string;
          verifiedAt: string;
          isMonitored: boolean;
          realBitcoinBalance: number;
        }[] = []
        
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
          
          // 🔥 PRODUCTION: Load REAL balance for each address from Mempool
          for (const btcAddr of Array.from(allAddresses)) {
            try {
              const balanceData = await mempoolService.getAddressBalance(btcAddr)
              const realBalance = balanceData?.balance || 0
              
              // Check if this address is monitored from Supabase
              const monitoringResponse = await fetch(`/api/supabase/bitcoin-addresses?bitcoin_address=${btcAddr}&is_monitoring=true`)
              const monitoringData = await monitoringResponse.json()
              const isMonitored = monitoringData.addresses && monitoringData.addresses.length > 0
              
              verifiedAddrs.push({
                address: btcAddr,
                verifiedAt: userData.registeredAt || new Date().toISOString(),
                isMonitored: isMonitored,
                realBitcoinBalance: realBalance
              })
              
              console.log(`📋 MINT: Address ${btcAddr} - Balance: ${realBalance.toFixed(8)} BTC, Monitored: ${isMonitored}`)
            } catch (err) {
              console.error(`Error loading balance for ${btcAddr}:`, err)
              verifiedAddrs.push({
                address: btcAddr,
                verifiedAt: userData.registeredAt || new Date().toISOString(),
                isMonitored: false,
                realBitcoinBalance: 0
              })
            }
          }
        }
        
        if (verifiedAddrs.length > 0) {
          setAllVerifiedAddresses(verifiedAddrs)
          
          const selectedAddress = specificAddress || verifiedAddrs[0].address
          setVerifiedBitcoinAddress(selectedAddress)
          setValue('bitcoinAddress', selectedAddress, { shouldValidate: true })
          
          // Load real balance for selected address
          await loadRealBitcoinBalance(selectedAddress)
          
          const selectedAddr = verifiedAddrs.find(a => a.address === selectedAddress)
          if (selectedAddr) {
            setValue('amount', selectedAddr.realBitcoinBalance.toFixed(8))
          }
          
          console.log(`📋 MINT: Selected address ${selectedAddress}`)
        }
      } catch (error) {
        console.error('❌ MINT: Error loading verified addresses:', error)
      }
    }
    
    loadVerifiedAddresses()
  }, [address, searchParams, setValue, loadRealBitcoinBalance, checkActiveMonitoring, forceRefresh])

  const refreshBalance = useCallback(() => {
    if (verifiedBitcoinAddress) {
      console.log('🔄 MINT: Refreshing balance for:', verifiedBitcoinAddress)
      loadRealBitcoinBalance(verifiedBitcoinAddress)
    }
  }, [verifiedBitcoinAddress, loadRealBitcoinBalance])

  const handleAddressChange = useCallback(async (newAddress: string) => {
    console.log('🔄 MINT: Changing to address:', newAddress)
    
    setVerifiedBitcoinAddress(newAddress)
    setValue('bitcoinAddress', newAddress, { shouldValidate: true })
    setRealBitcoinBalance(0)
    setIsBalanceLoading(true)
    
    console.log(`🔄 MINT: Loading balance for address: ${newAddress}`)
    
    if (newAddress) {
      await loadRealBitcoinBalance(newAddress)
    }
  }, [setValue, loadRealBitcoinBalance])

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

  // 🔥 PRODUCTION: Background refresh every 30 seconds
  useEffect(() => {
    if (!address || !verifiedBitcoinAddress) return

    const interval = setInterval(() => {
      console.log('🔄 MINT: Background balance refresh...')
      loadRealBitcoinBalance(verifiedBitcoinAddress)
    }, 30000)

    return () => clearInterval(interval)
  }, [address, verifiedBitcoinAddress, loadRealBitcoinBalance])

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
    
    if (realBitcoinBalance === 0 || !realBitcoinBalance) {
      toast.error(
        <div className="flex flex-col gap-2">
          <strong>Cannot Mint with Zero Balance</strong>
          <p className="text-sm">Please fund your Bitcoin address before minting.</p>
        </div>
      );
      return;
    }
    
    if (hasAnyActiveMonitoring) {
      toast.warning(
        <div className="flex flex-col gap-2">
          <strong>Monitoring Already Active</strong>
          <p className="text-sm">Another address is being monitored. Wait for it to complete.</p>
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
          initialBalance: Math.round(realBitcoinBalance * 100000000)
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
        
        setAllVerifiedAddresses(prev => prev.map(addr => ({
          ...addr,
          isMonitored: addr.address === data.bitcoinAddress ? true : addr.isMonitored
        })));
        
        setHasAnyActiveMonitoring(true);
        
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
            <p className="text-sm">The request took too long. Check Dashboard for status.</p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(
          <div className="flex flex-col gap-2">
            <strong>Registration Failed</strong>
            <p className="text-sm">{error.message}</p>
          </div>
        );
      }
      
      setMintStatus('error');
      setIsMinting(false);
      
      setTimeout(() => {
        setMintStatus('idle');
      }, 3000);
    }
  };

  const handleMintButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (realBitcoinBalance === 0 || !realBitcoinBalance) {
      toast.error(
        <div className="flex flex-col gap-2">
          <strong>Cannot Mint with Zero Balance</strong>
          <p className="text-sm">Please fund your Bitcoin address first.</p>
        </div>
      );
      return;
    }
    
    const selectedAddr = allVerifiedAddresses.find(a => a.address === verifiedBitcoinAddress)
    if (selectedAddr?.isMonitored) {
      toast.info('This address is already being monitored.');
      return;
    }
    
    if (hasAnyActiveMonitoring) {
      toast.info(
        <div className="flex flex-col gap-2">
          <strong>Another Address Already Monitored</strong>
          <p className="text-sm">Wait for current monitoring to complete.</p>
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

  const selectedAddressData = allVerifiedAddresses.find(a => a.address === verifiedBitcoinAddress)

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
          {!isBalanceLoading && realBitcoinBalance > 0 && (
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
                  Bitcoin Balance (Real-time from Mempool)
                </h3>
                <div className="flex items-center gap-2">
                  {!isBalanceLoading && realBitcoinBalance > 0 && (
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
                    = {Math.round(realBitcoinBalance * 100000000).toLocaleString()} satoshis
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
                  Balance is fetched directly from Mempool.space (real Bitcoin blockchain data)
                  {!isBalanceLoading && realBitcoinBalance > 0 && (
                    <span className="text-green-600"> • Live data</span>
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
                      <strong>Important:</strong> This address has made an outgoing transaction. Bitcoin's quantum protection has moved ALL your funds to new addresses under your seed phrase. Verify a fresh address to continue monitoring.
                    </p>
                    <Link 
                      href="/verify" 
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all"
                    >
                      <Shield className="h-3 w-3" />
                      Verify New Address
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
                                  {selectedAddressData?.isMonitored && ' • ✅ Monitoring Active'}
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
                              const isTestnet = addr.address.startsWith('tb1');
                              const shortAddr = `${addr.address.slice(0, 12)}...${addr.address.slice(-10)}`;
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    handleAddressChange(addr.address);
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
                                      {addr.isMonitored && ' • ✅ Monitoring Active'}
                                      {!addr.isMonitored && addr.realBitcoinBalance > 0 && ` • ${addr.realBitcoinBalance.toFixed(8)} BTC`}
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
                      One Address Monitoring Limit
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      • Only one Bitcoin address can be monitored at a time
                      • Monitoring stops automatically when balance reaches zero
                      • You can then mint another address
                    </p>
                  </div>
                </div>
              </div>
            )}

            {verifiedBitcoinAddress && !isBalanceLoading && (
              <div className="space-y-4 relative z-0">
                <button
                  type="button"
                  onClick={handleMintButtonClick}
                  disabled={!verifiedBitcoinAddress || isMinting || feeVaultBalance < 0.001 || selectedAddressData?.isMonitored || hasAnyActiveMonitoring}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                    selectedAddressData?.isMonitored
                      ? 'bg-green-600 cursor-not-allowed'
                      : hasAnyActiveMonitoring
                        ? 'bg-yellow-600 cursor-not-allowed'
                        : realBitcoinBalance === 0
                          ? 'bg-gray-600 cursor-not-allowed'
                          : feeVaultBalance < 0.001 
                            ? 'bg-gray-700 hover:bg-gray-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                >
                  {selectedAddressData?.isMonitored ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Already Monitoring ✅
                    </div>
                  ) : hasAnyActiveMonitoring ? (
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Another Address Already Monitoring
                    </div>
                  ) : isMinting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Activating Monitoring...
                    </div>
                  ) : realBitcoinBalance === 0 ? (
                    'No Bitcoin Balance to Mint'
                  ) : (
                    `Mint ${formattedBitcoinBalance} rBTC-SYNTH`
                  )}
                </button>

                {selectedAddressData?.isMonitored && (
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-green-600 dark:text-green-400 text-xl">✅</div>
                      <div className="flex-1">
                        <p className="text-green-800 dark:text-green-400 text-sm font-medium mb-2">
                          This Address is Being Monitored
                        </p>
                        <p className="text-green-700 dark:text-green-300/60 text-xs">
                          Oracle automatically mints/burns tokens based on balance changes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasAnyActiveMonitoring && !selectedAddressData?.isMonitored && (
                  <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
                      <div className="flex-1">
                        <p className="text-yellow-800 dark:text-yellow-400 text-sm font-medium mb-2">
                          Another Address is Being Monitored
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300/60 text-xs">
                          Wait for current monitoring to complete before minting this address.
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
                          Deposit at least 0.001 ETH to Fee Vault
                        </p>
                        <p className="text-orange-300/80 text-xs mb-3">
                          Current: {feeVaultBalance.toFixed(4)} ETH (need: 0.001 ETH)
                        </p>
                        <button
                          type="button"
                          onClick={() => document.getElementById('fee-vault-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          Go to Fee Vault
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {feeVaultBalance >= 0.001 && realBitcoinBalance > 0 && !selectedAddressData?.isMonitored && !hasAnyActiveMonitoring && (
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-green-600 dark:text-green-400 text-xl">✅</div>
                      <div className="flex-1">
                        <p className="text-green-800 dark:text-green-400 text-sm font-medium mb-1">
                          Ready to mint rBTC-SYNTH tokens
                        </p>
                        <p className="text-green-700 dark:text-green-300/80 text-xs">
                          Fee Vault: {feeVaultBalance.toFixed(4)} ETH • Bitcoin: {formattedBitcoinBalance} BTC
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
              Your Bitcoin address is now being monitored 24/7.
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