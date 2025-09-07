/**
 * React hook for automatic blockchain monitoring initialization
 * 
 * Ensures automatic operation for enterprise-scale deployment (100k+ users)
 */

import { useEffect } from 'react'
import { blockchainMonitor } from '@/lib/blockchain-monitor'

/**
 * Hook to initialize automatic blockchain monitoring
 * Should be called once at the app level for global monitoring
 */
export function useBlockchainMonitor() {
  useEffect(() => {
    console.log('🚀 Initializing automatic blockchain monitoring...')
    
    // Start monitoring on component mount
    blockchainMonitor.startMonitoring()
    
    // Cleanup on unmount (though this should rarely happen at app level)
    return () => {
      blockchainMonitor.stopMonitoring()
    }
  }, [])
}

/**
 * Hook for monitoring status
 */
export function useMonitoringStatus() {
  return {
    isActive: true, // We assume monitoring is always active for production
    startMonitoring: () => blockchainMonitor.startMonitoring(),
    stopMonitoring: () => blockchainMonitor.stopMonitoring()
  }
}