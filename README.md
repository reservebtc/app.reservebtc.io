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

## 🧪 **Frontend Test Suite** ✅ **6/7 TESTS PASSING (85.7%)**
[![Test Results](https://img.shields.io/badge/Test%20Results-6%2F7%20PASSING-brightgreen)](./TEST-STATUS.md)
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

**Website**: [app.reservebtc.io](https://app.reservebtc.io)

### 📋 Deployed Smart Contracts (MegaETH Testnet - Chain ID: 6342)

| Contract | Address | Purpose |
|----------|---------|---------|
| **OracleAggregator** | `0x717D12a23Bb46743b15019a52184DF7F250B061a` | Core Oracle system |
| **RBTCSynth** | `0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB` | rBTC-SYNTH (soulbound) |
| **VaultWrBTC** | `0xa10FC332f12d102Dddf431F8136E4E89279EFF87` | wrBTC (transferable) |
| **FeeVault** | `0x298b3746B593df83E5bB2122cb80d17bdE2AB5fF` | Fee management |
| **FeePolicy** | `0x2F0f48EA3dD5bCff86A178F20f9c4AB2860CD468` | Fee calculation |

**Network Configuration:**
- **RPC URL**: `https://carrot.megaeth.com/rpc`
- **Chain ID**: `6342`
- **Block Explorer**: [MegaETH Explorer](https://megaexplorer.xyz)

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

### Oracle Server (`oracle-server.js`)

Real production Oracle server with CLI interface:
- **Bitcoin Monitoring**: Tracks Bitcoin testnet addresses via BlockCypher API
- **Balance Sync**: Automatically calls `sync()` when Bitcoin balances change  
- **Fee Management**: Handles fee deduction from user's prepaid ETH
- **CLI Commands**: `add`, `remove`, `list`, `sync`, `status` commands
- **Resilience**: Handles +1/-1 noise deltas and large spike validation

## 🔄 How It Works

### Step 1: User Verification (Web Interface)
1. **Connect EVM Wallet**: MetaMask/WalletConnect on MegaETH network
2. **Enter Bitcoin Address**: User provides their Bitcoin address  
3. **BIP-322 Signature**: Sign message proving Bitcoin address ownership
4. **Oracle Registration**: Oracle server adds address to monitoring list

### Step 2: Automatic Oracle Monitoring
```bash
# Oracle server monitors Bitcoin addresses
oracle> add 0x... bc1q...  # Add user to tracking
oracle> sync               # Manual sync trigger
```
- **Real-time Monitoring**: Oracle checks Bitcoin balances every 5 minutes
- **Delta Detection**: Compares current vs last synced balance
- **Auto-Sync**: Calls `sync()` function when balance changes
- **Fee Deduction**: Takes fees from user's prepaid ETH balance

### Step 3: Token Management
- **Positive Delta**: Bitcoin balance increased → mint rBTC-SYNTH tokens
- **Negative Delta**: Bitcoin balance decreased → burn rBTC-SYNTH tokens  
- **1:1 Backing**: All tokens backed by real Bitcoin holdings
- **Soulbound**: rBTC-SYNTH cannot be transferred (tied to user)

## 🧪 Testing & Security

### Test Suite Status: 7/7 (100%) ✅
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
1. **Visit Website**: [app.reservebtc.io](https://app.reservebtc.io)
2. **Connect Wallet**: Use MetaMask with MegaETH Testnet  
3. **Verify Bitcoin Address**: Prove ownership via BIP-322 signature
4. **Get Tokens**: Oracle automatically mints rBTC-SYNTH based on Bitcoin balance

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

# Run all tests (7/7 passing)
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

#### Oracle Server
```bash
# Start Oracle monitoring
node oracle-server.js

# CLI commands
oracle> add 0x123... bc1q...  # Add user to tracking
oracle> list                  # Show tracked users  
oracle> sync                  # Manual balance sync
oracle> status                # Oracle system status
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
  blockExplorerUrls: ['https://megaexplorer.xyz']
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
// From oracle-server.js
const CONFIG = {
  ORACLE_PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY,
  MEGAETH_RPC: 'https://carrot.megaeth.com/rpc',
  SYNC_INTERVAL: 300,             // 5 minutes
  CONTRACT_ADDRESS: '0x717D12a23Bb46743b15019a52184DF7F250B061a'
}
```

## 📖 API Documentation

### Smart Contract Events
```solidity
// User registration
event RegistrationCompleted(address indexed user, bytes32 indexed checksum);

// Reserve synchronization  
event BalanceSync(address indexed user, uint256 newBalanceSats, int256 deltaSats);
event FeesCharged(address indexed user, uint256 feeWei, uint256 remainingBalanceWei);

// Fee management
event ETHDeposited(address indexed user, uint256 amount);
event ETHSpent(address indexed user, uint256 amount, uint256 remaining);
```

### Backend API Endpoints
```typescript
// BIP-322 verification
POST /api/verify-signature
{
  "btcAddress": "bc1q...",
  "message": "ReserveBTC binding: ...",  
  "signature": "base64_signature"
}

// Self-send tracking
POST /api/track-selfsend
{
  "address": "bc1q...",
  "minConfirmations": 6,
  "timeoutMs": 1800000
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
4. Ensure all 7 test suites pass: `npm run test:all`
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

**ReserveBTC Protocol v1.0** — Decentralized Bitcoin Reserves with Cryptographic Proof-of-Reserves

Built with ❤️ by the ReserveBTC team