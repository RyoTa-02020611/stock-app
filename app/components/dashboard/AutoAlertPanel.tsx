'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'

interface MonitorAlert {
  id: string
  type: 'price' | 'earnings' | 'rating' | 'news' | 'risk' | 'opportunity'
  symbol: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  actionRequired?: boolean
  actionType?: 'buy' | 'sell' | 'hold' | 'watch'
}

export default function AutoAlertPanel() {
  const [alerts, setAlerts] = useState<MonitorAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/monitoring/check-alerts')
        
        if (!response.ok) {
          throw new Error('アラートの取得に失敗しました')
        }

        const data = await response.json()
        setAlerts(data.alerts || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('アラートの取得に失敗しました'))
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()

    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <LoadingSpinner size="md" message="アラートを確認中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <ErrorDisplay message={error.message} type="data" onRetry={() => window.location.reload()} />
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-amber-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return '💰'
      case 'earnings': return '📊'
      case 'rating': return '⭐'
      case 'news': return '📰'
      case 'risk': return '⚠️'
      case 'opportunity': return '🚀'
      default: return '🔔'
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 text-lg font-semibold">自動アラート</h3>
        <span className="text-gray-600 text-sm">
          {alerts.length}件のアラート
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">現在、アラートはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-md p-4 ${
                alert.severity === 'critical' ? 'border-red-600 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                alert.severity === 'medium' ? 'border-amber-500 bg-amber-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(alert.type)}</span>
                  <div>
                    <h4 className="text-gray-900 font-semibold text-sm">{alert.title}</h4>
                    <p className="text-gray-600 text-xs">{alert.symbol}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                  {alert.severity === 'critical' ? '緊急' :
                   alert.severity === 'high' ? '高' :
                   alert.severity === 'medium' ? '中' : '低'}
                </span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{alert.message}</p>
              {alert.actionRequired && (
                <div className="mt-2">
                  <span className="text-xs text-gray-600">推奨アクション: </span>
                  <span className="text-xs font-semibold text-[#0066cc]">
                    {alert.actionType === 'buy' ? '買い' :
                     alert.actionType === 'sell' ? '売り' :
                     alert.actionType === 'watch' ? '要観察' : '保持'}
                  </span>
                </div>
              )}
              <p className="text-gray-500 text-xs mt-2">
                {new Date(alert.timestamp).toLocaleString('ja-JP')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

