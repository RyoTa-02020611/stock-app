'use client'

import { useEffect, useState } from 'react'

interface StockInsightResponse {
  symbol: string
  companyName?: string
  latestPrice?: number
  changePercent?: number
  trend30d?: 'up' | 'down' | 'sideways'
  volatilityLevel?: 'low' | 'medium' | 'high'
  newsSummary?: {
    positiveCount: number
    negativeCount: number
    neutralCount: number
    latestNews: Array<{
      title: string
      publishedAt: string
      url: string
      source?: string
    }>
  }
  observations: string[]
  impactSummary: string
}

interface StockInsightPanelProps {
  symbol: string
}

export default function StockInsightPanel({ symbol }: StockInsightPanelProps) {
  const [data, setData] = useState<StockInsightResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return

    const fetchInsight = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/stock-insight?symbol=${encodeURIComponent(symbol)}`)
        
        if (!response.ok) {
          throw new Error('データの取得に失敗しました')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching stock insight:', err)
        setError('データを取得できませんでした。時間をおいて再度お試しください。')
      } finally {
        setLoading(false)
      }
    }

    fetchInsight()
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-gray-400 text-sm font-medium mb-4">銘柄インサイト</h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-gray-400 text-sm font-medium mb-4">銘柄インサイト</h3>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const isPositive = (data.changePercent || 0) >= 0

  // Trend label
  const trendLabel = data.trend30d === 'up' ? '上昇傾向' : data.trend30d === 'down' ? '下落傾向' : '横ばい'
  const trendColor = data.trend30d === 'up' ? 'text-green-400' : data.trend30d === 'down' ? 'text-red-400' : 'text-gray-400'

  // Volatility label
  const volatilityLabel = data.volatilityLevel === 'high' ? '高' : data.volatilityLevel === 'medium' ? '中' : '低'
  const volatilityColor = data.volatilityLevel === 'high' ? 'text-orange-400' : data.volatilityLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
      <h3 className="text-gray-400 text-sm font-medium mb-4">銘柄インサイト</h3>

      {/* Company Info */}
      <div className="mb-6">
        <h4 className="text-white text-lg font-bold mb-2">
          {data.companyName || data.symbol}
        </h4>
        <p className="text-gray-400 text-sm mb-3">{data.symbol}</p>
        
        {data.latestPrice !== undefined && (
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-white text-2xl font-bold">
              ${data.latestPrice.toFixed(2)}
            </p>
            {data.changePercent !== undefined && (
              <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
              </p>
            )}
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {data.trend30d && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">30日騰落率</p>
              <p className={`text-sm font-semibold ${trendColor}`}>{trendLabel}</p>
            </div>
          )}
          {data.volatilityLevel && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">ボラティリティ</p>
              <p className={`text-sm font-semibold ${volatilityColor}`}>{volatilityLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* News Summary */}
      {data.newsSummary && (
        <div className="mb-6 pb-6 border-b border-gray-700">
          <h5 className="text-gray-400 text-xs font-medium mb-3">ニュース分析</h5>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">好材料: {data.newsSummary.positiveCount}件</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">✗</span>
              <span className="text-gray-300">懸念材料: {data.newsSummary.negativeCount}件</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">○</span>
              <span className="text-gray-300">中立: {data.newsSummary.neutralCount}件</span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Observations */}
      {data.observations && data.observations.length > 0 && (
        <div className="mb-6">
          <h5 className="text-gray-400 text-xs font-medium mb-3">分析結果</h5>
          <ul className="space-y-2">
            {data.observations.map((observation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <p className="text-gray-300 text-sm flex-1 leading-relaxed">{observation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Future Impact */}
      {data.impactSummary && (
        <div className="mb-6 pb-6 border-b border-gray-700">
          <h5 className="text-gray-400 text-xs font-medium mb-3">将来への影響</h5>
          <p className="text-gray-300 text-sm leading-relaxed">
            {data.impactSummary}
          </p>
        </div>
      )}

      {/* Recent News */}
      {data.newsSummary?.latestNews && data.newsSummary.latestNews.length > 0 && (
        <div className="mb-6">
          <h5 className="text-gray-400 text-xs font-medium mb-3">関連ニュース</h5>
          <div className="space-y-2">
            {data.newsSummary.latestNews.slice(0, 3).map((news, index) => (
              <a
                key={index}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <p className="text-gray-300 text-xs line-clamp-2 mb-1">{news.title}</p>
                {news.source && (
                  <p className="text-gray-500 text-xs">{news.source}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="pt-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs leading-relaxed">
          ※この分析は自動生成された参考情報であり、将来の株価を保証するものではありません。投資判断ではなく、学習目的としてお使いください。
        </p>
      </div>
    </div>
  )
}
