'use client'

import { ErrorTrend } from '../../../lib/utils/errorAnalyzer'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ErrorRateChartProps {
  trends: ErrorTrend[]
}

export default function ErrorRateChart({ trends }: ErrorRateChartProps) {
  const data = trends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    errorCount: trend.errorCount,
    uniqueErrors: trend.uniqueErrors,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">エラー発生トレンド</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="errorCount"
            stroke="#e53935"
            strokeWidth={2}
            name="エラー数"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="uniqueErrors"
            stroke="#f59e0b"
            strokeWidth={2}
            name="ユニークエラー数"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

