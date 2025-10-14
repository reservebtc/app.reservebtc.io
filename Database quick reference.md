# 📊 ReserveBTC Database Quick Reference

## Table Overview

```
┌─────────────────────────────────────────────────────────┐
│                  RESERVEBTC DATABASE                     │
│                   (Supabase PostgreSQL)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           CORE TABLES (8)                       │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  📝 transactions (42 records)                   │   │
│  │     - All MINT/BURN/WRAP/UNWRAP operations     │   │
│  │     - Indexed by user + timestamp               │   │
│  │     - 77 indexes total                          │   │
│  │                                                  │   │
│  │  👤 users (3 users)                             │   │
│  │     - Balance tracking                          │   │
│  │     - Lifetime totals                           │   │
│  │                                                  │   │
│  │  ₿  bitcoin_addresses (12 addresses)            │   │
│  │     - ETH ↔ BTC mapping                         │   │
│  │     - Balance in satoshis                       │   │
│  │     - 9 actively monitored                      │   │
│  │                                                  │   │
│  │  🚰 faucet_requests (5 requests)                │   │
│  │     - Testnet ETH distribution                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │        SYSTEM TABLES (4)                        │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  📋 oracle_operations_log                       │   │
│  │     - Oracle activity logging                   │   │
│  │                                                  │   │
│  │  🚨 system_alerts                               │   │
│  │     - Monitoring & errors                       │   │
│  │                                                  │   │
│  │  🔥 emergency_burns                             │   │
│  │     - Critical burn tracking                    │   │
│  │                                                  │   │
│  │  📜 system_contracts (6 contracts)              │   │
│  │     - Smart contract registry                   │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │        FUTURE TABLES (3)                        │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  💰 yield_monitoring                            │   │
│  │  💰 yield_operations_log                        │   │
│  │  💰 yield_scales_participants                   │   │
│  │     - Reserved for DeFi yield protocol          │   │
│  │     - Structure ready, awaiting activation      │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Database Stats

| Metric | Value |
|--------|-------|
| **Total Tables** | 12 |
| **Core Tables** | 8 |
| **System Tables** | 4 |
| **Total Indexes** | 77 |
| **RLS Coverage** | 100% |
| **Database Size** | 69 MB / 500 MB (14%) |
| **Transactions** | 42 |
| **Users** | 4 |
| **Security Issues** | 0 |

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                      DATA FLOW                            │
└──────────────────────────────────────────────────────────┘

    User Deposits Bitcoin
            ↓
    ┌─────────────────┐
    │ Bitcoin Network │  ← Mempool.space API
    └────────┬────────┘
             ↓ (15s polling)
    ┌─────────────────┐
    │ Oracle Server   │  ← Node.js + PM2
    │    (VPS)        │
    └────────┬────────┘
             ↓ (detects change)
             ↓
    ┌─────────────────┐
    │ Smart Contract  │  ← sync() call
    │   (MegaETH)     │
    └────────┬────────┘
             ↓ (emits event)
             ↓
    ┌─────────────────┐
    │ Oracle Server   │  ← Writes transaction
    └────────┬────────┘
             ↓ (INSERT)
             ↓
    ┌─────────────────┐
    │   Supabase      │  ← PostgreSQL 15
    │   Database      │
    └────────┬────────┘
             ↓ (CDC: Change Data Capture)
             ↓
    ┌─────────────────┐
    │  WebSocket      │  ← Real-time push
    │  Subscription   │
    └────────┬────────┘
             ↓
    ┌─────────────────┐
    │  Next.js App    │  ← UI updates
    │   (Frontend)    │
    └─────────────────┘
```

## Security Model

```
┌──────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                          │
└──────────────────────────────────────────────────────────┘

┌─────────────┐
│   USERS     │  → authenticated role
│             │  → See only their own data
│             │  → JWT-based auth
│             │  → Read-only queries
└──────┬──────┘
       ↓
┌─────────────┐
│    RLS      │  → Row Level Security
│  POLICIES   │  → Filter by user_address
│             │  → Automatic isolation
└──────┬──────┘
       ↓
┌─────────────┐
│  DATABASE   │  → Supabase PostgreSQL
│             │  → Encrypted storage
│             │  → Automatic backups
└──────┬──────┘
       ↑
┌─────────────┐
│  SERVICE    │  → service_role key
│    ROLE     │  → Full database access
│             │  → Oracle server only
└──────┬──────┘
       ↑
┌─────────────┐
│   ORACLE    │  → VPS backend
│   SERVER    │  → Private keys stored here
│             │  → PM2 managed
└─────────────┘
```

## Key Indexes

```sql
-- User transaction history (most common query)
CREATE INDEX idx_transactions_user_timestamp 
  ON transactions(user_address, block_timestamp DESC);

-- Duplicate prevention
CREATE UNIQUE INDEX transactions_tx_hash_unique 
  ON transactions(tx_hash);

-- Time-based queries
CREATE INDEX idx_transactions_block_timestamp 
  ON transactions(block_timestamp DESC);

-- ETH → BTC lookup
CREATE INDEX idx_btc_eth_address 
  ON bitcoin_addresses(eth_address);

-- Active monitoring
CREATE INDEX idx_btc_monitoring 
  ON bitcoin_addresses(is_monitoring) 
  WHERE is_monitoring = true;
```

## Common Queries

### Frontend (Read-only)

```typescript
// Get user transactions
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_address', address)
  .order('block_timestamp', { ascending: false })
  .limit(10);

// Get Bitcoin address
const { data } = await supabase
  .from('bitcoin_addresses')
  .select('bitcoin_address, balance_sats')
  .eq('eth_address', address)
  .single();

// Subscribe to new transactions
supabase
  .channel('user_txs')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions',
    filter: `user_address=eq.${address}`
  }, (payload) => {
    console.log('New tx:', payload.new);
  })
  .subscribe();
```

### Backend (Oracle Server)

```javascript
// Write transaction
await supabase.from('transactions').insert({
  tx_hash: txHash,
  block_number: blockNumber,
  block_timestamp: new Date().toISOString(),
  user_address: userAddress.toLowerCase(),
  tx_type: 'MINT',
  amount: amount.toString(),
  delta: delta.toString(),
  status: 'confirmed'
});

// Update user balance
await supabase.from('users').upsert({
  eth_address: userAddress.toLowerCase(),
  rbtc_balance: newBalance.toString()
});
```

## Performance Benchmarks

| Query Type | Response Time | Optimization |
|------------|---------------|--------------|
| User transactions | <50ms | Composite index |
| Recent activity | <100ms | Timestamp index |
| Balance lookup | <30ms | ETH address index |
| Duplicate check | <10ms | Unique hash index |
| Real-time update | <500ms | WebSocket push |

## Scaling Capacity

### Current (Testnet)
- Users: 4
- Transactions: 42
- Size: 69 MB
- Free tier: ✅

### Production (Mainnet)
- Users: 10,000+
- Transactions: 1,000+/day
- Size: 8 GB
- Pro tier: Required

## Monitoring Commands

```bash
# Oracle server status
pm2 status
pm2 logs oracle-universal --lines 50

# Database health
SELECT 
  COUNT(*) as transactions,
  COUNT(DISTINCT user_address) as users,
  pg_size_pretty(pg_database_size(current_database())) as size
FROM transactions;

# Recent activity
SELECT 
  tx_type,
  COUNT(*) as count,
  MAX(block_timestamp) as last_tx
FROM transactions
GROUP BY tx_type;
```

## Troubleshooting

### Transaction Missing
1. Check Oracle logs: `pm2 logs oracle-universal`
2. Verify monitoring: `SELECT * FROM bitcoin_addresses WHERE is_monitoring = true`
3. Check database: `SELECT COUNT(*) FROM transactions WHERE created_at > NOW() - INTERVAL '1 hour'`

### Slow Queries
1. Check indexes: `SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public'`
2. Analyze queries: `SELECT query, mean_exec_time FROM pg_stat_statements WHERE mean_exec_time > 100`
3. Add pagination: Use `LIMIT` + `OFFSET`

### RLS Issues
1. Verify policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
2. Check JWT: Ensure `eth_address` in token
3. Test with anon: Should allow public reads

---

**Quick Start:**
1. Read [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md) for full docs
2. Check current stats with monitoring commands
3. Query Supabase directly from frontend
4. Oracle writes via service_role key

**Status:** ✅ Production Ready | **Version:** 1.0 | **Updated:** Oct 14, 2025