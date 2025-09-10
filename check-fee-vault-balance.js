/**
 * Check FeeVault balance for specific user
 */

const { createPublicClient, http } = require('viem');

// MegaETH Testnet configuration
const chain = {
  id: 6342,
  name: 'MegaETH Testnet',
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } }
}

// Smart contract addresses
const FEE_VAULT = '0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1';

// User to check
const USER_ADDRESS = '0xb28224cAb7a4e6F0e8F7a61EF74672782b2e6324';

async function checkFeeVaultBalance() {
  console.log('💰 Checking FeeVault balance for user...');
  console.log('👤 User:', USER_ADDRESS);
  console.log('🏦 FeeVault:', FEE_VAULT);
  console.log('');

  try {
    // Setup client
    const publicClient = createPublicClient({
      transport: http(chain.rpcUrls.default.http[0]),
      chain
    });

    // Check user balance
    const balance = await publicClient.readContract({
      address: FEE_VAULT,
      abi: [
        'function balanceOf(address user) view returns (uint256)'
      ],
      functionName: 'balanceOf',
      args: [USER_ADDRESS]
    });

    const balanceEth = Number(balance) / 1e18;
    
    console.log('💰 FeeVault Balance Results:');
    console.log(`   Raw balance: ${balance.toString()} wei`);
    console.log(`   ETH balance: ${balanceEth.toFixed(8)} ETH`);
    console.log('');

    if (balanceEth > 0) {
      console.log('✅ User has FeeVault balance - INDIVIDUAL balance detected');
    } else {
      console.log('⚠️ User has no FeeVault balance');
    }

    // Also check a few other known users for comparison
    const knownUsers = [
      '0xA04D65730F22dE64d6cc62A3110ebE4e27965CC0',
      '0x44dB868F99a42A5ABC7A1492E64db9bCFb946b09'
    ];

    console.log('📊 Comparison with other users:');
    for (const user of knownUsers) {
      try {
        const userBalance = await publicClient.readContract({
          address: FEE_VAULT,
          abi: ['function balanceOf(address user) view returns (uint256)'],
          functionName: 'balanceOf',
          args: [user]
        });
        const userBalanceEth = Number(userBalance) / 1e18;
        console.log(`   ${user.substring(0, 10)}...: ${userBalanceEth.toFixed(8)} ETH`);
      } catch (error) {
        console.log(`   ${user.substring(0, 10)}...: ERROR`);
      }
    }

  } catch (error) {
    console.error('❌ Failed to check FeeVault balance:', error.message);
  }
}

// Run check
if (require.main === module) {
  checkFeeVaultBalance()
    .then(() => {
      console.log('\n🏁 FeeVault balance check completed!');
    })
    .catch(console.error);
}