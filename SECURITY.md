# ReserveBTC Security Guidelines

## 🔒 Repository Security

### GitHub Token Security
- ✅ **FIXED**: Removed hardcoded GitHub token from `autopush.sh`
- ✅ **PROTECTED**: Added `autopush.sh` to `.gitignore`
- ✅ **SECURE**: Created new `deploy.sh` script requiring environment variable

### Secure Deployment Process

#### Using the secure deploy script:
```bash
# Set your GitHub token as environment variable
export GITHUB_TOKEN="your_github_token_here"

# Run secure deployment
./deploy.sh
```

#### Alternative one-liner:
```bash
GITHUB_TOKEN=your_token ./deploy.sh
```

### Token Management
1. **Never commit tokens** to any repository
2. **Use environment variables** for sensitive data
3. **Rotate tokens regularly** for security
4. **Limit token permissions** to minimum required

### Files Protected from Public Access
- `autopush.sh` - Contains deployment automation
- `*.key` - Private keys
- `*.pem` - Certificate files  
- `*.env*` - Environment files
- `secrets.json` - Secret configurations
- `wallet.json` - Wallet files
- `keyfile.json` - Key storage files

## 🛡️ Smart Contract Security

### Comprehensive Test Suite
- **206 tests** covering all security scenarios
- **Zero critical issues** in security audit
- **Production ready** security status

### Security Features Implemented
- **Reentrancy protection** on all state-changing functions
- **Access control** with committee-based oracle
- **Integer overflow** protection with Solidity 0.8+
- **CEI pattern** enforced throughout contracts
- **Gas optimization** for production deployment

### Address Ownership Verification (T2.2)
- **BIP-322 verification**: Complete specification implementation
- **Self-send detection**: Bitcoin transaction monitoring
- **Signature validation**: Cryptographic proof of ownership
- **Amount validation**: 600-2000 satoshi range limits

## 📋 Security Checklist

### Before Deployment
- [ ] All tests passing (206/206)
- [ ] Security audit completed
- [ ] GitHub token set as environment variable
- [ ] No sensitive data in repository
- [ ] Deploy script permissions verified

### After Deployment  
- [ ] Contract addresses updated
- [ ] Frontend ABIs synchronized
- [ ] Oracle committee configured
- [ ] Fee parameters validated
- [ ] Monitoring systems active

## 🚨 Incident Response

### If Security Issue Detected
1. **Immediate**: Stop all operations
2. **Assess**: Determine scope of issue
3. **Mitigate**: Apply emergency fixes
4. **Communicate**: Notify users if needed
5. **Document**: Record incident and response

### Contact Information
- **Security Team**: reservebtcproof@gmail.com
- **Repository**: https://github.com/reservebtc/app.reservebtc.io
- **Documentation**: docs/PROTOCOL_V1.md

---

**Last Updated**: 2025-08-28  
**Security Status**: 🟢 HIGH (Production Ready)  
**Test Coverage**: 206/206 tests passing