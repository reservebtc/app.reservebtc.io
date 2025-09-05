import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Code, Copy, Download, FileText, GitBranch } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Smart Contract ABI | ReserveBTC Documentation',
  description: 'Complete Application Binary Interface (ABI) documentation for ReserveBTC smart contracts with function signatures and usage examples.',
  keywords: 'ReserveBTC ABI, smart contract ABI, Ethereum ABI, contract interface, function signatures',
}

export default function ABIPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Smart Contract ABI</h1>
          <p className="text-lg text-muted-foreground">
            Complete Application Binary Interface documentation for all ReserveBTC smart contracts, 
            including function signatures, events, and integration examples.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Contract Addresses</h2>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Copy className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Oracle Aggregator Contract</h3>
                  <p className="text-sm text-muted-foreground font-mono">0x74E64267a4d19357dd03A0178b5edEC79936c643</p>
                </div>
                <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                  Verified
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">rBTC-SYNTH Token Contract</h3>
                  <p className="text-sm text-muted-foreground font-mono">0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC</p>
                </div>
                <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                  Verified
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">wrBTC Token Contract</h3>
                  <p className="text-sm text-muted-foreground font-mono">0xa10FC332f12d102Dddf431F8136E4E89279EFF87</p>
                </div>
                <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                  Verified
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Fee Vault Contract</h3>
                  <p className="text-sm text-muted-foreground font-mono">0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1</p>
                </div>
                <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                  Verified
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Fee Policy Contract</h3>
                  <p className="text-sm text-muted-foreground font-mono">0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4</p>
                </div>
                <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                  Verified
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Code className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Core Functions</h3>
            </div>
            <p className="text-muted-foreground">
              Main protocol functions for minting, burning, and managing synthetic Bitcoin tokens.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Events & Logs</h3>
            </div>
            <p className="text-muted-foreground">
              Complete event definitions for monitoring and indexing protocol activities.
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Oracle Aggregator Contract ABI</h2>
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Oracle Functions</h3>
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Sync user's Bitcoin balance (Oracle only)
function sync(
  address user,
  uint64 newBalanceSats,
  uint32 height,
  uint64 timestamp
) external;

// Get user's last synchronized balance
function lastSats(address user) external view returns (uint64);

// Get oracle committee address
function committee() external view returns (address);

// Get minimum confirmations required
function minConfirmations() external view returns (uint256);

// Get maximum fee per sync
function maxFeePerSyncWei() external view returns (uint256);`}
              </pre>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">rBTC-SYNTH Token Functions</h3>
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// ERC20 View Functions
function balanceOf(address owner) external view returns (uint256);
function totalSupply() external view returns (uint256);
function decimals() external view returns (uint8);
function name() external view returns (string);
function symbol() external view returns (string);

// Oracle mint/burn (Oracle only)
function oracleMint(address to, uint64 amount) external;
function oracleBurn(address from, uint64 amount) external;

// Soulbound - transfers are blocked
function transfer(address to, uint256 amount) external pure returns (bool); // Always reverts
function approve(address spender, uint256 amount) external pure returns (bool); // Always reverts`}
              </pre>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Fee System Functions</h3>
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Fee Policy Contract
function pctBps() external view returns (uint256); // Fee percentage in basis points
function fixedWei() external view returns (uint256); // Fixed fee in wei
function weiPerSat() external view returns (uint256); // Wei per satoshi rate
function quoteFees(address user, int64 deltaSats) external view returns (uint256);

// Fee Vault Contract  
function depositETH(address user) external payable; // Deposit ETH for fees
function balances(address user) external view returns (uint256); // Get user's fee balance`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Oracle Events</h3>
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Oracle Aggregator Events
event Synced(
  address indexed user,
  uint64 newBalanceSats,
  int64 deltaSats,
  uint256 feeWei,
  uint32 height,
  uint64 timestamp
);

event NeedsTopUp(
  address indexed user
);`}
              </pre>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Token Events</h3>
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// ERC20 Transfer Events (both rBTC-SYNTH and wrBTC)
event Transfer(
  address indexed from,
  address indexed to,
  uint256 value
);

// ERC20 Approval Event (wrBTC only, rBTC-SYNTH reverts)
event Approval(
  address indexed owner,
  address indexed spender,
  uint256 value
);

// Fee Vault Events
event Deposit(
  address indexed user,
  uint256 amount
);`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">JavaScript/Web3.js</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Initialize contracts
const web3 = new Web3('https://carrot.megaeth.com/rpc');

const synthContract = new web3.eth.Contract(
  RBTC_SYNTH_ABI, 
  "0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC"
);

const oracleContract = new web3.eth.Contract(
  ORACLE_ABI,
  "0x74E64267a4d19357dd03A0178b5edEC79936c643"
);

// Query user's rBTC-SYNTH balance
const balance = await synthContract.methods.balanceOf(userAddress).call();
console.log('rBTC-SYNTH Balance:', balance);

// Listen to Oracle sync events
oracleContract.events.Synced()
  .on('data', (event) => {
    console.log('Balance synced:', event.returnValues);
  });`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Ethers.js</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Initialize provider and contracts
const provider = new ethers.JsonRpcProvider('https://carrot.megaeth.com/rpc');

const synthContract = new ethers.Contract(
  "0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC",
  RBTC_SYNTH_ABI,
  provider
);

const oracleContract = new ethers.Contract(
  "0x74E64267a4d19357dd03A0178b5edEC79936c643",
  ORACLE_ABI,
  provider
);

// Query last synchronized Bitcoin balance
const lastSats = await oracleContract.lastSats(userAddress);
console.log('Last synced Bitcoin balance:', lastSats.toString(), 'satoshis');

// Get rBTC-SYNTH token info
const name = await synthContract.name();
const symbol = await synthContract.symbol();
const decimals = await synthContract.decimals();
console.log(\`Token: \${name} (\${symbol}) - \${decimals} decimals\`);`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-amber-600 mr-2">⚠️</span>
            Important: Oracle-Based Architecture
          </h2>
          <div className="space-y-3 text-amber-900 dark:text-amber-100">
            <p>
              ReserveBTC uses an <strong>Oracle-based system</strong> where token minting and burning 
              is controlled by the Oracle, not directly by users.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Users prove Bitcoin ownership through BIP-322 signatures via the web interface</li>
              <li>The Oracle monitors Bitcoin addresses and automatically syncs balances</li>
              <li>rBTC-SYNTH tokens are automatically minted/burned based on Bitcoin balance changes</li>
              <li>Only the authorized Oracle committee can call mint/burn functions</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Download ABI Files</h2>
          <p className="text-muted-foreground mb-4">
            Download the complete ABI files for integration with your applications.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-3 transition-colors">
              <Download className="h-4 w-4" />
              <span>Contract ABIs</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-card border hover:bg-muted/50 rounded-lg p-3 transition-colors">
              <GitBranch className="h-4 w-4" />
              <span>View on GitHub</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/docs/integration" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Integration Guide
          </Link>
          <Link 
            href="/docs/api" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            API Documentation
          </Link>
        </div>
      </div>
    </div>
  )
}