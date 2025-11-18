'use client'

import { LogStatistics as LogStats, LogFilter } from '../../lib/schema'
import { getLogStorage } from '../../lib/utils/logStorage'
import { useEffect, useState } from 'react'

interface LogStatisticsProps {
  filter?: LogFilter
}

export default function LogStatistics({ filter }: LogStatisticsProps) {
  const [stats, setStats] = useState<LogStats | null>(null)

  useEffect(() => {
    const logStorage = typeof window !== 'undefined' ? getLogStorage() : null
    if (!logStorage) return

    const statistics = logStorage.getStatistics(filter)
    setStats(statistics)
  }, [filter])

  if (!stats) {
    return <div className="text-gray-600">統計を読み込んでいます...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Logs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">総ログ数</div>
        <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
      </div>

      {/* Error Rate */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">エラー率</div>
        <div className={`text-2xl font-bold ${stats.errorRate > 10 ? 'text-[#e53935]' : stats.errorRate > 5 ? 'text-amber-600' : 'text-gray-900'}`}>
          {stats.errorRate.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">{stats.byLevel.error} エラー</div>
      </div>

      {/* Average Response Time */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">平均応答時間</div>
        <div className={`text-2xl font-bold ${stats.averageResponseTime > 2000 ? 'text-[#e53935]' : stats.averageResponseTime > 1000 ? 'text-amber-600' : 'text-gray-900'}`}>
          {stats.averageResponseTime > 0 ? `${stats.averageResponseTime.toFixed(0)}ms` : 'N/A'}
        </div>
      </div>

      {/* Unique Endpoints */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">ユニークエンドポイント</div>
        <div className="text-2xl font-bold text-gray-900">{Object.keys(stats.byEndpoint).length}</div>
      </div>
    </div>
  )
}

