'use client'

import { useEffect, useState } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position } from '../../lib/schema'
import { getPriceImpactPredictor } from '../../lib/ai/priceImpactPredictor'
import { getMarketDataClient } from '../../lib/marketDataClient'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'

interface StockImpact {
  symbol: string
  name: string
  currentPrice: number
  overallImpact: number
  overallConfidence: number
  shortTermImpact: number
  mediumTermImpact: number
  recommendation: 'buy' | 'hold' | 'sell' | 'watch'
  topFactors: Array<{ source: 'economic' | 'earnings' | 'market_trends' | 'social' | 'analyst' | 'news'; impactScore: number; description: string }>
}

export default function ImpactAnalysisDashboard() {
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
            const summary = await predictor.predict(quote.symbol, quote.price, ['short', 'medium'])

            const topFactors = [
              ...summary.shortTerm.factors,
              ...summary.mediumTerm.factors,
            ]
              .sort((a, b) => Math.abs(b.impactScore * b.weight) - Math.abs(a.impactScore * a.weight))
              .slice(0, 3)
              .map(f => ({
                source: f.source,
                impactScore: f.impactScore,
                description: f.description,
              }))

            return {
              symbol: position.symbol,
              name: quote.name,
              currentPrice: quote.price,
              overallImpact: summary.overallImpact,
              overallConfidence: summary.overallConfidence,
              shortTermImpact: summary.shortTerm.impactScore,
              mediumTermImpact: summary.mediumTerm.impactScore,
              recommendation: summary.shortTerm.recommendation,
              topFactors,
            }
          } catch (err) {
            console.error(`Error analyzing impact for ${position.symbol}:`, err)
            return null
          }
        })

        const results = await Promise.all(impactPromises)
        const validImpacts = results.filter((r): r is StockImpact => r !== null)
        setImpacts(validImpacts.sort((a, b) => Math.abs(b.overallImpact) - Math.abs(a.overallImpact)))
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

  if (impacts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <p className="text-gray-600 text-center">ポートフォリオに銘柄がありません</p>
      </div>
    )
  }

  const getImpactColor = (score: number) => {
    if (score > 30) return 'text-[#00c853] bg-green-50'
    if (score < -30) return 'text-[#e53935] bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'bg-[#00c853] text-white'
      case 'sell': return 'bg-[#e53935] text-white'
      case 'watch': return 'bg-amber-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'buy': return '買い'
      case 'sell': return '売り'
      case 'watch': return '要観察'
      default: return '保持'
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4">ポートフォリオ影響分析</h3>
      
      <div className="space-y-4">
        {impacts.map((impact) => (
          <div key={impact.symbol} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-gray-900 font-semibold">{impact.symbol}</h4>
                <p className="text-gray-600 text-sm">{impact.name}</p>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-md text-sm font-medium ${getRecommendationColor(impact.recommendation)}`}>
                  {getRecommendationText(impact.recommendation)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-gray-600 text-xs mb-1">総合影響</p>
                <p className={`text-lg font-bold ${getImpactColor(impact.overallImpact).split(' ')[0]}`}>
                  {impact.overallImpact > 0 ? '+' : ''}{impact.overallImpact.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-1">短期影響</p>
                <p className={`text-sm font-semibold ${getImpactColor(impact.shortTermImpact).split(' ')[0]}`}>
                  {impact.shortTermImpact > 0 ? '+' : ''}{impact.shortTermImpact.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-1">中期影響</p>
                <p className={`text-sm font-semibold ${getImpactColor(impact.mediumTermImpact).split(' ')[0]}`}>
                  {impact.mediumTermImpact > 0 ? '+' : ''}{impact.mediumTermImpact.toFixed(1)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-gray-600 text-xs mb-2">主要要因</p>
              <div className="space-y-1">
                {impact.topFactors.map((factor, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">{factor.source}:</span> {factor.description.split('。')[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

