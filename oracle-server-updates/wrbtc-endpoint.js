/**
 * Oracle Server Update - wrBTC Transaction Tracking
 * 
 * This code should be added to the Oracle server (oracle-encrypted.js)
 * to handle encrypted wrBTC transaction data from the frontend
 */

// Add this endpoint to the Oracle server express app

// POST /sync-wrbtc - Receive encrypted wrBTC data from frontend
app.post('/sync-wrbtc', validateAPIKey, async (req, res) => {
  try {
    const { userAddress, encryptedWrBTCData, timestamp } = req.body;
    
    console.log(`📦 WRBTC SYNC: Received encrypted wrBTC data for user ${userAddress.substring(0, 10)}...`);
    
    // Validate input
    if (!userAddress || !encryptedWrBTCData || !timestamp) {
      return res.status(400).json({ 
        error: 'Missing required fields: userAddress, encryptedWrBTCData, timestamp' 
      });
    }
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }
    
    // Get or create user record
    const userKey = crypto.createHash('sha256').update(userAddress.toLowerCase()).digest('hex').substring(0, 16);
    
    if (!allUsersData[userKey]) {
      console.log(`👤 WRBTC SYNC: Creating new user record for ${userAddress.substring(0, 10)}...`);
      allUsersData[userKey] = {
        btcAddressHash: "unknown",
        lastSyncedBalance: 0,
        lastSyncTime: timestamp,
        registeredAt: new Date().toISOString(),
        transactionCount: 0,
        autoDetected: true,
        transactionHashes: [],
        lastTxHash: null
      };
    }
    
    // Add wrBTC data to user record
    allUsersData[userKey].wrBTCData = {
      encrypted: encryptedWrBTCData,
      lastUpdated: timestamp,
      syncedAt: new Date().toISOString()
    };
    
    // Update last sync time
    allUsersData[userKey].lastSyncTime = timestamp;
    
    console.log(`✅ WRBTC SYNC: Successfully stored encrypted wrBTC data for user ${userAddress.substring(0, 10)}...`);
    
    // Save to file system if implemented
    if (typeof saveUsersData === 'function') {
      await saveUsersData();
    }
    
    res.json({
      success: true,
      message: 'wrBTC data synced successfully',
      userKey: userKey,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error('❌ WRBTC SYNC ERROR:', error);
    res.status(500).json({ 
      error: 'Internal server error during wrBTC sync',
      details: error.message 
    });
  }
});

// GET /wrbtc-data/:userAddress - Get encrypted wrBTC data for specific user
app.get('/wrbtc-data/:userAddress', validateAPIKey, (req, res) => {
  try {
    const { userAddress } = req.params;
    
    console.log(`📊 WRBTC GET: Fetching wrBTC data for user ${userAddress.substring(0, 10)}...`);
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }
    
    // Find user by address
    const userKey = crypto.createHash('sha256').update(userAddress.toLowerCase()).digest('hex').substring(0, 16);
    const userData = allUsersData[userKey];
    
    if (!userData || !userData.wrBTCData) {
      console.log(`❌ WRBTC GET: No wrBTC data found for user ${userAddress.substring(0, 10)}...`);
      return res.status(404).json({ 
        error: 'No wrBTC data found for this user',
        userAddress: userAddress 
      });
    }
    
    console.log(`✅ WRBTC GET: Retrieved wrBTC data for user ${userAddress.substring(0, 10)}...`);
    
    res.json({
      userAddress: userAddress,
      wrBTCData: userData.wrBTCData,
      lastSyncTime: userData.lastSyncTime,
      registeredAt: userData.registeredAt
    });
    
  } catch (error) {
    console.error('❌ WRBTC GET ERROR:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching wrBTC data',
      details: error.message 
    });
  }
});

// GET /internal-users - Update existing endpoint to include wrBTC data
// This should be added to the existing /internal-users endpoint

// Modify the existing /internal-users endpoint to include wrBTC data in the response
// Add this inside the existing endpoint logic:

/*
// Inside the existing /internal-users endpoint, after decrypting user data:
for (const [userKey, userData] of Object.entries(decryptedUsers)) {
  // ... existing user data processing ...
  
  // Add wrBTC data if available
  if (userData.wrBTCData) {
    userData.wrBTCTransactions = userData.wrBTCData.encrypted; // Encrypted wrBTC transaction data
    userData.wrBTCLastUpdated = userData.wrBTCData.lastUpdated;
    userData.wrBTCSyncedAt = userData.wrBTCData.syncedAt;
  }
}
*/

console.log('🔧 Oracle Server: wrBTC endpoint handlers loaded');