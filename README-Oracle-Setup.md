# 🔮 Oracle Setup Guide for ReserveBTC

## Overview

The ReserveBTC Oracle monitors Bitcoin addresses and synchronizes balances to the MegaETH protocol. This enables automatic minting and burning of rBTC tokens based on real Bitcoin holdings.

## 🚀 Quick Start

### 1. Start the Oracle Server

```bash
# Install dependencies (if not already done)
npm install viem

# Start the oracle server
node oracle-server.js
```

### 2. Add Users to Track

Once the server is running, use the CLI to add users:

```bash
oracle> add 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
oracle> list
```

### 3. Monitor Synchronization

The oracle will automatically sync balances every 5 minutes. You can also trigger manual syncs:

```bash
oracle> sync
oracle> status
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# Oracle private key (same as in contracts/.env.deploy)
ORACLE_PRIVATE_KEY=0xeec1cf19d9890a45fa92cd97a6311752350403036b03a7f325541851a53b9abb

# Sync interval in seconds (default: 300 = 5 minutes)
SYNC_INTERVAL=300

# Optional: Bitcoin RPC URL (uses public APIs by default)
BITCOIN_RPC_URL=https://your-bitcoin-node.com
```

### Contract Configuration

The oracle is configured for MegaETH Testnet:
- **Chain ID:** 6342
- **RPC URL:** https://carrot.megaeth.com/rpc
- **Oracle Contract:** `0x717D12a23Bb46743b15019a52184DF7F250B061a`

## 📋 Oracle Commands

| Command | Description | Example |
|---------|-------------|---------|
| `add <eth> <btc>` | Add user to track | `add 0xabc... tb1qxy...` |
| `remove <eth>` | Remove user | `remove 0xabc...` |
| `list` | Show all tracked users | `list` |
| `sync` | Trigger manual sync | `sync` |
| `status` | Show oracle status | `status` |
| `help` | Show help menu | `help` |
| `exit` | Stop oracle server | `exit` |

## 🔄 How It Works

### 1. Balance Monitoring
- Oracle queries Bitcoin testnet APIs (BlockCypher) for address balances
- Compares with last synced balance stored in smart contract
- Only syncs when balance changes detected

### 2. Synchronization Process
```
BTC Address → API Query → Balance Check → Contract Call → Event Emission
```

### 3. Smart Contract Integration
- Calls `OracleAggregator.sync()` function
- Provides: user address, new balance (satoshis), block height, timestamp
- Contract calculates delta and mints/burns tokens accordingly

## 📊 Monitoring & Logs

### Sample Output
```
🔮 ReserveBTC Oracle Server Starting...
Oracle Address: 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b
✅ Oracle authorization verified

🔄 Starting sync cycle for 1 users...
📈 Balance change detected for 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b:
   Previous: 0.00000000 BTC  
   New:      0.00100000 BTC
   Delta:    0.00100000 BTC
⛓️  Sync transaction sent: 0xabcd1234...
✅ Balance synced successfully
```

### Error Handling
- Network failures are logged and retried
- Invalid transactions are caught before submission
- User data is persisted to `oracle-users.json`

## 🧪 Testing the Oracle

### 1. Add Yourself as Test User
```bash
oracle> add YOUR_ETH_ADDRESS YOUR_BTC_TESTNET_ADDRESS
```

### 2. Fund Your BTC Testnet Address
Get testnet BTC from faucets:
- https://coinfaucet.eu/en/btc-testnet/
- https://testnet-faucet.mempool.co/

### 3. Verify Synchronization
```bash
oracle> sync
# Check MegaExplorer: https://megaexplorer.xyz
# Verify token balance in frontend
```

## 🔐 Security Considerations

### Production Deployment
1. **Secure Oracle Key Storage**
   - Use hardware wallets or secure key management
   - Never commit private keys to code

2. **Network Security**
   - Run oracle on secure, monitored servers
   - Use VPN or private networks

3. **Multi-Oracle Setup**
   - Deploy multiple oracles for redundancy
   - Implement consensus mechanisms for critical operations

4. **Rate Limiting**
   - Implement API rate limiting for Bitcoin queries
   - Add circuit breakers for failed sync attempts

## 🔗 Integration with Frontend

### Web Interface
The oracle dashboard is available at:
```
http://localhost:3000/oracle
```

Features:
- View oracle status and configuration
- Monitor user balances
- Trigger manual synchronization
- View contract addresses

### API Endpoints
```typescript
// Sync user balance
POST /api/oracle/sync
{
  "userAddress": "0x...",
  "btcBalance": "0.00100000", 
  "blockHeight": 870000
}

// Get oracle status
GET /api/oracle/sync
```

## 📈 Scaling for Production

### High-Frequency Trading
- Reduce sync interval to 30-60 seconds
- Implement WebSocket connections for real-time updates
- Use dedicated Bitcoin node with txindex

### Large User Base
- Implement user pagination and batching
- Use Redis for user state management  
- Deploy multiple oracle instances with load balancing

### Enterprise Features
- Add Prometheus metrics and Grafana dashboards
- Implement alerting for failed syncs
- Add audit logging and compliance reporting

## 🐛 Troubleshooting

### Common Issues

**"Oracle not authorized"**
- Verify `ORACLE_PRIVATE_KEY` matches deployed committee address
- Check contract deployment logs

**"Balance sync failing"**  
- Check MegaETH RPC connectivity
- Verify sufficient ETH for gas fees
- Check contract addresses are correct

**"Bitcoin API errors"**
- API rate limits reached - implement backoff
- Use alternative APIs or Bitcoin node

### Debug Mode
Enable verbose logging:
```bash
DEBUG=* node oracle-server.js
```

## 📞 Support

For oracle issues:
1. Check the logs in the terminal
2. Verify contract addresses match deployment
3. Test with small amounts first
4. Report issues with full error logs

The oracle is the heart of the ReserveBTC protocol - it ensures your Bitcoin holdings are accurately reflected as rBTC tokens on MegaETH! 🚀