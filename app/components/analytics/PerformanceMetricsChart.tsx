'use client'

import { ApiUsage } from '../../../lib/utils/apiAnalyzer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PerformanceMetricsChartProps {
  apiUsage: ApiUsage[]
}

export default function PerformanceMetricsChart({ apiUsage }: PerformanceMetricsChartProps) {
  const data = apiUsage.slice(0, 10).map(usage => ({
    endpoint: `${usage.method} ${usage.endpoint.length > 30 ? usage.endpoint.substring(0, 30) + '...' : usage.endpoint}`,
    average: usage.averageResponseTime,
    p50: usage.p50ResponseTime,
    p95: usage.p95ResponseTime,
    p99: usage.p99ResponseTime,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">API応答時間（上位10エンドポイント）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" label={{ value: '応答時間 (ms)', position: 'insideBottom', offset: -5 }} />
          <YAxis dataKey="endpoint" type="category" width={200} stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
            formatter={(value: number) => `${value.toFixed(0)}ms`}
          />
          <Legend />
          <Bar dataKey="average" fill="#0066cc" name="平均" />
          <Bar dataKey="p50" fill="#4caf50" name="P50" />
          <Bar dataKey="p95" fill="#ff9800" name="P95" />
          <Bar dataKey="p99" fill="#e53935" name="P99" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

