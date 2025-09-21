# 🔮 ReserveBTC Oracle Server - Technical Documentation v2.1

## Overview

The ReserveBTC Oracle Server is a production-grade, autonomous blockchain oracle system that bridges Bitcoin and MegaETH networks, providing real-time synthetic token management with advanced security features including emergency burn protection and DeFi yield integration through YieldScalesPool.

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────┐
│                  Oracle Server v2.1                  │
│  ┌────────────────────────────────────────────────┐ │
│  │            State Management Layer              │ │
│  │  • User database (auto-discovery)              │ │
│  │  • Transaction deduplication                   │ │
│  │  • Emergency burn tracking                     │ │
│  │  • YieldScales participant monitoring          │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │           Blockchain Interaction Layer         │ │
│  │  • MegaETH RPC connection                      │ │
│  │  • Smart contract calls (sync, lastSats)      │ │
│  │  • Event log scanning                          │ │
│  │  • YieldScalesPool integration                 │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │            Database Layer (Supabase)           │ │
│  │  • Transaction history                         │ │
│  │  • Emergency burn records                      │ │
│  │  • Yield participants tracking                 │ │
│  │  • User analytics                             │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🔐 Security Features

### 1. Emergency Burn Protection
When users have insufficient funds in FeeVault to pay for sync operations, the Oracle automatically burns ALL their tokens to prevent system abuse.

```javascript
// Emergency burn detection
if (feeVaultBalance === 0n) {
  console.log('🔥🔥🔥 EMERGENCY BURN DETECTED');
  // Burns all user tokens automatically
  emergencyBurns.set(userAddress, {
    timestamp: new Date().toISOString(),
    burnedAmount: oldSats,
    reason: 'Insufficient FeeVault balance'
  });
}
```

### 2. YieldScales Integration
Oracle monitors and tracks eligible participants for the YieldScalesPool, enabling DeFi yield generation based on rBTC-SYNTH holdings.

```javascript
// YieldScales eligibility check on MINT
if (delta > 0 && CONFIG.YIELD_SCALES_POOL && !isEmergencyBurn) {
  // Check if user is registered in YieldScales
  const checkRegistration = await publicClient.readContract({
    address: CONFIG.YIELD_SCALES_POOL,
    functionName: 'participants',
    args: [userAddress]
  });
  
  if (!checkRegistration.joinedAt || checkRegistration.joinedAt === 0n) {
    console.log('💎 User eligible for YieldScales registration');
  }
}
```

### 3. State Persistence
- Automatic state backup every operation
- Recovery on restart
- No data loss on server crashes
- Emergency burns permanently logged

### 4. Transaction Deduplication
- Unique transaction keys prevent double-processing
- Maintains processed transaction history
- Last 1000 transactions cached

## 📊 Smart Contracts Integration

### Deployed Contracts (Latest with YieldScales)

| Contract | Purpose |
|----------|---------|
| OracleAggregator | Core oracle logic with emergency burn |
| FeeVault | Fee management and prepayment |
| RBTCSynth | Soulbound rBTC tokens |
| YieldScalesPool | DeFi yield generation for participants |
| VaultWrBTC | Transferable wrapped rBTC tokens |

### Contract Cross-References
All contracts are atomically deployed with correct bidirectional references:
- FeeVault → OracleAggregator ✅
- OracleAggregator → FeeVault ✅
- OracleAggregator → RBTCSynth ✅
- RBTCSynth → OracleAggregator ✅
- YieldScalesPool → RBTCSynth ✅
- YieldScalesPool → FeeVault ✅
- YieldScalesPool → Oracle (Committee) ✅

## 🔄 Core Functionality

### 1. Automatic User Discovery
```javascript
// Scans blockchain for new users every 30 seconds
async function scanForAllUsers() {
  // Monitors FeeVault deposits
  // Monitors Oracle sync events
  // Automatically adds new users to tracking
  // Identifies YieldScales eligible users
}
```

### 2. Balance Synchronization with Yield Tracking
```javascript
// Checks all users for balance changes
async function checkAllUsers() {
  // Reads on-chain lastSats
  // Compares with local state
  // Triggers sync if different
  // Checks YieldScales eligibility for new minters
}
```

### 3. Emergency Burn Mechanism
```javascript
// Automatic burn on insufficient fees
if (delta < 0 && feeVaultBalance === 0n) {
  // EMERGENCY BURN - all tokens burned
  // Updates YieldScales if user was participant
}
```

### 4. YieldScales Participant Monitoring
```javascript
// Tracks yield generation metrics
- Bitcoin holders: Automatic based on rBTC-SYNTH balance
- Traders: Virtual USDT deposits from DeFi partners
- Loyalty tiers: Bronze → Silver → Gold
- Dynamic yield: Based on scales balance
```

## 📈 Monitoring & Analytics

### Real-time Metrics
- Total users tracked: Dynamic
- Emergency burns: Tracked and logged
- YieldScales participants: 0+ (growing)
- Memory usage: ~76MB (optimal)
- Uptime: 24/7 with PM2 process manager

### YieldScales Metrics
- Total participants: Real-time tracking
- USDT Scale: Always 100%
- rBTC Scale: Dynamic based on supply
- Current yield rate: Calculated per block
- Loyalty distribution: Bronze/Silver/Gold

### Database Integration
- **Supabase**: Real-time transaction storage
- **Oracle operations log**: All sync events
- **Emergency burns table**: Permanent record
- **Yield participants**: DeFi integration tracking
- **System contracts**: Address registry

## 🚀 Deployment Configuration

### PM2 Process Management
```bash
# Current status
pm2 list
┌────┬──────────────────┬────────┬──────┬─────────┬──────────┐
│ id │ name             │ status │ cpu  │ memory  │ uptime   │
├────┼──────────────────┼────────┼──────┼─────────┼──────────┤
│ 19 │ oracle-universal │ online │ 0%   │ 76.6mb  │ 24/7     │
└────┴──────────────────┴────────┴──────┴─────────┴──────────┘
```

### Environment Configuration
```javascript
const CONFIG = {
  MEGAETH_RPC: 'https://carrot.megaeth.com/rpc',
  CHECK_INTERVAL: 30000,  // 30 seconds
  SCAN_BLOCKS: 1000,      // blocks per scan
  BATCH_SIZE: 10,         // users per batch
  // Contract addresses configured
};
```

## 🧪 Testing & Verification

### Comprehensive Test Suite V2 (100% Pass Rate)
1. ✅ All 5 contracts deployed and verified
2. ✅ YieldScalesPool integration confirmed
3. ✅ Cross-reference validation
4. ✅ State persistence with 3 users
5. ✅ Emergency burn tracking (3 burns, 251,822 sats)
6. ✅ Process health monitoring
7. ✅ User balance consistency (3/3)
8. ✅ Database connectivity
9. ✅ YieldScales metrics operational
10. ✅ Scale balance tracking
11. ✅ Total system integration

## 📝 Operational Flow

### User Journey with YieldScales
```
1. User deposits ETH to FeeVault
2. Oracle detects deposit event
3. User automatically added to monitoring
4. User verifies Bitcoin address (BIP-322)
5. Oracle tracks Bitcoin balance (lastSats)
6. Automatic mint on balance increase
   → YieldScales eligibility checked
   → Participant registration available
7. Automatic burn on balance decrease
   → Emergency burn if no fees
   → YieldScales updated if participant
8. Yield generation based on participation
```

### State Management Structure
```javascript
{
  "users": {
    "0xaddress": {
      "lastSats": 150000,
      "firstSeen": "timestamp",
      "lastUpdated": "timestamp",
      "yieldEligible": true
    }
  },
  "emergencyBurns": {
    "0xaddress": {
      "timestamp": "timestamp",
      "burnedAmount": 51822,
      "reason": "Insufficient FeeVault balance"
    }
  },
  "lastScannedBlock": "17265066"
}
```

## 🛡️ Security Measures

### Multi-Layer Protection
1. **Private Key Management**: Secure storage, never logged
2. **Nonce Management**: Automatic tracking and reset
3. **Rate Limiting**: 30-second intervals, batch processing
4. **Emergency Burns**: Automatic protection against abuse
5. **YieldScales Access**: Oracle-only participant registration

## 📊 Performance Metrics

- **Memory Usage**: 16-77 MB (optimal)
- **CPU Usage**: 0-2% (efficient)
- **Uptime**: 99.9% with PM2
- **Response Time**: < 1 second
- **Block Scanning**: 1000 blocks/scan
- **User Capacity**: Unlimited
- **YieldScales Capacity**: Unlimited participants

## 🔄 Backup & Recovery

### Automatic Backups
- State saved after every operation
- Transaction history preserved
- Emergency burns logged permanently
- YieldScales participants tracked

### Recovery Process
```bash
# Restart Oracle (auto-recovery)
pm2 restart oracle-universal

# State automatically loaded from:
/root/oracle-universal-state.json

# Monitor logs
pm2 logs oracle-universal --lines 100
```

## 📡 External Integrations

### Supabase Database
- Transaction history
- Emergency burn records
- Yield participant tracking
- System contract registry
- Oracle operations log

### MegaETH RPC
- Event log filtering
- Block synchronization
- Contract state queries

### YieldScalesPool
- Participant eligibility checking
- Yield metrics tracking
- Scale balance monitoring

## 🚨 Emergency Procedures

### Monitoring Commands
```bash
# Check emergency burns
node ~/monitor-emergency-burns.js

# Run system test
node ~/oracle-system-test-v2.js

# View Oracle logs
pm2 logs oracle-universal --lines 100

# Check YieldScales participants
# Query via Supabase dashboard
```

## 🎯 Key Features Summary

### ReserveBTC Oracle v2.1
- ✅ **Emergency Burn Protection**: Automatic token burn for insufficient fees
- ✅ **YieldScales Integration**: DeFi yield generation for participants
- ✅ **Auto-Discovery**: Finds and tracks users automatically
- ✅ **State Persistence**: Never loses user data
- ✅ **Real-time Sync**: 30-second update intervals
- ✅ **Scale Monitoring**: Dynamic yield based on rBTC supply
- ✅ **Loyalty System**: Bronze/Silver/Gold tiers
- ✅ **Database Backup**: Supabase integration
- ✅ **Production Ready**: 24/7 operation with PM2

## 📈 Future Roadmap

- Multi-source Bitcoin balance verification
- Advanced yield optimization algorithms
- Cross-chain bridge integration
- Real-time WebSocket updates
- Automated YieldScales registration
- DeFi partner API integration
- Governance token distribution

## 🏁 Conclusion

The ReserveBTC Oracle Server v2.1 represents a production-ready, secure, and efficient solution for bridging Bitcoin and MegaETH networks with integrated DeFi yield generation. The addition of YieldScalesPool enables new revenue streams for participants while maintaining the core security and reliability of the Oracle system.

---

**Version**: 2.1.0  
**Status**: Production  
**Uptime**: 24/7  
**Network**: MegaETH Testnet  
**Last Updated**: September 21, 2025  
**Maintained by**: ReserveBTC Team

**Test Results**: 11/11 Passed (100%)  
**Emergency Burns Tracked**: 3 (251,822 sats)  
**YieldScales Status**: Deployed and Operational