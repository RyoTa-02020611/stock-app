'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'

interface PriceImpactPrediction {
  symbol: string
  timeframe: 'short' | 'medium' | 'long'
  impactScore: number
  confidence: number
  factors: Array<{ source: string; impactScore: number; weight: number; description: string }>
  predictedPriceRange: { low: number; high: number; base: number }
  recommendation: 'buy' | 'hold' | 'sell' | 'watch'
  description: string
  timestamp: string
}

interface PriceImpactSummary {
  symbol: string
  shortTerm: PriceImpactPrediction
  mediumTerm: PriceImpactPrediction
  longTerm?: PriceImpactPrediction
  overallImpact: number
  overallConfidence: number
}

interface PriceImpactPanelProps {
  symbol: string
  currentPrice: number
}

export default function PriceImpactPanel({ symbol, currentPrice }: PriceImpactPanelProps) {
  const [summary, setSummary] = useState<PriceImpactSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/ai/predict-impact?symbol=${symbol}&timeframes=short,medium`)
        
        if (!response.ok) {
          throw new Error('予測の取得に失敗しました')
        }

        const data = await response.json()
        setSummary(data.summary)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('予測の取得に失敗しました'))
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <LoadingSpinner size="md" message="影響予測を計算中..." />
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

  if (!summary) {
    return null
  }

  const getImpactColor = (score: number) => {
    if (score > 30) return 'text-[#00c853]'
    if (score < -30) return 'text-[#e53935]'
    return 'text-gray-600'
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
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-6">
      <div>
        <h3 className="text-gray-900 text-lg font-semibold mb-2">株価影響予測</h3>
        <p className="text-gray-600 text-sm">複数の情報源を統合分析した予測結果</p>
      </div>

      {/* Overall Impact */}
      <div className="bg-gray-50 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600 text-sm">総合影響スコア</span>
          <span className={`text-2xl font-bold ${getImpactColor(summary.overallImpact)}`}>
            {summary.overallImpact > 0 ? '+' : ''}{summary.overallImpact.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">信頼度</span>
          <span className="text-gray-900 font-semibold">{summary.overallConfidence.toFixed(0)}%</span>
        </div>
      </div>

      {/* Short Term Prediction */}
      <div>
        <h4 className="text-gray-900 font-medium mb-3">短期予測（1日〜1週間）</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">影響スコア</span>
            <span className={`font-semibold ${getImpactColor(summary.shortTerm.impactScore)}`}>
              {summary.shortTerm.impactScore > 0 ? '+' : ''}{summary.shortTerm.impactScore.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">推奨アクション</span>
            <span className={`px-3 py-1 rounded-md text-sm font-medium ${getRecommendationColor(summary.shortTerm.recommendation)}`}>
              {getRecommendationText(summary.shortTerm.recommendation)}
            </span>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-gray-600 text-xs mb-2">予測価格範囲</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">${summary.shortTerm.predictedPriceRange.low.toFixed(2)}</span>
              <span className="text-gray-900 font-semibold">${summary.shortTerm.predictedPriceRange.base.toFixed(2)}</span>
              <span className="text-gray-500">${summary.shortTerm.predictedPriceRange.high.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">{summary.shortTerm.description}</p>
        </div>
      </div>

      {/* Medium Term Prediction */}
      <div>
        <h4 className="text-gray-900 font-medium mb-3">中期予測（1ヶ月〜3ヶ月）</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">影響スコア</span>
            <span className={`font-semibold ${getImpactColor(summary.mediumTerm.impactScore)}`}>
              {summary.mediumTerm.impactScore > 0 ? '+' : ''}{summary.mediumTerm.impactScore.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">推奨アクション</span>
            <span className={`px-3 py-1 rounded-md text-sm font-medium ${getRecommendationColor(summary.mediumTerm.recommendation)}`}>
              {getRecommendationText(summary.mediumTerm.recommendation)}
            </span>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-gray-600 text-xs mb-2">予測価格範囲</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">${summary.mediumTerm.predictedPriceRange.low.toFixed(2)}</span>
              <span className="text-gray-900 font-semibold">${summary.mediumTerm.predictedPriceRange.base.toFixed(2)}</span>
              <span className="text-gray-500">${summary.mediumTerm.predictedPriceRange.high.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">{summary.mediumTerm.description}</p>
        </div>
      </div>

      {/* Key Factors */}
      <div>
        <h4 className="text-gray-900 font-medium mb-3">主要要因</h4>
        <div className="space-y-2">
          {summary.shortTerm.factors.slice(0, 5).map((factor, index) => (
            <div key={index} className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 text-xs">{factor.source}</span>
                <span className={`text-xs font-semibold ${getImpactColor(factor.impactScore)}`}>
                  {factor.impactScore > 0 ? '+' : ''}{factor.impactScore.toFixed(1)}
                </span>
              </div>
              <p className="text-gray-700 text-xs">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

