// Simple fee-deposits endpoint to add to Oracle server

// Add this endpoint before app.listen
app.get('/api/users/:address/fee-deposits', function(req, res) {
  const userAddress = req.params.address;
  
  if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid address format',
      hasDeposited: false,
      deposits: []
    });
  }
  
  console.log('Fee deposits check for:', userAddress);
  
  // Find user in database
  const userKey = Object.keys(users).find(key => 
    users[key].ethAddress && users[key].ethAddress.toLowerCase() === userAddress.toLowerCase()
  );
  
  if (!userKey) {
    return res.json({
      success: true,
      hasDeposited: false,
      deposits: [],
      message: 'User not found'
    });
  }
  
  const userData = users[userKey];
  const hasDeposited = userData.transactionCount > 0;
  
  res.json({
    success: true,
    hasDeposited: hasDeposited,
    deposits: [],
    userExists: true,
    totalDeposits: 0
  });
});

console.log('Fee deposits endpoint added');