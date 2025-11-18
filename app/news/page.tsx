'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NewsAnalysisPanel from '../components/news/NewsAnalysisPanel'

interface NewsItem {
  id: string
  title: string
  summary?: string
  publishedAt: string
  url: string
  source?: string
  symbol?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export default function NewsPage() {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      let retryCount = 0
      const maxRetries = 3
      
      const attemptFetch = async (): Promise<void> => {
        try {
          const response = await fetch('/api/news/analysis?limit=50', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.news && Array.isArray(data.news) && data.news.length > 0) {
              setNews(data.news)
              return
            }
          }
          
          // データが空またはエラーの場合、リトライ
          if (retryCount < maxRetries) {
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
            return attemptFetch()
          }
          
          // リトライ後も失敗した場合、空配列を設定（APIがフォールバックを返すはず）
          setNews([])
        } catch (error) {
          if (retryCount < maxRetries) {
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
            return attemptFetch()
          }
          console.error('Error fetching news:', error)
          // エラー時でも空配列を設定（APIがフォールバックを返すはず）
          setNews([])
        }
      }
      
      await attemptFetch()
      setLoading(false)
    }

    fetchNews()
  }, [])

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-[#00c853] bg-green-50'
      case 'negative':
        return 'text-[#e53935] bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-gray-900 text-2xl font-bold mb-2">ニュース</h2>
          <p className="text-gray-600 text-sm">市場全体の最新ニュース（複数ソースから収集・分析）</p>
        </div>

        {/* News Analysis */}
        <div className="mb-6">
          <NewsAnalysisPanel />
        </div>

        <div className="space-y-4">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {item.symbol && (
                      <button
                        onClick={() => router.push(`/stocks/${item.symbol}`)}
                        className="text-[#0066cc] hover:text-[#0052a3] text-sm font-semibold"
                      >
                        {item.symbol}
                      </button>
                    )}
                    {item.sentiment && (
                      <span className={`text-xs px-2 py-1 rounded ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment === 'positive' ? '好材料' : item.sentiment === 'negative' ? '懸念材料' : '中立'}
                      </span>
                    )}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="text-gray-900 font-semibold text-lg mb-2 hover:text-[#0066cc] transition-colors">
                      {item.title}
                    </h3>
                  </a>
                  {item.summary && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {item.source && <span>{item.source}</span>}
                    {item.publishedAt && (
                      <span>{new Date(item.publishedAt).toLocaleString('ja-JP')}</span>
                    )}
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6 text-gray-400 hover:text-[#0066cc] transition-colors"
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
                </a>
              </div>
            </div>
          ))}
        </div>

        {news.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">ニュースがありません</p>
          </div>
        )}
      </div>
    </div>
  )
}

