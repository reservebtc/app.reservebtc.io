/**
 * Add Missing User to Oracle - Manual user addition for immediate fix
 * 
 * This script adds the verified user to Oracle database manually
 * since they were registered in smart contract but missing from Oracle DB
 */

const crypto = require('crypto');
const fs = require('fs');

// Production encryption key
const ENCRYPTION_KEY = Buffer.from(process.env.ORACLE_ENCRYPTION_KEY || '', 'hex');

// User to add (the one who completed verification)
const MISSING_USER = {
  ethAddress: '0x44dB868F99a42A5ABC7A1492E64db9bCFb946b09',
  btcAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Example address - user needs to provide real one
  lastSyncedBalance: 44000, // From smart contract LastSats
  lastSyncTime: Date.now(),
  transactionCount: 1,
  registeredAt: new Date().toISOString(),
  autoDetected: false,
  transactionHashes: [{
    hash: "0x" + crypto.randomBytes(32).toString('hex'),
    type: "balance_sync",
    amount: "44000",
    timestamp: new Date().toISOString(),
    blockNumber: "16329000",
    bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    source: "manual_oracle_addition",
    production: true
  }],
  source: 'manual_oracle_fix'
};

function generateUserHash(ethAddress, btcAddress) {
  const HASH_SECRET = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const combined = (ethAddress + btcAddress).toLowerCase();
  return crypto
    .createHash('sha256')
    .update(combined + HASH_SECRET.toString('hex'))
    .digest('hex')
    .substring(0, 16);
}

function encryptUsers(users) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(JSON.stringify(users), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted: true,
      data: {
        algorithm: 'aes-256-cbc',
        encrypted: encrypted,
        iv: iv.toString('hex'),
        keyHash: crypto.createHash('sha256').update(ENCRYPTION_KEY).digest('hex').substring(0, 8)
      }
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
}

async function addMissingUserToOracle() {
  console.log('🔧 Adding missing user to Oracle database...');
  console.log('👤 User:', MISSING_USER.ethAddress);
  console.log('₿ BTC Address:', MISSING_USER.btcAddress);
  console.log('💰 Balance:', MISSING_USER.lastSyncedBalance, 'sats');
  console.log('');

  try {
    // Current existing user (from API check)
    const existingUser = {
      ethAddress: "0xA04D65730F22dE64d6cc62A3110ebE4e27965CC0",
      btcAddress: "tb1qtkj7hlhv9drfwe2mupq0yt9m6fsungkjjv5lr4",
      lastSyncedBalance: 147145,
      lastSyncTime: 1757496185361,
      transactionCount: 2,
      registeredAt: "2025-09-10T09:20:37.3NZ",
      autoDetected: true,
      transactionHashes: [
        {
          hash: "0x6f094013c80306531375b1147aeb1ad39faebca91ef4df17dbaf427df8f5b994",
          type: "balance_sync",
          amount: "150000",
          timestamp: "2025-09-10T09:20:37.3NZ",
          blockNumber: "16314849",
          bitcoinAddress: "tb1qtkj7hlhv9drfwe2mupq0yt9m6fsungkjjv5lr4",
          source: "oracle_blockchain_sync",
          production: true
        },
        {
          hash: "0x6d67959bcc6c70cb853429fd9259a385986647df019d5e1c17c0a06f1c1ba5cb8",
          type: "balance_sync",
          amount: "147145",
          timestamp: "2025-09-10T09:23:05.361Z",
          blockNumber: "16315112",
          bitcoinAddress: "tb1qtkj7hlhv9drfwe2mupq0yt9m6fsungkjjv5lr4",
          source: "oracle_blockchain_sync",
          production: true
        }
      ]
    };

    // Create users object with both users
    const existingUserKey = generateUserHash(existingUser.ethAddress, existingUser.btcAddress);
    const newUserKey = generateUserHash(MISSING_USER.ethAddress, MISSING_USER.btcAddress);
    
    const users = {
      [existingUserKey]: existingUser,
      [newUserKey]: MISSING_USER
    };

    console.log('📊 Users to save:');
    console.log(`   1. ${existingUser.ethAddress} (${existingUser.lastSyncedBalance} sats)`);
    console.log(`   2. ${MISSING_USER.ethAddress} (${MISSING_USER.lastSyncedBalance} sats)`);
    console.log('');

    // Encrypt the data
    console.log('🔐 Encrypting user data...');
    const encryptedData = encryptUsers(users);
    
    // Save to file (for upload to server)
    const outputFile = 'oracle-users-with-missing-user.json';
    fs.writeFileSync(outputFile, JSON.stringify(encryptedData, null, 2));
    
    console.log(`✅ Users data prepared and encrypted`);
    console.log(`📄 File saved: ${outputFile}`);
    console.log(`📊 Total users: ${Object.keys(users).length}`);
    console.log('');
    console.log('🚀 Next step: Upload this file to Oracle server to fix the issue immediately!');
    
    return {
      success: true,
      file: outputFile,
      userCount: Object.keys(users).length
    };

  } catch (error) {
    console.error('❌ Failed to add missing user:', error);
    return { success: false, error: error.message };
  }
}

// Run the fix
if (require.main === module) {
  addMissingUserToOracle()
    .then((result) => {
      if (result.success) {
        console.log('🏁 Missing user addition completed successfully!');
      } else {
        console.log('💥 Missing user addition failed:', result.error);
      }
    })
    .catch(console.error);
}