# Security Recommendations for FeeVault System

## Critical Issue: Users Can Keep rBTC Without Ability to Burn

### Problem Description
When a user's FeeVault balance runs out, they cannot burn rBTC tokens back to Bitcoin, but they still hold the rBTC tokens and can:
- Trade them on DEX
- Transfer to other users  
- Use in DeFi protocols
- Extract value without paying burn fees

### Recommended Solutions

## Solution 1: Minimum Balance Lock (RECOMMENDED)
**Implement a minimum FeeVault balance that covers both mint AND burn operations**

```solidity
// In OracleAggregator.sol
uint256 public constant MIN_BALANCE_MULTIPLIER = 2; // 2x fee for round trip

function sync(...) external {
    uint256 requiredFee = feePolicy.quoteFees(user, delta);
    uint256 minRequired = requiredFee * MIN_BALANCE_MULTIPLIER;
    
    require(feeVault.balanceOf(user) >= minRequired, "Insufficient balance for round trip");
    // ... rest of sync logic
}
```

**Benefits:**
- Ensures users always have enough for burn operation
- Simple to implement
- Protects protocol integrity

## Solution 2: Fee Deduction from rBTC Amount
**Deduct fees directly from minted rBTC amount**

```solidity
// Instead of minting full amount, mint (amount - fee equivalent)
uint256 feeInRBTC = calculateFeeInRBTC(delta);
uint256 mintAmount = delta - feeInRBTC;
synth.oracleMint(user, mintAmount);
// Transfer fee equivalent to treasury
```

**Benefits:**
- No separate FeeVault needed
- Fees always covered
- Simpler UX

## Solution 3: Escrow System
**Lock portion of FeeVault for future burns**

```solidity
mapping(address => uint256) public escrowedFees; // Locked for burns

function sync(...) external {
    if (delta > 0) { // Minting
        uint256 burnFee = estimateBurnFee(delta);
        escrowedFees[user] += burnFee;
        feeVault.lockFunds(user, burnFee);
    } else { // Burning
        uint256 lockedFee = escrowedFees[user];
        escrowedFees[user] = 0;
        feeVault.unlockFunds(user, lockedFee);
    }
}
```

**Benefits:**
- Guarantees burn capability
- Fair to users
- Maintains protocol balance

## Solution 4: Time-Based Penalty
**Add time-based penalties for holding rBTC without sufficient FeeVault**

```solidity
mapping(address => uint256) public lastSyncTime;
uint256 public constant PENALTY_RATE = 1; // 1% per day

function calculatePenalty(address user) view returns (uint256) {
    if (feeVault.balanceOf(user) < MIN_REQUIRED) {
        uint256 timePassed = block.timestamp - lastSyncTime[user];
        uint256 daysHeld = timePassed / 1 days;
        return (rbtc.balanceOf(user) * PENALTY_RATE * daysHeld) / 10000;
    }
    return 0;
}
```

**Benefits:**
- Incentivizes maintaining FeeVault balance
- Generates additional revenue
- Discourages gaming the system

## Solution 5: Transfer Restrictions
**Restrict rBTC transfers if FeeVault balance insufficient**

```solidity
// In RBTCSynth.sol
function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    if (from != address(0)) { // Not minting
        require(
            feeVault.balanceOf(from) >= MIN_FEE_BALANCE,
            "Maintain FeeVault balance to transfer"
        );
    }
    super._beforeTokenTransfer(from, to, amount);
}
```

**Benefits:**
- Forces users to maintain balance
- Prevents gaming via transfers
- Maintains system integrity

## Immediate Actions (Without Contract Changes)

### 1. UI/UX Warnings
- Add prominent warnings about maintaining FeeVault balance
- Show "Days until balance depleted" counter
- Send email/notifications when balance is low

### 2. Recommended Deposit Calculation
```javascript
// Current calculation is too low!
const calculateRecommendedDeposit = (operations) => {
  const mintOperations = Math.ceil(operations / 2);
  const burnOperations = Math.ceil(operations / 2);
  
  // Add 50% safety margin
  const totalFee = (mintOperations + burnOperations) * FEE_PER_OP * 1.5;
  return totalFee;
}
```

### 3. Auto Top-Up Feature
- Implement auto top-up when balance falls below threshold
- Partner with wallet providers for recurring deposits

### 4. FeeVault Balance Monitoring
```javascript
// Add monitoring endpoint
app.get('/api/users/low-balance', async (req, res) => {
  const users = await getUsersWithLowBalance();
  // Alert these users
  return res.json({ users });
});
```

## Risk Matrix

| Solution | Implementation Difficulty | Security Level | UX Impact |
|----------|-------------------------|----------------|-----------|
| Min Balance Lock | Easy | High | Medium |
| Fee from rBTC | Medium | Very High | Low |
| Escrow System | Hard | Very High | Low |
| Time Penalty | Medium | Medium | High |
| Transfer Restrict | Easy | High | High |

## My Strong Recommendation

**Implement Solution 1 (Minimum Balance Lock) IMMEDIATELY**
- Easiest to implement
- Doesn't require major contract changes
- Can be added as a check in the sync function

**Long-term: Move to Solution 2 (Fee from rBTC)**
- Most elegant solution
- Best UX
- Eliminates the problem entirely

## Code Example for Immediate Fix

```javascript
// In your Oracle sync API
const BURN_FEE_MULTIPLIER = 2.5; // Require 2.5x fee for safety

async function sync(userAddress, btcBalance, blockHeight) {
  const deltaInSats = calculateDelta(userAddress, btcBalance);
  const estimatedFee = calculateFee(deltaInSats);
  
  // For minting, require enough for future burn
  if (deltaInSats > 0) {
    const requiredBalance = estimatedFee * BURN_FEE_MULTIPLIER;
    const userBalance = await feeVault.balanceOf(userAddress);
    
    if (userBalance < requiredBalance) {
      throw new Error(`Need ${requiredBalance} wei in FeeVault for round-trip operation`);
    }
  }
  
  // Continue with sync...
}
```

## Timeline
1. **TODAY**: Update UI warnings and calculations
2. **THIS WEEK**: Implement minimum balance checks in API
3. **NEXT SPRINT**: Deploy escrow system or fee-from-rBTC solution
4. **LONG TERM**: Full contract upgrade with built-in protections