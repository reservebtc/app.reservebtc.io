# Setting up ORACLE_PRIVATE_KEY

## Current Issue
The Oracle sync API is not working because ORACLE_PRIVATE_KEY is not configured in production.

## Requirements
The ORACLE_PRIVATE_KEY must generate the address: `0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b`

## Step 1: Get or Generate the Key

If you already have the private key for address `0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b`, skip to Step 2.

To generate a new key (if changing committee):
```javascript
const { privateKeyToAccount } = require('viem/accounts');
const { generatePrivateKey } = require('viem/accounts');

// Generate new key
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);
console.log('Private Key:', privateKey);
console.log('Address:', account.address);
```

## Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/reservebtc/web-interface/settings/environment-variables)
2. Add new environment variable:
   - Name: `ORACLE_PRIVATE_KEY`
   - Value: `0x...` (your private key)
   - Environment: Production, Preview, Development
3. Click "Save"

## Step 3: Redeploy Application

After adding the environment variable:
```bash
vercel --prod --yes
```

## Step 4: Update Oracle Server (if needed)

SSH to oracle server:
```bash
ssh root@oracle.reservebtc.io
```

Edit the Oracle server config:
```bash
nano /root/oracle-server/.env
```

Add/update:
```
ORACLE_PRIVATE_KEY=0x... (same key as Vercel)
```

Restart Oracle service:
```bash
pm2 restart oracle-server
pm2 save
```

## Step 5: Test the Integration

Run the test script:
```bash
node test-production.js
```

Or test manually:
```bash
# Test Oracle sync
curl -X POST https://app.reservebtc.io/api/oracle/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x1234567890123456789012345678901234567890",
    "btcBalance": "0.1",
    "blockHeight": 800000
  }'
```

## Security Note
⚠️ **NEVER commit the private key to git**
- Keep it only in environment variables
- Use different keys for testnet and mainnet
- Rotate keys periodically

## Current Contract Configuration
- Committee Address: `0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b`
- Oracle Aggregator: `0x717D12a23Bb46743b15019a52184DF7F250B061a`
- Chain: MegaETH Testnet (ID: 6342)