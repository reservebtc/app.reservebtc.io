/**
 * Professional Logging System for ReserveBTC Frontend
 * Security-focused, user-isolated logging with professional error handling
 * Ensures no cross-user data exposure in browser console
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export type LogCategory = 
  | 'VERIFICATION'   // Bitcoin address verification
  | 'ORACLE'         // Oracle server communication
  | 'MEMPOOL'        // Mempool.space API calls
  | 'MINT'           // Minting operations
  | 'WRAP'           // Wrap/unwrap operations
  | 'DASHBOARD'      // Dashboard data loading
  | 'AUTH'           // User authentication
  | 'SECURITY'       // Security-related events
  | 'PRIVACY'        // Privacy protection events
  | 'CONTRACT'       // Smart contract interactions
  | 'BALANCE'        // Balance fetching and updates
  | 'TRANSACTION'    // Transaction processing

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  userWallet?: string // Only last 6 characters for privacy
  action: string
  result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO'
  message: string
  duration?: number
  errorCode?: string
  metadata?: Record<string, any>
}

class ProfessionalLogger {
  private isProductionMode: boolean
  private logHistory: LogEntry[] = []
  private maxHistorySize: number = 1000
  private sessionId: string
  
  constructor() {
    this.isProductionMode = process.env.NODE_ENV === 'production'
    this.sessionId = this.generateSessionId()
    
    // Initialize session logging
    this.log('info', 'AUTH', 'SESSION_START', 'INFO', 
      `ReserveBTC Frontend session started (Session: ${this.sessionId.substring(0, 8)}...)`)
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  private formatUserWallet(wallet?: string): string | undefined {
    if (!wallet) return undefined
    return wallet.length > 6 ? `...${wallet.slice(-6)}` : wallet
  }

  private sanitizeMessage(message: string, userWallet?: string): string {
    // Remove sensitive data patterns
    const sanitized = message
      .replace(/0x[a-fA-F0-9]{40}/g, (match) => {
        // Keep only last 6 characters of Ethereum addresses for current user privacy
        return userWallet && match.toLowerCase().includes(userWallet.toLowerCase().slice(-6)) 
          ? `...${match.slice(-6)}` 
          : '[WALLET_ADDR]'
      })
      .replace(/[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g, (match) => {
        // Bitcoin addresses - show only first 8 and last 6 for current user
        return `${match.slice(0, 8)}...${match.slice(-6)}`
      })
      .replace(/tb1[a-zA-HJ-NP-Z0-9]{25,87}/g, (match) => {
        // Testnet addresses - show only first 8 and last 6
        return `${match.slice(0, 8)}...${match.slice(-6)}`
      })
      .replace(/bc1[a-zA-HJ-NP-Z0-9]{25,87}/g, (match) => {
        // Bech32 addresses - show only first 8 and last 6
        return `${match.slice(0, 8)}...${match.slice(-6)}`
      })

    return sanitized
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProductionMode) {
      // In production, only log warnings and errors
      return ['warn', 'error', 'critical'].includes(level)
    }
    return true // Log everything in development
  }

  private formatLogMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const userInfo = entry.userWallet ? ` [${entry.userWallet}]` : ''
    const duration = entry.duration ? ` (${entry.duration}ms)` : ''
    
    const levelEmoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    }[entry.level]

    const resultEmoji = {
      SUCCESS: '✅',
      FAILURE: '❌',
      WARNING: '⚠️',
      INFO: 'ℹ️'
    }[entry.result]

    return `${levelEmoji} [${timestamp}] ${entry.category}${userInfo} [${entry.action}] ${resultEmoji} ${entry.message}${duration}`
  }

  /**
   * Production Error Tracking
   * Sends critical errors to external monitoring services in production
   */
  private trackProductionError(
    level: LogLevel,
    category: LogCategory,
    action: string,
    message: string,
    error?: Error | string,
    userWallet?: string,
    metadata?: Record<string, any>
  ): void {
    if (this.isProductionMode && ['error', 'critical'].includes(level)) {
      // Enhanced production error tracking
      const productionError = {
        timestamp: new Date().toISOString(),
        level,
        category,
        action,
        message: this.sanitizeMessage(message, userWallet),
        userWallet: this.formatUserWallet(userWallet),
        sessionId: this.sessionId.substring(0, 8),
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: metadata || {}
      }

      // Console error for immediate visibility
      console.error('🚨 PRODUCTION ERROR TRACKED:', {
        level,
        category,
        action,
        message: productionError.message,
        timestamp: productionError.timestamp,
        sessionId: productionError.sessionId
      })

      // TODO: Integrate with external error tracking service
      // Examples:
      // - Sentry: Sentry.captureException(error, { extra: productionError })
      // - LogRocket: LogRocket.captureException(error)
      // - Datadog: DD_RUM.addError(error, productionError)
      // - Custom API: fetch('/api/error-tracking', { method: 'POST', body: JSON.stringify(productionError) })
      
      // For now, store in localStorage for debugging (with size limit)
      try {
        const storedErrors = JSON.parse(localStorage.getItem('reservebtc_production_errors') || '[]')
        storedErrors.push(productionError)
        
        // Keep only last 50 errors to prevent localStorage overflow
        if (storedErrors.length > 50) {
          storedErrors.splice(0, storedErrors.length - 50)
        }
        
        localStorage.setItem('reservebtc_production_errors', JSON.stringify(storedErrors))
      } catch (e) {
        // Fail silently if localStorage is not available
        console.warn('Unable to store production error in localStorage:', e)
      }
    }
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    options?: {
      userWallet?: string
      duration?: number
      errorCode?: string
      metadata?: Record<string, any>
    }
  ): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      userWallet: this.formatUserWallet(options?.userWallet),
      action,
      result,
      message: this.sanitizeMessage(message, options?.userWallet),
      duration: options?.duration,
      errorCode: options?.errorCode,
      metadata: options?.metadata
    }

    // Add to history
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift() // Remove oldest entry
    }

    // Output to console with appropriate method
    const formattedMessage = this.formatLogMessage(entry)
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
      case 'critical':
        console.error(formattedMessage)
        if (options?.metadata) {
          console.error('Metadata:', options.metadata)
        }
        break
    }
  }

  // Convenience methods for common operations
  public verification(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'VERIFICATION', action, result, message, { userWallet, duration })
  }

  public oracle(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'ORACLE', action, result, message, { userWallet, duration })
  }

  public mempool(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'MEMPOOL', action, result, message, { userWallet, duration })
  }

  public mint(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'MINT', action, result, message, { userWallet, duration })
  }

  public wrap(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'WRAP', action, result, message, { userWallet, duration })
  }

  public dashboard(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'DASHBOARD', action, result, message, { userWallet, duration })
  }

  public security(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    errorCode?: string
  ): void {
    this.log('warn', 'SECURITY', action, result, message, { userWallet, errorCode })
  }

  public privacy(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string
  ): void {
    this.log('info', 'PRIVACY', action, result, message, { userWallet })
  }

  public contract(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    this.log('info', 'CONTRACT', action, result, message, { userWallet, duration, metadata })
  }

  public balance(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number
  ): void {
    this.log('info', 'BALANCE', action, result, message, { userWallet, duration })
  }

  public transaction(
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO',
    message: string,
    userWallet?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    this.log('info', 'TRANSACTION', action, result, message, { userWallet, duration, metadata })
  }

  // Error logging with stack traces and production tracking
  public error(
    category: LogCategory,
    action: string,
    error: Error | string,
    userWallet?: string,
    metadata?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : error
    const stack = error instanceof Error ? error.stack : undefined
    
    // Track in production
    this.trackProductionError('error', category, action, errorMessage, error, userWallet, {
      ...metadata,
      stack
    })
    
    this.log('error', category, action, 'FAILURE', errorMessage, {
      userWallet,
      metadata: { ...metadata, stack }
    })
  }

  // Critical errors that need immediate attention
  public critical(
    category: LogCategory,
    action: string,
    message: string,
    userWallet?: string,
    errorCode?: string,
    metadata?: Record<string, any>
  ): void {
    // Track critical errors in production
    this.trackProductionError('critical', category, action, message, message, userWallet, {
      errorCode,
      ...metadata
    })
    
    this.log('critical', category, action, 'FAILURE', message, {
      userWallet,
      errorCode,
      metadata
    })
  }

  // Performance timing helper
  public time(category: LogCategory, action: string, userWallet?: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = Math.round(performance.now() - startTime)
      this.log('debug', category, action, 'INFO', `Operation completed`, {
        userWallet,
        duration
      })
    }
  }

  // Get filtered log history (only for current user)
  public getLogHistory(userWallet?: string): LogEntry[] {
    if (!userWallet) return []
    
    const userSuffix = this.formatUserWallet(userWallet)
    return this.logHistory.filter(entry => entry.userWallet === userSuffix)
  }

  // Get production errors from localStorage (development only)
  public getProductionErrors(): any[] {
    if (this.isProductionMode) return []
    
    try {
      return JSON.parse(localStorage.getItem('reservebtc_production_errors') || '[]')
    } catch {
      return []
    }
  }

  // Clear production errors (development only)
  public clearProductionErrors(): void {
    if (!this.isProductionMode) {
      localStorage.removeItem('reservebtc_production_errors')
      console.info('🗑️ Production error history cleared')
    }
  }

  // Clear log history
  public clearHistory(): void {
    this.logHistory = []
    console.info('🗑️ Log history cleared')
  }

  // Get system statistics
  public getStats(): {
    totalLogs: number
    logsByLevel: Record<LogLevel, number>
    logsByCategory: Record<LogCategory, number>
    sessionId: string
    sessionDuration: string
    productionErrors: number
  } {
    const logsByLevel = this.logHistory.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1
      return acc
    }, {} as Record<LogLevel, number>)

    const logsByCategory = this.logHistory.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1
      return acc
    }, {} as Record<LogCategory, number>)

    const sessionStart = parseInt(this.sessionId.substring(0, 8), 36)
    const sessionDuration = Math.round((Date.now() - sessionStart) / 1000)

    return {
      totalLogs: this.logHistory.length,
      logsByLevel,
      logsByCategory,
      sessionId: this.sessionId.substring(0, 8),
      sessionDuration: `${sessionDuration}s`,
      productionErrors: this.getProductionErrors().length
    }
  }
}

// Export singleton instance
export const professionalLogger = new ProfessionalLogger()

// Export convenience function
export const createLogger = (defaultUserWallet?: string) => ({
  verification: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.verification(action, result, message, defaultUserWallet, duration),
  
  oracle: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.oracle(action, result, message, defaultUserWallet, duration),
    
  mempool: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.mempool(action, result, message, defaultUserWallet, duration),
    
  mint: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.mint(action, result, message, defaultUserWallet, duration),
    
  wrap: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.wrap(action, result, message, defaultUserWallet, duration),
    
  dashboard: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.dashboard(action, result, message, defaultUserWallet, duration),
    
  security: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, errorCode?: string) =>
    professionalLogger.security(action, result, message, defaultUserWallet, errorCode),
    
  privacy: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string) =>
    professionalLogger.privacy(action, result, message, defaultUserWallet),
    
  contract: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number, metadata?: Record<string, any>) =>
    professionalLogger.contract(action, result, message, defaultUserWallet, duration, metadata),
    
  balance: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number) =>
    professionalLogger.balance(action, result, message, defaultUserWallet, duration),
    
  transaction: (action: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO', message: string, duration?: number, metadata?: Record<string, any>) =>
    professionalLogger.transaction(action, result, message, defaultUserWallet, duration, metadata),
    
  error: (category: LogCategory, action: string, error: Error | string, metadata?: Record<string, any>) =>
    professionalLogger.error(category, action, error, defaultUserWallet, metadata),
    
  critical: (category: LogCategory, action: string, message: string, errorCode?: string, metadata?: Record<string, any>) =>
    professionalLogger.critical(category, action, message, defaultUserWallet, errorCode, metadata),
    
  time: (category: LogCategory, action: string) =>
    professionalLogger.time(category, action, defaultUserWallet)
})