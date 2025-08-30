# GitHub Actions Workflows — ReserveBTC Protocol

[![CI/CD Pipeline](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/ci.yml)
[![Frontend Test Suite](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml)
[![Smart Contract Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/smart-contract-tests.yml)
[![Security Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml)

This document provides a comprehensive overview of all GitHub Actions workflows configured for the ReserveBTC Protocol repository.

## 📋 Overview

The ReserveBTC Protocol uses **23 automated GitHub Actions workflows** to ensure code quality, security, and reliability across all components:

- **6 Frontend Workflows** — Web application testing and deployment
- **3 Backend Workflows** — Bitcoin provider and API testing  
- **14 Smart Contract Workflows** — Comprehensive Solidity testing

All workflows are automatically triggered on `push` and `pull_request` events to `main` and `develop` branches, with intelligent path filtering to run only relevant tests.

---

## 🚀 Frontend Workflows

### 1. CI/CD Pipeline
**File:** `.github/workflows/ci.yml`  
**Trigger:** `push`/`pull_request` to `main`/`develop`

Complete frontend testing pipeline with matrix strategy:
- **Code Quality Check** — TypeScript + ESLint validation
- **Test Suite Matrix** — Unit, Component, API, Accessibility tests
- **Security Audit** — npm audit + security tests
- **Build Check** — Production build verification

### 2. Frontend Test Suite
**File:** `.github/workflows/frontend-test-suite.yml`  
**Trigger:** `push`/`pull_request` to `main`/`develop`

Comprehensive frontend testing:
- **Build Check** — All test suites with optimized settings
- **Web Interface Check** — TypeScript validation + component verification

---

## 🔧 Backend Workflows

### 1. Backend — Bitcoin Provider Integration Tests
**File:** `.github/workflows/backend-bitcoin-provider-tests.yml`  
**Trigger:** Changes to `backend/bitcoin-provider/**`

Integration testing for Bitcoin blockchain interaction:
- BIP-322 signature verification
- Self-send transaction detection
- Bitcoin RPC communication

### 2. Backend — Bitcoin Provider CI
**File:** `.github/workflows/backend-bitcoin-provider-ci.yml`  
**Trigger:** Changes to `backend/bitcoin-provider/**`

Continuous integration for Bitcoin provider:
- Build verification with TypeScript
- Vitest test runner
- Environment configuration validation

### 3. Backend — Bitcoin Provider Unit Tests  
**File:** `.github/workflows/backend-bitcoin-provider-unit.yml`  
**Trigger:** Changes to `backend/bitcoin-provider/**`

Unit testing for Bitcoin provider modules:
- Address validation functions
- Cryptographic operations
- RPC client methods

---

## ⛓️ Smart Contract Workflows

### Core Protocol Tests

#### 1. E2E Tests — ReserveBTC v0.1
**File:** `.github/workflows/e2e-tests.yml`  
**Path:** `**/E2E_*.t.sol`

End-to-end testing of complete user journeys:
- User registration and prepayment flow
- Reserve synchronization with oracle committee
- rBTC minting and burning operations

#### 2. E2E Oracle Resilience — ReserveBTC v0.1
**File:** `.github/workflows/e2e-oracle-resilience.yml`  
**Path:** `**/Oracle_Resilience_*.t.sol`

Oracle system stress testing:
- Price spike handling and capping
- Committee consensus edge cases
- Network partition recovery

#### 3. Security Canary — ReserveBTC v0.1
**File:** `.github/workflows/security-canary-tests.yml`  
**Path:** `**/Security_Canary_*.t.sol`

Critical security monitoring:
- State corruption detection
- Invariant violation alerts
- Production deployment safety checks

### Oracle System Tests

#### 4. Oracle Tests
**File:** `.github/workflows/oracle.yml`  
**Path:** `**/Oracle_*.t.sol`

Core oracle functionality:
- Committee signature verification
- Price feed aggregation
- Consensus mechanism validation

#### 5. Oracle (All Unit)
**File:** `.github/workflows/oracle-all.yml`  
**Path:** `**/Oracle_All_Unit.t.sol`

Comprehensive oracle unit tests:
- All oracle functions tested in isolation
- Edge case handling
- Error condition validation

#### 6. Oracle Gas Report
**File:** `.github/workflows/oracle-gas.yml`  
**Command:** `forge snapshot --match-path "**/Oracle_*.t.sol"`

Gas optimization analysis:
- Function-level gas usage tracking
- Optimization opportunity identification
- Performance regression detection

#### 7. Oracle (Boundary & Fuzz)
**File:** `.github/workflows/oracle-boundary-fuzz.yml`  
**Path:** `**/Oracle_Bounds_*.t.sol`, `**/Oracle_BoundaryFuzz_*.t.sol`

Boundary and fuzz testing:
- Maximum value handling
- Random input validation
- Overflow/underflow protection

#### 8. Oracle (Boundary + Fuzz + Gas)
**File:** `.github/workflows/oracle-boundary.yml`  
**Path:** `**/Oracle_BoundaryFuzz_*.t.sol`

Combined boundary, fuzz, and gas analysis:
- Performance under extreme conditions
- Gas usage under stress
- Optimization validation

#### 9. Oracle (Negative Delta)
**File:** `.github/workflows/oracle-negative-delta.yml`  
**Path:** `**/Oracle_NegativeDelta_*.t.sol`

Negative balance change handling:
- Bitcoin withdrawal processing
- Fee calculation for negative deltas
- rBTC burning mechanics

### Token System Tests

#### 10. RBTCSynth Tests
**File:** `.github/workflows/rbtcsynth-tests.yml`  
**Path:** `**/RBTCSynth_Core_*.t.sol`

Soulbound rBTC token testing:
- Mint/burn functionality
- Transfer restrictions (soulbound)
- Oracle-only access control

#### 11. VaultWrBTC ERC20+Redeem+Slash+Reentrancy
**File:** `.github/workflows/vaultwrbtc-erc20.yml`  
**Path:** `**/VaultWrBTC_ERC20_*.t.sol`

Wrapped rBTC token testing:
- Standard ERC-20 functionality
- Redeem mechanisms
- Slashing protection
- Reentrancy attack prevention

### Fee System Tests

#### 12. FeeVault (Edges Unit)
**File:** `.github/workflows/vault-edges.yml`  
**Path:** `**/FeeVault_Edges_*.t.sol`

Fee vault edge case testing:
- Maximum deposit/withdrawal limits
- Zero-value transaction handling
- Insufficient balance scenarios

#### 13. FeeVault (Conservation Invariant)
**File:** `.github/workflows/vault-conservation.yml`  
**Path:** `**/FeeVault_Conservation_*.t.sol`

Fee conservation verification:
- Total ETH conservation across operations
- Fee accounting accuracy
- Balance consistency checks

---

## 🔍 Workflow Configuration

### Automatic Triggers
All workflows automatically run on:
```yaml
on:
  push:
    branches: [ main, develop ]
    paths:
      - 'relevant/path/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'relevant/path/**'
  workflow_dispatch:  # Manual trigger
```

### Path Filtering
Intelligent path filtering ensures workflows only run when relevant files change:
- **Frontend workflows** → Root directory changes
- **Backend workflows** → `backend/bitcoin-provider/**` changes
- **Contract workflows** → `contracts/**` changes
- **Workflow files** → `.github/workflows/*.yml` changes

### Environment Configuration
All workflows use optimized environment settings:
- **Node.js Version:** 22.14.0 (pinned for consistency)
- **Foundry:** Latest nightly build
- **Timeout Settings:** 30s tests, 120s CI environment
- **Memory Allocation:** 4GB for complex operations
- **Worker Limits:** 2 workers in CI for stability

---

## 📊 Workflow Status Dashboard

### Current Status (All 23 Workflows)
- ✅ **Frontend Workflows** — 2/2 PASSING
- ✅ **Backend Workflows** — 3/3 PASSING  
- ✅ **Smart Contract Workflows** — 14/14 PASSING
- ✅ **Security Tests** — ALL PASSING
- ✅ **Performance Tests** — OPTIMIZED

### Badge Integration
All workflows are integrated with GitHub badge system for real-time status display in README.md:

```markdown
[![CI/CD Pipeline](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/ci.yml/badge.svg)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/ci.yml)
```

### Monitoring & Alerts
- **Failure Notifications** — Immediate GitHub notifications
- **Performance Monitoring** — Gas usage tracking
- **Security Alerts** — Automated security audit reporting
- **Dependency Updates** — Dependabot integration

---

## 🛠️ Maintenance & Updates

### Adding New Workflows
1. Create workflow file in `.github/workflows/`
2. Configure appropriate triggers and path filters
3. Add environment optimization settings
4. Update this documentation
5. Add status badge to README.md

### Debugging Workflow Issues
1. Check workflow logs in GitHub Actions tab
2. Verify environment configuration
3. Test locally with same Node.js/Foundry versions
4. Review path filtering logic
5. Check timeout and memory settings

### Performance Optimization
- Use matrix strategies for parallel testing
- Implement intelligent caching
- Configure appropriate timeout values
- Optimize path filtering to reduce unnecessary runs
- Monitor gas usage and optimize contract code

---

## 🔗 Related Documentation

- **[Smart Contract Tests](../contracts/test/)** — Detailed test documentation
- **[Backend API Tests](../backend/bitcoin-provider/README_Test_Summary_BitcoinProvider.md)** — Backend test summary
- **[Security Audit Report](../contracts/SECURITY_AUDIT_REPORT.md)** — Security analysis results
- **[Protocol Documentation](./PROTOCOL_V1.md)** — Complete protocol specification

---

**Last Updated:** 2025-08-30  
**Total Workflows:** 23  
**Test Coverage:** 206 smart contract tests + 45 backend tests + 7 frontend test suites  
**Security Status:** 🟢 PRODUCTION READY