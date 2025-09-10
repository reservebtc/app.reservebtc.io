#!/bin/bash
# Script to add fee-deposits endpoint to Oracle server

# Backup original file
cp oracle-production.js oracle-production-backup-$(date +%Y%m%d_%H%M).js

# Create the new endpoint code
cat << 'EOF' > /tmp/fee-deposits-endpoint.js

// Fee deposits endpoint - Added for frontend compatibility
app.get('/api/users/:address/fee-deposits', (req, res) => {
  try {
    const userAddress = req.params.address;
    
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
        hasDeposited: false,
        deposits: []
      });
    }
    
    console.log('📊 FEE_DEPOSITS: Checking deposits for', userAddress.substring(0, 10) + '...');
    
    // Find user in our database
    const userKey = Object.keys(users).find(key => 
      users[key].ethAddress && users[key].ethAddress.toLowerCase() === userAddress.toLowerCase()
    );
    
    if (!userKey) {
      console.log('⚠️ FEE_DEPOSITS: User not found in database');
      return res.json({
        success: true,
        hasDeposited: false,
        deposits: [],
        message: 'User not found in Oracle database'
      });
    }
    
    const userData = users[userKey];
    
    // For existing users, assume they have deposited if they have transaction history
    const hasDeposited = userData.transactionCount > 0;
    
    const response = {
      success: true,
      hasDeposited,
      deposits: [],
      userExists: true,
      totalDeposits: 0
    };
    
    console.log('✅ FEE_DEPOSITS: Response sent, hasDeposited:', hasDeposited);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ FEE_DEPOSITS: Error checking deposits:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      hasDeposited: false,
      deposits: []
    });
  }
});

EOF

# Find the line with app.listen and insert the endpoint before it
sed -i '/app.listen/e cat /tmp/fee-deposits-endpoint.js' oracle-production.js

echo "✅ Fee deposits endpoint added to Oracle server"
echo "🔄 Restart Oracle server to apply changes"