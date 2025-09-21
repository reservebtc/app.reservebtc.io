# ReserveBTC Protocol — Decentralized Bitcoin Reserves with Proof-of-Reserves

[![Frontend Test Suite](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![Smart Contract Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml)
[![Bitcoin Provider](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bitcoin-provider-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bitcoin-provider-tests.yml)
[![Security Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml)
[![Coverage & Performance](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml)
[![Oracle Tests](https://img.shields.io/badge/Oracle%20Tests-ALL%20PASSING-brightgreen)](./contracts/test/README-Oracle-Tests.md)
[![Oracle (All Unit)](https://img.shields.io/badge/Oracle%20%28All%20Unit%29-PASSING-brightgreen)](./contracts/test/Oracle_All_Unit.t.sol)
[![Oracle Gas Report](https://img.shields.io/badge/Oracle%20Gas%20Report-OPTIMIZED-brightgreen)](./contracts/.gas-snapshot)
[![Oracle Boundary Fuzz](https://img.shields.io/badge/Oracle%20Boundary%20Fuzz-PASSING-brightgreen)](./contracts/test/Oracle_BoundaryFuzz_Invariants.t.sol)
[![Oracle Resilience](https://img.shields.io/badge/Oracle%20Resilience-PASSING-brightgreen)](./contracts/test/Oracle_Resilience_Unit.t.sol)
[![Oracle Negative Delta](https://img.shields.io/badge/Oracle%20Negative%20Delta-NO%20FEE%20POLICY-brightgreen)](./contracts/test/Oracle_NegativeDelta_NoFee_Unit.t.sol)
[![Oracle Test Summary](https://img.shields.io/badge/Oracle%20Summary-COMPLETE-brightgreen)](./contracts/test/README-Oracle-Tests.md)
[![RBTCSynth Tests](https://img.shields.io/badge/RBTCSynth%20Tests-SOULBOUND%20VERIFIED-brightgreen)](./contracts/test/RBTCSynth_Core_Soulbound_Unit.t.sol)
[![RBTS Summary](https://img.shields.io/badge/RBTS%20Summary-COMPLETE-brightgreen)](./contracts/test/README-RBTCSynth-Tests.md)
[![FeeVault (Edges Unit)](https://img.shields.io/badge/FeeVault%20Edges-PASSING-brightgreen)](./contracts/test/FeeVault_Edges_Unit.t.sol)
[![FeeVault Conservation](https://img.shields.io/badge/FeeVault%20Conservation-INVARIANT%20VERIFIED-brightgreen)](./contracts/test/FeeVault_Conservation_Invariant.t.sol)
[![VaultWrBTC ERC20](https://img.shields.io/badge/VaultWrBTC%20ERC20-REENTRANCY%20SAFE-brightgreen)](./contracts/test/VaultWrBTC_ERC20_Unit.t.sol)
[![FeeVault Test Summary](https://img.shields.io/badge/FeeVault%20Summary-31%2F31%20PASSING-brightgreen)](./contracts/test/README-FeeVault-Tests.md)
[![VaultWrBTC Test Summary](https://img.shields.io/badge/VaultWrBTC%20Summary-COMPLETE-brightgreen)](./contracts/test/README-VaultWrBTC-Tests.md)
[![FeePolicy Edges](https://img.shields.io/badge/FeePolicy%20Edges-NO%20OVERFLOW-brightgreen)](./contracts/test/FeePolicy_Edges_Unit.t.sol)
[![FeePolicy Edges Tests](https://img.shields.io/badge/FeePolicy%20Tests-31%2F31%20PASSING-brightgreen)](./contracts/test/FeePolicy_Comprehensive_Security.t.sol)
[![FeePolicy Summary](https://img.shields.io/badge/FeePolicy%20Summary-COMPLETE-brightgreen)](./contracts/test/README–FeePolicy–Edges.md)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-ReserveBTC%20v0.1-brightgreen)](./contracts/test/README_Test_Summary_E2E.md)
[![E2E Oracle Resilience](https://img.shields.io/badge/E2E%20Oracle%20Resilience-SPIKE%20CAPPED-brightgreen)](./contracts/test/Oracle_Resilience_Unit.t.sol)
[![E2E Summary](https://img.shields.io/badge/E2E%20Summary-COMPLETE-brightgreen)](./contracts/test/README_Test_Summary_E2E.md)
[![Security Canary](https://img.shields.io/badge/Security%20Canary-NO%20CORRUPTION-brightgreen)](./contracts/test/Security_Canary_OracleAndVault.t.sol)
[![Security Canary Summary](https://img.shields.io/badge/Security%20Summary-PRODUCTION%20READY-brightgreen)](./contracts/test/README_Test_Summary_SecurityCanary.md)
[![Bitcoin Provider Integration](https://img.shields.io/badge/Bitcoin%20Provider-INTEGRATION%20TESTED-brightgreen)](./backend/bitcoin-provider/test/bitcoin-provider.int.test.ts)
[![Bitcoin Provider CI](https://img.shields.io/badge/Bitcoin%20Provider%20CI-VITEST%20PASSING-brightgreen)](./backend/bitcoin-provider/vitest.config.ts)
[![Bitcoin Provider Unit](https://img.shields.io/badge/Bitcoin%20Provider%20Unit-BIP322%20VERIFIED-brightgreen)](./backend/bitcoin-provider/test/unit/)
[![Bitcoin Provider Summary](https://img.shields.io/badge/Bitcoin%20Provider%20Summary-COMPLETE-brightgreen)](./backend/bitcoin-provider/README_Test_Summary_BitcoinProvider.md)

## 🧪 **Frontend Test Suite** ✅ **67/67 TESTS PASSING (100%)**
[![Test Results](https://img.shields.io/badge/Test%20Results-67%2F67%20PASSING-brightgreen)](./TEST-STATUS.md)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-39%20Tests%20PASS-brightgreen)](./lib/__tests__/bitcoin-validation.test.ts)
[![Validation Tests](https://img.shields.io/badge/Validation%20Tests-18%20Tests%20PASS-brightgreen)](./lib/__tests__/validation-schemas.test.ts)
[![Component Tests](https://img.shields.io/badge/Component%20Tests-6%20Tests%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![API Tests](https://img.shields.io/badge/API%20Tests-6%20Tests%20PASS-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)  
[![Security Audit](https://img.shields.io/badge/Security%20Audit-0%20Vulnerabilities-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20Ready-brightgreen)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![Web Interface](https://img.shields.io/badge/Web%20Interface-Production%20Ready-brightgreen)](./app/)
[![GitHub Workflows](https://img.shields.io/badge/GitHub%20Workflows-23%20Files%20Ready-brightgreen)](./docs/github-workflows.md)

## 🛡️ **Comprehensive Security Test Suite** ✅ **ALL TESTS PASSING**
[![Comprehensive Security Tests](https://img.shields.io/badge/Comprehensive%20Security%20Tests-206%2F206%20PASSING-brightgreen)](./contracts/test/README_Comprehensive_Security_Tests.md)
[![Security Audit Report](https://img.shields.io/badge/Security%20Audit-HIGH%20RATING-success)](./contracts/SECURITY_AUDIT_REPORT.md)
[![FeeVault Comprehensive Security](https://img.shields.io/badge/FeeVault%20Comprehensive-31%20Tests%20PASS-brightgreen)](./contracts/test/FeeVault_Comprehensive_Security.t.sol)
[![OracleAggregator Comprehensive Security](https://img.shields.io/badge/OracleAggregator%20Comprehensive-27%20Tests%20PASS-brightgreen)](./contracts/test/OracleAggregator_Comprehensive_Security.t.sol)
[![FeePolicy Comprehensive Security](https://img.shields.io/badge/FeePolicy%20Comprehensive-31%20Tests%20PASS-brightgreen)](./contracts/test/FeePolicy_Comprehensive_Security.t.sol)
[![BIP-322 Verification Module](https://img.shields.io/badge/BIP--322%20Module-IMPLEMENTED-success)](./backend/bitcoin-provider/src/bip322-verify.ts)
[![Self-Send Detector Module](https://img.shields.io/badge/SelfSend%20Module-IMPLEMENTED-success)](./backend/bitcoin-provider/src/selfsend-detector.ts)

## 🚀 Live Deployment - MegaETH Testnet

**Main Website**: [app.reservebtc.io](https://app.reservebtc.io)  
**Oracle Dashboard**: [oracle.reservebtc.io](https://oracle.reservebtc.io)

### 🌐 Live Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| **Main App** | [app.reservebtc.io](https://app.reservebtc.io) | Landing page with protocol overview |
| **Dashboard** | [app.reservebtc.io/dashboard](https://app.reservebtc.io/dashboard) | User portfolio with rBTC/wrBTC balances & transaction history |
| **Mint rBTC** | [app.reservebtc.io/mint](https://app.reservebtc.io/mint) | BIP-322 verification & token minting interface |
| **Faucet** | [app.reservebtc.io/faucet](https://app.reservebtc.io/faucet) | MegaETH testnet ETH faucet & Bitcoin testnet resources |
| **Oracle Management** | [app.reservebtc.io/oracle](https://app.reservebtc.io/oracle) | Oracle status monitoring & manual sync interface |
| **Documentation** | [app.reservebtc.io/docs](https://app.reservebtc.io/docs) | Complete protocol documentation & API reference |

### 📋 Deployed Smart Contracts (MegaETH Testnet - Chain ID: 6342)

| Contract | Address | Purpose |
|----------|---------|---------|
| **OracleAggregator** | `0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc` | Core Oracle system |
| **RBTCSynth** | `0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58` | rBTC-SYNTH (soulbound) |
| **VaultWrBTC** | `0xa10FC332f12d102Dddf431F8136E4E89279EFF87` | wrBTC (transferable) |
| **FeeVault** | `0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f` | Fee management |
| **FeePolicy** | `0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4` | Fee calculation |

**Network Configuration:**
- **RPC URL**: `https://carrot.megaeth.com/rpc`
- **Chain ID**: `6342`
- **Block Explorer**: [MegaExplorer](https://www.megaexplorer.xyz)

## 🌟 Overview

ReserveBTC is the first Bitcoin-backed synthetic asset protocol built on MegaETH, enabling users to mint synthetic Bitcoin tokens (rBTC-SYNTH and wrBTC) that are fully backed by real Bitcoin holdings verified through BIP-322 signatures.

### Key Features

- **🔐 Oracle-Based Architecture**: Automated balance synchronization between Bitcoin and MegaETH
- **₿ BIP-322 Verification**: Cryptographic proof of Bitcoin ownership without custody transfer
- **⚡ MegaETH Integration**: Ultra-fast transactions with institutional-grade performance
- **🔒 Self-Custody**: Users maintain full control of their Bitcoin while participating in DeFi
- **🛡️ Security First**: Comprehensive testing with E2E, security canary, and resilience tests
- **📱 Complete dApp**: Modern responsive web interface with comprehensive documentation

## 📋 Protocol Architecture

### Oracle-Based System

ReserveBTC uses an innovative Oracle-based architecture where token minting/burning is **automatically managed** by monitoring Bitcoin address balances, not through direct user calls.

**How It Works:**
1. **User Verification**: Users prove Bitcoin ownership via BIP-322 signatures through web interface
2. **Oracle Monitoring**: Automated Oracle server monitors Bitcoin addresses via BlockCypher API  
3. **Balance Sync**: Oracle detects Bitcoin balance changes and calls `sync()` function
4. **Automatic Tokens**: rBTC-SYNTH tokens automatically minted/burned based on Bitcoin balance

### Smart Contract Components

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| **OracleAggregator** | Core Oracle system | `sync()`, `lastSats()`, `committee()` |
| **RBTCSynth** | Soulbound rBTC tokens | `oracleMint()`, `oracleBurn()` (Oracle-only) |
| **VaultWrBTC** | Transferable wrBTC | Standard ERC-20 backed by rBTC-SYNTH |
| **FeeVault** | Fee management | `depositETH()`, `balances()` |
| **FeePolicy** | Fee calculation | `quoteFees()`, `pctBps()`, `weiPerSat()` |

### Oracle Infrastructure

#### Live Oracle Server
- **Production URL**: [oracle.reservebtc.io](https://oracle.reservebtc.io)
- **Real-time Monitoring**: Active 24/7 Bitcoin address tracking
- **Dashboard**: Live activity monitoring with performance metrics
- **Committee Address**: `0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b`

#### Oracle Features
- **Bitcoin Monitoring**: Tracks Bitcoin testnet addresses via multiple APIs
- **Automatic Sync**: Calls `sync()` when Bitcoin balances change  
- **Fee Management**: Handles fee deduction from user's prepaid ETH
- **Real-time Dashboard**: Live monitoring of Oracle operations and health
- **Resilience**: Handles +1/-1 noise deltas and large spike validation
- **Performance Tracking**: Uptime monitoring, response time metrics, alert system

## 🔄 How It Works

### Step 1: User Verification ([Mint Page](https://app.reservebtc.io/mint))
1. **Connect EVM Wallet**: MetaMask/WalletConnect on MegaETH network
2. **Deposit ETH**: Add funds to Fee Vault for Oracle operations
3. **Enter Bitcoin Address**: User provides their Bitcoin testnet address  
4. **BIP-322 Signature**: Sign message proving Bitcoin address ownership
5. **Oracle Registration**: [Oracle server](https://oracle.reservebtc.io) adds address to monitoring

### Step 2: Live Oracle Monitoring ([Oracle Dashboard](https://oracle.reservebtc.io))
- **24/7 Bitcoin Tracking**: Oracle monitors registered Bitcoin addresses
- **Real-time Dashboard**: Live activity feed and performance metrics
- **Balance Detection**: Detects Bitcoin balance changes automatically
- **Smart Sync**: Calls `sync()` function when balances change
- **Fee Management**: Deducts fees from user's prepaid ETH balance

### Step 3: Token Management ([Dashboard](https://app.reservebtc.io/dashboard))
- **Positive Delta**: Bitcoin balance increased → mint rBTC-SYNTH tokens
- **Negative Delta**: Bitcoin balance decreased → burn rBTC-SYNTH tokens  
- **1:1 Backing**: All tokens backed by real Bitcoin holdings
- **Soulbound**: rBTC-SYNTH cannot be transferred (tied to user)
- **Portfolio View**: Real-time balance tracking and transaction history
- **wrBTC Wrapping**: Convert rBTC-SYNTH to transferable wrBTC tokens

### Step 4: Get Testnet Funds ([Faucet Page](https://app.reservebtc.io/faucet))
- **MegaETH ETH**: Get testnet ETH for gas fees and Oracle deposits
- **Bitcoin Testnet**: Links to reliable Bitcoin testnet faucets
- **Developer Resources**: API documentation and integration guides

## 🧪 Testing & Security

### Test Suite Status: 67/67 (100%) ✅
- **Unit Tests**: 39 tests - Bitcoin validation, schemas, utilities
- **Component Tests**: 6 tests - React components, UI interactions  
- **API Tests**: 6 tests - Verification endpoints, minting routes
- **Security Tests**: All passing - Access control, edge cases
- **Accessibility Tests**: WCAG compliance verified

### Smart Contract Security
- **E2E Integration Tests**: Complete user flow validation
- **Security Canary Tests**: Self-destruct resilience, zero-address protection
- **Oracle Resilience Tests**: Stress testing with noise deltas and spikes  
- **Multi-user Invariants**: Balance consistency across multiple users
- **Fee Cap Enforcement**: Protection against excessive fees

## 📁 Repository Structure

```
app.reservebtc.io/
├── 📋 Smart Contracts
│   ├── contracts/src/              # Solidity contracts
│   │   ├── OracleAggregator.sol    # Core Oracle system  
│   │   ├── RBTCSynth.sol           # Soulbound rBTC tokens
│   │   ├── VaultWrBTC.sol          # Transferable wrBTC tokens
│   │   ├── FeeVault.sol            # ETH fee management
│   │   └── FeePolicy.sol           # Fee calculation
│   └── contracts/test/             # E2E, security, resilience tests
├── 🔮 Oracle Infrastructure  
│   ├── oracle-server.js            # Production Oracle with CLI
│   └── oracle-users.json           # Tracked users database
├── 🌐 Web Application (Next.js 14)
│   ├── app/                        # App router pages
│   │   ├── docs/                   # Complete documentation
│   │   ├── oracle/                 # Oracle management UI
│   │   ├── api/                    # API endpoints 
│   │   └── page.tsx                # Landing page
│   ├── components/                 # React components
│   │   ├── mint/                   # Token minting UI
│   │   ├── verification/           # BIP-322 verification
│   │   ├── wallet/                 # Wallet connection
│   │   └── widgets/                # Statistics widgets
│   └── lib/                        # Utilities & configurations
├── 🧪 Testing & CI/CD
│   ├── __tests__/                  # Frontend tests
│   ├── .github/workflows/          # GitHub Actions CI/CD  
│   ├── CI-CD-README.md            # Testing documentation
│   └── scripts/test-ci-locally.sh  # Local CI reproduction
└── 📚 Documentation
    ├── README.md                   # This file
    └── docs/                       # Additional documentation
```

## 🚀 Quick Start

### For Users
1. **Get Testnet Funds**: Visit [Faucet](https://app.reservebtc.io/faucet) for MegaETH ETH and Bitcoin testnet coins
2. **Connect Wallet**: Use MetaMask with MegaETH Testnet on [main app](https://app.reservebtc.io)
3. **Mint rBTC**: Go to [Mint page](https://app.reservebtc.io/mint) and verify Bitcoin address via BIP-322
4. **Monitor Portfolio**: Check [Dashboard](https://app.reservebtc.io/dashboard) for balances and transaction history
5. **Oracle Status**: View [Oracle Dashboard](https://oracle.reservebtc.io) for real-time monitoring

### For Developers

#### Prerequisites
- Node.js 22+ (locked in `.nvmrc`)
- npm 10+ (locked in `package.json`)

#### Installation & Testing
```bash
# Clone and install
git clone https://github.com/reservebtc/app.reservebtc.io.git
cd app.reservebtc.io
npm install

# Run all tests (67/67 passing)
npm run test:all

# Individual test suites  
npm run test:unit          # 39 unit tests
npm run test:components    # 6 component tests
npm run test:api           # 6 API tests
npm run test:accessibility # WCAG tests
npm run test:security      # Security audit

# Development server
npm run dev                # http://localhost:3000
npm run build              # Production build
npm run type-check         # TypeScript validation
```

#### Oracle Server (Production Running)
```bash
# Live Oracle Dashboard (24/7 active)
https://oracle.reservebtc.io

# Oracle monitoring dashboard (local development)
node monitoring/oracle-dashboard.js

# View tracked users
cat oracle-users.json

# Check Oracle status via web interface
# Visit: https://app.reservebtc.io/oracle
```

## ⚙️ Configuration

### MegaETH Network Setup
```javascript
// Add MegaETH Testnet to MetaMask
const megaethTestnet = {
  chainId: '0x18C6',  // 6342 in hex
  chainName: 'MegaETH Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH', 
    decimals: 18
  },
  rpcUrls: ['https://carrot.megaeth.com/rpc'],
  blockExplorerUrls: ['https://www.megaexplorer.xyz']
}
```

### Fee Configuration (Current Testnet)
```javascript
// From contracts.ts
export const FEE_CONFIG = {
  PCT_BPS: 10,                    // 0.1% fee in basis points
  FIXED_WEI: 0,                   // No fixed fee
  WEI_PER_SAT: 1_000_000_000,     // 1 gwei per satoshi
  MIN_CONFIRMATIONS: 1,           // Testnet: faster confirmations
  MAX_FEE_PER_SYNC: '0.01'        // 0.01 ETH max fee cap
}
```

### Oracle Configuration
```javascript
// Live Oracle Server Configuration
const CONFIG = {
  oracleUrl: 'https://oracle.reservebtc.io',
  oracleContract: '0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc',
  committeeAddress: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
  feeVault: '0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f',
  refreshInterval: 10000,         // 10 seconds monitoring
  alertThresholds: {
    maxResponseTime: 5000,        // 5 seconds
    minUptime: 95,               // 95%
    maxFailedSyncs: 3
  }
}
```

## 📖 API Documentation

### Smart Contract Events
```solidity
// User registration
event RegistrationCompleted(address indexed user, bytes32 indexed checksum);

// Reserve synchronization  
event Synced(address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp);

// Token operations
event Transfer(address indexed from, address indexed to, uint256 value);
event Mint(address indexed to, uint256 value);
event Burn(address indexed from, uint256 value);

// Fee management
event Deposited(address indexed user, uint256 amount);
event Spent(address indexed user, uint256 amount, address indexed spender);
```

### Backend API Endpoints
```typescript
// BIP-322 verification
POST /api/verify-wallet
{
  "btcAddress": "bc1q...",
  "message": "ReserveBTC binding: ...",  
  "signature": "base64_signature"
}

// Mint rBTC tokens
POST /api/mint-rbtc
{
  "bitcoinAddress": "bc1q...",
  "ethereumAddress": "0x...",
  "amountSatoshis": 100000000
}
```

## 🛡️ Security Considerations

### Smart Contract Security
- **Reentrancy Protection**: All state-changing functions use OpenZeppelin's `nonReentrant` modifier
- **Access Control**: Committee-based multisig for oracle operations
- **Integer Overflow**: SafeMath patterns and Solidity 0.8+ built-in protection
- **CEI Pattern**: Checks-Effects-Interactions order enforced throughout
- **Gas Limits**: Optimized for reasonable gas costs across all functions

### Bitcoin Integration Security
- **BIP-322 Compliance**: Full specification implementation with edge case handling
- **Address Validation**: Comprehensive bech32 and legacy address format support
- **Signature Verification**: Cryptographic validation of Bitcoin message signatures
- **Transaction Monitoring**: Real-time mempool watching with confirmation tracking
- **Amount Validation**: Sensible limits on self-send amounts (600-2000 sats)

## 🔍 Monitoring & Analytics

### On-Chain Metrics
- Total rBTC Supply vs. Bitcoin Reserves
- Fee Collection and Distribution
- User Registration and Activity
- Oracle Committee Performance
- Gas Usage and Optimization

### Bitcoin Network Metrics
- Reserve Wallet Balances
- Transaction Confirmation Times
- Network Fee Estimates
- Mempool Status and Congestion

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Write comprehensive tests for new functionality
4. Ensure all 67 test suites pass: `npm run test:all`
5. Run TypeScript validation: `npm run type-check`
6. Submit pull request with detailed description

### Testing Standards
- All new smart contract features require comprehensive security tests
- Frontend modules need unit tests with component testing
- E2E tests for complete user journeys
- Oracle resilience testing for balance sync operations
- Integration tests for cross-component interactions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [app.reservebtc.io](https://app.reservebtc.io)
- **Documentation**: [Complete Documentation](https://app.reservebtc.io/docs)
- **Testing Guide**: [CI-CD-README.md](CI-CD-README.md)
- **Smart Contract Tests**: [E2E Test Summary](./contracts/test/README_Test_Summary_E2E.md)
- **Security Tests**: [Security Canary Report](./contracts/test/README_Test_Summary_SecurityCanary.md)

---

## License
This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details. 

---

**ReserveBTC Protocol v1.0** — Decentralized Bitcoin Reserves with Cryptographic Proof-of-Reserves

Built with ❤️ by the ReserveBTC team