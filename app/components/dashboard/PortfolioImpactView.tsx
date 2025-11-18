'use client'

import { useEffect, useState } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position } from '../../lib/schema'
import { getPriceImpactPredictor } from '../../lib/ai/priceImpactPredictor'
import { getMarketDataClient } from '../../lib/marketDataClient'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface StockImpact {
  symbol: string
  name: string
  impactScore: number
  confidence: number
}

export default function PortfolioImpactView() {
  const [impacts, setImpacts] = useState<StockImpact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadImpacts = async () => {
      try {
        setLoading(true)
        setError(null)

        const storage = getStorageAdapter()
        const positions = await storage.getPositions()
        const marketClient = getMarketDataClient()
        const predictor = getPriceImpactPredictor()

        const impactPromises = positions.map(async (position) => {
          try {
            const quote = await marketClient.getQuote(position.symbol)
            const summary = await predictor.predict(quote.symbol, quote.price, ['short'])

            return {
              symbol: position.symbol,
              name: quote.name,
              impactScore: summary.overallImpact,
              confidence: summary.overallConfidence,
            }
          } catch (err) {
            console.error(`Error loading impact for ${position.symbol}:`, err)
            return null
          }
        })

        const results = await Promise.all(impactPromises)
        const validImpacts = results.filter((r): r is StockImpact => r !== null)
        setImpacts(validImpacts.sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore)))
      } catch (err) {
        setError(err instanceof Error ? err : new Error('影響分析の取得に失敗しました'))
      } finally {
        setLoading(false)
      }
    }

    loadImpacts()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <LoadingSpinner size="md" message="影響分析を計算中..." />
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

  const chartData = impacts.map(impact => ({
    symbol: impact.symbol,
    impact: impact.impactScore,
  }))

  const getColor = (score: number) => {
    if (score > 30) return '#00c853'
    if (score < -30) return '#e53935'
    return '#9ca3af'
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4">ポートフォリオ影響スコア</h3>
      
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="symbol" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              domain={[-100, 100]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
            <Bar dataKey="impact">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.impact)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {impacts.map((impact) => (
          <div key={impact.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div>
              <p className="text-gray-900 font-semibold text-sm">{impact.symbol}</p>
              <p className="text-gray-600 text-xs">{impact.name}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${getColor(impact.impactScore)}`}>
                {impact.impactScore > 0 ? '+' : ''}{impact.impactScore.toFixed(1)}
              </p>
              <p className="text-gray-500 text-xs">信頼度: {impact.confidence.toFixed(0)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

