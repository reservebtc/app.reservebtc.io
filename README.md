# ReserveBTC Protocol — Decentralized Bitcoin Reserves with Proof-of-Reserves

[![Website](https://img.shields.io/badge/Website-app.reservebtc.io-blue)](https://app.reservebtc.io)
[![MegaETH](https://img.shields.io/badge/Network-MegaETH%20Testnet-orange)](https://www.megaexplorer.xyz)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Competition Ready](https://img.shields.io/badge/MegaETH-Competition%20Ready-orange)](https://app.reservebtc.io)

---

## 🔐 Independent Security Verification

**Don't trust. Verify.** Anyone can independently test our BIP-322 implementation:

<div align="center">

### [🚀 Run BIP-322 Security Tests (Public Access)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml)

**Click → Press "Run workflow" → Watch 32 tests execute → See results in 2 minutes**

[![Run Tests](https://img.shields.io/badge/🔒_BIP--322-Run_32_Public_Tests-orange?style=for-the-badge)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml)
[![Security](https://img.shields.io/badge/Security-Independently_Verifiable-green?style=for-the-badge)](https://github.com/reservebtc/app.reservebtc.io/blob/main/docs/SECURITY_AUDIT_BIP322.md)

</div>

**Why this matters:** BIP-322 signature verification is the **foundation** of ReserveBTC security. We let you verify it yourself:

- ✅ **32 security tests** - Run them yourself on GitHub Actions
- ✅ **Zero vulnerabilities** - Independently verifiable
- ✅ **Open source** - Complete code transparency
- ✅ **No trust needed** - Mathematical proof, not promises

**How to verify:**
1. Click button above → Opens GitHub Actions
2. Press green "Run workflow" button (top right)
3. Watch all 32 security tests execute live
4. Download test results (available for 30 days)
```bash
# Or run locally yourself:
git clone https://github.com/reservebtc/app.reservebtc.io
cd app.reservebtc.io
npm install
node scripts/security-audit-bip322-ci.js

---

## 🚀 Quick Links

| Resource | Link |
|----------|------|
| **Live Application** | [app.reservebtc.io](https://app.reservebtc.io) |
| **Oracle Dashboard** | [oracle.reservebtc.io](https://oracle.reservebtc.io) |
| **Documentation** | [Complete Docs](https://app.reservebtc.io/docs) |
| **Faucet** | [Testnet ETH & BTC](https://app.reservebtc.io/faucet) |

---

## 🏆 Production Status

[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen)](https://app.reservebtc.io)
[![All Tests](https://img.shields.io/badge/All%20Tests-350%2F350%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/TEST-STATUS.md)
[![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-0%20Found-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/SECURITY.md)

---

## 🧪 Test Status - ALL PASSING

### Live CI/CD Status
[![Frontend Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![Smart Contracts](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml)
[![BIP-322 Security](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml)
[![Bitcoin Provider](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bitcoin-provider-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bitcoin-provider-tests.yml)
[![Coverage](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml)

### Security Verification
[![BIP-322 Verified](https://img.shields.io/badge/BIP--322-Verified-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/docs/SECURITY_AUDIT_BIP322.md)
[![Security Audit](https://img.shields.io/badge/Security%20Audit-32%2F32%20PASS-success)](https://github.com/reservebtc/app.reservebtc.io/blob/main/scripts/security-audit-bip322-ci.js)
[![Security Rating](https://img.shields.io/badge/Security%20Rating-HIGH-success)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/SECURITY_AUDIT_REPORT.md)

### Comprehensive Testing
[![Comprehensive Tests](https://img.shields.io/badge/Comprehensive%20Security-206%2F206%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/README_Comprehensive_Security_Tests.md)
[![Reentrancy Safe](https://img.shields.io/badge/Reentrancy-SAFE-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/VaultWrBTC_ERC20_Unit.t.sol)
[![Access Control](https://img.shields.io/badge/Access%20Control-Committee%20Based-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/OracleAggregator.sol)

---

<details>
<summary>📊 <b>Detailed Test Results (350 tests - click to expand)</b></summary>

### Frontend Tests (67/67 PASS)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-39%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/lib/__tests__/bitcoin-validation.test.ts)
[![Validation](https://img.shields.io/badge/Validation-18%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/lib/__tests__/validation-schemas.test.ts)
[![Components](https://img.shields.io/badge/Components-6%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![API Tests](https://img.shields.io/badge/API-6%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AA-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)

### Smart Contract Tests (206/206 PASS)

**Oracle Tests**  
[![Oracle All Unit](https://img.shields.io/badge/Oracle%20All%20Unit-PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Oracle_All_Unit.t.sol)
[![Boundary Fuzz](https://img.shields.io/badge/Boundary%20Fuzz-PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Oracle_BoundaryFuzz_Invariants.t.sol)
[![Resilience](https://img.shields.io/badge/Resilience-PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Oracle_Resilience_Unit.t.sol)
[![Negative Delta](https://img.shields.io/badge/Negative%20Delta-NO%20FEE-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Oracle_NegativeDelta_NoFee_Unit.t.sol)

**Token Tests**  
[![RBTCSynth](https://img.shields.io/badge/RBTCSynth-SOULBOUND%20VERIFIED-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/RBTCSynth_Core_Soulbound_Unit.t.sol)
[![VaultWrBTC](https://img.shields.io/badge/VaultWrBTC-ERC20%20SAFE-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/VaultWrBTC_ERC20_Unit.t.sol)

**Fee System**  
[![FeeVault](https://img.shields.io/badge/FeeVault-31%2F31%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/FeeVault_Edges_Unit.t.sol)
[![FeePolicy](https://img.shields.io/badge/FeePolicy-31%2F31%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/FeePolicy_Comprehensive_Security.t.sol)

**E2E & Security**  
[![E2E Tests](https://img.shields.io/badge/E2E-COMPLETE-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/README_Test_Summary_E2E.md)
[![Security Canary](https://img.shields.io/badge/Security%20Canary-NO%20CORRUPTION-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Security_Canary_OracleAndVault.t.sol)

### BIP-322 Security (32/32 PASS)
- Cryptographic Attacks: 8/8 PASS
- Injection Attacks: 7/7 PASS
- Input Validation: 12/12 PASS
- Protocol Attacks: 3/3 PASS
- DoS Prevention: 1/1 PASS
- Legitimate Operations: 1/1 PASS

### Bitcoin Provider (45/45 PASS)
[![BIP-322 Module](https://img.shields.io/badge/BIP--322-IMPLEMENTED-success)](https://github.com/reservebtc/app.reservebtc.io/blob/main/backend/bitcoin-provider/src/bip322-verify.ts)
[![Self-Send](https://img.shields.io/badge/SelfSend-IMPLEMENTED-success)](https://github.com/reservebtc/app.reservebtc.io/blob/main/backend/bitcoin-provider/src/selfsend-detector.ts)

</details>

---

## What is ReserveBTC? A Real-World Analogy

Imagine you own a valuable gold bar stored in your personal safe at home. Traditional finance would require you to hand over your gold to a bank to get a loan. But what if you could **keep your gold in YOUR safe** while still participating in the financial system?

That's exactly what ReserveBTC does with Bitcoin:

- **Traditional DeFi**: "Give us your Bitcoin, we'll give you tokens" (Risk: You lose control)  
- **ReserveBTC**: "Keep your Bitcoin, we'll mirror its value" (Safety: You stay in control)

**Think of it like this**: Your Bitcoin is like a house you own. Instead of selling or mortgaging it, you get a "digital twin" that represents its value. You keep living in your house (holding your Bitcoin), but now you can also use its digital twin to participate in DeFi, earn yield, and prove your wealth—all without ever giving up your keys.

---

## The Complete User Journey

### Step 1: Verification
**Where**: [app.reservebtc.io/verify](https://app.reservebtc.io/verify)

Just like showing your ID at a bank, but cryptographically:
1. Enter your Bitcoin address
2. Sign a message with your Bitcoin wallet
3. System verifies you own that Bitcoin address via BIP-322
4. **Result**: You're verified without revealing private keys

### Step 2: Minting
**Where**: [app.reservebtc.io/mint](https://app.reservebtc.io/mint)

Like getting a certified copy of your property deed:
1. Deposit 0.001 ETH to FeeVault (covers Oracle operating costs)
2. Select your verified Bitcoin address
3. Oracle begins 24/7 monitoring of your Bitcoin balance
4. **Result**: rBTC-SYNTH tokens automatically appear based on your BTC balance

### Step 3: Oracle Guardian
**Where**: [oracle.reservebtc.io](https://oracle.reservebtc.io)

Like having a trusted notary watching your assets 24/7:
- Checks your Bitcoin balance every 30 seconds
- If BTC increases → Automatically mints more rBTC-SYNTH
- If BTC decreases → Automatically burns rBTC-SYNTH
- **Complete transparency**: View live at [oracle.reservebtc.io/status](https://oracle.reservebtc.io/status)

### Step 4: Yield Scales Revolution
**Where**: [app.reservebtc.io/yield-scales](https://app.reservebtc.io/yield-scales)

Picture an old-fashioned balance scale in a marketplace:
- **Left side**: Traders deposit USDT (stays safe, principal protected)
- **Right side**: Bitcoin holders provide rBTC-SYNTH backing
- **The Magic**: The balance determines yield (target 3-7% APY)
- **Your Safety**: USDT never moves, only yield rate changes

---

## Current Live Statistics

```
System Status Dashboard
═══════════════════════════════════════════════
Oracle Uptime:           99.9% (24/7 Active)
Total Users:             3 Active
Total rBTC Tracked:      153,000 sats
Smart Contract Tests:    350/350 (100%)
Security Status:         PRODUCTION READY
═══════════════════════════════════════════════
```

---

## Smart Contracts Suite

**MegaETH Testnet - Chain ID: 6342**

| Contract | Address | Purpose |
|----------|---------|---------|
| **OracleAggregator** | `0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc` | Core Oracle logic |
| **RBTCSynth** | `0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58` | Soulbound BTC mirror |
| **FeeVault** | `0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f` | Fee management |
| **FeePolicy** | `0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4` | Fee calculations |
| **YieldScalesPool** | `0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8` | DeFi yield engine |

**Network Configuration:**
- **RPC URL**: `https://carrot.megaeth.com/rpc`
- **Chain ID**: `6342`
- **Block Explorer**: [MegaExplorer](https://www.megaexplorer.xyz)

---

## Complete Platform Map

### Core Features

| Feature | URL | Description |
|---------|-----|-------------|
| Homepage | [app.reservebtc.io](https://app.reservebtc.io) | Your entry point to Bitcoin DeFi |
| Verify Address | [app.reservebtc.io/verify](https://app.reservebtc.io/verify) | Prove Bitcoin ownership |
| Mint Tokens | [app.reservebtc.io/mint](https://app.reservebtc.io/mint) | Start monitoring & receive rBTC-SYNTH |
| Dashboard | [app.reservebtc.io/dashboard](https://app.reservebtc.io/dashboard) | Portfolio view |
| Faucet | [app.reservebtc.io/faucet](https://app.reservebtc.io/faucet) | Get testnet funds |

### Yield Scales

| Feature | URL | Purpose |
|---------|-----|---------|
| Main Portal | [app.reservebtc.io/yield-scales](https://app.reservebtc.io/yield-scales) | Yield generation |
| Projections | [app.reservebtc.io/yield-scales/projections](https://app.reservebtc.io/yield-scales/projections) | Calculate returns |
| Risk Disclosure | [app.reservebtc.io/yield-scales/risks](https://app.reservebtc.io/yield-scales/risks) | Transparency on risks |
| Live Stats | [app.reservebtc.io/yield-scales/stats](https://app.reservebtc.io/yield-scales/stats) | Real-time metrics |
| Loyalty Program | [app.reservebtc.io/yield-scales/loyalty](https://app.reservebtc.io/yield-scales/loyalty) | Bonus yields |

### Oracle Transparency

| Feature | URL | Description |
|---------|-----|-------------|
| Dashboard | [app.reservebtc.io/oracle-transparency](https://app.reservebtc.io/oracle-transparency) | Real-time operations |
| API Explorer | [app.reservebtc.io/api-explorer/oracle](https://app.reservebtc.io/api-explorer/oracle) | Test APIs |
| Status Monitor | [oracle.reservebtc.io/status](https://oracle.reservebtc.io/status) | Health metrics |

---

## Security & Testing

### Multi-Layer Security

```
Layer 1: Smart Contracts
├── 350/350 Tests Passed
├── Reentrancy Protection
├── Access Control (Committee)
└── Atomic Deployment Verified

Layer 2: Oracle System
├── 24/7 Monitoring (99.9% uptime)
├── Multi-source Verification
├── Automatic Emergency Burns
└── Real-time Balance Sync

Layer 3: Data Protection
├── AES-256-GCM Encryption
├── User Privacy
├── Audit Trail Logging
└── GDPR Compliance Ready
```

### BIP-322 Verification

- **32 security tests** covering all attack vectors
- **0 vulnerabilities** found
- **100% test coverage** for signature verification

Supported address types:
- Native SegWit (P2WPKH) - `bc1q...`
- Taproot (P2TR) - `bc1p...`
- SegWit (P2SH-P2WPKH) - `3...`
- Legacy (P2PKH) - `1...`
- Testnet variants - `tb1...`, `2...`, `m...`, `n...`

---

## Quick Start

### For New Users

```bash
1. Visit: https://app.reservebtc.io
2. Connect: MetaMask to MegaETH Testnet
3. Get ETH: Use faucet at /faucet
4. Verify: Your Bitcoin address at /verify
5. Mint: Start monitoring at /mint
Done! Check tokens at /dashboard
```

### For Developers

```bash
# Clone repository
git clone https://github.com/reservebtc/app.reservebtc.io
cd app.reservebtc.io

# Install dependencies
npm install

# Run comprehensive health check
node scripts/smart-contract-health-check.js

# Check Oracle status
curl https://oracle.reservebtc.io/status
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Complete Documentation](https://app.reservebtc.io/docs) | Full protocol docs |
| [Security Audit BIP-322](https://github.com/reservebtc/app.reservebtc.io/blob/main/docs/SECURITY_AUDIT_BIP322.md) | BIP-322 security report |
| [Smart Contract Security](https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/SECURITY_AUDIT_REPORT.md) | Contract audit report |
| [Security Policy](https://github.com/reservebtc/app.reservebtc.io/blob/main/SECURITY.md) | Vulnerability reporting |
| [Test Status](https://github.com/reservebtc/app.reservebtc.io/blob/main/TEST-STATUS.md) | Detailed test results |

---

## Key Features

- **BIP-322 Verified** - Cryptographic proof of Bitcoin ownership
- **Self-Custody** - Bitcoin never leaves your wallet
- **Oracle-Based** - Automated balance synchronization
- **MegaETH Integration** - Ultra-fast L2 transactions
- **Production Ready** - 350/350 tests passing
- **Zero Vulnerabilities** - Comprehensive security audit

---

## Development Status

```
MegaETH Competition Readiness
═══════════════════════════════════════════════
Smart Contracts:      5/5 Deployed & Verified
Oracle Server:        Active 24/7
Health Check:         12/12 Tests Passing
Security Status:      100% PASS
User Interface:       18 Pages Live
API Endpoints:        19/19 Operational
Documentation:        Complete
═══════════════════════════════════════════════
STATUS: COMPETITION READY
```

---

## Join the Revolution

### Start Now
- **Users**: [app.reservebtc.io](https://app.reservebtc.io)
- **Developers**: [GitHub](https://github.com/reservebtc/app.reservebtc.io)
- **Partners**: [Partner Portal](https://app.reservebtc.io/partners)
- **Support**: reservebtcproof@gmail.com

### Follow Us
- **Twitter**: [@reserveBTC](https://x.com/reserveBTC)
- **Docs**: [Documentation](https://app.reservebtc.io/docs)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**ReserveBTC Protocol v2.2** — *Your Bitcoin, Your Keys, Your Yield*

**Built for the MegaETH Ecosystem** | **October 2025**

*Revolutionizing Bitcoin DeFi one verification at a time*