/**
 * Logger Utility
 * 
 * Provides structured logging for the application with persistence,
 * performance monitoring, and automatic context addition.
 * In production, this can be integrated with services like Sentry, LogRocket, etc.
 */

import { LogEntry, LogLevel } from '../schema'
import { getLogStorage } from './logStorage'
import { getPerformanceMonitor } from './performanceMonitor'

class Logger {
  private isDevelopment: boolean
  private enablePersistence: boolean = true
  private minLogLevel: LogLevel = 'debug' // Minimum log level to persist
  private sessionId: string
  private logStorage = typeof window !== 'undefined' ? getLogStorage() : null
  private performanceMonitor = typeof window !== 'undefined' ? getPerformanceMonitor() : null

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.sessionId = this.generateSessionId()
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current log level priority
   */
  private getLogLevelPriority(level: LogLevel): number {
    const priorities: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return priorities[level] || 0
  }

  /**
   * Check if log should be persisted
   */
  private shouldPersist(level: LogLevel): boolean {
    if (!this.enablePersistence || !this.logStorage) return false
    return this.getLogLevelPriority(level) >= this.getLogLevelPriority(this.minLogLevel)
  }

  /**
   * Get automatic context
   */
  private getAutoContext(): Record<string, any> {
    const context: Record<string, any> = {
      sessionId: this.sessionId,
    }

    // Add user agent (client-side only)
    if (typeof window !== 'undefined' && window.navigator) {
      context.userAgent = window.navigator.userAgent
    }

    // Add URL (client-side only)
    if (typeof window !== 'undefined' && window.location) {
      context.url = window.location.href
      context.pathname = window.location.pathname
    }

    return context
  }

  /**
   * Main log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    options?: {
      source?: string
      component?: string
      action?: string
      endpoint?: string
      method?: string
      statusCode?: number
      responseTime?: number
      performance?: {
        duration?: number
        memoryUsage?: number
      }
    }
  ) {
    const timestamp = new Date().toISOString()
    const autoContext = this.getAutoContext()
    const mergedContext = { ...autoContext, ...(context || {}) }

    const entry: Omit<LogEntry, 'id'> = {
      level,
      message,
      timestamp,
      context: mergedContext,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      source: options?.source,
      component: options?.component,
      action: options?.action,
      endpoint: options?.endpoint,
      method: options?.method,
      statusCode: options?.statusCode,
      responseTime: options?.responseTime,
      performance: options?.performance,
    }

    // In development, log to console with better formatting
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      const timestampStr = new Date().toLocaleString('ja-JP')
      const prefix = `[${timestampStr}] [${level.toUpperCase()}]`
      
      if (error) {
        console[consoleMethod](`${prefix} ${message}`, {
          context: mergedContext,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          ...(options || {}),
        })
      } else if (mergedContext && Object.keys(mergedContext).length > 0) {
        console[consoleMethod](`${prefix} ${message}`, { ...mergedContext, ...(options || {}) })
      } else {
        console[consoleMethod](`${prefix} ${message}`)
      }
    }

    // Persist log if enabled
    if (this.shouldPersist(level)) {
      try {
        this.logStorage?.saveLog(entry)
      } catch (err) {
        // Silently fail to avoid infinite logging loop
        if (this.isDevelopment) {
          console.error('Error persisting log:', err)
        }
      }
    }

    // In production, send to logging service
    // TODO: Integrate with Sentry, LogRocket, or similar service
    if (!this.isDevelopment && level === 'error') {
      // Send error to error tracking service
      this.sendToErrorTracking(entry)
    }
  }

  private sendToErrorTracking(entry: Omit<LogEntry, 'id'>) {
    // Placeholder for error tracking service integration
    // Example: Sentry.captureException(entry.error, { extra: entry.context })
  }

  /**
   * Set minimum log level for persistence
   */
  setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level
  }

  /**
   * Enable or disable persistence
   */
  setPersistenceEnabled(enabled: boolean): void {
    this.enablePersistence = enabled
  }

  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, any>, options?: { source?: string; component?: string; action?: string }) {
    this.log('debug', message, context, undefined, options)
  }

  /**
   * Info log
   */
  info(message: string, context?: Record<string, any>, options?: { source?: string; component?: string; action?: string }) {
    this.log('info', message, context, undefined, options)
  }

  /**
   * Warn log
   */
  warn(message: string, context?: Record<string, any>, options?: { source?: string; component?: string; action?: string }) {
    this.log('warn', message, context, undefined, options)
  }

  /**
   * Error log
   */
  error(message: string, error?: Error, context?: Record<string, any>, options?: { source?: string; component?: string; action?: string }) {
    this.log('error', message, context, error, options)
  }

  /**
   * Log API call
   */
  logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    error?: Error,
    context?: Record<string, any>
  ) {
    const level = error || statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info'
    this.log(
      level,
      `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`,
      context,
      error,
      {
        endpoint,
        method,
        statusCode,
        responseTime,
        source: 'API',
        component: 'API Route',
        action: `${method} ${endpoint}`,
      }
    )
  }

  /**
   * Log performance metric
   */
  logPerformance(
    name: string,
    duration: number,
    context?: Record<string, any>,
    memoryUsage?: number
  ) {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug'
    this.log(
      level,
      `Performance: ${name} took ${duration.toFixed(2)}ms`,
      context,
      undefined,
      {
        source: 'Performance',
        component: 'PerformanceMonitor',
        action: name,
        performance: {
          duration,
          memoryUsage,
        },
      }
    )
  }

  /**
   * Measure and log an async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>,
    options?: { source?: string; component?: string }
  ): Promise<T> {
    if (!this.performanceMonitor) {
      return operation()
    }

    try {
      const result = await this.performanceMonitor.measure(name, operation, context)
      const metric = this.performanceMonitor.getMetrics({ name })[0]
      if (metric) {
        this.logPerformance(name, metric.duration, { ...context, ...metric.metadata }, metric.memoryUsage)
      }
      return result
    } catch (error) {
      const metric = this.performanceMonitor.getMetrics({ name })[0]
      if (metric) {
        this.logPerformance(name, metric.duration, { ...context, error: error instanceof Error ? error.message : String(error) }, metric.memoryUsage)
      }
      throw error
    }
  }

  /**
   * Measure and log a sync operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    context?: Record<string, any>,
    options?: { source?: string; component?: string }
  ): T {
    if (!this.performanceMonitor) {
      return operation()
    }

    try {
      const result = this.performanceMonitor.measureSync(name, operation, context)
      const metric = this.performanceMonitor.getMetrics({ name })[0]
      if (metric) {
        this.logPerformance(name, metric.duration, { ...context, ...metric.metadata }, metric.memoryUsage)
      }
      return result
    } catch (error) {
      const metric = this.performanceMonitor.getMetrics({ name })[0]
      if (metric) {
        this.logPerformance(name, metric.duration, { ...context, error: error instanceof Error ? error.message : String(error) }, metric.memoryUsage)
      }
      throw error
    }
  }
}

// Export singleton instance
export const logger = new Logger()

