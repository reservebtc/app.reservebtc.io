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

### 3.1 Configure Oracle Environment:
**Option A - Using .env file (Recommended):**
```bash
# Create .env file in project root
echo "ORACLE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE" > .env
```

**Option B - Export environment variable:**
```bash
export ORACLE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

⚠️ **Important:** Private key must include `0x` prefix!

### 3.2 Install Oracle dependencies:
```bash
npm install viem
```

### 3.3 Launch Oracle server:
```bash
node oracle-server.js
```

### 3.4 Expected result:
```
🔮 ReserveBTC Oracle Server Starting...
Oracle Address: 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b
Contract Address: 0x717D12a23Bb46743b15019a52184DF7F250B061a
Sync Interval: 300 seconds
✅ Oracle authorization verified
🎯 Oracle server is ready!
oracle> 
```

### 3.5 Add yourself to monitoring:
```bash
oracle> add 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```
*(Replace addresses with your own - ETH address and BTC testnet address)*

### 3.6 Verify setup:
```bash
oracle> list     # Should show your added address
oracle> status   # Shows Oracle configuration
```

---

## 🪙 **STEP 4: Get Test Tokens**

### 4.1 Get ETH for MegaETH Testnet:
**Required for gas fees and Oracle transactions**
- Request test ETH from MegaETH developers
- Join MegaETH Discord/Telegram for faucet access
- You need ~0.1 ETH for testing (covers multiple transactions)
- Verify balance in MetaMask after receiving

### 4.2 Get BTC Testnet:
**For testing BTC balance synchronization**

**Bitcoin Testnet Faucets:**
- https://coinfaucet.eu/en/btc-testnet/
- https://testnet-faucet.mempool.co/
- https://bitcoinfaucet.uo1.net/

**Steps:**
1. Generate or use existing Bitcoin testnet address
2. Request testnet BTC from faucet (usually ~0.001-0.01 BTC)
3. Wait for confirmation (10-30 minutes)
4. Verify balance on Bitcoin testnet explorer

---

## 🔄 **STEP 5: Test Synchronization**

### 5.1 Manual Sync via Oracle Panel:
**Open Oracle dashboard:** `http://localhost:3000/oracle`

**Manual Balance Sync:**
1. Connect MetaMask wallet (should show your address)
2. Enter your actual **BTC balance** from testnet wallet (e.g., 0.001)
3. Enter current **Block Height** (check Bitcoin testnet explorer or use ~870000)
4. Click **"Sync BTC Balance"**
5. Confirm transaction in MetaMask when prompted

### 5.2 Automatic Sync via Oracle Server:
**Oracle server automatically syncs every 5 minutes for monitored addresses**

Terminal commands:
```bash
oracle> sync        # Force immediate sync of all users
oracle> list        # Show all monitored users and their status
oracle> status      # Display Oracle configuration and status
oracle> help        # Show all available commands
```

### 5.3 Monitor Results:
**Check multiple places for confirmation:**
- ✅ Oracle web panel shows updated "Last Synced BTC Balance"
- ✅ Terminal displays sync transaction logs and gas usage
- ✅ Transaction appears on https://megaexplorer.xyz
- ✅ MetaMask shows transaction in activity history
- ✅ rBTC-SYNTH tokens appear in wallet (may need to add token contract)

---

## 📊 **STEP 6: Verify Token Balances**

### 6.1 Check Synchronized Balance:
**In Oracle dashboard panel:**
- View "Last Synced BTC Balance" section
- Should match your actual BTC testnet balance
- Check timestamp of last synchronization

### 6.2 Add ReserveBTC Tokens to MetaMask:
**You must manually add these tokens to see them in your wallet**

**rBTC-SYNTH (Soulbound Token):**
- **Contract Address:** `0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB`
- **Token Symbol:** rBTC-SYNTH
- **Decimals:** 8
- **Type:** Non-transferable (soulbound)

**wrBTC (Tradeable ERC-20):**
- **Contract Address:** `0xa10FC332f12d102Dddf431F8136E4E89279EFF87`
- **Token Symbol:** wrBTC  
- **Decimals:** 8
- **Type:** Standard ERC-20 (transferable)

**How to add tokens in MetaMask:**
1. Click "Import tokens" in MetaMask
2. Paste contract address
3. Symbol and decimals should auto-fill
4. Click "Add Custom Token"
5. Confirm the import

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
- Ensure private key has `0x` prefix in environment variable
- Restart oracle server

### "ORACLE_PRIVATE_KEY environment variable is required"
- Create `.env` file in project root with: `ORACLE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY`
- Or export environment variable: `export ORACLE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY`
- Private key must include `0x` prefix

### "Insufficient funds for gas"
- Get more ETH on MegaETH testnet from developers
- Check connection to correct network (Chain ID: 6342)
- Verify RPC URL: `https://carrot.megaeth.com/rpc`

### "Transaction failed" / "Contract execution failed"
- Verify all contract addresses are correct
- Make sure BTC address is correct for testnet (starts with `tb1` or `2`)
- Check that user has sufficient ETH balance for gas fees
- Ensure Oracle is properly authorized as committee member

### "Balance sync failing" / "Network errors"
- Check MegaETH RPC connectivity
- Verify Bitcoin API access (using BlockCypher)
- Restart oracle server if persistent failures
- Check firewall/network restrictions

### Balances not updating in MetaMask
- Wait for transaction confirmation (1-2 minutes)
- Refresh browser page and reconnect wallet
- Check that Oracle server is running continuously
- Verify token contracts are added to MetaMask with correct addresses
- Check transaction status on https://megaexplorer.xyz

### Oracle server crashes or stops
- Check system resources and memory usage
- Review oracle logs for specific error messages
- Ensure stable internet connection for API calls
- Restart with: `node oracle-server.js`

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