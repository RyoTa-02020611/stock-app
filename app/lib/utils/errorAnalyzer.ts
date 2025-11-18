/**
 * Error Analyzer
 * 
 * Analyzes error patterns, frequencies, grouping, and trends.
 */

import { LogEntry, LogFilter } from '../schema'
import { getLogStorage } from './logStorage'

export interface ErrorPattern {
  message: string
  errorName: string
  count: number
  firstOccurred: string
  lastOccurred: string
  occurrences: Array<{
    timestamp: string
    context?: Record<string, any>
    endpoint?: string
    component?: string
  }>
}

export interface ErrorGroup {
  pattern: ErrorPattern
  similarErrors: ErrorPattern[]
  totalCount: number
  affectedEndpoints: string[]
  affectedComponents: string[]
}

export interface ErrorTrend {
  date: string
  errorCount: number
  uniqueErrors: number
  errors: ErrorPattern[]
}

export interface ErrorAnalysis {
  totalErrors: number
  uniqueErrors: number
  errorRate: number
  patterns: ErrorPattern[]
  groups: ErrorGroup[]
  trends: ErrorTrend[]
  mostFrequent: ErrorPattern[]
  recentErrors: ErrorPattern[]
  affectedEndpoints: Array<{ endpoint: string; errorCount: number }>
  affectedComponents: Array<{ component: string; errorCount: number }>
}

class ErrorAnalyzer {
  /**
   * Analyze errors from logs
   */
  analyzeErrors(filter?: LogFilter): ErrorAnalysis {
    const logStorage = typeof window !== 'undefined' ? getLogStorage() : null
    if (!logStorage) {
      return this.getEmptyAnalysis()
    }

    const errorFilter: LogFilter = {
      ...filter,
      level: 'error',
    }

    const errorLogs = logStorage.getLogs(errorFilter)
    const allLogs = logStorage.getLogs(filter)
    const totalLogs = allLogs.length

    // Extract error patterns
    const patterns = this.extractErrorPatterns(errorLogs)

    // Group similar errors
    const groups = this.groupSimilarErrors(patterns)

    // Calculate trends
    const trends = this.calculateTrends(errorLogs)

    // Get most frequent errors
    const mostFrequent = [...patterns].sort((a, b) => b.count - a.count).slice(0, 10)

    // Get recent errors
    const recentErrors = [...patterns]
      .sort((a, b) => new Date(b.lastOccurred).getTime() - new Date(a.lastOccurred).getTime())
      .slice(0, 10)

    // Analyze affected endpoints
    const affectedEndpoints = this.analyzeAffectedEndpoints(errorLogs)

    // Analyze affected components
    const affectedComponents = this.analyzeAffectedComponents(errorLogs)

    // Calculate error rate
    const errorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0

    return {
      totalErrors: errorLogs.length,
      uniqueErrors: patterns.length,
      errorRate,
      patterns,
      groups,
      trends,
      mostFrequent,
      recentErrors,
      affectedEndpoints,
      affectedComponents,
    }
  }

  /**
   * Extract error patterns from logs
   */
  private extractErrorPatterns(logs: LogEntry[]): ErrorPattern[] {
    const patternMap = new Map<string, ErrorPattern>()

    logs.forEach(log => {
      if (!log.error) return

      const key = `${log.error.name}:${log.error.message}`
      const existing = patternMap.get(key)

      if (existing) {
        existing.count++
        if (new Date(log.timestamp) > new Date(existing.lastOccurred)) {
          existing.lastOccurred = log.timestamp
        }
        if (new Date(log.timestamp) < new Date(existing.firstOccurred)) {
          existing.firstOccurred = log.timestamp
        }
        existing.occurrences.push({
          timestamp: log.timestamp,
          context: log.context,
          endpoint: log.endpoint,
          component: log.component,
        })
      } else {
        patternMap.set(key, {
          message: log.error.message,
          errorName: log.error.name,
          count: 1,
          firstOccurred: log.timestamp,
          lastOccurred: log.timestamp,
          occurrences: [
            {
              timestamp: log.timestamp,
              context: log.context,
              endpoint: log.endpoint,
              component: log.component,
            },
          ],
        })
      }
    })

    return Array.from(patternMap.values())
  }

  /**
   * Group similar errors
   */
  private groupSimilarErrors(patterns: ErrorPattern[]): ErrorGroup[] {
    const groups: ErrorGroup[] = []
    const processed = new Set<string>()

    patterns.forEach(pattern => {
      if (processed.has(pattern.message)) return

      const similar = patterns.filter(p => {
        if (p.message === pattern.message) return true
        // Simple similarity check (can be improved)
        const similarity = this.calculateSimilarity(pattern.message, p.message)
        return similarity > 0.7
      })

      const affectedEndpoints = new Set<string>()
      const affectedComponents = new Set<string>()

      similar.forEach(p => {
        p.occurrences.forEach(occ => {
          if (occ.endpoint) affectedEndpoints.add(occ.endpoint)
          if (occ.component) affectedComponents.add(occ.component)
        })
        processed.add(p.message)
      })

      groups.push({
        pattern: similar[0], // Use the most frequent as the main pattern
        similarErrors: similar.slice(1),
        totalCount: similar.reduce((sum, p) => sum + p.count, 0),
        affectedEndpoints: Array.from(affectedEndpoints),
        affectedComponents: Array.from(affectedComponents),
      })
    })

    return groups.sort((a, b) => b.totalCount - a.totalCount)
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Calculate error trends over time
   */
  private calculateTrends(logs: LogEntry[]): ErrorTrend[] {
    const trendsMap = new Map<string, ErrorTrend>()

    logs.forEach(log => {
      if (!log.error) return

      const date = new Date(log.timestamp).toISOString().split('T')[0]

      if (!trendsMap.has(date)) {
        trendsMap.set(date, {
          date,
          errorCount: 0,
          uniqueErrors: 0,
          errors: [],
        })
      }

      const trend = trendsMap.get(date)!
      trend.errorCount++

      const errorKey = `${log.error.name}:${log.error.message}`
      if (!trend.errors.some(e => `${e.errorName}:${e.message}` === errorKey)) {
        trend.uniqueErrors++
        trend.errors.push({
          message: log.error.message,
          errorName: log.error.name,
          count: 1,
          firstOccurred: log.timestamp,
          lastOccurred: log.timestamp,
          occurrences: [],
        })
      }
    })

    return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Analyze affected endpoints
   */
  private analyzeAffectedEndpoints(logs: LogEntry[]): Array<{ endpoint: string; errorCount: number }> {
    const endpointMap = new Map<string, number>()

    logs.forEach(log => {
      if (log.endpoint) {
        endpointMap.set(log.endpoint, (endpointMap.get(log.endpoint) || 0) + 1)
      }
    })

    return Array.from(endpointMap.entries())
      .map(([endpoint, errorCount]) => ({ endpoint, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
  }

  /**
   * Analyze affected components
   */
  private analyzeAffectedComponents(logs: LogEntry[]): Array<{ component: string; errorCount: number }> {
    const componentMap = new Map<string, number>()

    logs.forEach(log => {
      if (log.component) {
        componentMap.set(log.component, (componentMap.get(log.component) || 0) + 1)
      }
    })

    return Array.from(componentMap.entries())
      .map(([component, errorCount]) => ({ component, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
  }

  /**
   * Get empty analysis result
   */
  private getEmptyAnalysis(): ErrorAnalysis {
    return {
      totalErrors: 0,
      uniqueErrors: 0,
      errorRate: 0,
      patterns: [],
      groups: [],
      trends: [],
      mostFrequent: [],
      recentErrors: [],
      affectedEndpoints: [],
      affectedComponents: [],
    }
  }
}

// Export singleton instance
let analyzerInstance: ErrorAnalyzer | null = null

export function getErrorAnalyzer(): ErrorAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new ErrorAnalyzer()
  }
  return analyzerInstance
}

