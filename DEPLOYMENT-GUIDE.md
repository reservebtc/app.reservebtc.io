# 🚀 ReserveBTC Deployment Guide - MegaETH Testnet

## 📋 Quick Start Instructions

### 1. **Configure Your Private Key**

Edit the file `contracts/.env.deploy` and add your MetaMask private key:

```bash
# MegaETH Testnet Deployment Configuration
PRIVATE_KEY=your_private_key_here_without_0x

# MegaETH Testnet RPC (2025)
RPC_URL=https://carrot.megaeth.com/rpc

# Your wallet address (will be committee member)
DEPLOYER_ADDRESS=your_wallet_address

# Fee collector address (can be same as deployer)
FEE_COLLECTOR=your_wallet_address
```

**⚠️ ВАЖНО:** Приватный ключ БЕЗ префикса `0x`!

### 2. **Add MegaETH Testnet to MetaMask**

Network Settings:
- **Network Name:** MegaETH Testnet
- **RPC URL:** `https://carrot.megaeth.com/rpc`
- **Chain ID:** `6342`
- **Currency Symbol:** ETH
- **Block Explorer:** `https://megaexplorer.xyz`

### 3. **Get Testnet ETH**

Убедитесь, что у вас есть testnet ETH для gas fees на MegaETH testnet.

### 4. **Deploy Contracts**

Run the deployment script:

```bash
./deploy-megaeth.sh
```

The script will:
- ✅ Check your configuration
- ✅ Run pre-deployment tests
- ✅ Deploy all 5 ReserveBTC contracts
- ✅ Configure permissions between contracts
- ✅ Display all contract addresses

### 5. **Expected Output**

After successful deployment, you'll see:

```
=== DEPLOYMENT COMPLETE ===
Save these addresses for frontend configuration:

FeePolicy: 0x...
FeeVault: 0x...
RBTCSynth: 0x...
VaultWrBTC: 0x...
OracleAggregator: 0x...

Oracle Committee Member: 0x... (your address)
Fee Collector: 0x... (your address)

🎉 Ready for testnet usage!
```

## 📊 **Contract Architecture**

The deployment creates these contracts:

1. **OracleAggregator** - Main protocol contract
2. **FeeVault** - User ETH deposit management
3. **FeePolicy** - Fee calculation (0.1% default)
4. **RBTCSynth** - Soulbound rBTC token
5. **VaultWrBTC** - Wrapped rBTC (ERC-20)

## 🔧 **Configuration Details**

### Fee Policy Parameters:
- **Fee Rate:** 0.1% (10 basis points)
- **Fixed Fee:** 0 wei
- **Wei per Satoshi:** 1,000,000,000 (1 gwei)

### Oracle Settings:
- **Threshold:** 1-of-1 (you as single oracle)
- **Min Confirmations:** 1 (testnet)
- **Max Fee per Sync:** 0.01 ETH

## 🚨 **Troubleshooting**

### Common Issues:

**"PRIVATE_KEY not set"**
- Check that `.env.deploy` exists
- Ensure private key is without `0x` prefix

**"Insufficient funds for gas"**
- Get more testnet ETH
- Check you're connected to MegaETH testnet

**"Contract creation failed"**
- Ensure contracts compile: `cd contracts && forge build`
- Check RPC endpoint is working

## 🔗 **Next Steps After Deployment**

1. **Update Frontend Config** with contract addresses
2. **Test Oracle Functions** - sync user balances
3. **Test User Flow** - wallet verification → minting
4. **Monitor Transactions** on MegaExplorer

## 📞 **Support**

If deployment fails, check:
- Gas estimation settings
- Network connectivity
- Contract compilation errors

All test files remain untouched - only deployment scripts added! 🎯