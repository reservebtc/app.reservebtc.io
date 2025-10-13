'use client'

import { useEffect } from 'react'

/**
 * Client-side component for one-time localStorage cleanup
 * Removes all legacy localStorage keys from previous architecture
 * 
 * Professional Architecture:
 * - NO localStorage for user data
 * - NO localStorage for monitoring
 * - NO localStorage for transactions
 * - Single Source of Truth: Supabase PostgreSQL
 * 
 * This component runs once on app load to clean up old keys
 */
export function LocalStorageCleanup() {
  useEffect(() => {
    // List of legacy keys to remove from old architecture
    const legacyKeys = [
      'mintedAddresses',
      'mint_protection_state', 
      'pending_mints',
      'reservebtc_production_errors'
    ]
    
    // Remove specific legacy keys
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
      }
    })
    
    // Remove all keys with legacy prefixes
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith('monitoring_') || 
        key.startsWith('oracle_pending_') ||
        key.includes('transaction_') ||
        key.includes('feevault_')
      ) {
        localStorage.removeItem(key)
      }
    })
    
    // Log cleanup completion (no sensitive data)
    console.log('✅ CLEANUP: localStorage cleanup completed - now using blockchain and Supabase only')
  }, [])
  
  return null
}