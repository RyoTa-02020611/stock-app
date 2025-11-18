'use client'

import { useEffect, useState } from 'react'
import NewsAnalysisPanel from '../news/NewsAnalysisPanel'

interface StockNewsSectionProps {
  symbol: string
}

interface NewsItem {
  id: string
  title: string
  summary?: string
  publishedAt: string
  url: string
  source?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export default function StockNewsSection({ symbol }: StockNewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/news?limit=20&analyze=true`)
        if (response.ok) {
          const data = await response.json()
          setNews(data.news || [])
        }
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [symbol])

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400'
      case 'negative':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getSentimentLabel = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '好材料'
      case 'negative':
        return '懸念材料'
      default:
        return '中立'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-700 rounded-lg h-24"></div>
        ))}
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">関連ニュースがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* News Analysis Panel */}
      <NewsAnalysisPanel symbol={symbol} />

      {/* News List */}
      <div className="space-y-4">
        {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-semibold text-sm line-clamp-2">{item.title}</h3>
                {item.sentiment && (
                  <span className={`text-xs px-2 py-1 rounded ${getSentimentColor(item.sentiment)} bg-gray-800`}>
                    {getSentimentLabel(item.sentiment)}
                  </span>
                )}
              </div>
              {item.summary && (
                <p className="text-gray-400 text-xs line-clamp-2 mb-2">{item.summary}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {item.source && <span>{item.source}</span>}
                {item.publishedAt && (
                  <span>{new Date(item.publishedAt).toLocaleDateString('ja-JP')}</span>
                )}
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>
        </a>
      ))}
      </div>
    </div>
  )
}

