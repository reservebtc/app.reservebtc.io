-- Database schema for ReserveBTC transaction indexing

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  eth_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMP NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  tx_type VARCHAR(20) NOT NULL, -- MINT, BURN, SYNC, WRAP, UNWRAP
  amount NUMERIC(78, 0), -- Amount in smallest units (satoshis/wei)
  delta NUMERIC(78, 0), -- Change amount (can be negative)
  fee_wei NUMERIC(78, 0),
  bitcoin_address VARCHAR(62),
  gas_used BIGINT,
  gas_price NUMERIC(78, 0),
  status VARCHAR(20) DEFAULT 'confirmed',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_address (user_address),
  INDEX idx_tx_type (tx_type),
  INDEX idx_block_timestamp (block_timestamp),
  INDEX idx_bitcoin_address (bitcoin_address)
);

-- Balance snapshots table
CREATE TABLE balance_snapshots (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  block_number BIGINT NOT NULL,
  rbtc_balance NUMERIC(78, 0),
  wrbtc_balance NUMERIC(78, 0),
  last_sats NUMERIC(78, 0),
  snapshot_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_address, block_number),
  INDEX idx_user_snapshot (user_address, snapshot_timestamp DESC)
);

-- Bitcoin addresses mapping
CREATE TABLE bitcoin_addresses (
  id SERIAL PRIMARY KEY,
  eth_address VARCHAR(42) NOT NULL,
  bitcoin_address VARCHAR(62) NOT NULL,
  network VARCHAR(10) DEFAULT 'testnet', -- mainnet/testnet
  verified_at TIMESTAMP,
  monitoring_started_at TIMESTAMP,
  is_monitoring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(eth_address, bitcoin_address),
  INDEX idx_eth_address (eth_address),
  INDEX idx_monitoring (is_monitoring)
);