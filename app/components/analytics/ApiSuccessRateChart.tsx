'use client'

import { ApiUsage } from '../../../lib/utils/apiAnalyzer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ApiSuccessRateChartProps {
  apiUsage: ApiUsage[]
}

export default function ApiSuccessRateChart({ apiUsage }: ApiSuccessRateChartProps) {
  const data = apiUsage.slice(0, 10).map(usage => ({
    endpoint: `${usage.method} ${usage.endpoint.length > 30 ? usage.endpoint.substring(0, 30) + '...' : usage.endpoint}`,
    successRate: 100 - usage.errorRate,
    errorRate: usage.errorRate,
    successCount: usage.successCount,
    errorCount: usage.errorCount,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">API成功率（上位10エンドポイント）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis dataKey="endpoint" type="category" width={200} stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'successRate' || name === 'errorRate') {
                return [`${value.toFixed(2)}%`, name === 'successRate' ? '成功率' : 'エラー率']
              }
              return [value, name === 'successCount' ? '成功数' : 'エラー数']
            }}
          />
          <Legend />
          <Bar dataKey="successRate" fill="#00c853" name="成功率 (%)" />
          <Bar dataKey="errorRate" fill="#e53935" name="エラー率 (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

