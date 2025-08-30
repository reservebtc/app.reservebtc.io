# 🧪 Step-by-Step Testing Guide for ReserveBTC on MegaETH

## 🎯 **WHAT WE HAVE NOW**

✅ **All contracts deployed on MegaETH Testnet**  
✅ **Oracle server ready to launch**  
✅ **Web management panel created**  
✅ **Frontend updated with contract addresses**

---

## 🚀 **STEP 1: Launch Application**

### 1.1 Start the web application:
```bash
npm run dev
```

### 1.2 Open browser:
```
http://localhost:3000
```

---

## 🔮 **STEP 2: Oracle Management Panel**

### 2.1 Open Oracle panel:
```
http://localhost:3000/oracle
```

### 2.2 Connect MetaMask:
- Click wallet connection button
- Make sure you're connected to **MegaETH Testnet**

### 2.3 MegaETH Setup in MetaMask:
If network is missing, add manually:
- **Network Name:** MegaETH Testnet
- **RPC URL:** `https://carrot.megaeth.com/rpc`
- **Chain ID:** `6342`
- **Currency:** ETH
- **Block Explorer:** `https://megaexplorer.xyz`

---

## ⚡ **STEP 3: Launch Oracle Server**

### 3.1 Open new terminal:
```bash
node oracle-server.js
```

### 3.2 Expected result:
```
🔮 ReserveBTC Oracle Server Starting...
Oracle Address: 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b
✅ Oracle authorization verified
🎯 Oracle server is ready!
oracle> 
```

### 3.3 Add yourself to monitoring:
```bash
oracle> add 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```
*(Replace addresses with your own)*

---

## 🪙 **STEP 4: Get Test Tokens**

### 4.1 Get ETH for MegaETH:
- Need ETH on MegaETH for gas fees
- Request test ETH from MegaETH developers

### 4.2 Get BTC Testnet:
BTC testnet faucet sites:
- https://coinfaucet.eu/en/btc-testnet/
- https://testnet-faucet.mempool.co/
- Send to your testnet address

---

## 🔄 **STEP 5: Test Synchronization**

### 5.1 In Oracle panel (`http://localhost:3000/oracle`):
1. Enter your **BTC balance** (e.g., 0.001)
2. Enter **Block Height** (any number, e.g., 870000)
3. Click **"Sync BTC Balance"**

### 5.2 In Oracle terminal:
```bash
oracle> sync
oracle> list
oracle> status
```

### 5.3 Check results:
- Oracle page should update balance
- Terminal should show sync logs
- Transaction should appear on https://megaexplorer.xyz

---

## 📊 **STEP 6: Check Tokens**

### 6.1 Check rBTC-SYNTH balance:
In Oracle panel check "Last Synced BTC Balance"

### 6.2 Add tokens to MetaMask:
**rBTC-SYNTH (Soulbound):**
- Address: `0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB`
- Symbol: rBTC-SYNTH
- Decimals: 8

**wrBTC (ERC-20):**
- Address: `0xa10FC332f12d102Dddf431F8136E4E89279EFF87`  
- Symbol: wrBTC
- Decimals: 8

---

## 🎮 **STEP 7: Full Testing**

### 7.1 Test scenario:
1. **Send BTC** to your testnet address
2. **Wait 5 minutes** (auto-sync)
3. **Check** token increase in MetaMask
4. **Send BTC** from address (decrease balance)  
5. **Check** token decrease

### 7.2 Monitoring:
- **Oracle logs** in terminal
- **Transactions** on https://megaexplorer.xyz
- **Balances** in MetaMask
- **Oracle web panel**

---

## 🔍 **STEP 8: Monitoring and Debugging**

### 8.1 Useful Oracle commands:
```bash
oracle> list        # Show all users
oracle> status      # Oracle status
oracle> sync        # Force synchronization
oracle> help        # All commands
```

### 8.2 Logs and errors:
- **Oracle terminal** - main logs
- **Browser console** - frontend errors
- **MetaMask** - transaction status

### 8.3 Check contract addresses:
Oracle panel shows all contract addresses at the bottom

---

## 🚨 **Common Issues and Solutions**

### "Oracle not authorized"
- Check that `ORACLE_PRIVATE_KEY` matches contract address
- Restart oracle server

### "Insufficient funds for gas"
- Get more ETH on MegaETH testnet
- Check connection to correct network

### "Transaction failed"
- Check all contract addresses
- Make sure BTC address is correct for testnet

### Balances not updating
- Wait for transaction confirmation
- Refresh browser page
- Check that Oracle server is running

---

## 📱 **WORKFLOW OVERVIEW**

```
1. 💰 Received BTC on testnet address
    ↓
2. 🔮 Oracle detected balance change  
    ↓
3. ⛓️ Oracle sent sync transaction to MegaETH
    ↓
4. 🏭 Contract calculated delta and minted/burned tokens
    ↓
5. 💎 rBTC-SYNTH and wrBTC tokens appeared in MetaMask
```

---

## 🎯 **SUCCESS CHECKLIST**

✅ **Oracle server running without errors**  
✅ **Web panel opens and shows data**  
✅ **MetaMask connected to MegaETH Testnet**  
✅ **BTC balance synchronization works**  
✅ **Tokens appear in wallet**  
✅ **Transactions visible in block explorer**

**🚀 Congratulations! ReserveBTC protocol is fully operational!**

---

## 📞 **Support**

When issues arise:
1. Check all addresses and networks
2. Look at logs in terminal
3. Make sure all services are running
4. Test with small amounts

**Important - Oracle must run continuously in background for automatic synchronization!**