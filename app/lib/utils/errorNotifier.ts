/**
 * Error Notifier
 * 
 * Manages error thresholds, notifications, and alerts.
 */

import { LogEntry } from '../schema'
import { getLogStorage } from './logStorage'
import { getErrorAnalyzer, ErrorAnalysis } from './errorAnalyzer'

export interface ErrorThreshold {
  errorRate?: number // Percentage of errors in total logs
  errorCount?: number // Absolute number of errors
  timeWindow?: number // Time window in milliseconds
  action: 'warn' | 'error' | 'critical'
}

export interface ErrorAlert {
  id: string
  message: string
  threshold: ErrorThreshold
  triggeredAt: string
  resolvedAt?: string
  status: 'active' | 'resolved'
}

class ErrorNotifier {
  private thresholds: ErrorThreshold[] = []
  private alerts: ErrorAlert[] = []
  private checkInterval: NodeJS.Timeout | null = null
  private onAlertCallback?: (alert: ErrorAlert) => void

  /**
   * Set error thresholds
   */
  setThresholds(thresholds: ErrorThreshold[]): void {
    this.thresholds = thresholds
  }

  /**
   * Add a threshold
   */
  addThreshold(threshold: ErrorThreshold): void {
    this.thresholds.push(threshold)
  }

  /**
   * Remove a threshold
   */
  removeThreshold(index: number): void {
    this.thresholds.splice(index, 1)
  }

  /**
   * Get all thresholds
   */
  getThresholds(): ErrorThreshold[] {
    return [...this.thresholds]
  }

  /**
   * Set callback for alerts
   */
  setOnAlert(callback: (alert: ErrorAlert) => void): void {
    this.onAlertCallback = callback
  }

  /**
   * Start monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      this.stopMonitoring()
    }

    this.checkInterval = setInterval(() => {
      this.checkThresholds()
    }, intervalMs)

    // Check immediately
    this.checkThresholds()
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Check thresholds and trigger alerts if needed
   */
  checkThresholds(): void {
    if (this.thresholds.length === 0) return

    const logStorage = typeof window !== 'undefined' ? getLogStorage() : null
    if (!logStorage) return

    const errorAnalyzer = getErrorAnalyzer()
    const analysis = errorAnalyzer.analyzeErrors()

    this.thresholds.forEach(threshold => {
      const shouldAlert = this.evaluateThreshold(threshold, analysis)

      if (shouldAlert) {
        const existingAlert = this.alerts.find(
          a => a.status === 'active' && this.isSameThreshold(a.threshold, threshold)
        )

        if (!existingAlert) {
          const alert: ErrorAlert = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message: this.generateAlertMessage(threshold, analysis),
            threshold,
            triggeredAt: new Date().toISOString(),
            status: 'active',
          }

          this.alerts.push(alert)
          this.onAlertCallback?.(alert)
          this.showBrowserNotification(alert)
        }
      } else {
        // Resolve existing alerts for this threshold
        this.alerts.forEach(alert => {
          if (alert.status === 'active' && this.isSameThreshold(alert.threshold, threshold)) {
            alert.status = 'resolved'
            alert.resolvedAt = new Date().toISOString()
          }
        })
      }
    })
  }

  /**
   * Evaluate if a threshold is exceeded
   */
  private evaluateThreshold(threshold: ErrorThreshold, analysis: ErrorAnalysis): boolean {
    if (threshold.errorRate !== undefined) {
      if (analysis.errorRate >= threshold.errorRate) {
        return true
      }
    }

    if (threshold.errorCount !== undefined) {
      if (analysis.totalErrors >= threshold.errorCount) {
        return true
      }
    }

    return false
  }

  /**
   * Check if two thresholds are the same
   */
  private isSameThreshold(t1: ErrorThreshold, t2: ErrorThreshold): boolean {
    return (
      t1.errorRate === t2.errorRate &&
      t1.errorCount === t2.errorCount &&
      t1.action === t2.action
    )
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(threshold: ErrorThreshold, analysis: ErrorAnalysis): string {
    const parts: string[] = []

    if (threshold.errorRate !== undefined) {
      parts.push(`エラー率が${threshold.errorRate}%を超えました（現在: ${analysis.errorRate.toFixed(2)}%）`)
    }

    if (threshold.errorCount !== undefined) {
      parts.push(`エラー数が${threshold.errorCount}件を超えました（現在: ${analysis.totalErrors}件）`)
    }

    return parts.join('、')
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(alert: ErrorAlert): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification('エラーアラート', {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('エラーアラート', {
            body: alert.message,
            icon: '/favicon.ico',
            tag: alert.id,
          })
        }
      })
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ErrorAlert[] {
    return this.alerts.filter(a => a.status === 'active')
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): ErrorAlert[] {
    return [...this.alerts]
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && alert.status === 'active') {
      alert.status = 'resolved'
      alert.resolvedAt = new Date().toISOString()
    }
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = []
  }
}

// Export singleton instance
let notifierInstance: ErrorNotifier | null = null

export function getErrorNotifier(): ErrorNotifier {
  if (!notifierInstance) {
    notifierInstance = new ErrorNotifier()
  }
  return notifierInstance
}

