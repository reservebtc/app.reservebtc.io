-- Supabase Schema for Faucet Requests
-- Run this in Supabase SQL Editor

-- Create faucet_requests table
CREATE TABLE IF NOT EXISTS faucet_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_handle VARCHAR(255) NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  eth_address VARCHAR(42) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed', 'rejected')),
  amount_sent DECIMAL(10, 6),
  tx_hash VARCHAR(66),
  verified_twitter BOOLEAN DEFAULT FALSE,
  verified_github BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX idx_faucet_requests_status ON faucet_requests(status);
CREATE INDEX idx_faucet_requests_eth_address ON faucet_requests(eth_address);
CREATE INDEX idx_faucet_requests_created_at ON faucet_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE faucet_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (create request)
CREATE POLICY "Anyone can create faucet request" ON faucet_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can do everything (simplified)
CREATE POLICY "Service role full access" ON faucet_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to check for duplicate requests in last 24 hours
CREATE OR REPLACE FUNCTION check_duplicate_request(
  p_eth_address VARCHAR,
  p_twitter_handle VARCHAR,
  p_github_username VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM faucet_requests
    WHERE created_at > NOW() - INTERVAL '24 hours'
    AND (
      eth_address = p_eth_address
      OR twitter_handle = p_twitter_handle
      OR github_username = p_github_username
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faucet_requests_updated_at
  BEFORE UPDATE ON faucet_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for admin dashboard (aggregated stats)
CREATE OR REPLACE VIEW faucet_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) as total_requests,
  SUM(amount_sent) FILTER (WHERE status = 'completed') as total_eth_sent,
  COUNT(DISTINCT eth_address) as unique_addresses,
  MAX(created_at) as last_request_at
FROM faucet_requests;