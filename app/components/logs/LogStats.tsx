'use client'

import { LogStatistics } from '../../lib/schema'

interface LogStatsProps {
  stats: LogStatistics
}

export default function LogStats({ stats }: LogStatsProps) {
  const total = stats.total
  const errorCount = stats.byLevel.error
  const errorRate = stats.errorRate

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Logs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">総ログ数</div>
        <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
      </div>

      {/* Error Rate */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">エラー率</div>
        <div className={`text-2xl font-bold ${errorRate > 10 ? 'text-[#e53935]' : errorRate > 5 ? 'text-amber-600' : 'text-gray-900'}`}>
          {errorRate.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">{errorCount} エラー</div>
      </div>

      {/* Average Response Time */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-1">平均応答時間</div>
        <div className={`text-2xl font-bold ${stats.averageResponseTime > 2000 ? 'text-[#e53935]' : stats.averageResponseTime > 1000 ? 'text-amber-600' : 'text-gray-900'}`}>
          {stats.averageResponseTime > 0 ? `${stats.averageResponseTime.toFixed(0)}ms` : 'N/A'}
        </div>
      </div>

      {/* Logs by Level */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-600 mb-2">ログレベル別</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">ERROR:</span>
            <span className="font-semibold text-[#e53935]">{stats.byLevel.error}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">WARN:</span>
            <span className="font-semibold text-amber-600">{stats.byLevel.warn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">INFO:</span>
            <span className="font-semibold text-blue-600">{stats.byLevel.info}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DEBUG:</span>
            <span className="font-semibold text-gray-600">{stats.byLevel.debug}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

