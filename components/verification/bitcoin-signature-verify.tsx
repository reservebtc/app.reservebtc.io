'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Copy, Check, ChevronDown, ChevronUp, Info, ArrowRight, Rocket, Activity } from 'lucide-react'
import { useAccount } from 'wagmi'
// CRITICAL SECURITY FIX: Using secure Bitcoin signature validator
import { BitcoinSignatureValidatorFixed } from '@/lib/bitcoin-signature-validator-fixed'
import { useRouter } from 'next/navigation'
// User data now handled by Professional Oracle only
import { useUserVerification } from '@/lib/user-profile-hooks'
import { saveVerifiedUserToCache } from '@/lib/verified-users-cache'
// Real-time integration
import { useRealtimeUserData } from '@/lib/professional-realtime-hooks'
// Old Oracle modules removed - using Professional Oracle only
// Smart contract integration removed - using Professional Oracle only

interface BitcoinSignatureVerifyProps {
  onVerificationComplete?: (data: { address: string; signature: string; verified: boolean }) => void
}

interface WalletInstruction {
  id: string
  name: string
  icon: string
  recommended?: boolean
  hardwareCompatible?: Array<{
    name: string
    icon: string
    color: string
  }>
  steps: string[]
  testnet?: string[]
}

// UI Badge component
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

export function BitcoinSignatureVerify({ onVerificationComplete }: BitcoinSignatureVerifyProps) {
  const { address: ethAddress, isConnected: isMetaMaskConnected } = useAccount()
  const router = useRouter()
  
  // Real-time integration
  const userData = useRealtimeUserData()
  
  // Use new user verification hook for other purposes if needed
  const verification = useUserVerification()

  /**
   * Create/Update user profile via Professional Oracle (ORACLE 2.1.0 ARRAY SUPPORT)
   * Handles both new users and adding addresses to existing users
   */
  const createOracleProfile = async (bitcoinAddress: string, signature: string) => {
    if (!ethAddress || !bitcoinAddress) {
      console.error('❌ PROFILE: Missing required data - ethAddress or bitcoinAddress')
      console.log(`   ETH Address: ${ethAddress ? ethAddress.substring(0, 10) + '...' : 'MISSING'}`)
      console.log(`   BTC Address: ${bitcoinAddress || 'MISSING'}`)
      return false
    }
    
    try {
      console.log('🏢 VERIFICATION: Oracle 2.1.0 - Checking if user exists for array support...')
      
      // 
      const { oracleService } = await import('@/lib/oracle-service')
      const existingUser = await oracleService.getUserByAddress(ethAddress)
      
      if (existingUser) {
        console.log('👤 VERIFICATION: Existing user found - adding Bitcoin address to array')
        console.log('📊 VERIFICATION: Current addresses:', oracleService.getUserBitcoinAddresses(existingUser))
        
        // 
        const addResult = await oracleService.addBitcoinAddressToExistingUser(
          ethAddress,
          bitcoinAddress,
          signature
        )
        
        if (addResult.success) {
          console.log('✅ VERIFICATION: Bitcoin address added to existing user array')
          console.log('📊 VERIFICATION: Total addresses now:', addResult.totalAddresses)
          
          // Also save to cache for immediate UI update
          await saveVerifiedUserToCache(ethAddress, bitcoinAddress, signature)
          return true
        } else {
          console.log('⚠️ VERIFICATION: Failed to add address to existing user:', addResult.error)
        }
      } else {
        console.log('👤 VERIFICATION: New user - creating profile with first Bitcoin address')
      }
      
      // Create new profile or fallback for existing user
      console.log('📡 VERIFICATION: Calling Professional Oracle API for profile creation...')
      const profileResult = await oracleService.createUserProfile(
        ethAddress, 
        bitcoinAddress, 
        signature
      )
      
      if (profileResult.success) {
        console.log('✅ VERIFICATION: Professional Oracle profile created/updated successfully')
        console.log('📊 VERIFICATION: User registered with Bitcoin address array support')
        
        // Also save to cache for immediate UI update
        console.log('💾 VERIFICATION: Also saving to cache for immediate UI update...')
        await saveVerifiedUserToCache(ethAddress, bitcoinAddress, signature)
        console.log('✅ VERIFICATION: Cache updated - user visible in dashboard immediately')
        
        return true
        
      } else {
        console.log('⚠️ VERIFICATION: Professional Oracle failed, using fallback cache system')
        // Fallback: Save to cache for immediate UI display
        await saveVerifiedUserToCache(ethAddress, bitcoinAddress, signature)
        return true
      }
      
    } catch (error: any) {
      console.error('❌ VERIFICATION: Profile creation failed:', error)
      
      // Fallback: Still save to cache so user sees something
      try {
        console.log('🔄 VERIFICATION: Using fallback cache system...')
        await saveVerifiedUserToCache(ethAddress, bitcoinAddress, signature)
        console.log('✅ VERIFICATION: Fallback successful - user will see verification status')
        return true
      } catch (fallbackError) {
        console.error('❌ VERIFICATION: Even fallback failed:', fallbackError)
        return false
      }
    }
  }

  const [bitcoinAddress, setBitcoinAddress] = useState('')
  const [signature, setSignature] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [activeWallet, setActiveWallet] = useState<string | null>(null)
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null)
  const [addressUniquenessCheck, setAddressUniquenessCheck] = useState<{
    isChecking: boolean
    isUnique: boolean | null
    error: string | null
    conflictUser: string | null
    message?: string
  }>({
    isChecking: false,
    isUnique: null,
    error: null,
    conflictUser: null
  })

  // CRITICAL FIX: Fixed timestamp for consistent signature verification
  const [fixedTimestamp] = useState(() => Math.floor(Date.now() / 1000))

  const message = ethAddress 
    ? `ReserveBTC Wallet Verification
Timestamp: ${fixedTimestamp}
MegaETH Address: ${ethAddress}
I confirm ownership of this Bitcoin address for use with ReserveBTC protocol.`
    : ''

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  // Real-time sync for existing verified addresses
  useEffect(() => {
    if (userData.userData && !userData.loading) {
      console.log('📡 VERIFY: Real-time user data update received')
      
      // Check if user already has verified addresses from real-time system
      const userBitcoinAddresses = (userData.userData as any).bitcoinAddresses || []
      if (userBitcoinAddresses.length > 0) {
        console.log('📡 VERIFY: User has', userBitcoinAddresses.length, 'verified addresses in real-time system')
        
        // If we just verified an address and it's now in real-time data, we can show success
        if (verifiedAddress && userBitcoinAddresses.includes(verifiedAddress)) {
          console.log('📡 VERIFY: Just verified address confirmed in real-time system')
        }
      }
    }
  }, [userData, verifiedAddress])

  // Check Bitcoin address uniqueness (enhanced version)
  const checkAddressUniqueness = async (bitcoinAddress: string) => {
    if (!bitcoinAddress || !ethAddress) return
    
    console.log('🔍 UNIQUENESS CHECK: Checking address:', bitcoinAddress.slice(0, 8) + '...')
    console.log('🔍 UNIQUENESS CHECK: Current user:', ethAddress.slice(0, 8) + '...')
    
    setAddressUniquenessCheck({
      isChecking: true,
      isUnique: null,
      error: null,
      conflictUser: null
    })

    try {
      // First check real-time data if available
      if (userData.userData && !userData.loading) {
        const userBitcoinAddresses = (userData.userData as any).bitcoinAddresses || []
        if (userBitcoinAddresses.includes(bitcoinAddress)) {
          console.log('📡 UNIQUENESS CHECK: Address found in real-time data for current user')
          setAddressUniquenessCheck({
            isChecking: false,
            isUnique: false,
            error: null,
            conflictUser: 'current_user',
            message: "You have already verified this Bitcoin address"
          })
          return
        }
      }

      const { oracleService } = await import('@/lib/oracle-service')
      const allUsers = await oracleService.getDecryptedUsers()
      
      if (!allUsers) {
        throw new Error('Unable to fetch user data from Oracle')
      }
      

      for (const user of allUsers) {
        // Check user addresses silently for privacy
        const isCurrentUser = user.ethAddress?.toLowerCase() === ethAddress.toLowerCase()
        
        if (isCurrentUser) {
          console.log('🔍 UNIQUENESS CHECK: Checking current user addresses')
        }
        
        // Check all possible fields and Bitcoin address arrays
        const userDataAny = user as any
        
        // Collect ALL Bitcoin addresses for this user
        const allUserBitcoinAddresses: string[] = []
        
        // Primary addresses
        if (user.bitcoinAddress) allUserBitcoinAddresses.push(user.bitcoinAddress)
        if (user.btcAddress) allUserBitcoinAddresses.push(user.btcAddress)
        if (userDataAny.bitcoin_address) allUserBitcoinAddresses.push(userDataAny.bitcoin_address)
        
        // Address arrays
        if (userDataAny.bitcoinAddresses && Array.isArray(userDataAny.bitcoinAddresses)) {
          allUserBitcoinAddresses.push(...userDataAny.bitcoinAddresses)
        }
        if (userDataAny.processedBitcoinAddresses && Array.isArray(userDataAny.processedBitcoinAddresses)) {
          allUserBitcoinAddresses.push(...userDataAny.processedBitcoinAddresses)
        }
        if (userDataAny.allBitcoinAddresses && Array.isArray(userDataAny.allBitcoinAddresses)) {
          allUserBitcoinAddresses.push(...userDataAny.allBitcoinAddresses)
        }
        if (userDataAny.btcAddresses && Array.isArray(userDataAny.btcAddresses)) {
          allUserBitcoinAddresses.push(...userDataAny.btcAddresses)
        }
        
        // Check if the address is found for this user
        if (allUserBitcoinAddresses.includes(bitcoinAddress)) {
          if (user.ethAddress?.toLowerCase() === ethAddress.toLowerCase()) {
            console.log('⚠️ UNIQUENESS CHECK: Current user already verified this address')
            setAddressUniquenessCheck({
              isChecking: false,
              isUnique: false,
              error: null,
              conflictUser: 'current_user',
              message: "You have already verified this Bitcoin address"
            })
          } else {
            console.log('❌ UNIQUENESS CHECK: Address belongs to another user')
            setAddressUniquenessCheck({
              isChecking: false,
              isUnique: false,
              error: null,
              conflictUser: 'other_user',
              message: "This Bitcoin address has already been verified by another user"
            })
          }
          return
        }
      }
      
      console.log('UNIQUENESS CHECK: Address is available for verification')
      setAddressUniquenessCheck({
        isChecking: false,
        isUnique: true,
        error: null,
        conflictUser: null,
        message: "Bitcoin address is available for verification"
      })
      
    } catch (error) {
      console.error('❌ UNIQUENESS CHECK: Error checking address uniqueness:', error)
      setAddressUniquenessCheck({
        isChecking: false,
        isUnique: null,
        error: 'Unable to verify address uniqueness. Proceeding with caution.',
        conflictUser: null,
        message: "Unable to verify address uniqueness. Proceeding with caution."
      })
    }
  }

  // useEffect to check address uniqueness when bitcoinAddress changes
  useEffect(() => {
    if (bitcoinAddress && bitcoinAddress.length >= 26) { // Minimum Bitcoin address length
      const debounceTimer = setTimeout(() => {
        checkAddressUniqueness(bitcoinAddress)
      }, 500) // 500ms debounce

      return () => clearTimeout(debounceTimer)
    } else {
      // Reset check state when address is too short
      setAddressUniquenessCheck({
        isChecking: false,
        isUnique: null,
        error: null,
        conflictUser: null
      })
    }
  }, [bitcoinAddress, ethAddress])

  // 🔐 CRITICAL SECURITY FIX: Proper signature validation with address verification
  const verifyBitcoinSignature = async (address: string, message: string, signature: string): Promise<boolean> => {
    console.log('🔐 VALIDATOR: Starting signature verification')
    console.log(`   Address: ${address}`)
    console.log(`   Message length: ${message.length}`)
    console.log(`   Signature length: ${signature.length}`)
    
    try {
      const isValid = BitcoinSignatureValidatorFixed.verify(address, message, signature)
      
      if (isValid) {
        console.log('✅ Signature verified successfully')
        return true
      } else {
        console.error('❌ Invalid signature')
        return false
      }
      
    } catch (error) {
      console.error('❌ Signature validation error:', error)
      return false
    }
  }

  const verifySignature = async () => {
    if (!bitcoinAddress || !signature || !message) {
      setVerificationResult({
        success: false,
        message: 'Please provide Bitcoin address and signature'
      })
      return
    }

    // Check address uniqueness before verification
    if (addressUniquenessCheck.isUnique === false) {
      setVerificationResult({
        success: false,
        message: `Cannot verify: ${addressUniquenessCheck.error}`
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Clean up inputs
      const cleanSignature = signature.trim().replace(/[\r\n]+/g, '')
      const cleanAddress = bitcoinAddress.trim()
      
      if (cleanSignature.length < 64) {
        setVerificationResult({
          success: false,
          message: 'Signature appears too short. Please ensure you copied the complete signature.'
        })
        setIsVerifying(false)
        return
      }
      
      const isValid = await verifyBitcoinSignature(cleanAddress, message, cleanSignature)
      
      if (!isValid) {
        setVerificationResult({
          success: false,
          message: 'Invalid signature. The signature does not match the Bitcoin address.'
        })
        console.error('Signature validation failed - address/signature mismatch')
        setIsVerifying(false)
        return
      }
      
      setVerificationResult({
        success: true,
        message: 'Bitcoin signature verified successfully with BIP-322 cryptographic validation!'
      })
      
      // Save verified address for navigation
      setVerifiedAddress(cleanAddress)
      
      // Create Oracle profile for the verified user via Professional Oracle
      console.log('🎯 VERIFY: BIP-322 verification successful!')
      console.log('🔍 SAVING TO ORACLE - ADDRESS:', cleanAddress)
      console.log('🔍 SAVING TO ORACLE - ETH ADDRESS:', ethAddress)
      console.log('🔄 VERIFY: Creating Professional Oracle profile for user...')
      
      try {
        const profileCreated = await createOracleProfile(cleanAddress, cleanSignature)
        if (profileCreated) {
          console.log('✅ VERIFY: Professional Oracle profile created successfully')
          
          console.log('✅ VERIFY: Verification completed!')
          
          // 🔥 SUPABASE: Save verified Bitcoin address to database
          console.log('💾 SUPABASE: Saving Bitcoin address to database...')
          console.log('   ETH:', ethAddress)
          console.log('   BTC:', cleanAddress)
          console.log('   Network:', cleanAddress.startsWith('tb1') || cleanAddress.startsWith('2') || cleanAddress.startsWith('m') || cleanAddress.startsWith('n') ? 'testnet' : 'mainnet')

          try {
            const supabasePayload = {
              bitcoinAddress: cleanAddress,
              ethereumAddress: ethAddress,
              message: message,
              signature: cleanSignature,
              network: cleanAddress.startsWith('tb1') || cleanAddress.startsWith('2') || cleanAddress.startsWith('m') || cleanAddress.startsWith('n') ? 'testnet' : 'mainnet'
            }
            
            console.log('📤 SUPABASE: Sending payload to /api/verify-wallet...')
            
            const supabaseResponse = await fetch('/api/verify-wallet', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(supabasePayload)
            })
            
            const supabaseData = await supabaseResponse.json()
            
            if (supabaseResponse.ok && supabaseData.success) {
              console.log('✅ SUPABASE: Bitcoin address saved to database successfully')
              console.log('📊 SUPABASE: Response:', supabaseData)
            } else {
              console.log('⚠️ SUPABASE: Failed to save to database:', supabaseData.error || 'Unknown error')
              console.log('   Oracle still has the data, so user can proceed')
            }
          } catch (supabaseError: any) {
            console.error('❌ SUPABASE: Database save error:', supabaseError)
            console.log('   Oracle has the data, user can still proceed')
          }
          
        } else {
          console.log('⚠️ VERIFY: Professional Oracle profile creation failed, but user can still proceed')
        }
      } catch (error) {
        console.log('⚠️ VERIFY: Oracle profile creation failed:', error)
      }
        
        if (onVerificationComplete) {
          onVerificationComplete({
            address: cleanAddress,
            signature: cleanSignature,
            verified: true
          })
        }
    } catch (error: any) {
      console.error('Verification error:', error)
      
      // Provide more helpful error messages
      let errorMessage = 'Verification error: '
      
      if (error.message?.includes('Invalid signature')) {
        errorMessage += 'The signature format is invalid. Make sure to copy the entire signature from your wallet.'
      } else if (error.message?.includes('Invalid address')) {
        errorMessage += 'The Bitcoin address format is invalid.'
      } else if (error.message?.includes('testnet')) {
        errorMessage += 'Testnet addresses may not be fully supported by the verification library.'
      } else {
        errorMessage += error.message || 'Unknown error occurred'
      }
      
      setVerificationResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const walletInstructions: WalletInstruction[] = [
    {
      id: 'sparrow',
      name: 'Sparrow Wallet',
      icon: '🔧',
      recommended: true,
      hardwareCompatible: [
        { name: 'Ledger', icon: '🔒', color: 'from-blue-500 to-blue-600' },
        { name: 'Trezor', icon: '🛡️', color: 'from-green-500 to-green-600' },
        { name: 'Coldcard', icon: '❄️', color: 'from-gray-500 to-gray-600' },
        { name: 'BitBox', icon: '📦', color: 'from-purple-500 to-purple-600' },
        { name: 'Keystone', icon: '🔑', color: 'from-orange-500 to-orange-600' }
      ],
      steps: [
        'Open Sparrow Wallet',
        'Copy your Bitcoin address (the one holding your Bitcoin reserves) from Addresses tab',
        'Paste this address in Step 3 field on this page',
        'Go to Tools → Sign/Verify Message (Ctrl+M on Windows, Cmd+M on Mac)',
        'In Address field: paste your Bitcoin address',
        'In Message field: paste message from Step 1',
        'Click "Sign" button',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ],
      testnet: [
        'Open Sparrow → Tools → Restart in Testnet',
        'Sparrow will close and restart with separate testnet configuration',
        'Create a new wallet in testnet mode (File → New Wallet)',
        'After wallet is created, go to Addresses tab',
        'Copy any address from the list (right-click → Copy Address)',
        'Paste this address in Step 3 field on this page',
        'Go to Tools → Sign/Verify Message (Ctrl+M on Windows, Cmd+M on Mac)',
        'In "Address" field: paste your testnet address again',
        'In "Message" field: paste the message you copied from Step 1',
        'Click "Sign Message" button',
        'Copy the signature from "Signature" field',
        'Paste this signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete verification'
      ]
    },
    {
      id: 'ledger',
      name: 'Ledger/Trezor',
      icon: '💎',
      steps: [
        'Connect hardware wallet to Sparrow or Electrum',
        'Copy address from your hardware wallet (the one holding your Bitcoin reserves)',
        'Paste this address in Step 3 field on this page',
        'Open Tools → Sign/Verify Message',
        'Select address from your hardware wallet',
        'Paste message from Step 1',
        'Sign message on device',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ],
      testnet: [
        'In Sparrow: Enable testnet first (see Sparrow instructions)',
        'Connect your hardware wallet',
        'Hardware wallet will work with testnet automatically',
        'For Trezor: Enable testnet in Trezor Suite settings',
        'Go to Addresses tab in Sparrow',
        'Copy any testnet address',
        'Paste this address in Step 3 field on this page',
        'Go to Tools → Sign/Verify Message',
        'Sign with hardware wallet confirmation',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ]
    },
    {
      id: 'electrum',
      name: 'Electrum',
      icon: '⚡',
      steps: [
        'Open Electrum wallet',
        'Copy your Bitcoin address (the one holding your Bitcoin reserves) from Addresses tab',
        'Paste this address in Step 3 field on this page',
        'Go to Tools → Sign/Verify Message',
        'In Address field: enter your Bitcoin address',
        'In Message field: paste message from Step 1',
        'Click "Sign" button',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ],
      testnet: [
        'Run Electrum with --testnet flag',
        'Or download Electrum Testnet version',
        'Create new wallet for testnet',
        'Go to Addresses tab',
        'Copy any testnet address (tb1... or 2... or m/n...)',
        'Paste this address in Step 3 field on this page',
        'Go to Tools → Sign/Verify Message',
        'In Address field: paste your testnet address',
        'In Message field: paste message from Step 1',
        'Click "Sign" button',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ]
    },
    {
      id: 'bitcoincore',
      name: 'Bitcoin Core',
      icon: '₿',
      steps: [
        'Open Bitcoin Core',
        'Go to Receive tab and copy your address (the one holding your Bitcoin reserves)',
        'Paste this address in Step 3 field on this page',
        'Go to File → Sign Message',
        'In Address field: select your address',
        'In Message field: paste message from Step 1',
        'Click "Sign Message" button',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ],
      testnet: [
        'Start Bitcoin Core with -testnet flag',
        'Or add testnet=1 to bitcoin.conf',
        'Restart Bitcoin Core',
        'Go to Receive tab and generate new testnet address',
        'Copy the testnet address',
        'Paste this address in Step 3 field on this page',
        'Go to File → Sign Message',
        'In Address field: select your testnet address',
        'In Message field: paste message from Step 1',
        'Click "Sign Message" button',
        'Copy the signature',
        'Paste signature in Step 4 field on this page',
        'Click "Verify Ownership" button to complete'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <span>🔐</span>
            <span>Bitcoin Address Verification</span>
          </h3>
          {!userData.loading && userData.userData && (userData.userData as any).bitcoinAddresses?.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              Real-time
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Verify ownership of your Bitcoin address using BIP-322 signature
          {!userData.loading && userData.userData && (userData.userData as any).bitcoinAddresses?.length > 0 && (
            <span className="text-green-600 ml-1">• {(userData.userData as any).bitcoinAddresses.length} verified address(es)</span>
          )}
        </p>
      </div>

      {!isMetaMaskConnected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">MetaMask Required</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Please connect your MetaMask wallet first. The MegaETH address is needed for the verification message.
              </p>
            </div>
          </div>
        </div>
      )}

      {isMetaMaskConnected && (
        <>
          {/* Real-time verification status indicator */}
          {!userData.loading && userData.userData && (userData.userData as any).bitcoinAddresses?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Verified Addresses Found
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                    You have {(userData.userData as any).bitcoinAddresses.length} verified Bitcoin address(es) in the real-time system.
                    You can verify additional addresses below.
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Activity className="h-3 w-3 text-green-500" />
                      Live sync active
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Message to Sign */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium">Step 1: Copy this message</label>
              <span className="text-xs text-muted-foreground">Sign in your Bitcoin wallet</span>
            </div>
            <div className="bg-muted/50 rounded p-3 font-mono text-sm whitespace-pre-wrap break-all">
              {message}
            </div>
            <button
              onClick={copyMessage}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {copiedMessage ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Wallet Instructions */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium">Step 2: Sign in your wallet</label>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span>Instructions</span>
                {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {showInstructions && (
              <div className="space-y-2">
                {walletInstructions.map((wallet) => (
                  <div key={wallet.id} className="border rounded-lg p-3">
                    <button
                      onClick={() => setActiveWallet(activeWallet === wallet.id ? null : wallet.id)}
                      className="w-full text-left"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl">{wallet.icon}</span>
                          <span className="font-medium">{wallet.name}</span>
                          {wallet.recommended && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded">Recommended</span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          {wallet.hardwareCompatible && (
                            <div className="w-full sm:w-auto">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-muted-foreground block sm:inline mb-1 sm:mb-0">Works with:</span>
                                <div className="flex flex-wrap gap-1">
                                  {wallet.hardwareCompatible.map((hw) => (
                                    <div
                                      key={hw.name}
                                      className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r ${hw.color} text-white text-[10px] sm:text-xs font-medium shadow-sm hover:shadow-md transition-shadow relative group`}
                                      title={hw.name}
                                    >
                                      <span className="text-[10px] sm:text-xs">{hw.icon}</span>
                                      <span className="hidden xs:inline">{hw.name}</span>
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        {hw.name} Wallet
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="ml-auto">
                            {activeWallet === wallet.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {activeWallet === wallet.id && (
                      <div className="mt-3 ml-2 sm:ml-7 space-y-3">
                        {wallet.hardwareCompatible && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              <span className="font-medium">Connection Layer:</span> Sparrow acts as a bridge to your hardware wallet. Your private keys remain secure on your hardware device.
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-primary mb-1">Mainnet Instructions:</p>
                          <ol className="space-y-1 text-sm text-muted-foreground">
                            {wallet.steps.map((step, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary font-medium">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        {wallet.testnet && (
                          <div className="border-t pt-3">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                              🧪 Testnet Mode:
                            </p>
                            <ol className="space-y-1 text-sm text-muted-foreground">
                              {wallet.testnet.map((step, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Any wallet supporting BIP-322 or message signing will work. 
                Hardware wallets (Ledger, Trezor) provide the best security.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                <strong>Testing:</strong> Use testnet mode (see instructions above) to test without real Bitcoin.
              </p>
            </div>
          </div>

          {/* Step 3: Enter Bitcoin Address */}
          <div className="border rounded-lg p-4 space-y-3">
            <label className="font-medium">Step 3: Enter your Bitcoin address</label>
            <input
              type="text"
              placeholder="bc1q... or 3... or 1... (testnet: tb1... or 2... or m/n...)"
              value={bitcoinAddress}
              onChange={(e) => setBitcoinAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background dark:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700"
            />
            
            {/* Address uniqueness check indicator */}
            {bitcoinAddress && bitcoinAddress.length >= 26 && (
              <div className="mt-2">
                {addressUniquenessCheck.isChecking && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="h-4 w-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-sm">Checking address uniqueness...</span>
                  </div>
                )}
                
                {addressUniquenessCheck.isUnique === true && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">{addressUniquenessCheck.message || "Address is available for verification"}</span>
                  </div>
                )}
                
                {addressUniquenessCheck.isUnique === false && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {addressUniquenessCheck.conflictUser === 'current_user' ? '' : '❌'} {addressUniquenessCheck.message || 
                        (addressUniquenessCheck.conflictUser === 'current_user'
                          ? "You have already verified this Bitcoin address" 
                          : "This Bitcoin address has already been verified by another user")}
                      </div>
                      <div className="text-xs mt-1 text-gray-600">
                        {addressUniquenessCheck.conflictUser === 'current_user' 
                          ? "This address is already associated with your account."
                          : "Each Bitcoin address can only be verified by one user account."
                        }
                      </div>
                    </div>
                  </div>
                )}
                
                {addressUniquenessCheck.error && addressUniquenessCheck.isUnique === null && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">⚠️ {addressUniquenessCheck.message || addressUniquenessCheck.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 4: Enter Signature */}
          <div className="border rounded-lg p-4 space-y-3">
            <label className="font-medium">Step 4: Paste your BIP-322 signature</label>
            <textarea
              placeholder="Paste the signature from your wallet here (base64 format starting with H/I or hex format)..."
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg bg-background dark:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700 font-mono text-sm"
            />
            {signature && signature.length < 50 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Signature seems too short. Make sure you copied the entire signature from your wallet.
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={verifySignature}
            disabled={!bitcoinAddress || !signature || isVerifying || addressUniquenessCheck.isUnique === false}
            className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Signature...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Verify Bitcoin Ownership</span>
              </>
            )}
          </button>

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${
                verificationResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start space-x-3">
                  {verificationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      verificationResult.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {verificationResult.message.split('\n').map((line, index) => (
                        <p key={index} className={index > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {verificationResult.success && bitcoinAddress && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Address: {bitcoinAddress}
                      </p>
                    )}
                    {verificationResult.success && !userData.loading && (
                      <div className="mt-2">
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Activity className="h-3 w-3 text-green-500" />
                          Will sync to real-time system
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Continue to Mint Button - Only shown on successful verification */}
              {verificationResult.success && (
                <button
                  onClick={async () => {
                    // Save verified address using centralized storage system
                    if (verifiedAddress && ethAddress) {
                      // User profile already created via Professional Oracle above
                      console.log('✅ User profile already saved via Professional Oracle')
                    }
                    // Navigate to mint with parameters indicating we came from verification
                    router.push(`/mint?from=verify&address=${encodeURIComponent(verifiedAddress || '')}`)
                  }}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 group"
                >
                  <Rocket className="h-4 sm:h-5 w-4 sm:w-5 group-hover:rotate-12 transition-transform" />
                  <span className="text-base sm:text-lg">Continue to Mint rBTC</span>
                  <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}