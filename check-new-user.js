/**
 * Check New User in Oracle Database
 * Check if the new user 0xb28224cAb7a4e6F0e8F7a61EF74672782b2e6324 is in Oracle
 */

const crypto = require('crypto');

// Production encryption key
const ENCRYPTION_KEY = Buffer.from(process.env.ORACLE_ENCRYPTION_KEY || '', 'hex');

// New user who just verified
const NEW_USER = '0xb28224cAb7a4e6F0e8F7a61EF74672782b2e6324';

async function checkNewUser() {
  console.log('🔍 Checking new user in Oracle database...');
  console.log('👤 New User:', NEW_USER);
  console.log('');

  try {
    // Fetch Oracle data
    console.log('📡 Fetching Oracle data...');
    const response = await fetch('https://oracle.reservebtc.io/users');
    const oracleResponse = await response.json();
    
    console.log('📊 Oracle Response:');
    console.log(`   Encrypted: ${oracleResponse.encrypted}`);
    console.log(`   Data length: ${oracleResponse.data?.length || 'N/A'}`);
    console.log(`   IV length: ${oracleResponse.iv?.length || 'N/A'}`);
    console.log('');

    if (oracleResponse.encrypted && oracleResponse.data) {
      // Decrypt data
      console.log('🔐 Decrypting Oracle data...');
      
      const iv = Buffer.from(oracleResponse.iv, 'hex');
      const encryptedData = Buffer.from(oracleResponse.data, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      const userData = JSON.parse(decrypted.toString('utf8'));
      console.log('✅ Decryption successful!');
      console.log(`📊 Total users: ${userData.users?.length || 0}`);
      console.log('');
      
      if (userData.users && userData.users.length > 0) {
        console.log('👥 All users in Oracle:');
        userData.users.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.ethAddress} (${user.lastSyncedBalance || 0} sats)`);
          console.log(`      BTC: ${user.btcAddress || 'N/A'}`);
          console.log(`      Registered: ${user.registeredAt || 'N/A'}`);
          console.log('');
        });
        
        // Look for new user
        const newUser = userData.users.find(user => 
          user.ethAddress?.toLowerCase() === NEW_USER.toLowerCase()
        );
        
        if (newUser) {
          console.log('✅ NEW USER FOUND IN ORACLE!');
          console.log(`   ETH: ${newUser.ethAddress}`);
          console.log(`   BTC: ${newUser.btcAddress}`);
          console.log(`   Balance: ${newUser.lastSyncedBalance} sats`);
          console.log(`   Registered: ${newUser.registeredAt}`);
        } else {
          console.log('❌ NEW USER NOT FOUND IN ORACLE!');
          console.log('💡 This means Oracle profile creation failed');
        }
      } else {
        console.log('⚠️ No users found in Oracle data');
      }
    } else {
      console.log('❌ Oracle data not encrypted or missing');
    }

  } catch (error) {
    console.error('❌ Failed to check new user:', error.message);
  }
}

// Run check
if (require.main === module) {
  checkNewUser()
    .then(() => {
      console.log('\n🏁 New user check completed!');
    })
    .catch(console.error);
}