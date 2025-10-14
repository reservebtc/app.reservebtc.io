// lib/supabase-client.ts
// Supabase client configuration with admin support

import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Public client (for inserting requests, client-side operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client (for reading/updating - server-side only)
// Only initialize if service key is available
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// TypeScript types for Faucet functionality
export interface FaucetRequest {
  id?: string
  twitter_handle: string
  github_username: string
  eth_address: string
  ip_address?: string
  user_agent?: string
  status?: 'pending' | 'verified' | 'completed' | 'rejected'
  amount_sent?: number
  tx_hash?: string
  verified_twitter?: boolean
  verified_github?: boolean
  admin_notes?: string
  created_at?: string
  updated_at?: string
  completed_at?: string
}

// Helper function: Create faucet request (public operation)
export async function createFaucetRequest(data: Omit<FaucetRequest, 'id' | 'created_at' | 'updated_at'>) {
  // Check for duplicates in last 24 hours
  const { data: existingRequests, error: checkError } = await supabase
    .from('faucet_requests')
    .select('id')
    .or(`eth_address.eq.${data.eth_address},twitter_handle.eq.${data.twitter_handle},github_username.eq.${data.github_username}`)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (checkError) {
    console.error('❌ Error checking duplicates:', checkError)
    throw new Error('Failed to check for duplicate requests')
  }

  if (existingRequests && existingRequests.length > 0) {
    throw new Error('You have already submitted a request in the last 24 hours')
  }

  // Insert new request
  const { data: newRequest, error } = await supabase
    .from('faucet_requests')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating request:', error)
    throw new Error('Failed to create faucet request')
  }

  console.log('✅ Faucet request created:', newRequest?.id)
  return newRequest
}

// Admin function: Get all faucet requests (server-side only)
export async function getFaucetRequests(status?: string) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not initialized - missing SUPABASE_SERVICE_KEY')
  }

  let query = supabaseAdmin
    .from('faucet_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ Error fetching requests:', error)
    throw new Error('Failed to fetch requests')
  }

  console.log(`✅ Fetched ${data?.length || 0} faucet requests`)
  return data
}

// Admin function: Update faucet request (server-side only)
export async function updateFaucetRequest(
  id: string, 
  updates: Partial<FaucetRequest>
) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not initialized - missing SUPABASE_SERVICE_KEY')
  }

  const { data, error } = await supabaseAdmin
    .from('faucet_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating request:', error)
    throw new Error('Failed to update request')
  }

  console.log('✅ Faucet request updated:', id)
  return data
}

// Admin function: Mark request as completed (server-side only)
export async function markRequestCompleted(
  id: string,
  txHash: string,
  amount: number = 0.005
) {
  return updateFaucetRequest(id, {
    status: 'completed',
    tx_hash: txHash,
    amount_sent: amount,
    completed_at: new Date().toISOString()
  })
}