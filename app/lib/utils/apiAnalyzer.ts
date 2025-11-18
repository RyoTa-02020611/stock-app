/**
 * API Analyzer
 * 
 * Analyzes API usage patterns, error rates, response times, and usage frequency.
 */

import { LogEntry, LogFilter } from '../schema'
import { getLogStorage } from './logStorage'

export interface ApiUsage {
  endpoint: string
  method: string
  count: number
  successCount: number
  errorCount: number
  errorRate: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  lastCalled: string
  firstCalled: string
}

export interface ApiUsagePattern {
  endpoint: string
  method: string
  peakHours: number[] // Hours of day (0-23) with most calls
  peakDays: number[] // Days of week (0-6) with most calls
  averageCallsPerDay: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface ApiAnalysis {
  totalApiCalls: number
  uniqueEndpoints: number
  averageResponseTime: number
  overallErrorRate: number
  mostUsed: ApiUsage[]
  mostErrored: ApiUsage[]
  slowest: ApiUsage[]
  fastest: ApiUsage[]
  patterns: ApiUsagePattern[]
}

class ApiAnalyzer {
  /**
   * Analyze API usage
   */
  analyzeApiUsage(filter?: LogFilter): ApiAnalysis {
    const logStorage = typeof window !== 'undefined' ? getLogStorage() : null
    if (!logStorage) {
      return this.getEmptyAnalysis()
    }

    const apiFilter: LogFilter = {
      ...filter,
      endpoint: filter?.endpoint || undefined, // Don't filter by endpoint if not specified
    }

    const apiLogs = logStorage.getLogs(apiFilter).filter(log => log.endpoint && log.method)
    const allLogs = logStorage.getLogs(filter)

    if (apiLogs.length === 0) {
      return this.getEmptyAnalysis()
    }

    // Group by endpoint and method
    const usageMap = new Map<string, ApiUsage>()

    apiLogs.forEach(log => {
      if (!log.endpoint || !log.method) return

      const key = `${log.method}:${log.endpoint}`
      const existing = usageMap.get(key)

      if (existing) {
        existing.count++
        if (log.statusCode) {
          if (log.statusCode >= 200 && log.statusCode < 300) {
            existing.successCount++
          } else {
            existing.errorCount++
          }
        }
        if (log.responseTime !== undefined) {
          existing.averageResponseTime = (existing.averageResponseTime * (existing.count - 1) + log.responseTime) / existing.count
          existing.minResponseTime = Math.min(existing.minResponseTime, log.responseTime)
          existing.maxResponseTime = Math.max(existing.maxResponseTime, log.responseTime)
        }
        if (new Date(log.timestamp) > new Date(existing.lastCalled)) {
          existing.lastCalled = log.timestamp
        }
        if (new Date(log.timestamp) < new Date(existing.firstCalled)) {
          existing.firstCalled = log.timestamp
        }
      } else {
        const isSuccess = log.statusCode ? log.statusCode >= 200 && log.statusCode < 300 : false
        usageMap.set(key, {
          endpoint: log.endpoint,
          method: log.method,
          count: 1,
          successCount: isSuccess ? 1 : 0,
          errorCount: isSuccess ? 0 : 1,
          errorRate: isSuccess ? 0 : 100,
          averageResponseTime: log.responseTime || 0,
          minResponseTime: log.responseTime || 0,
          maxResponseTime: log.responseTime || 0,
          p50ResponseTime: log.responseTime || 0,
          p95ResponseTime: log.responseTime || 0,
          p99ResponseTime: log.responseTime || 0,
          lastCalled: log.timestamp,
          firstCalled: log.timestamp,
        })
      }
    })

    // Calculate percentiles for each endpoint
    const usages = Array.from(usageMap.values())
    usages.forEach(usage => {
      const endpointLogs = apiLogs.filter(
        log => log.endpoint === usage.endpoint && log.method === usage.method && log.responseTime !== undefined
      )
      const responseTimes = endpointLogs.map(log => log.responseTime!).sort((a, b) => a - b)

      if (responseTimes.length > 0) {
        usage.p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)]
        usage.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)]
        usage.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)]
      }

      usage.errorRate = usage.count > 0 ? (usage.errorCount / usage.count) * 100 : 0
    })

    // Calculate overall statistics
    const totalResponseTime = apiLogs
      .filter(log => log.responseTime !== undefined)
      .reduce((sum, log) => sum + (log.responseTime || 0), 0)
    const responseTimeCount = apiLogs.filter(log => log.responseTime !== undefined).length
    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0

    const totalErrors = apiLogs.filter(log => log.statusCode && log.statusCode >= 400).length
    const overallErrorRate = apiLogs.length > 0 ? (totalErrors / apiLogs.length) * 100 : 0

    // Analyze usage patterns
    const patterns = this.analyzeUsagePatterns(apiLogs)

    return {
      totalApiCalls: apiLogs.length,
      uniqueEndpoints: usages.length,
      averageResponseTime,
      overallErrorRate,
      mostUsed: [...usages].sort((a, b) => b.count - a.count).slice(0, 10),
      mostErrored: [...usages].filter(u => u.errorCount > 0).sort((a, b) => b.errorCount - a.errorCount).slice(0, 10),
      slowest: [...usages].sort((a, b) => b.averageResponseTime - a.averageResponseTime).slice(0, 10),
      fastest: [...usages].sort((a, b) => a.averageResponseTime - b.averageResponseTime).slice(0, 10),
      patterns,
    }
  }

  /**
   * Analyze usage patterns
   */
  private analyzeUsagePatterns(logs: LogEntry[]): ApiUsagePattern[] {
    const patternMap = new Map<string, ApiUsagePattern>()

    logs.forEach(log => {
      if (!log.endpoint || !log.method) return

      const key = `${log.method}:${log.endpoint}`
      const date = new Date(log.timestamp)
      const hour = date.getHours()
      const day = date.getDay()

      if (!patternMap.has(key)) {
        patternMap.set(key, {
          endpoint: log.endpoint,
          method: log.method,
          peakHours: [],
          peakDays: [],
          averageCallsPerDay: 0,
          trend: 'stable',
        })
      }

      const pattern = patternMap.get(key)!
      // This is simplified - in a real implementation, you'd track hour/day counts
    })

    // Calculate patterns (simplified)
    const patterns = Array.from(patternMap.values())

    // Calculate average calls per day
    const firstLog = logs[0]
    const lastLog = logs[logs.length - 1]
    if (firstLog && lastLog) {
      const daysDiff = (new Date(lastLog.timestamp).getTime() - new Date(firstLog.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      patterns.forEach(pattern => {
        const endpointLogs = logs.filter(
          log => log.endpoint === pattern.endpoint && log.method === pattern.method
        )
        pattern.averageCallsPerDay = daysDiff > 0 ? endpointLogs.length / daysDiff : endpointLogs.length
      })
    }

    return patterns
  }

  /**
   * Get empty analysis result
   */
  private getEmptyAnalysis(): ApiAnalysis {
    return {
      totalApiCalls: 0,
      uniqueEndpoints: 0,
      averageResponseTime: 0,
      overallErrorRate: 0,
      mostUsed: [],
      mostErrored: [],
      slowest: [],
      fastest: [],
      patterns: [],
    }
  }
}

// Export singleton instance
let analyzerInstance: ApiAnalyzer | null = null

export function getApiAnalyzer(): ApiAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new ApiAnalyzer()
  }
  return analyzerInstance
}

