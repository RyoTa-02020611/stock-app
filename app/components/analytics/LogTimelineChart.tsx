'use client'

import { LogStatistics } from '../../lib/schema'
import { getLogStorage } from '../../lib/utils/logStorage'
import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface LogTimelineChartProps {
  days?: number
}

export default function LogTimelineChart({ days = 7 }: LogTimelineChartProps) {
  const [data, setData] = useState<Array<{ date: string; debug: number; info: number; warn: number; error: number }>>([])

  useEffect(() => {
    const logStorage = typeof window !== 'undefined' ? getLogStorage() : null
    if (!logStorage) return

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = logStorage.getLogs({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })

    // Group by date
    const dateMap = new Map<string, { debug: number; info: number; warn: number; error: number }>()

    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      if (!dateMap.has(date)) {
        dateMap.set(date, { debug: 0, info: 0, warn: 0, error: 0 })
      }
      const counts = dateMap.get(date)!
      counts[log.level]++
    })

    const chartData = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setData(chartData)
  }, [days])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ログタイムライン（過去{days}日間）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="debug" stackId="1" stroke="#9ca3af" fill="#9ca3af" name="DEBUG" />
          <Area type="monotone" dataKey="info" stackId="1" stroke="#0066cc" fill="#0066cc" name="INFO" />
          <Area type="monotone" dataKey="warn" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="WARN" />
          <Area type="monotone" dataKey="error" stackId="1" stroke="#e53935" fill="#e53935" name="ERROR" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

