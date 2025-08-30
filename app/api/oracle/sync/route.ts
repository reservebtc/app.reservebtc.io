import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACTS, CONTRACT_ABIS } from '@/app/lib/contracts';
import { megaeth } from '@/lib/chains/megaeth';

// Cache for initialized clients
let clientsCache: {
  account: ReturnType<typeof privateKeyToAccount>;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
} | null = null;

// Initialize clients function
function initializeClients() {
  const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY as `0x${string}`;
  
  if (!ORACLE_PRIVATE_KEY) {
    return null;
  }
  
  if (!clientsCache) {
    const account = privateKeyToAccount(ORACLE_PRIVATE_KEY);
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
      abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
      functionName: 'committee',
    });

    if ((committeeAddress as string).toLowerCase() !== account.address.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: not oracle committee member'
      }, { status: 403 });
    }

    // Simulate the transaction first to check for errors
    try {
      await publicClient.simulateContract({
        account,
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
        functionName: 'sync',
        args: [
          userAddress as `0x${string}`,
          balanceInSats,
          blockHeight,
          BigInt(syncTimestamp),
        ],
      });
    } catch (simulationError: any) {
      console.error('Transaction simulation failed:', simulationError);
      return NextResponse.json({
        success: false,
        error: `Transaction would fail: ${simulationError.message || 'Unknown error'}`
      }, { status: 400 });
    }

    // Execute the transaction
    const hash = await walletClient.writeContract({
      address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
      abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
      functionName: 'sync',
      args: [
        userAddress as `0x${string}`,
        balanceInSats,
        blockHeight,
        BigInt(syncTimestamp),
      ],
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
        abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
        functionName: 'committee',
      }),
      publicClient.readContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
        functionName: 'minConfirmations',
      }),
      publicClient.readContract({
        address: CONTRACTS.ORACLE_AGGREGATOR as `0x${string}`,
        abi: CONTRACT_ABIS.ORACLE_AGGREGATOR,
        functionName: 'maxFeePerSyncWei',
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        committee,
        minConfirmations: (minConfirmations as bigint).toString(),
        maxFeePerSync: (maxFeePerSync as bigint).toString(),
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