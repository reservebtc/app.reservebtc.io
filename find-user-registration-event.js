/**
 * Find User Registration Event - Search blockchain for user registration
 * 
 * This script searches through blockchain history to find when the user was registered
 */

const { createPublicClient, http, parseAbi } = require('viem');

// MegaETH Testnet configuration
const chain = {
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } }
};

// Contract addresses
const ORACLE_AGGREGATOR = '0x74E64267a4d19357dd03A0178b5edEC79936c643';

// Test user
const TEST_USER = '0x44dB868F99a42A5ABC7A1492E64db9bCFb946b09';

// Create client
const publicClient = createPublicClient({
  chain,
  transport: http('https://carrot.megaeth.com/rpc')
});

// Contract ABI with all possible events
const CONTRACT_ABI = parseAbi([
  'event UserRegistered(address indexed user, string btcAddress, uint256 prepaidAmount)',
  'event BalanceSynced(address indexed user, uint64 oldBalance, uint64 newBalance)',
  'event SyncCompleted(address indexed user, uint64 balanceSats)',
  'event Sync(address indexed user, uint64 newBalanceSats)',
  'event RegisterAndPrepay(address indexed user, string btcAddress)',
  'function lastSats(address user) external view returns (uint64)',
  'function registerAndPrepay(address user, string calldata btcAddress) external payable'
]);

async function findUserRegistrationEvent() {
  try {
    console.log('🔍 Searching for user registration event...');
    console.log('👤 User:', TEST_USER);
    console.log('📄 Contract:', ORACLE_AGGREGATOR);
    console.log('');

    // Get current block
    const currentBlock = await publicClient.getBlockNumber();
    console.log('📊 Current block:', currentBlock.toString());

    // Search in chunks (last 5000 blocks)
    const blockRange = 5000;
    const fromBlock = currentBlock - BigInt(blockRange);
    const toBlock = currentBlock;

    console.log(`🔍 Searching blocks ${fromBlock.toString()} to ${toBlock.toString()}`);
    console.log('');

    // Try different event signatures
    const eventTypes = [
      'UserRegistered',
      'RegisterAndPrepay', 
      'BalanceSynced',
      'SyncCompleted',
      'Sync'
    ];

    for (const eventName of eventTypes) {
      try {
        console.log(`🔍 Searching for ${eventName} events...`);
        
        let eventAbi;
        if (eventName === 'UserRegistered') {
          eventAbi = {
            type: 'event',
            name: 'UserRegistered',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'btcAddress', type: 'string', indexed: false },
              { name: 'prepaidAmount', type: 'uint256', indexed: false }
            ]
          };
        } else if (eventName === 'RegisterAndPrepay') {
          eventAbi = {
            type: 'event',
            name: 'RegisterAndPrepay',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'btcAddress', type: 'string', indexed: false }
            ]
          };
        } else if (eventName === 'BalanceSynced') {
          eventAbi = {
            type: 'event',
            name: 'BalanceSynced',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'oldBalance', type: 'uint64', indexed: false },
              { name: 'newBalance', type: 'uint64', indexed: false }
            ]
          };
        } else if (eventName === 'SyncCompleted') {
          eventAbi = {
            type: 'event',
            name: 'SyncCompleted',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'balanceSats', type: 'uint64', indexed: false }
            ]
          };
        } else if (eventName === 'Sync') {
          eventAbi = {
            type: 'event',
            name: 'Sync',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'newBalanceSats', type: 'uint64', indexed: false }
            ]
          };
        }

        const logs = await publicClient.getLogs({
          address: ORACLE_AGGREGATOR,
          event: eventAbi,
          args: {
            user: TEST_USER
          },
          fromBlock,
          toBlock
        });

        if (logs.length > 0) {
          console.log(`✅ Found ${logs.length} ${eventName} events for user!`);
          logs.forEach((log, i) => {
            console.log(`📋 Event ${i + 1}:`);
            console.log(`   📝 Transaction: ${log.transactionHash}`);
            console.log(`   📊 Block: ${log.blockNumber.toString()}`);
            console.log(`   📄 Args:`, log.args);
          });
          console.log('');
        } else {
          console.log(`❌ No ${eventName} events found for user`);
        }

      } catch (eventError) {
        console.log(`⚠️ Error searching for ${eventName} events:`, eventError.message);
      }
    }

    // Also search for ANY events from the contract related to our user
    console.log('🔍 Searching for ANY events related to user...');
    try {
      const allLogs = await publicClient.getLogs({
        address: ORACLE_AGGREGATOR,
        fromBlock,
        toBlock
      });

      console.log(`📊 Total events from contract: ${allLogs.length}`);
      
      // Filter logs that might be related to our user
      const userRelatedLogs = allLogs.filter(log => {
        const logData = log.data.toLowerCase();
        const logTopics = log.topics.map(t => t.toLowerCase());
        const userAddress = TEST_USER.toLowerCase().substring(2); // Remove 0x
        
        return logData.includes(userAddress) || logTopics.some(topic => topic.includes(userAddress));
      });

      if (userRelatedLogs.length > 0) {
        console.log(`✅ Found ${userRelatedLogs.length} events potentially related to user!`);
        userRelatedLogs.forEach((log, i) => {
          console.log(`📋 Related Event ${i + 1}:`);
          console.log(`   📝 Transaction: ${log.transactionHash}`);
          console.log(`   📊 Block: ${log.blockNumber.toString()}`);
          console.log(`   🏷️ Topics:`, log.topics);
          console.log(`   📄 Data:`, log.data.substring(0, 100) + '...');
        });
      } else {
        console.log('❌ No events related to user found');
      }

    } catch (error) {
      console.log('⚠️ Error searching for all events:', error.message);
    }

    // Check user's current smart contract state
    console.log('\n📊 Current Smart Contract State:');
    try {
      const lastSats = await publicClient.readContract({
        address: ORACLE_AGGREGATOR,
        abi: CONTRACT_ABI,
        functionName: 'lastSats',
        args: [TEST_USER]
      });

      console.log(`📊 LastSats: ${lastSats.toString()}`);
      console.log(`✅ User registered: ${lastSats > 0 ? 'YES' : 'NO'}`);
    } catch (error) {
      console.log('❌ Failed to check smart contract state:', error.message);
    }

  } catch (error) {
    console.error('❌ Failed to search for registration events:', error);
  }
}

// Run the search
if (require.main === module) {
  findUserRegistrationEvent()
    .then(() => {
      console.log('\n🏁 User registration event search completed!');
    })
    .catch(console.error);
}