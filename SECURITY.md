# ReserveBTC Security Policy

## 🛡️ Security Status: PRODUCTION READY

### Public Testnet Security Infrastructure
- **Web Application**: [https://app.reservebtc.io](https://app.reservebtc.io) - SSL/TLS secured
- **Oracle Server**: [https://oracle.reservebtc.io](https://oracle.reservebtc.io) - Isolated infrastructure
- **Smart Contracts**: Deployed on MegaETH Testnet with comprehensive testing
- **API Endpoints**: Rate-limited and validated

## 🔒 Infrastructure Security

### Production Deployment Architecture
- **Frontend**: Vercel Edge Network with DDoS protection
- **Oracle Server**: Hetzner dedicated server with PM2 process management
- **Smart Contracts**: Immutable deployment on MegaETH (Chain ID: 6342)
- **API Security**: Input validation, rate limiting, and error handling

### Environment Variables & Secrets Management
```bash
# Production secrets (NEVER commit to repository)
ORACLE_PRIVATE_KEY=0x...       # Oracle signing key
BLOCKCYPHER_API_KEY=...         # Bitcoin API access
MEGAETH_RPC_URL=...             # RPC endpoint
VERCEL_API_TOKEN=...            # Deployment token
```

### Security Best Practices
1. **No hardcoded secrets** - All sensitive data in environment variables
2. **Minimal permissions** - Oracle only has sync() permission
3. **Input validation** - All user inputs sanitized
4. **Rate limiting** - API endpoints protected from abuse
5. **Monitoring** - 24/7 Oracle status tracking

### Protected Files (via .gitignore)
```
*.key                   # Private keys
*.pem                   # Certificates  
.env*                   # Environment variables
secrets.json            # Secret configurations
wallet.json             # Wallet data
oracle-server.js        # Oracle implementation
test-*.js              # Internal test scripts
```

## 🛡️ Smart Contract Security

### Audit Results
- **Total Tests**: 206/206 passing
- **Security Tests**: 100% coverage
- **Vulnerabilities**: 0 critical, 0 high, 0 medium
- **Gas Optimization**: Optimized for MegaETH
- **Deployment Status**: Immutable on testnet

### Security Architecture

#### 1. Oracle System Security
- **Committee-based**: Single Oracle address authorized
- **Signature verification**: Every sync() call validated
- **Balance limits**: Maximum delta caps implemented
- **Fee protection**: User prepaid balance checks

#### 2. Token Security (rBTC-SYNTH)
- **Soulbound tokens**: Non-transferable, user-locked
- **Oracle-only minting**: Users cannot directly mint/burn
- **1:1 backing enforced**: Bitcoin balance = token supply
- **No admin functions**: Fully decentralized

#### 3. BIP-322 Implementation
- **Full specification**: Complete BIP-322 compliance
- **Address validation**: Bech32 and legacy formats
- **Signature verification**: Cryptographic proof required
- **Replay protection**: Nonce-based message signing

## 🔐 API Security

### Endpoint Protection
| Endpoint | Security Measures |
|----------|------------------|
| `/api/oracle/sync` | Rate limiting, signature validation, fee checks |
| `/api/verify-wallet` | BIP-322 validation, input sanitization |
| `/api/mint-rbtc` | Mock endpoint for testnet only |
| `/api/track-selfsend` | Bitcoin address validation, timeout limits |

### Rate Limiting Configuration
```javascript
// Current production limits
const RATE_LIMITS = {
  oracle_sync: '10 requests per minute',
  wallet_verify: '5 requests per minute',
  api_global: '100 requests per minute'
}
```

## 📊 Security Monitoring

### Real-time Monitoring
- **Oracle Status**: [https://oracle.reservebtc.io/status](https://oracle.reservebtc.io/status)
- **Uptime**: 99.9% availability target
- **Response Time**: <100ms average
- **Error Rate**: <0.1% threshold

### Audit Trail
- All Oracle sync operations logged
- User verification attempts tracked
- Fee vault deposits recorded on-chain
- Smart contract events indexed

## 🚨 Security Incident Response

### Reporting Vulnerabilities
1. **DO NOT** create public GitHub issues for security vulnerabilities
2. **Email**: security@reservebtc.io (monitored 24/7)
3. **Expected Response**: Within 24 hours
4. **Bug Bounty**: Testnet bugs eligible for recognition

### Incident Response Plan
```
Level 1 (Low): Monitor and patch in next release
Level 2 (Medium): Patch within 48 hours
Level 3 (High): Immediate response and mitigation
Level 4 (Critical): Emergency shutdown if needed
```

## ✅ Current Security Status

### Testnet Deployment (September 2, 2025)
- ✅ All 206 security tests passing
- ✅ Oracle server secured on Hetzner
- ✅ API endpoints protected with rate limiting
- ✅ Smart contracts immutably deployed
- ✅ No known vulnerabilities
- ✅ 24/7 monitoring active

### Recent Security Updates
- **Sept 2, 2025**: Public testnet launch with full security
- **Sept 1, 2025**: Oracle server hardening completed
- **Aug 31, 2025**: BIP-322 implementation audited
- **Aug 30, 2025**: Smart contract deployment verified

## 📝 Security Best Practices for Users

1. **Never share private keys** or seed phrases
2. **Verify website URL**: Always use https://app.reservebtc.io
3. **Check network**: Ensure you're on MegaETH Testnet (Chain ID: 6342)
4. **Test with small amounts** first on testnet
5. **Keep MetaMask updated** to latest version

---

**Security Contact**: security@reservebtc.io  
**GitHub Security**: [Security Policy](https://github.com/reservebtc/app.reservebtc.io/security)  
**Last Security Review**: September 2, 2025  
**Status**: 🟢 **SECURE** - Production Ready for Testnet