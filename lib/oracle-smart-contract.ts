/**
 * Oracle Smart Contract Integration
 * 
 * This module handles user registration via OracleAggregator smart contract
 * When users verify Bitcoin addresses, we call registerAndPrepay() to create
 * their encrypted profile in Oracle database (the way it was originally designed)
 */

import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// MegaETH Testnet configuration
const chain = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } }
}

// Smart contract addresses
const CONTRACTS = {
  ORACLE_AGGREGATOR: '0x74E64267a4d19357dd03A0178b5edEC79936c643' as `0x${string}`,
  RBTC_SYNTH: '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC' as `0x${string}`,
  FEE_VAULT: '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1' as `0x${string}`
}

// Committee credentials (for registerAndPrepay calls)
const COMMITTEE_PRIVATE_KEY = (process.env.NEXT_PUBLIC_COMMITTEE_PRIVATE_KEY || '0xeec1cf19d9890a45fa92cd97a6311752350403036b03a7f325541851a53b9abb') as `0x${string}`
const COMMITTEE_ADDRESS = (process.env.NEXT_PUBLIC_COMMITTEE_ADDRESS || '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b') as `0x${string}`

/**
 * Register user via Oracle smart contract (the correct way)
 * This creates encrypted user profile in Oracle database
 */
export async function registerUserViaOracleContract(
  userAddress: string,
  bitcoinAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🚀 ORACLE CONTRACT: Starting user registration via smart contract')
    console.log('👤 User:', userAddress)
    console.log('₿ Bitcoin Address:', bitcoinAddress)
    
    // Check environment variables first
    console.log('🔧 ORACLE CONTRACT: Environment check...')
    console.log('🔧 ORACLE CONTRACT: Committee Private Key present:', !!COMMITTEE_PRIVATE_KEY)
    console.log('🔧 ORACLE CONTRACT: Committee Address:', COMMITTEE_ADDRESS)
    console.log('🔧 ORACLE CONTRACT: Oracle Aggregator Address:', CONTRACTS.ORACLE_AGGREGATOR)
    
    if (!COMMITTEE_PRIVATE_KEY || COMMITTEE_PRIVATE_KEY === '0x' || COMMITTEE_PRIVATE_KEY.length < 60) {
      throw new Error('Invalid COMMITTEE_PRIVATE_KEY - check environment variables')
    }
    
    // Setup clients
    const committeeAccount = privateKeyToAccount(COMMITTEE_PRIVATE_KEY)
    const publicClient = createPublicClient({
      transport: http(chain.rpcUrls.default.http[0]),
      chain
    })
    const walletClient = createWalletClient({
      account: committeeAccount,
      transport: http(chain.rpcUrls.default.http[0]),
      chain
    })
    
    // Check if user is already registered
    const currentLastSats = await publicClient.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{
        name: 'lastSats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint64' }]
      }],
      functionName: 'lastSats',
      args: [userAddress as `0x${string}`]
    })
    
    if (currentLastSats > BigInt(0)) {
      console.log('✅ ORACLE CONTRACT: User already registered in Oracle')
      return { success: true, txHash: 'already_registered' }
    }
    
    // Get Bitcoin balance for checksum
    console.log('🌐 ORACLE CONTRACT: Fetching Bitcoin balance...')
    const bitcoinResponse = await fetch(`https://blockstream.info/testnet/api/address/${bitcoinAddress}`)
    if (!bitcoinResponse.ok) {
      throw new Error(`Bitcoin API failed: ${bitcoinResponse.status}`)
    }
    
    const bitcoinData = await bitcoinResponse.json()
    const balanceInSats = bitcoinData.chain_stats?.funded_txo_sum || 0
    const spentInSats = bitcoinData.chain_stats?.spent_txo_sum || 0
    const currentBalanceInSats = balanceInSats - spentInSats
    
    console.log('₿ ORACLE CONTRACT: Bitcoin balance:', currentBalanceInSats, 'sats')
    
    // Create checksum for registration
    const checksum = '0x' + Buffer.from(`${userAddress}_${bitcoinAddress}_${currentBalanceInSats}`)
      .toString('hex').substring(0, 64).padEnd(64, '0')
    
    // Call registerAndPrepay on smart contract
    console.log('📞 ORACLE CONTRACT: Calling registerAndPrepay...')
    const registerTx = await walletClient.writeContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{
        name: 'registerAndPrepay',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { name: 'user', type: 'address' },
          { name: 'method', type: 'uint8' },
          { name: 'checksum', type: 'bytes32' }
        ]
      }],
      functionName: 'registerAndPrepay',
      args: [userAddress as `0x${string}`, 1, checksum as `0x${string}`],
      value: parseEther('0.001') // Small ETH payment for registration
    })
    
    console.log('📝 ORACLE CONTRACT: Transaction hash:', registerTx)
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: registerTx,
      timeout: 60000 // 1 minute timeout
    })
    
    if (receipt.status === 'success') {
      console.log('✅ ORACLE CONTRACT: Registration successful!')
      console.log('⏳ ORACLE CONTRACT: Oracle server will detect event and create encrypted user profile')
      
      // Note: sync() will be called later during mint operations when user has FeeVault balance
      // For now, just registration is enough to create Oracle profile
      console.log('💡 ORACLE CONTRACT: User registered successfully!')
      console.log('💡 ORACLE CONTRACT: sync() will be called during first mint operation')
      
      return { success: true, txHash: registerTx }
    } else {
      throw new Error('Transaction failed')
    }
    
  } catch (error: any) {
    console.error('❌ ORACLE CONTRACT: Registration failed:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    }
  }
}

/**
 * Check if user needs committee ETH for transactions
 */
export async function checkCommitteeBalance(): Promise<{ hasBalance: boolean; balance: string }> {
  try {
    const publicClient = createPublicClient({
      transport: http(chain.rpcUrls.default.http[0]),
      chain
    })
    
    const balance = await publicClient.getBalance({ address: COMMITTEE_ADDRESS as `0x${string}` })
    const balanceEth = Number(balance) / 1e18
    
    return {
      hasBalance: balanceEth > 0.01,
      balance: balanceEth.toFixed(4) + ' ETH'
    }
  } catch (error) {
    console.error('❌ Failed to check committee balance:', error)
    return { hasBalance: false, balance: 'Error' }
  }
}

/**
 * Verify smart contract is accessible
 */
export async function verifyOracleContract(): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      transport: http(chain.rpcUrls.default.http[0]),
      chain
    })
    
    // Try to read a simple value from the contract
    const testRead = await publicClient.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR,
      abi: [{
        name: 'lastSats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint64' }]
      }],
      functionName: 'lastSats',
      args: ['0x0000000000000000000000000000000000000000'] // Test with zero address
    })
    
    console.log('✅ ORACLE CONTRACT: Contract is accessible')
    return true
  } catch (error) {
    console.error('❌ ORACLE CONTRACT: Contract not accessible:', error)
    return false
  }
}