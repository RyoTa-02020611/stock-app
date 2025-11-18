'use client'

import { useState, useEffect } from 'react'
import { NewsAnalysis } from '../../lib/newsClient'

interface NewsAnalysisPanelProps {
  symbol?: string
}

export default function NewsAnalysisPanel({ symbol }: NewsAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true)
      try {
        const url = symbol
          ? `/api/news/analysis?symbol=${encodeURIComponent(symbol)}&limit=50`
          : `/api/news/analysis?limit=50`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setAnalysis(data.analysis)
        }
      } catch (error) {
        console.error('Error fetching news analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  const sentimentPercentage = {
    positive: (analysis.positiveCount / analysis.totalArticles) * 100,
    negative: (analysis.negativeCount / analysis.totalArticles) * 100,
    neutral: (analysis.neutralCount / analysis.totalArticles) * 100,
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
        <span>📊</span>
        ニュース分析
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Overview */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-gray-300 text-sm font-medium mb-4">センチメント分布</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-400 text-sm">好材料</span>
                <span className="text-white text-sm font-semibold">
                  {analysis.positiveCount} ({sentimentPercentage.positive.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${sentimentPercentage.positive}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-red-400 text-sm">懸念材料</span>
                <span className="text-white text-sm font-semibold">
                  {analysis.negativeCount} ({sentimentPercentage.negative.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${sentimentPercentage.negative}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-sm">中立</span>
                <span className="text-white text-sm font-semibold">
                  {analysis.neutralCount} ({sentimentPercentage.neutral.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: `${sentimentPercentage.neutral}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">平均センチメント</span>
              <span
                className={`text-sm font-semibold ${
                  analysis.averageSentiment > 0.1
                    ? 'text-green-400'
                    : analysis.averageSentiment < -0.1
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {analysis.averageSentiment > 0 ? '+' : ''}
                {analysis.averageSentiment.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Trend & Sources */}
        <div className="space-y-4">
          {/* Trend */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-gray-300 text-sm font-medium mb-3">トレンド</h4>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg ${
                  analysis.trend === 'increasing'
                    ? 'text-green-400'
                    : analysis.trend === 'decreasing'
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {analysis.trend === 'increasing' ? '📈' : analysis.trend === 'decreasing' ? '📉' : '➡️'}
              </span>
              <span className="text-white font-semibold">
                {analysis.trend === 'increasing'
                  ? '上昇傾向'
                  : analysis.trend === 'decreasing'
                  ? '下降傾向'
                  : '安定'}
              </span>
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-gray-300 text-sm font-medium mb-3">主要ソース</h4>
            <div className="space-y-2">
              {analysis.topSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{source.source}</span>
                  <span className="text-white text-xs font-semibold">{source.count}件</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        {analysis.topCategories.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-gray-300 text-sm font-medium mb-3">カテゴリ</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.topCategories.map((cat, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs"
                >
                  {cat.category} ({cat.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Topics */}
        {analysis.keyTopics.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-gray-300 text-sm font-medium mb-3">主要トピック</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keyTopics.slice(0, 8).map((topic, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-xs mb-1">総記事数</p>
            <p className="text-white font-semibold text-lg">{analysis.totalArticles}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">期間</p>
            <p className="text-white font-semibold text-sm">
              {new Date(analysis.timeRange.start).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              -{' '}
              {new Date(analysis.timeRange.end).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">ソース数</p>
            <p className="text-white font-semibold text-lg">{analysis.topSources.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

