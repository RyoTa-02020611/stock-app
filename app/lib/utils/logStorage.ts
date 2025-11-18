/**
 * Log Storage Adapter
 * 
 * Provides storage for log entries using localStorage/IndexedDB.
 * Supports log rotation, search, filter, and export functionality.
 */

import { LogEntry, LogFilter, LogStatistics, STORAGE_KEYS } from '../schema'

interface LogStorageSettings {
  maxLogs: number // Maximum number of logs to keep
  retentionDays: number // Number of days to keep logs
  enableRotation: boolean // Enable automatic log rotation
}

const DEFAULT_SETTINGS: LogStorageSettings = {
  maxLogs: 10000,
  retentionDays: 30,
  enableRotation: true,
}

class LogStorage {
  private settings: LogStorageSettings
  private storageKey: string = STORAGE_KEYS.LOGS
  private settingsKey: string = STORAGE_KEYS.LOG_SETTINGS

  constructor() {
    this.settings = this.loadSettings()
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): LogStorageSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS
    }

    try {
      const stored = localStorage.getItem(this.settingsKey)
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Error loading log settings:', error)
    }

    return DEFAULT_SETTINGS
  }

  /**
   * Save settings to storage
   */
  saveSettings(settings: Partial<LogStorageSettings>): void {
    if (typeof window === 'undefined') return

    this.settings = { ...this.settings, ...settings }
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings))
    } catch (error) {
      console.error('Error saving log settings:', error)
    }
  }

  /**
   * Get current settings
   */
  getSettings(): LogStorageSettings {
    return { ...this.settings }
  }

  /**
   * Save a log entry
   */
  saveLog(entry: Omit<LogEntry, 'id'>): string {
    if (typeof window === 'undefined') return ''

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const logEntry: LogEntry = {
      ...entry,
      id,
    }

    try {
      const logs = this.getAllLogs()
      logs.push(logEntry)

      // Apply rotation if enabled
      if (this.settings.enableRotation) {
        const rotated = this.rotateLogs(logs)
        localStorage.setItem(this.storageKey, JSON.stringify(rotated))
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(logs))
      }

      return id
    } catch (error) {
      console.error('Error saving log:', error)
      return ''
    }
  }

  /**
   * Save multiple log entries (batch operation)
   */
  saveLogs(entries: Array<Omit<LogEntry, 'id'>>): string[] {
    if (typeof window === 'undefined') return []

    const ids: string[] = []
    const logs = this.getAllLogs()

    try {
      entries.forEach(entry => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const logEntry: LogEntry = {
          ...entry,
          id,
        }
        logs.push(logEntry)
        ids.push(id)
      })

      // Apply rotation if enabled
      if (this.settings.enableRotation) {
        const rotated = this.rotateLogs(logs)
        localStorage.setItem(this.storageKey, JSON.stringify(rotated))
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(logs))
      }

      return ids
    } catch (error) {
      console.error('Error saving logs:', error)
      return []
    }
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored) as LogEntry[]
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }

    return []
  }

  /**
   * Get logs with filters
   */
  getLogs(filter?: LogFilter, limit?: number): LogEntry[] {
    let logs = this.getAllLogs()

    // Apply filters
    if (filter) {
      logs = this.applyFilters(logs, filter)
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply limit
    if (limit && limit > 0) {
      logs = logs.slice(0, limit)
    }

    return logs
  }

  /**
   * Apply filters to logs
   */
  private applyFilters(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    return logs.filter(log => {
      // Level filter
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level]
        if (!levels.includes(log.level)) return false
      }

      // Date range filter
      if (filter.startDate) {
        if (new Date(log.timestamp) < new Date(filter.startDate)) return false
      }
      if (filter.endDate) {
        if (new Date(log.timestamp) > new Date(filter.endDate)) return false
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const messageMatch = log.message.toLowerCase().includes(searchLower)
        const contextMatch = JSON.stringify(log.context || {}).toLowerCase().includes(searchLower)
        if (!messageMatch && !contextMatch) return false
      }

      // Source filter
      if (filter.source && log.source !== filter.source) return false

      // Component filter
      if (filter.component && log.component !== filter.component) return false

      // Endpoint filter
      if (filter.endpoint && log.endpoint !== filter.endpoint) return false

      // Status code filter
      if (filter.statusCode !== undefined && log.statusCode !== filter.statusCode) return false

      // Response time filters
      if (filter.minResponseTime !== undefined && (log.responseTime || 0) < filter.minResponseTime) return false
      if (filter.maxResponseTime !== undefined && (log.responseTime || Infinity) > filter.maxResponseTime) return false

      return true
    })
  }

  /**
   * Get log statistics
   */
  getStatistics(filter?: LogFilter): LogStatistics {
    const logs = filter ? this.applyFilters(this.getAllLogs(), filter) : this.getAllLogs()

    const stats: LogStatistics = {
      total: logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      },
      bySource: {},
      byComponent: {},
      byEndpoint: {},
      errorRate: 0,
      averageResponseTime: 0,
      slowestEndpoints: [],
      mostFrequentErrors: [],
    }

    let totalResponseTime = 0
    let responseTimeCount = 0
    const endpointTimes: Record<string, { total: number; count: number }> = {}
    const errorCounts: Record<string, { count: number; lastOccurred: string }> = {}

    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level]++

      // Count by source
      if (log.source) {
        stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1
      }

      // Count by component
      if (log.component) {
        stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1
      }

      // Count by endpoint
      if (log.endpoint) {
        stats.byEndpoint[log.endpoint] = (stats.byEndpoint[log.endpoint] || 0) + 1

        // Track response times for endpoints
        if (log.responseTime !== undefined) {
          if (!endpointTimes[log.endpoint]) {
            endpointTimes[log.endpoint] = { total: 0, count: 0 }
          }
          endpointTimes[log.endpoint].total += log.responseTime
          endpointTimes[log.endpoint].count++
        }
      }

      // Calculate average response time
      if (log.responseTime !== undefined) {
        totalResponseTime += log.responseTime
        responseTimeCount++
      }

      // Track errors
      if (log.level === 'error') {
        const errorKey = log.error?.message || log.message
        if (!errorCounts[errorKey]) {
          errorCounts[errorKey] = { count: 0, lastOccurred: log.timestamp }
        }
        errorCounts[errorKey].count++
        if (new Date(log.timestamp) > new Date(errorCounts[errorKey].lastOccurred)) {
          errorCounts[errorKey].lastOccurred = log.timestamp
        }
      }
    })

    // Calculate error rate
    if (logs.length > 0) {
      stats.errorRate = (stats.byLevel.error / logs.length) * 100
    }

    // Calculate average response time
    if (responseTimeCount > 0) {
      stats.averageResponseTime = totalResponseTime / responseTimeCount
    }

    // Get slowest endpoints
    stats.slowestEndpoints = Object.entries(endpointTimes)
      .map(([endpoint, data]) => ({
        endpoint,
        averageTime: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)

    // Get most frequent errors
    stats.mostFrequentErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurred: data.lastOccurred,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  /**
   * Rotate logs (remove old logs based on settings)
   */
  private rotateLogs(logs: LogEntry[]): LogEntry[] {
    const now = Date.now()
    const retentionMs = this.settings.retentionDays * 24 * 60 * 60 * 1000

    // Filter by retention period
    let filtered = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime()
      return now - logTime < retentionMs
    })

    // Limit by max logs
    if (filtered.length > this.settings.maxLogs) {
      // Sort by timestamp (oldest first) and keep only the newest ones
      filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      filtered = filtered.slice(-this.settings.maxLogs)
    }

    return filtered
  }

  /**
   * Delete logs
   */
  deleteLogs(filter?: LogFilter): number {
    if (typeof window === 'undefined') return 0

    try {
      if (filter) {
        const allLogs = this.getAllLogs()
        const filtered = this.applyFilters(allLogs, filter)
        const remaining = allLogs.filter(log => !filtered.some(f => f.id === log.id))
        localStorage.setItem(this.storageKey, JSON.stringify(remaining))
        return filtered.length
      } else {
        localStorage.removeItem(this.storageKey)
        return this.getAllLogs().length
      }
    } catch (error) {
      console.error('Error deleting logs:', error)
      return 0
    }
  }

  /**
   * Delete a single log by ID
   */
  deleteLog(id: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      const logs = this.getAllLogs()
      const filtered = logs.filter(log => log.id !== id)
      localStorage.setItem(this.storageKey, JSON.stringify(filtered))
      return filtered.length < logs.length
    } catch (error) {
      console.error('Error deleting log:', error)
      return false
    }
  }

  /**
   * Export logs to JSON
   */
  exportLogs(filter?: LogFilter): string {
    const logs = filter ? this.getLogs(filter) : this.getAllLogs()
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Export logs to CSV
   */
  exportLogsToCSV(filter?: LogFilter): string {
    const logs = filter ? this.getLogs(filter) : this.getAllLogs()

    const headers = ['ID', 'Timestamp', 'Level', 'Message', 'Source', 'Component', 'Endpoint', 'Status Code', 'Response Time (ms)', 'Error']
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.level,
      log.message.replace(/"/g, '""'), // Escape quotes
      log.source || '',
      log.component || '',
      log.endpoint || '',
      log.statusCode?.toString() || '',
      log.responseTime?.toString() || '',
      log.error ? `${log.error.name}: ${log.error.message}`.replace(/"/g, '""') : '',
    ])

    const csvRows = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ]

    return csvRows.join('\n')
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): number {
    if (typeof window === 'undefined') return 0

    try {
      const imported = JSON.parse(json) as LogEntry[]
      if (!Array.isArray(imported)) {
        throw new Error('Invalid log format')
      }

      const logs = this.getAllLogs()
      const merged = [...logs, ...imported]

      // Remove duplicates by ID
      const unique = merged.filter((log, index, self) =>
        index === self.findIndex(l => l.id === log.id)
      )

      localStorage.setItem(this.storageKey, JSON.stringify(unique))
      return imported.length
    } catch (error) {
      console.error('Error importing logs:', error)
      return 0
    }
  }

  /**
   * Clear all logs
   */
  clearAllLogs(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Error clearing logs:', error)
    }
  }
}

// Export singleton instance
let storageInstance: LogStorage | null = null

export function getLogStorage(): LogStorage {
  if (!storageInstance) {
    storageInstance = new LogStorage()
  }
  return storageInstance
}

