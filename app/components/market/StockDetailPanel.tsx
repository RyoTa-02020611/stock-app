'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import EmptyState from '../common/EmptyState'

interface StockDetail {
  symbol: string
  name: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  marketCap?: number
  pe?: number
  volume: number
}

interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  url: string
}

interface StockDetailPanelProps {
  symbol: string | null
  isOpen: boolean
  onClose: () => void
}

// X icon for close button
const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
)

/**
 * パターンA: 画面右側にスライドする詳細パネル
 */
export default function StockDetailPanel({ symbol, isOpen, onClose }: StockDetailPanelProps) {
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (isOpen && symbol) {
      const loadStockDetail = async () => {
        try {
          setLoading(true)
          setError(null)
          
          // 実データを取得
          const [overviewResponse, newsResponse] = await Promise.allSettled([
            fetch(`/api/stocks/${symbol}/overview`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              },
            }),
            fetch(`/api/stocks/${symbol}/news?limit=5`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              },
            }),
          ])

          // 基本情報を取得
          if (overviewResponse.status === 'fulfilled' && overviewResponse.value.ok) {
            const overviewData = await overviewResponse.value.json()
            if (overviewData && overviewData.symbol) {
              setStockDetail({
                symbol: overviewData.symbol || symbol,
                name: overviewData.name || `${symbol} Corporation`,
                currentPrice: overviewData.quote?.price || overviewData.price || overviewData.currentPrice || 0,
                previousClose: overviewData.quote?.previousClose || overviewData.previousClose || overviewData.previous_price || 0,
                change: overviewData.quote?.change || overviewData.change || overviewData.price_change || 0,
                changePercent: overviewData.quote?.changePercent || overviewData.changePercent || overviewData.price_change_percent || 0,
                marketCap: overviewData.quote?.marketCap || overviewData.marketCap || overviewData.market_cap,
                pe: overviewData.keyMetrics?.find((m: any) => m.label === 'PER' || m.label === 'P/E Ratio')?.value || overviewData.pe || overviewData.pe_ratio,
                volume: overviewData.quote?.volume || overviewData.volume || overviewData.trading_volume || 0,
              })
            } else {
              throw new Error('銘柄データの形式が正しくありません')
            }
          } else {
            throw new Error('銘柄データの取得に失敗しました')
          }

          // ニュースを取得
          if (newsResponse.status === 'fulfilled' && newsResponse.value.ok) {
            const newsData = await newsResponse.value.json()
            if (newsData.articles && Array.isArray(newsData.articles) && newsData.articles.length > 0) {
              setNews(newsData.articles.slice(0, 5).map((article: any, index: number) => ({
                id: article.id || `news-${index}`,
                title: article.title || article.headline || 'ニュース',
                source: article.source || article.publisher || '不明',
                publishedAt: article.publishedAt || article.published_time || new Date().toISOString(),
                url: article.url || article.link || '#',
              })))
            } else {
              // ニュースがない場合は空配列
              setNews([])
            }
          } else {
            // ニュース取得失敗は無視（エラーにはしない）
            setNews([])
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('銘柄詳細データの取得に失敗しました')
          const { logger } = await import('../../lib/utils/logger')
          logger.error('Error loading stock detail', error, { component: 'StockDetailPanel', symbol })
          setError(error)
          setStockDetail(null)
          setNews([])
        } finally {
          setLoading(false)
        }
      }

      loadStockDetail()
    } else {
      // パネルが閉じられたら状態をリセット
      setStockDetail(null)
      setNews([])
      setError(null)
    }
  }, [isOpen, symbol])

  const isPositive = stockDetail ? stockDetail.change >= 0 : false

  return (
    <>
      {/* オーバーレイ（背景） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 右側パネル */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full md:w-[500px] lg:w-[600px]
          bg-white border-l border-gray-200 shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : stockDetail ? (
              <>
                <h2 className="text-gray-900 text-2xl font-bold">{stockDetail.symbol}</h2>
                <p className="text-gray-600 text-sm">{stockDetail.name}</p>
              </>
            ) : error ? (
              <>
                <h2 className="text-gray-900 text-2xl font-bold">{symbol}</h2>
                <p className="text-gray-600 text-sm">データ取得エラー</p>
              </>
            ) : (
              <>
                <h2 className="text-gray-900 text-2xl font-bold">{symbol}</h2>
                <p className="text-gray-600 text-sm">銘柄詳細</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        {loading ? (
          <div className="p-6 space-y-4">
            <LoadingSpinner size="md" message="データを読み込み中..." />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorDisplay
              message={error.message}
              type="api"
              onRetry={() => {
                setError(null)
                // useEffectが再実行されるようにする
                const loadStockDetail = async () => {
                  try {
                    setLoading(true)
                    setError(null)
                    const response = await fetch(`/api/stocks/${symbol}/overview`, {
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    })
                    if (response.ok) {
                      const overviewData = await response.json()
                      if (overviewData && overviewData.symbol) {
                        setStockDetail({
                          symbol: overviewData.symbol || symbol,
                          name: overviewData.name || `${symbol} Corporation`,
                          currentPrice: overviewData.quote?.price || overviewData.price || 0,
                          previousClose: overviewData.quote?.previousClose || overviewData.previousClose || 0,
                          change: overviewData.quote?.change || overviewData.change || 0,
                          changePercent: overviewData.quote?.changePercent || overviewData.changePercent || 0,
                          marketCap: overviewData.quote?.marketCap || overviewData.marketCap,
                          pe: overviewData.keyMetrics?.find((m: any) => m.label === 'PER' || m.label === 'P/E Ratio')?.value || overviewData.pe,
                          volume: overviewData.quote?.volume || overviewData.volume || 0,
                        })
                      }
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err : new Error('データの取得に失敗しました'))
                  } finally {
                    setLoading(false)
                  }
                }
                loadStockDetail()
              }}
            />
          </div>
        ) : stockDetail ? (
          <div className="p-6 space-y-6">
            {/* 現在価格・前日比 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm mb-1">現在価格</p>
                  <p className="text-gray-900 text-3xl font-bold">
                    ${stockDetail.currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                    {isPositive ? '+' : ''}
                    {stockDetail.changePercent.toFixed(2)}%
                  </p>
                  <p className={`text-sm ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                    {isPositive ? '+' : ''}${Math.abs(stockDetail.change).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                前日終値: ${stockDetail.previousClose.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* 基本指標 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-xs mb-1">時価総額</p>
                <p className="text-gray-900 font-semibold">
                  {stockDetail.marketCap
                    ? `$${(stockDetail.marketCap / 1e9).toFixed(2)}B`
                    : '--'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-xs mb-1">PER</p>
                <p className="text-gray-900 font-semibold">
                  {stockDetail.pe ? typeof stockDetail.pe === 'number' ? stockDetail.pe.toFixed(2) : stockDetail.pe : '--'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-xs mb-1">出来高</p>
                <p className="text-gray-900 font-semibold">
                  {stockDetail.volume.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-xs mb-1">変動率</p>
                <p className={`font-semibold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                  {isPositive ? '+' : ''}
                  {stockDetail.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* チャート（簡易版） */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-gray-900 font-semibold mb-4">価格チャート</h3>
              <div className="h-64 bg-white border border-gray-200 rounded flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  チャート表示エリア（1D〜1Yのチャートをここに実装）
                </p>
              </div>
            </div>

            {/* 関連ニュース */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-gray-900 font-semibold mb-4">関連ニュース</h3>
              {news.length === 0 ? (
                <EmptyState
                  icon="📰"
                  title="ニュースがありません"
                  message="この銘柄に関するニュースが見つかりませんでした。"
                />
              ) : (
                <div className="space-y-3">
                  {news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-gray-900 text-sm font-medium mb-1">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>
                          {new Date(item.publishedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon="📊"
              title="データがありません"
              message="銘柄詳細データを取得できませんでした。"
            />
          </div>
        )}
      </div>
    </>
  )
}

