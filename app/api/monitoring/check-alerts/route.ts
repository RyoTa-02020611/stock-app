import { NextRequest, NextResponse } from 'next/server'
import { getAutoMonitor } from '../../../lib/monitoring/autoMonitor'

/**
 * GET /api/monitoring/check-alerts
 * 
 * Checks for all monitoring alerts
 */
export async function GET(request: NextRequest) {
  try {
    const monitor = getAutoMonitor()
    const alerts = await monitor.checkAllAlerts()

    // Sort by severity and timestamp
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
        actionRequired: alerts.filter(a => a.actionRequired).length,
      },
    })
  } catch (error: any) {
    console.error('Monitoring alerts API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check alerts' },
      { status: 500 }
    )
  }
}

