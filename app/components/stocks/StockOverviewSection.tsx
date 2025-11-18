'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface StockOverviewSectionProps {
  symbol: string
}

export default function StockOverviewSection({ symbol }: StockOverviewSectionProps) {
  const [overview, setOverview] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [overviewRes, chartRes] = await Promise.all([
          fetch(`/api/stocks/${encodeURIComponent(symbol)}/overview`),
          fetch(`/api/stocks/${encodeURIComponent(symbol)}/chart?range=1mo`),
        ])

        if (overviewRes.ok) {
          const overviewData = await overviewRes.json()
          setOverview(overviewData)
        }

        if (chartRes.ok) {
          const chartDataRes = await chartRes.json()
          setChartData(chartDataRes.data || [])
        }
      } catch (error) {
        console.error('Error fetching overview:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [symbol])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-gray-700 rounded"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">データを取得できませんでした</p>
      </div>
    )
  }

  const quote = overview.quote || {}
  const isPositive = quote.changePercent >= 0

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">前日終値</p>
          <p className="text-white font-semibold">
            {quote.currency === 'JPY' ? '¥' : '$'}{quote.previousClose?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">出来高</p>
          <p className="text-white font-semibold">{quote.volume?.toLocaleString() || '--'}</p>
        </div>
        {quote.marketCap && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">時価総額</p>
            <p className="text-white font-semibold text-sm">
              {quote.marketCap >= 1e12
                ? `¥${(quote.marketCap / 1e12).toFixed(2)}兆`
                : quote.marketCap >= 1e9
                ? `¥${(quote.marketCap / 1e9).toFixed(2)}億`
                : `¥${(quote.marketCap / 1e6).toFixed(2)}百万`}
            </p>
          </div>
        )}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">市場</p>
          <p className="text-white font-semibold text-sm">{quote.market || '--'}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium mb-4">1ヶ月チャート</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '価格']}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? '#34D399' : '#F87171'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {overview.keyMetrics && overview.keyMetrics.length > 0 && (
        <div>
          <h3 className="text-gray-400 text-sm font-medium mb-4">主要指標</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {overview.keyMetrics.map((metric: any, index: number) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-xs mb-2">{metric.label}</p>
                <p className="text-white font-semibold text-lg">
                  {typeof metric.value === 'number' 
                    ? metric.value.toFixed(2) 
                    : metric.value}
                  {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Description */}
      {overview.description && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium mb-2">会社概要</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{overview.description}</p>
        </div>
      )}
    </div>
  )
}

