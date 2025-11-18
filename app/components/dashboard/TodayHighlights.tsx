'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position, Alert } from '../../lib/schema'
import { getWorstPerformer } from '../../lib/utils/portfolioCalculator'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import EmptyState from '../common/EmptyState'

interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  url: string
}

interface AlertWithDistance {
  alert: Alert
  symbol: string
  name: string
  currentPrice: number
  alertPrice: number
  distancePercent: number
  distance: number
}

export default function TodayHighlights() {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const storage = getStorageAdapter()
        
        // 並列でデータを取得（パフォーマンス最適化）
        const [fetchedPositions, fetchedAlerts, newsResponse] = await Promise.allSettled([
          storage.getPositions(),
          storage.getAlerts({ status: 'ACTIVE' }),
          fetch('/api/news/analysis?limit=5'),
        ])
        
        // Positionデータを設定
        if (fetchedPositions.status === 'fulfilled') {
          setPositions(fetchedPositions.value)
        } else {
          const { logger } = await import('../../lib/utils/logger')
          logger.warn('Failed to load positions', { error: fetchedPositions.reason })
        }
        
        // Alertデータを設定
        if (fetchedAlerts.status === 'fulfilled') {
          setAlerts(fetchedAlerts.value)
        } else {
          const { logger } = await import('../../lib/utils/logger')
          logger.warn('Failed to load alerts', { error: fetchedAlerts.reason })
        }
        
        // ニュースデータを設定
        if (newsResponse.status === 'fulfilled' && newsResponse.value.ok) {
          try {
            const newsData = await newsResponse.value.json()
            if (newsData.articles && Array.isArray(newsData.articles)) {
              setNews(newsData.articles.slice(0, 3).map((article: any, index: number) => ({
                id: article.id || `news-${index}`,
                title: article.title || article.headline || 'ニュース',
                source: article.source || article.publisher || '不明',
                publishedAt: article.publishedAt || article.published_time || new Date().toISOString(),
                url: article.url || article.link || '#',
              })))
            }
          } catch (parseError) {
            const { logger } = await import('../../lib/utils/logger')
            logger.warn('Failed to parse news data', { error: parseError })
          }
        } else {
          const { logger } = await import('../../lib/utils/logger')
          logger.warn('Failed to fetch news', { error: newsResponse.status === 'rejected' ? newsResponse.reason : 'HTTP error' })
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('データの読み込みに失敗しました')
        const { logger } = await import('../../lib/utils/logger')
        logger.error('Error loading highlights', error, { component: 'TodayHighlights' })
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // すべてのフックを条件分岐の前に移動（React Hooksのルール）
  // 今日の損失が最も大きい銘柄 TOP1
  const worstPerformer = useMemo(() => getWorstPerformer(positions), [positions])

  // 重要ニュース 1本（最新）
  const topNews = useMemo(() => news.length > 0 ? news[0] : null, [news])

  // アラートに近づいている銘柄 1つ（距離が最も近い）
  const alertsWithDistance: AlertWithDistance[] = useMemo(() => alerts
    .filter(alert => alert.type === 'PRICE' && alert.targetValue && alert.symbol)
    .map(alert => {
      const position = positions.find(p => p.symbol === alert.symbol)
      if (!position) return null
      
      const currentPrice = position.currentPrice
      const alertPrice = alert.targetValue!
      const distancePercent = ((currentPrice - alertPrice) / alertPrice) * 100
      
      return {
        alert,
        symbol: alert.symbol,
        name: `${alert.symbol} Corporation`, // 実際の実装では銘柄名を取得
        currentPrice,
        alertPrice,
        distancePercent,
        distance: Math.abs(distancePercent),
      }
    })
    .filter((item): item is AlertWithDistance => item !== null)
    .sort((a, b) => a.distance - b.distance), [alerts, positions])

  const nearestAlert = useMemo(() => alertsWithDistance.length > 0 ? alertsWithDistance[0] : null, [alertsWithDistance])

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-gray-900 text-xl font-bold mb-4 flex items-center gap-2">
          <span>🎯</span>
          今日見るべき3つだけ
        </h2>
        <LoadingSpinner size="md" message="データを読み込み中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <ErrorDisplay
          message={error.message}
          type="data"
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  // データがない場合の表示
  if (!worstPerformer && !topNews && !nearestAlert) {
    return (
      <div className="mb-6">
        <h2 className="text-gray-900 text-xl font-bold mb-4 flex items-center gap-2">
          <span>🎯</span>
          今日見るべき3つだけ
        </h2>
        <EmptyState
          icon="📊"
          title="データがありません"
          message="ポジション、アラート、ニュースがありません。"
        />
      </div>
    )
  }

  // カードデータを構築
  const cards = []
  
  if (worstPerformer) {
    const dailyChange = (worstPerformer.currentPrice * 0.98 - worstPerformer.currentPrice) * worstPerformer.quantity
    const dailyChangePercent = worstPerformer.currentPrice * 0.98 > 0 
      ? ((worstPerformer.currentPrice - worstPerformer.currentPrice * 0.98) / (worstPerformer.currentPrice * 0.98)) * 100 
      : 0
    
    cards.push({
      id: 'worst-performer',
      title: '今日の損失が最も大きい銘柄',
      icon: '📉',
      onClick: () => router.push(`/stocks/${worstPerformer.symbol}`),
      data: {
        symbol: worstPerformer.symbol,
        name: `${worstPerformer.symbol} Corporation`,
        lossAmount: Math.abs(dailyChange),
        lossPercent: Math.abs(dailyChangePercent),
      },
    })
  }
  
  if (topNews) {
    cards.push({
      id: 'top-news',
      title: '重要ニュース',
      icon: '📰',
      onClick: () => window.open(topNews.url, '_blank'),
      data: topNews,
    })
  }
  
  if (nearestAlert) {
    cards.push({
      id: 'nearest-alert',
      title: 'アラートに近づいている銘柄',
      icon: '🔔',
      onClick: () => router.push(`/stocks/${nearestAlert.symbol}`),
      data: nearestAlert,
    })
  }

  return (
    <div className="mb-6">
      <h2 className="text-gray-900 text-xl font-bold mb-4 flex items-center gap-2">
        <span>🎯</span>
        今日見るべき3つだけ
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* カード1: 今日の損失が最も大きい銘柄 */}
        {worstPerformer && (
          <div
            onClick={() => router.push(`/stocks/${worstPerformer.symbol}`)}
            className="bg-red-50 rounded-xl p-5 border border-red-200 hover:border-red-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📉</span>
              <h3 className="text-gray-900 font-semibold text-sm">今日の損失が最も大きい銘柄</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-gray-900 font-bold text-lg">{worstPerformer.symbol}</p>
                <p className="text-gray-600 text-xs">{worstPerformer.symbol} Corporation</p>
              </div>
              
              <div className="pt-2 border-t border-red-200">
                {(() => {
                  const dailyChange = (worstPerformer.currentPrice * 0.98 - worstPerformer.currentPrice) * worstPerformer.quantity
                  const dailyChangePercent = worstPerformer.currentPrice * 0.98 > 0 
                    ? ((worstPerformer.currentPrice - worstPerformer.currentPrice * 0.98) / (worstPerformer.currentPrice * 0.98)) * 100 
                    : 0
                  return (
                    <>
                      <p className="text-[#e53935] font-bold text-xl">
                        ¥{Math.abs(dailyChange).toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[#e53935] text-sm">
                        損失率: {Math.abs(dailyChangePercent).toFixed(2)}%
                      </p>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* カード2: 重要ニュース */}
        {topNews && (
          <div
            onClick={() => window.open(topNews.url, '_blank')}
            className="bg-blue-50 rounded-xl p-5 border border-blue-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📰</span>
              <h3 className="text-gray-900 font-semibold text-sm">重要ニュース</h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-900 font-medium text-sm line-clamp-2">
                {topNews.title}
              </p>
              
              <div className="pt-2 border-t border-blue-200">
                <p className="text-gray-600 text-xs">{topNews.source}</p>
                <p className="text-gray-500 text-xs">
                  {new Date(topNews.publishedAt).toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* カード3: アラートに近づいている銘柄 */}
        {nearestAlert && (
          <div
            onClick={() => router.push(`/stocks/${nearestAlert.symbol}`)}
            className="bg-amber-50 rounded-xl p-5 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔔</span>
              <h3 className="text-gray-900 font-semibold text-sm">アラートに近づいている銘柄</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-gray-900 font-bold text-lg">{nearestAlert.symbol}</p>
                <p className="text-gray-600 text-xs">{nearestAlert.name}</p>
              </div>
              
              <div className="pt-2 border-t border-amber-200">
                <p className="text-gray-900 text-sm">
                  現在: ¥{nearestAlert.currentPrice.toLocaleString('ja-JP')}
                </p>
                <p className="text-amber-600 text-sm font-semibold">
                  アラート: ¥{nearestAlert.alertPrice.toLocaleString('ja-JP')}
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  あと {Math.abs(nearestAlert.distancePercent).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

