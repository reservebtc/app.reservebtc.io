import { createPublicClient, http, parseAbi, getAddress } from 'viem';

// Define MegaETH chain
const megaeth = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    public: { http: ['https://carrot.megaeth.com/rpc'] },
    default: { http: ['https://carrot.megaeth.com/rpc'] },
  },
  testnet: true,
};

const client = createPublicClient({
  chain: megaeth,
  transport: http()
});

// Contract addresses
const ORACLE_AGGREGATOR = '0x74E64267a4d19357dd03A0178b5edEC79936c643';
const FEE_VAULT = '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1';
const RBTC_SYNTH = '0x37fE059490B70e2605cb3D6fD64F5292d3eB46dE';

async function analyzeContractMethods() {
  console.log('🔍 ANALYZING CONTRACT METHODS...\n');
  
  // Get the contract bytecode to verify it exists
  const oracleCode = await client.getBytecode({
    address: ORACLE_AGGREGATOR
  });
  console.log('📊 OracleAggregator deployed:', !!oracleCode);
  console.log('📊 Bytecode size:', oracleCode?.length || 0, 'bytes\n');
  
  // Test different method signatures that might exist
  const potentialMethods = [
    // Standard Oracle methods
    'registerUser(address,string)',
    'registerAddress(address,string)', 
    'registerBitcoinAddress(string)',
    'addUser(address,string)',
    'addAddress(string)',
    
    // Payment-based methods
    'registerAndPay(string)',
    'registerWithPayment(string)',
    'payAndRegister(string,uint256)',
    'prepayRegistration(string,uint256)',
    
    // Status methods that we can test
    'isRegistered(address)',
    'getUserBitcoinAddress(address)',
    'getBalance(address)',
    'owner()',
    'paused()',
    
    // ERC20 methods on rBTC token
    'balanceOf(address)',
    'totalSupply()',
    'mint(address,uint256)',
    'burn(uint256)'
  ];
  
  console.log('🧪 Testing method existence...\n');
  
  for (const method of potentialMethods) {
    try {
      // Try to call the method to see if it exists
      let testAddress = '0xf45d5feefd7235d9872079d537f5796ba79b1e52';
      let testBtcAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      
      let result;
      
      if (method.includes('string')) {
        // Methods that take a Bitcoin address
        if (method.includes('address,string')) {
          result = await client.readContract({
            address: ORACLE_AGGREGATOR,
            abi: parseAbi([`function ${method} view returns (bool)`]),
            functionName: method.split('(')[0],
            args: [testAddress, testBtcAddress]
          });
        } else {
          result = await client.readContract({
            address: ORACLE_AGGREGATOR,
            abi: parseAbi([`function ${method} view returns (bool)`]),
            functionName: method.split('(')[0],
            args: [testBtcAddress]
          });
        }
      } else if (method.includes('address')) {
        // Methods that take an address
        result = await client.readContract({
          address: ORACLE_AGGREGATOR,
          abi: parseAbi([`function ${method} view returns (bool)`]),
          functionName: method.split('(')[0],
          args: [testAddress]
        });
      } else if (method.includes('uint256')) {
        // Skip uint256 methods for now
        continue;
      } else {
        // Methods with no parameters
        result = await client.readContract({
          address: ORACLE_AGGREGATOR,
          abi: parseAbi([`function ${method} view returns (bool)`]),
          functionName: method.split('(')[0]
        });
      }
      
      console.log(`✅ Method ${method} EXISTS! Result:`, result);
      
    } catch (error) {
      if (error.message.includes('Function') && error.message.includes('not found')) {
        console.log(`❌ Method ${method} not found`);
      } else {
        console.log(`⚠️ Method ${method} exists but error:`, error.message.split('\n')[0]);
      }
    }
  }
  
  // Test rBTC token methods
  console.log('\n🪙 Testing rBTC Token methods...\n');
  
  const rbtcMethods = [
    'balanceOf(address)',
    'totalSupply()',
    'decimals()',
    'symbol()',
    'name()'
  ];
  
  for (const method of rbtcMethods) {
    try {
      let result;
      if (method.includes('address')) {
        result = await client.readContract({
          address: RBTC_SYNTH,
          abi: parseAbi([`function ${method} view returns (uint256)`]),
          functionName: method.split('(')[0],
          args: ['0xf45d5feefd7235d9872079d537f5796ba79b1e52']
        });
      } else {
        result = await client.readContract({
          address: RBTC_SYNTH,
          abi: parseAbi([`function ${method} view returns (uint256)`]),
          functionName: method.split('(')[0]
        });
      }
      console.log(`✅ rBTC ${method}:`, result.toString());
    } catch (error) {
      console.log(`❌ rBTC ${method} failed:`, error.message.split('\n')[0]);
    }
  }
  
  // Check what events the contract emits
  console.log('\n📺 Checking recent events...\n');
  
  try {
    const latestBlock = await client.getBlockNumber();
    console.log('📍 Latest block:', latestBlock.toString());
    
    // Check for Transfer events on rBTC (indicating minting/burning)
    const transferEvents = await client.getLogs({
      address: RBTC_SYNTH,
      event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']),
      fromBlock: latestBlock - 1000n,
      toBlock: 'latest'
    });
    
    console.log('💸 Recent rBTC Transfer events:', transferEvents.length);
    if (transferEvents.length > 0) {
      console.log('📝 Latest transfer:', transferEvents[transferEvents.length - 1]);
    }
    
  } catch (error) {
    console.log('⚠️ Error checking events:', error.message);
  }
}

analyzeContractMethods().catch(console.error);