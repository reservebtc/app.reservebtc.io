# 🚀 ReserveBTC Atomic Deployment Guide

## 📋 Overview

This document describes a successfully tested method for atomic deployment of all three main ReserveBTC contracts with correct cross-references. Used to fix the `0x1bc2178f (NotOracle)` error in MegaETH testnet and ready for Mainnet deployment.

## 🎯 Problem Solved by Atomic Deployment

**Problem:** Circular dependencies between contracts:
- `FeeVault` needs `OracleAggregator` address in constructor
- `OracleAggregator` needs `FeeVault` and `RBTCSynth` addresses in constructor  
- `RBTCSynth` needs `OracleAggregator` address in constructor

**Result without atomic deployment:** Contracts reference incorrect addresses, leading to `NotOracle()` errors when Oracle Aggregator tries to call `spendFrom()` on FeeVault.

## ✅ Solution: Atomic Deployment with Address Prediction

### How it Works

1. **Address Prediction:** Use `CREATE` formula to calculate future contract addresses based on deployer nonce
2. **Sequential Deployment:** Deploy contracts in correct order using predicted addresses
3. **Verification:** Check that predictions matched actual addresses

### Script: AtomicDeployFixed.s.sol

```solidity
// STEP 1: Predict addresses of all three contracts
uint64 nonce = vm.getNonce(deployer);
address predictedFeeVault = computeCreateAddress(deployer, nonce);
address predictedOracleAgg = computeCreateAddress(deployer, nonce + 1);
address predictedRBTCSynth = computeCreateAddress(deployer, nonce + 2);

// STEP 2: Deploy FeeVault with predicted Oracle address
FeeVault feeVault = new FeeVault(
    predictedOracleAgg,    // oracle = predicted Oracle Aggregator
    payable(feeCollector)  // feeCollector = fee recipient address
);

// STEP 3: Deploy OracleAggregator with actual FeeVault and predicted RBTCSynth
OracleAggregator oracle = new OracleAggregator(
    predictedRBTCSynth,    // predicted synth address
    address(feeVault),     // actual feeVault address
    FEE_POLICY,           // existing working feePolicy
    committee,            // committee (deployer)
    MIN_CONFIRMATIONS,    // minConf
    MAX_FEE_PER_SYNC      // maxFeePerSync
);

// STEP 4: Deploy RBTCSynth with actual Oracle address
RBTCSynth rbtcSynth = new RBTCSynth(address(oracle));
```

## 🔧 Step-by-Step Instructions for Mainnet

### 1. Preparation

```bash
# Ensure forge is installed and configured
forge --version

# Prepare deployer private key (securely!)
export PRIVATE_KEY="your_mainnet_private_key_here"

# Configure RPC URL for Mainnet
export RPC_URL="https://mainnet.infura.io/v3/your_key"
# or
export RPC_URL="https://eth-mainnet.alchemyapi.io/v2/your_key"
```

### 2. Update Configuration for Mainnet

Update `contracts/script/AtomicDeployFixed.s.sol`:

```solidity
// Mainnet Configuration
uint256 constant CHAIN_ID = 1; // Ethereum Mainnet

// Use existing FeePolicy or deploy new one
address constant FEE_POLICY = 0x...; // Mainnet FeePolicy address

// Mainnet parameters
uint256 constant MIN_CONFIRMATIONS = 6; // More confirmations for security
uint256 constant MAX_FEE_PER_SYNC = 0.01 ether; // Reasonable fee limit
```

### 3. Execute Deployment

```bash
# Deploy to Mainnet (WITHOUT --broadcast for dry run)
forge script contracts/script/AtomicDeployFixed.s.sol:AtomicDeployFixed \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# If everything looks correct, execute real deployment
forge script contracts/script/AtomicDeployFixed.s.sol:AtomicDeployFixed \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 4. Result Verification

After deployment, verify:

```bash
# Run verification test (update addresses)
node test-complete-atomic-system.js
```

Expected result:
```
✅ FeeVault → Oracle:        OK
✅ Oracle → Synth:           OK  
✅ Oracle → FeeVault:        OK
✅ Oracle → FeePolicy:       OK
✅ Synth → Oracle:           OK
```

## 📊 Test Deployment Results in MegaETH

### Deployed Addresses (MegaETH Testnet):
- **FeeVault:** `0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f`
- **OracleAggregator:** `0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc`  
- **RBTCSynth:** `0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58`
- **FeePolicy:** `0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4` (reused)

### Verification Successful:
- ✅ All address predictions matched actual addresses
- ✅ All cross-references are correct
- ✅ Oracle Aggregator can call `spendFrom()` on FeeVault
- ✅ Error `0x1bc2178f (NotOracle)` fixed
- ✅ System ready for automatic RBTC token mining

## 🔄 System Update After Deployment

### 1. Update Oracle Server
```bash
# Update Oracle server configuration with new addresses
ssh user@oracle-server "sed -i 's/OLD_ORACLE_ADDRESS/NEW_ORACLE_ADDRESS/g' oracle-server.js"
ssh user@oracle-server "pm2 restart oracle-server"
```

### 2. Update Frontend
```typescript
// app/lib/contracts.ts
export const CONTRACTS = {
  CHAIN_ID: 1, // Mainnet
  FEE_VAULT: '0x...', // New FeeVault
  ORACLE_AGGREGATOR: '0x...', // New Oracle Aggregator
  RBTC_SYNTH: '0x...', // New RBTCSynth
  FEE_POLICY: '0x...', // FeePolicy (may be reused)
}
```

### 3. Update Documentation
- Update addresses in all docs pages
- Update README.md
- Update API documentation

## ⚠️ Important Notes

### Security
- **NEVER** commit private keys to Git
- Use hardware wallets for Mainnet deployment
- Test on testnet before Mainnet
- Backup all configurations

### Gas and Fees
- Atomic deployment requires ~1.9M gas
- Consider high gas prices in Mainnet
- Plan deployment during low network congestion

### Testing
- Always run full verification after deployment
- Test with small amounts before production
- Verify all contract cross-references

## 🎉 Conclusion

Atomic deployment solves the fundamental circular dependency problem in ReserveBTC, ensuring correct operation of all system components. The method is tested and ready for Mainnet deployment.

**Key Benefits:**
- ✅ Solves `NotOracle()` errors
- ✅ Ensures correct cross-references
- ✅ Guarantees Oracle system functionality
- ✅ Automates complex deployment process
- ✅ Includes complete result verification

---
*Document created after successful atomic deployment in MegaETH Testnet 2025-09-05*