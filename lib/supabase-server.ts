// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    // During build time, if env vars are not available, return a mock client
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      console.warn('Supabase environment variables not available during build')
      return null
    }
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export function requireSupabaseClient() {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase client not available')
  }
  return client
}