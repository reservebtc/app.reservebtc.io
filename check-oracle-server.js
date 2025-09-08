// Check Oracle server endpoints and status
// This script will discover what endpoints are available on the Oracle server

const SERVER_BASE_URL = 'https://oracle.reservebtc.io';
const USER_ADDRESS = '0x44dB868F99a42A5ABC7A1492E64db9bCFb946b09';
const USER_BTC_ADDRESS = 'tb1q47a3eq5fm4pdhczm33qkd3u7rqlkhwlwmykdnhq5mdgr9xvwu09s44004';

async function checkOracleServer() {
  console.log('🔍 Checking Oracle Server Endpoints...');
  console.log(`📡 Server: ${SERVER_BASE_URL}`);
  
  // Test various possible endpoints
  const endpointsToTest = [
    '/users',
    '/api/users', 
    '/register',
    '/api/register',
    '/sync',
    '/api/sync',
    '/trigger-sync',
    '/api/trigger-sync',
    '/status',
    '/health',
    '/info',
    '/',
    '/register-user',
    '/add-user',
    '/mint',
    '/oracle/register',
    '/oracle/sync'
  ];
  
  console.log('\n📋 Testing endpoints...');
  const workingEndpoints = [];
  
  for (const endpoint of endpointsToTest) {
    try {
      const url = `${SERVER_BASE_URL}${endpoint}`;
      console.log(`🔄 Testing: ${endpoint}`);
      
      // Test GET first
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReserveBTC-Frontend/1.0'
        }
      });
      
      if (getResponse.ok) {
        const data = await getResponse.text();
        console.log(`✅ GET ${endpoint} - Status: ${getResponse.status}`);
        console.log(`   Response: ${data.substring(0, 200)}...`);
        workingEndpoints.push({ endpoint, method: 'GET', status: getResponse.status });
      } else {
        console.log(`⚠️ GET ${endpoint} - Status: ${getResponse.status}`);
      }
      
      // For some endpoints, test POST too
      if (['/register', '/api/register', '/sync', '/trigger-sync', '/register-user', '/add-user'].includes(endpoint)) {
        try {
          const postResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              userAddress: USER_ADDRESS,
              bitcoinAddress: USER_BTC_ADDRESS,
              test: true
            })
          });
          
          if (postResponse.ok || postResponse.status < 500) {
            const postData = await postResponse.text();
            console.log(`✅ POST ${endpoint} - Status: ${postResponse.status}`);
            console.log(`   Response: ${postData.substring(0, 200)}...`);
            workingEndpoints.push({ endpoint, method: 'POST', status: postResponse.status });
          } else {
            console.log(`⚠️ POST ${endpoint} - Status: ${postResponse.status}`);
          }
        } catch (postError) {
          console.log(`❌ POST ${endpoint} - Error: ${postError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎯 Working Endpoints Summary:');
  console.log('='.repeat(50));
  workingEndpoints.forEach(ep => {
    console.log(`${ep.method} ${ep.endpoint} - Status: ${ep.status}`);
  });
  
  // Test specific Oracle functionality
  console.log('\n🧪 Testing Oracle-specific functionality...');
  
  // Check current users
  try {
    const usersResponse = await fetch(`${SERVER_BASE_URL}/users`);
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('👥 Current Oracle users:');
      Object.keys(users).forEach(address => {
        const user = users[address];
        console.log(`   ${address}: ${user.btcAddress} (${user.lastSyncedBalance} sats)`);
      });
      
      // Check if our test user is registered
      const testUser = users[USER_ADDRESS.toLowerCase()] || users[USER_ADDRESS];
      console.log(`🔍 Test user registered: ${testUser ? 'YES' : 'NO'}`);
    }
  } catch (error) {
    console.log('❌ Failed to fetch Oracle users:', error.message);
  }
  
  // Test registration with our user
  console.log('\n📝 Testing user registration...');
  
  const registrationEndpoints = ['/register', '/api/register', '/register-user', '/add-user'];
  
  for (const regEndpoint of registrationEndpoints) {
    if (workingEndpoints.some(ep => ep.endpoint === regEndpoint && ep.method === 'POST')) {
      try {
        console.log(`🔄 Testing registration via ${regEndpoint}...`);
        
        const regResponse = await fetch(`${SERVER_BASE_URL}${regEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userAddress: USER_ADDRESS,
            bitcoinAddress: USER_BTC_ADDRESS,
            balanceSats: 44000,
            feeVaultBalance: 0.013,
            timestamp: Date.now()
          })
        });
        
        const regData = await regResponse.text();
        console.log(`📄 ${regEndpoint} response (${regResponse.status}):`, regData.substring(0, 300));
        
        if (regResponse.ok) {
          console.log(`✅ Registration via ${regEndpoint} appears to work!`);
          break;
        }
        
      } catch (error) {
        console.log(`❌ Registration test via ${regEndpoint} failed:`, error.message);
      }
    }
  }
  
  return {
    workingEndpoints,
    serverResponsive: workingEndpoints.length > 0
  };
}

if (require.main === module) {
  checkOracleServer()
    .then(result => {
      console.log('\n🏁 Oracle Server Check Complete');
      if (result.serverResponsive) {
        console.log('✅ Oracle server is responsive and has working endpoints');
      } else {
        console.log('❌ Oracle server appears to be down or misconfigured');
      }
    })
    .catch(console.error);
}

module.exports = { checkOracleServer };