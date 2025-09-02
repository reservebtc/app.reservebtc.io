import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACTS, CONTRACT_ABIS } from '@/app/lib/contracts';
import { megaeth } from '@/lib/chains/megaeth';
import { getOracleAbi } from '@/app/lib/abi-utils';

// Cache for initialized clients
let clientsCache: {
  account: ReturnType<typeof privateKeyToAccount>;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
} | null = null;

// Initialize clients function
function initializeClients() {
  const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
  
  if (!ORACLE_PRIVATE_KEY) {
    return null;
  }
  
  // Ensure private key has 0x prefix and correct format
  const formattedKey = ORACLE_PRIVATE_KEY.startsWith('0x') 
    ? ORACLE_PRIVATE_KEY 
    : `0x${ORACLE_PRIVATE_KEY}`;
  
  // Validate key length (should be 66 chars with 0x prefix)
  if (formattedKey.length !== 66) {
    console.error('Invalid private key length:', formattedKey.length);
    return null;
  }
  
  if (!clientsCache) {
    try {
      const account = privateKeyToAccount(formattedKey as `0x${string}`);
      const publicClient = createPublicClient({
        chain: megaeth,
        transport: http(),
      });
      const walletClient = createWalletClient({
        account,
        chain: megaeth,
        transport: http(),
      });
      
      clientsCache = { account, publicClient, walletClient };
    } catch (error) {
      console.error('Failed to initialize clients:', error);
      return null;
    }
  }
  
  return clientsCache;
}

export interface SyncRequest {
  userAddress: string;
  btcBalance: string; // BTC amount as string (e.g., "0.12345678")
  blockHeight: number;
  timestamp?: number;
}

export interface SyncResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponse>> {
  try {
    // Check if Oracle is configured
    const clients = initializeClients();
    if (!clients) {
      return NextResponse.json({
        success: false,
        error: 'Oracle not configured - ORACLE_PRIVATE_KEY environment variable required'
      }, { status: 500 });
    }
    
    const { account, publicClient, walletClient } = clients;

    const body: SyncRequest = await request.json();
    const { userAddress, btcBalance, blockHeight, timestamp } = body;

    // Validate input
    if (!userAddress || !btcBalance || !blockHeight) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userAddress, btcBalance, blockHeight'
      }, { status: 400 });
    }

    // Convert BTC to satoshis (multiply by 1e8)
    const btcAmount = parseFloat(btcBalance);
    if (isNaN(btcAmount) || btcAmount < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid BTC balance amount'
      }, { status: 400 });
    }

    const balanceInSats = BigInt(Math.floor(btcAmount * 1e8));
    const syncTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Check if oracle is authorized
    const committeeAddress = await publicClient.readContract({
      address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
      abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
      functionName: 'committee',
      args: [],
    }) as unknown as `0x${string}`;

    if (committeeAddress.toLowerCase() !== account.address.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: not oracle committee member'
      }, { status: 403 });
    }

    // Check if user has prepaid fees (optional, for better error messages)
    let hasSufficientFees = false;
    try {
      const feeVaultBalance = await publicClient.readContract({
        address: CONTRACTS.FEE_VAULT as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.FEE_VAULT),
        functionName: 'balances',
        args: [userAddress as `0x${string}`],
      }) as unknown as bigint;
      
      // Estimate required fee (simplified)
      const estimatedFee = BigInt(Math.floor(btcAmount * 1e8)) * BigInt(1_000_000_000); // 1 gwei per satoshi
      hasSufficientFees = feeVaultBalance >= estimatedFee;
      
      if (!hasSufficientFees) {
        console.log(`User ${userAddress} has insufficient FeeVault balance: ${feeVaultBalance} wei, needs ~${estimatedFee} wei`);
      }
    } catch (err) {
      console.log('Could not check FeeVault balance:', err);
    }

    // Simulate the transaction first to check for errors
    try {
      await publicClient.simulateContract({
        account,
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
        functionName: 'sync',
        args: [
          userAddress as `0x${string}`,
          balanceInSats,
          '0x' as `0x${string}`, // Empty proof for now
        ],
      });
    } catch (simulationError: any) {
      console.error('Transaction simulation failed:', simulationError);
      
      // Provide more helpful error messages
      if (simulationError.message?.includes('needs-topup') || !hasSufficientFees) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient FeeVault balance. Please deposit ETH to FeeVault first.',
          needsTopUp: true
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: `Transaction would fail: ${simulationError.message || 'Unknown error'}`
      }, { status: 400 });
    }

    // Execute the transaction
    const hash = await walletClient.writeContract({
      address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
      abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
      functionName: 'sync',
      args: [
        userAddress as `0x${string}`,
        balanceInSats,
        '0x' as `0x${string}`, // Empty proof for now
      ],
      account,
      chain: megaeth,
    });

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      gasUsed: receipt.gasUsed.toString(),
    });

  } catch (error: any) {
    console.error('Oracle sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint for oracle status
export async function GET(): Promise<NextResponse> {
  try {
    // Check if Oracle is configured
    const clients = initializeClients();
    if (!clients) {
      return NextResponse.json({
        success: false,
        error: 'Oracle not configured - ORACLE_PRIVATE_KEY environment variable required'
      }, { status: 500 });
    }

    const { publicClient } = clients;

    const [committee, minConfirmations, maxFeePerSync] = await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
        functionName: 'committee',
        args: [],
      }),
      publicClient.readContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
        functionName: 'minConfirmations',
        args: [],
      }),
      publicClient.readContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: getOracleAbi(CONTRACT_ABIS.ORACLE_AGGREGATOR),
        functionName: 'maxFeePerSyncWei',
        args: [],
      }),
    ]) as unknown as [`0x${string}`, bigint, bigint];

    return NextResponse.json({
      success: true,
      data: {
        committee,
        minConfirmations: minConfirmations.toString(),
        maxFeePerSync: maxFeePerSync.toString(),
        chainId: megaeth.id,
        contractAddress: CONTRACTS.ORACLE_AGGREGATOR,
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch oracle status:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch oracle status'
    }, { status: 500 });
  }
}