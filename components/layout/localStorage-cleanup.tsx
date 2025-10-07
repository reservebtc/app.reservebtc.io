'use client'

import { useEffect } from 'react'

/**
 * Client-side component for one-time localStorage cleanup
 * Removes all legacy localStorage keys from previous versions
 */
export function LocalStorageCleanup() {
  useEffect(() => {
    // ONE-TIME CLEANUP: Remove all old localStorage data from previous versions
    const keysToRemove = [
      'mintedAddresses',
      'mint_protection_state', 
      'pending_mints',
      'reservebtc_production_errors'
    ]
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log('🧹 CLEANUP: Removed old localStorage key:', key)
      }
    })
    
    // Remove all keys starting with monitoring_ or oracle_pending_ or transaction_ or feevault_
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('monitoring_') || 
          key.startsWith('oracle_pending_') ||
          key.includes('transaction_') ||
          key.includes('feevault_')) {
        localStorage.removeItem(key)
        console.log('🧹 CLEANUP: Removed old localStorage key:', key)
      }
    })
    
    console.log('✅ CLEANUP: localStorage cleanup completed - now using blockchain and Supabase only')
  }, [])
  
  return null
}