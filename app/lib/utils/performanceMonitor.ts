/**
 * Performance Monitor
 * 
 * Tracks API response times, operation durations, and other performance metrics.
 */

export interface PerformanceMetric {
  name: string // Metric name (e.g., 'api_call', 'data_processing')
  duration: number // Duration in milliseconds
  timestamp: string // ISO 8601 timestamp
  metadata?: Record<string, any> // Additional metadata
  memoryUsage?: number // Memory usage in bytes (if available)
}

export interface PerformanceThreshold {
  name: string
  threshold: number // Threshold in milliseconds
  action?: 'warn' | 'error' // Action to take when threshold is exceeded
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private thresholds: Map<string, PerformanceThreshold> = new Map()
  private maxMetrics: number = 1000 // Maximum number of metrics to keep in memory

  /**
   * Start timing an operation
   */
  start(name: string): () => PerformanceMetric {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    return () => {
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      const duration = endTime - startTime
      const memoryDelta = endMemory ? endMemory - (startMemory || 0) : undefined

      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: new Date().toISOString(),
        memoryUsage: memoryDelta,
      }

      this.recordMetric(metric)
      return metric
    }
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const stop = this.start(name)
    try {
      const result = await operation()
      const metric = stop()
      if (metadata) {
        metric.metadata = metadata
      }
      this.checkThreshold(metric)
      return result
    } catch (error) {
      const metric = stop()
      if (metadata) {
        metric.metadata = { ...metadata, error: error instanceof Error ? error.message : String(error) }
      }
      this.checkThreshold(metric)
      throw error
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    const stop = this.start(name)
    try {
      const result = operation()
      const metric = stop()
      if (metadata) {
        metric.metadata = metadata
      }
      this.checkThreshold(metric)
      return result
    } catch (error) {
      const metric = stop()
      if (metadata) {
        metric.metadata = { ...metadata, error: error instanceof Error ? error.message : String(error) }
      }
      this.checkThreshold(metric)
      throw error
    }
  }

  /**
   * Record a metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(filter?: { name?: string; startDate?: string; endDate?: string }): PerformanceMetric[] {
    let filtered = [...this.metrics]

    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name === filter.name)
      }
      if (filter.startDate) {
        filtered = filtered.filter(m => new Date(m.timestamp) >= new Date(filter.startDate!))
      }
      if (filter.endDate) {
        filtered = filtered.filter(m => new Date(m.timestamp) <= new Date(filter.endDate!))
      }
    }

    return filtered
  }

  /**
   * Get statistics for a metric name
   */
  getStatistics(name: string): {
    count: number
    average: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } | null {
    const metrics = this.metrics.filter(m => m.name === name)
    if (metrics.length === 0) return null

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)
    const average = sum / durations.length
    const min = durations[0]
    const max = durations[durations.length - 1]
    const p50 = durations[Math.floor(durations.length * 0.5)]
    const p95 = durations[Math.floor(durations.length * 0.95)]
    const p99 = durations[Math.floor(durations.length * 0.99)]

    return {
      count: metrics.length,
      average,
      min,
      max,
      p50,
      p95,
      p99,
    }
  }

  /**
   * Set a performance threshold
   */
  setThreshold(name: string, threshold: number, action: 'warn' | 'error' = 'warn'): void {
    this.thresholds.set(name, { name, threshold, action })
  }

  /**
   * Remove a threshold
   */
  removeThreshold(name: string): void {
    this.thresholds.delete(name)
  }

  /**
   * Check if a metric exceeds its threshold
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name)
    if (!threshold) return

    if (metric.duration > threshold.threshold) {
      const message = `Performance threshold exceeded: ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold.threshold}ms)`

      if (threshold.action === 'error') {
        console.error(`[PERFORMANCE ERROR] ${message}`, metric)
      } else {
        console.warn(`[PERFORMANCE WARN] ${message}`, metric)
      }
    }
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as any).memory
      return mem.usedJSHeapSize
    }
    return undefined
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Get slow operations (operations that exceed a threshold)
   */
  getSlowOperations(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold).sort((a, b) => b.duration - a.duration)
  }

  /**
   * Get metrics grouped by name
   */
  getMetricsByName(): Record<string, PerformanceMetric[]> {
    const grouped: Record<string, PerformanceMetric[]> = {}
    this.metrics.forEach(metric => {
      if (!grouped[metric.name]) {
        grouped[metric.name] = []
      }
      grouped[metric.name].push(metric)
    })
    return grouped
  }
}

// Export singleton instance
let monitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor()
  }
  return monitorInstance
}

