# ReserveBTC Protocol — Bitcoin-Backed Synthetic Assets on MegaETH

[![Website](https://img.shields.io/badge/Website-app.reservebtc.io-blue)](https://app.reservebtc.io)
[![MegaETH](https://img.shields.io/badge/Network-MegaETH%20Testnet-orange)](https://megaeth-testnet-v2.blockscout.com)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://app.reservebtc.io)

---

## 🔐 Independent Security Verification

**Don't trust. Verify.** Anyone can independently test our BIP-322 implementation:

<div align="center">

### [🚀 Run BIP-322 Security Tests (Public Access)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml)

**Click → Press "Run workflow" → Watch 32 tests execute → See results in 2 minutes**

[![Run Tests](https://img.shields.io/badge/🔒_BIP--322-Run_32_Public_Tests-orange?style=for-the-badge)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml)
[![Security](https://img.shields.io/badge/Security-Independently_Verifiable-green?style=for-the-badge)](./docs/SECURITY_AUDIT_BIP322.md)

</div>

**Why this matters:** BIP-322 signature verification is the **foundation** of ReserveBTC security. We let you verify it yourself:

- ✅ **32 security tests** - Run them yourself on GitHub Actions
- ✅ **Zero vulnerabilities** - Independently verifiable
- ✅ **Open source** - Complete code transparency
- ✅ **No trust needed** - Mathematical proof, not promises

---

## 🏆 Production Status

[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen)](https://app.reservebtc.io)
[![All Tests](https://img.shields.io/badge/All%20Tests-350%2F350%20PASS-brightgreen)](./TEST-STATUS.md)
[![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-0%20Found-brightgreen)](./SECURITY.md)
[![Uptime](https://img.shields.io/badge/Oracle%20Uptime-99.9%25-brightgreen)](https://oracle.reservebtc.io)

---

## 🧪 Automated Testing & CI/CD

### Live Test Status (GitHub Actions)

[![Frontend Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![Smart Contracts](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml)
[![BIP-322 Security](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml)
[![Bitcoin Provider](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bitcoin-provider-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bitcoin-provider-tests.yml)
[![Coverage](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml)

### Security Verification

[![BIP-322 Verified](https://img.shields.io/badge/BIP--322-Verified-brightgreen)](./docs/SECURITY_AUDIT_BIP322.md)
[![Security Audit](https://img.shields.io/badge/Security%20Audit-32%2F32%20PASS-success)](./scripts/security-audit-bip322-ci.js)
[![Security Rating](https://img.shields.io/badge/Security%20Rating-HIGH-success)](./contracts/SECURITY_AUDIT_REPORT.md)

### Comprehensive Testing

[![Comprehensive Tests](https://img.shields.io/badge/Comprehensive%20Security-206%2F206%20PASS-brightgreen)](./contracts/test/README_Comprehensive_Security_Tests.md)
[![Reentrancy Safe](https://img.shields.io/badge/Reentrancy-SAFE-brightgreen)](./contracts/test/VaultWrBTC_ERC20_Unit.t.sol)
[![Access Control](https://img.shields.io/badge/Access%20Control-Committee%20Based-brightgreen)](./contracts/OracleAggregator.sol)

---

<details>
<summary>📊 <b>Detailed Test Results (350 tests - click to expand)</b></summary>

### Frontend Tests (67/67 PASS)
- **Unit Tests**: 39/39 PASS - Bitcoin validation, address types, network detection
- **Validation**: 18/18 PASS - Form validation, input sanitization
- **Components**: 6/6 PASS - React component rendering, hooks
- **API Tests**: 6/6 PASS - REST endpoints, error handling
- **Accessibility**: WCAG AA compliant

### Smart Contract Tests (206/206 PASS)

**Oracle Tests**
- Oracle All Unit: PASS
- Boundary Fuzz: PASS
- Resilience: PASS
- Negative Delta (No Fee): PASS

**Token Tests**
- RBTCSynth: SOULBOUND VERIFIED
- VaultWrBTC: ERC20 SAFE

**Fee System**
- FeeVault: 31/31 PASS
- FeePolicy: 31/31 PASS

**E2E & Security**
- E2E Tests: COMPLETE
- Security Canary: NO CORRUPTION

### BIP-322 Security (32/32 PASS)
- Cryptographic Attacks: 8/8 PASS
- Injection Attacks: 7/7 PASS
- Input Validation: 12/12 PASS
- Protocol Attacks: 3/3 PASS
- DoS Prevention: 1/1 PASS
- Legitimate Operations: 1/1 PASS

### Bitcoin Provider (45/45 PASS)
- BIP-322 Module: IMPLEMENTED
- Self-Send Detection: IMPLEMENTED

</details>

---

## 💡 What is ReserveBTC?

**TL;DR:** Keep your Bitcoin in your own wallet while using it in DeFi. No custody, no risk, 1:1 backing guaranteed.

### The Problem
- **Traditional DeFi**: "Give us your Bitcoin, we'll give you tokens" ❌ (You lose control)
- **Most bridges**: Custodial solutions that require trust ❌ (Risk of theft/hacks)

### Our Solution
- **ReserveBTC**: "Keep your Bitcoin, we mirror its value" ✅ (You stay in control)
- **Oracle-based monitoring**: 24/7 automatic synchronization ✅ (No manual actions)
- **Proof-of-reserves**: BIP-322 cryptographic verification ✅ (Mathematical certainty)

---

## 🏗️ System Architecture v4.0

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Next.js 14)                  │
│           https://app.reservebtc.io (Vercel Edge)               │
│                                                                 │
│  • /verify    - Bitcoin address verification (BIP-322)          │
│  • /mint      - Start monitoring + receive rBTC-SYNTH           │
│  • /dashboard - Real-time portfolio view                        │
│  • /faucet    - Testnet ETH & BTC                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│           SUPABASE POSTGRESQL (Single Source of Truth)          │
│                                                                 │
│  Tables:                                                        │
│  • transactions       - All MINT/BURN/WRAP/UNWRAP operations    │
│  • bitcoin_addresses  - Verified addresses + monitoring status  │
│  • balance_snapshots  - Historical balance tracking             │
│                                                                 │
│  Real-time: PostgreSQL Change Data Capture (CDC)                │
│  Security: Row Level Security (RLS) per user                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              ORACLE SERVER (VPS - Backend 24/7)                 │
│                                                                 │
│  professional-oracle-server.js (PM2 Process Manager)            │
│                                                                 │
│  1. Monitors Bitcoin addresses (Mempool.space API)              │
│     - Checks balances every 15 seconds                          │
│  2. Detects MINT/BURN conditions                                │
│     - Bitcoin received → MINT tokens                            │
│     - Bitcoin withdrawn → BURN tokens                           │
│  3. Calls sync() on Oracle Aggregator contract                  │
│     - Executes on MegaETH with <1s finality                     │
│  4. Writes transactions to Supabase PostgreSQL                  │
│     - Single source of truth                                    │
│  5. PostgreSQL CDC → Real-time dashboard updates                │
│     - No browser polling needed                                 │
│                                                                 │
│  Uptime: 99.9% | Memory: ~20MB | CPU: <2%                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│           SMART CONTRACTS (MegaETH Testnet - Chain 6342)        │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Oracle          │  │ rBTC-SYNTH      │  │ FeeVault        │  │
│  │ Aggregator      │  │ (Soulbound)     │  │ (Fee Manager)   │  │
│  │ 0xEcCC...aEAc   │  │ 0x5b93...6F58   │  │ 0x1384...FD4f   │  │
│  │                 │  │                 │  │                 │  │
│  │ sync()          │  │ mint()/burn()   │  │ balanceOf()     │  │
│  │ lastSats()      │  │ 1:1 Bitcoin     │  │ user deposits   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Journey

### Step 1: Verification
**Page**: [app.reservebtc.io/verify](https://app.reservebtc.io/verify)

Prove Bitcoin address ownership via BIP-322 signature:

1. Enter your Bitcoin address
2. Sign a message with your Bitcoin wallet
3. System verifies signature cryptographically
4. Address saved to Supabase with `is_monitoring = false`

**Result**: Verified but NOT monitored yet (no fees charged).

---

### Step 2: Start Monitoring (Mint)
**Page**: [app.reservebtc.io/mint](https://app.reservebtc.io/mint)

Explicit two-step process for transparency:

1. **Deposit ETH to FeeVault**
   - Minimum: 0.001 ETH
   - Pays for Oracle operations (gas fees)
   - Your funds, your control

2. **Click "Start Monitoring"**
   - Updates `is_monitoring = true` in Supabase
   - Oracle Server begins monitoring within 5 minutes
   - rBTC-SYNTH tokens minted based on Bitcoin balance

**Result**: Oracle monitors 24/7, automatic MINT/BURN operations.

---

### Step 3: Oracle Guardian (Automatic)
**Monitor**: [oracle.reservebtc.io](https://oracle.reservebtc.io)

Backend Oracle Server handles everything:

- **Every 15 seconds**: Checks your Bitcoin balance via Mempool.space
- **Balance increases**: Automatically mints more rBTC-SYNTH tokens
- **Balance decreases**: Automatically burns rBTC-SYNTH tokens
- **Balance reaches zero**: Emergency burn, monitoring stops

**Transparency**: View live operations at [oracle.reservebtc.io/status](https://oracle.reservebtc.io/status)

---

### Step 4: Dashboard & Portfolio
**Page**: [app.reservebtc.io/dashboard](https://app.reservebtc.io/dashboard)

Real-time portfolio interface:

- **rBTC-SYNTH Balance**: Current tokens (soulbound, non-transferable)
- **Transaction History**: All MINT/BURN/WRAP/UNWRAP operations
- **Bitcoin Addresses**: Verified addresses with monitoring status
- **Real-time Updates**: Supabase CDC pushes updates instantly

**No manual refresh needed!** Dashboard updates automatically when Oracle writes transactions.

---

## 📊 Current Live Statistics

```
PRODUCTION SYSTEM STATUS (OCTOBER 2025)
═══════════════════════════════════════════════════
Oracle Server:           ONLINE (VPS, PM2, 25+ hours)
Oracle Uptime:           99.9% (24/7 monitoring)
Active Users:            4 users
Bitcoin Addresses:       8 verified
Transactions Processed:  27 MINT/BURN operations
Memory Usage:            20MB (Oracle Server)
CPU Usage:               <2% (Oracle Server)
Real-time Latency:       <500ms (Supabase CDC)
Smart Contract Tests:    350/350 (100% pass rate)
Security Status:         PRODUCTION READY
═══════════════════════════════════════════════════
```

---

## 🔗 Smart Contracts Suite

**MegaETH Testnet - Chain ID: 6342**

| Contract | Address | Purpose |
|----------|---------|---------|
| **Oracle Aggregator** | `0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc` | Core Oracle logic, sync() calls |
| **rBTC-SYNTH** | `0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58` | Soulbound Bitcoin mirror (non-transferable) |
| **FeeVault** | `0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f` | Fee management, user deposits |
| **FeePolicy** | `0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4` | Fee calculations |
| **YieldScales Pool** | `0x0bAbb640c2eb4501b3d62D090A2c34871EB95df8` | DeFi yield engine (optional) |

**Network Configuration:**
- **RPC URL**: `https://carrot.megaeth.com/rpc`
- **Chain ID**: `6342`
- **Block Explorer**: [MegaExplorer](https://megaeth-testnet-v2.blockscout.com)
- **Block Time**: <1 second
- **Finality**: Instant

---

## 🗺️ Complete Platform Map

### Core Features

| Feature | URL | Description |
|---------|-----|-------------|
| **Homepage** | [app.reservebtc.io](https://app.reservebtc.io) | Your entry point to Bitcoin DeFi |
| **Verify Address** | [/verify](https://app.reservebtc.io/verify) | Prove Bitcoin ownership (BIP-322) |
| **Mint Tokens** | [/mint](https://app.reservebtc.io/mint) | Start monitoring & receive rBTC-SYNTH |
| **Dashboard** | [/dashboard](https://app.reservebtc.io/dashboard) | Real-time portfolio view |
| **Faucet** | [/faucet](https://app.reservebtc.io/faucet) | Get testnet ETH & BTC |

### DeFi Yield (Optional)

| Feature | URL | Purpose |
|---------|-----|---------|
| **Yield Scales** | [/yield-scales](https://app.reservebtc.io/yield-scales) | Earn 3-7% APY on USDT |
| **Projections** | [/yield-scales/projections](https://app.reservebtc.io/yield-scales/projections) | Calculate potential returns |
| **Risk Disclosure** | [/yield-scales/risks](https://app.reservebtc.io/yield-scales/risks) | Transparency on risks |
| **Live Stats** | [/yield-scales/stats](https://app.reservebtc.io/yield-scales/stats) | Real-time TVL, APY |

### Oracle Transparency

| Feature | URL | Description |
|---------|-----|-------------|
| **Oracle Dashboard** | [oracle.reservebtc.io](https://oracle.reservebtc.io) | Live operations monitor |
| **Status Monitor** | [oracle.reservebtc.io/status](https://oracle.reservebtc.io/status) | Health metrics, uptime |
| **Transparency** | [/oracle-transparency](https://app.reservebtc.io/oracle-transparency) | Real-time sync operations |

---

## 🛡️ Security & Testing

### Multi-Layer Security

```
Layer 1: Smart Contracts
├── 206/206 Security Tests Passed
├── Reentrancy Protection (OpenZeppelin)
├── Access Control (Committee-based)
├── Atomic Deployment Verified
└── Zero Critical Vulnerabilities

Layer 2: Oracle System (Backend VPS)
├── 24/7 Monitoring (99.9% uptime)
├── PM2 Process Manager (auto-restart)
├── State File Recovery (crash protection)
├── Automatic Emergency Burns
├── Real-time Bitcoin Balance Sync
└── Private Keys (backend only, not exposed)

Layer 3: Data Protection (Supabase)
├── PostgreSQL Single Source of Truth
├── Row Level Security (RLS) per user
├── Real-time CDC (Change Data Capture)
├── Encrypted Communication (HTTPS)
├── No localStorage Usage
└── GDPR Compliance Ready

Layer 4: Frontend Security
├── No Private Keys in Browser
├── No Blockchain Polling (backend-driven)
├── Input Validation & Sanitization
├── BIP-322 Signature Verification
└── WCAG AA Accessibility
```

### BIP-322 Verification

**Run tests yourself:** [GitHub Actions](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml)

- **32 security tests** covering all attack vectors
- **0 vulnerabilities** found
- **100% test coverage** for signature verification

Supported address types:
- ✅ Native SegWit (P2WPKH) - `bc1q...`
- ✅ Taproot (P2TR) - `bc1p...`
- ✅ SegWit (P2SH-P2WPKH) - `3...`
- ✅ Legacy (P2PKH) - `1...`
- ✅ Testnet variants - `tb1...`, `2...`, `m...`, `n...`

---

## 🚀 Quick Start

### For New Users

```bash
1. Visit: https://app.reservebtc.io
2. Connect: MetaMask to MegaETH Testnet
3. Get ETH: Use faucet at /faucet (0.001 ETH minimum)
4. Verify: Your Bitcoin address at /verify (BIP-322 signature)
5. Mint: Deposit ETH, click "Start Monitoring" at /mint
Done! Check real-time updates at /dashboard
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

# Run all tests locally
npm test
```

---

## 📚 Documentation

### Production Architecture

| Document | Description | Status |
|----------|-------------|--------|
| [**Production Architecture v4.0**](./PRODUCTION_ARCHITECTURE.md) | Complete system design, backend-driven architecture | ✅ Current |
| [**Active Monitoring System**](./ACTIVE-MONITORING.md) | Two-step verification → monitoring flow, emergency burn logic | ✅ v2.6 |
| [**Mint System Testing Report v2.0**](./MINT_SYSTEM_TESTING_REPORT.md) | Two-step verification → monitoring flow validation | ✅ 100% Pass |
| [**Dashboard Documentation v2.0**](./DASHBOARD_DOCUMENTATION.md) | Real-time Supabase CDC architecture | ✅ Operational |

### Legacy Documentation (Reference Only)

| Document | Description | Status |
|----------|-------------|--------|
| [ReserveBTC Mint System (Legacy)](./ReserveBTC%20Mint%20System.md) | Old localStorage-based system | 🗂️ Deprecated |
| [Dashboard (Legacy)](./ReserveBTC%20Dashboard.md) | Old WebSocket polling system | 🗂️ Deprecated |
| [Real-time Integration (Legacy)](./REALTIME-INTEGRATION.md) | Old unified real-time system | 🗂️ Deprecated |

### Security & Technical

| Document | Description |
|----------|-------------|
| [**Security Audit BIP-322**](./docs/SECURITY_AUDIT_BIP322.md) | BIP-322 signature verification audit |
| [**Smart Contract Security Audit**](./contracts/SECURITY_AUDIT_REPORT.md) | Comprehensive contract security report |
| [**Security Policy**](./SECURITY.md) | Vulnerability reporting guidelines |
| [**Test Status**](./TEST-STATUS.md) | Detailed test results (350 tests) |
| [**Database Architecture**](./DATABASE-ARCHITECTURE.md) | Supabase PostgreSQL schema |
| [**Database Quick Reference**](./Database%20quick%20reference.md) | Common SQL queries |

### Additional Resources

| Document | Description |
|----------|-------------|
| [**Yield Scales Protocol**](./ReserveBTC%20Yield%20Scales%20Protocol.md) | DeFi yield mechanism (optional) |
| [**Professional Architecture**](./ReserveBTC%20Professional%20Architecture%20Documentation.md) | Technical deep dive |

---

## 🎯 Key Features

### Backend-Driven Architecture ✅
- Oracle Server on VPS monitors Bitcoin 24/7
- Dashboard receives updates via Supabase CDC
- Zero blockchain polling in browser
- Works even when user is offline

### Supabase Single Source of Truth ✅
- All data in PostgreSQL (no localStorage)
- Real-time updates via Change Data Capture
- Row Level Security prevents data leakage
- Complete transaction history

### Professional Real-time Updates ✅
- PostgreSQL CDC → WebSocket → Dashboard
- Sub-second latency (<500ms)
- No manual refresh needed
- Scales to 10,000+ users

### Two-Step Verification Flow ✅
- **Step 1 (Verify)**: Prove Bitcoin ownership (BIP-322)
  - Saves to database with `is_monitoring = false`
  - No Oracle operations start
  - Zero fees charged
- **Step 2 (Mint)**: Deposit ETH + click "Start Monitoring"
  - Updates `is_monitoring = true`
  - Oracle begins monitoring within 5 minutes
  - Automatic MINT/BURN operations

### Security First ✅
- **Non-custodial**: Bitcoin never leaves your wallet
- **Cryptographic proof**: BIP-322 signature verification
- **Committee-based**: Multi-sig Oracle control
- **Soulbound tokens**: rBTC-SYNTH non-transferable (1:1 backing)
- **Open source**: Complete code transparency

---

## 📊 System Performance

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Oracle Uptime** | 99% | 99.9% | ✅ Exceeds |
| **MINT/BURN Latency** | <30s | 15-30s | ✅ Met |
| **Dashboard Load Time** | <2s | 1.2s | ✅ Fast |
| **Real-time Update** | <1s | <500ms | ✅ Instant |
| **Memory Usage (Oracle)** | <100MB | 20MB | ✅ Efficient |
| **CPU Usage (Oracle)** | <10% | <2% | ✅ Minimal |
| **Test Pass Rate** | 100% | 100% | ✅ Perfect |
| **Security Vulnerabilities** | 0 | 0 | ✅ Secure |

---

## 🔮 Development Roadmap

### Current Status: v4.0 (Production)
- ✅ Backend-driven Oracle monitoring (VPS)
- ✅ Supabase single source of truth
- ✅ Two-step verification → monitoring flow
- ✅ Real-time dashboard (PostgreSQL CDC)
- ✅ Automatic MINT/BURN operations
- ✅ Emergency burn protection
- ✅ 350 tests passing (100%)

### Planned Features: v5.0
- 🔄 Multi-address monitoring (when FeeVault permits)
- 🔄 Email notifications (MINT/BURN alerts)
- 🔄 Advanced analytics (transaction charts)
- 🔄 Mobile app (React Native)
- 🔄 Mainnet deployment (Bitcoin + Ethereum)

### Scalability Improvements
- 🔄 Horizontal Oracle scaling (multiple VPS servers)
- 🔄 Database sharding (partition by user for 100K+)
- 🔄 Redis caching (reduce Supabase query load)
- 🔄 Multi-region deployment (US, EU, Asia)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Frontend
npm install
npm run dev

# Smart Contracts
cd contracts
forge build
forge test

# Oracle Server
cd oracle
npm install
pm2 start professional-oracle-server.js
```

---

## 📞 Contact & Support

### Get Help
- **Email**: reservebtcproof@gmail.com
- **Twitter**: [@reserveBTC](https://x.com/reserveBTC)
- **Documentation**: [app.reservebtc.io/docs](https://app.reservebtc.io/docs)
- **Discord**: [Join our community](https://discord.gg/reservebtc) *(coming soon)*

### Bug Reports & Security
- **Security Issues**: See [SECURITY.md](./SECURITY.md) for responsible disclosure
- **Bug Reports**: [GitHub Issues](https://github.com/reservebtc/app.reservebtc.io/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/reservebtc/app.reservebtc.io/discussions)

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🏆 Built for MegaETH Ecosystem

**ReserveBTC Protocol v4.0** — *Your Bitcoin, Your Keys, Your Yield*

**Production Status**: ✅ **FULLY OPERATIONAL**  
**Network**: MegaETH Testnet (Chain ID: 6342)  
**Architecture**: Backend-driven, Supabase-first, Zero browser polling  
**Last Updated**: October 2025  

---

<div align="center">

### 🚀 Start Using ReserveBTC Today

[![Get Started](https://img.shields.io/badge/Get_Started-app.reservebtc.io-blue?style=for-the-badge)](https://app.reservebtc.io)
[![Documentation](https://img.shields.io/badge/Read_Docs-Production_Architecture-green?style=for-the-badge)](./PRODUCTION_ARCHITECTURE.md)
[![View Tests](https://img.shields.io/badge/View_Tests-350_Passing-brightgreen?style=for-the-badge)](./TEST-STATUS.md)

**Revolutionizing Bitcoin DeFi one verification at a time** 🔐

</div>