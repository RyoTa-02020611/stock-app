'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import ErrorDisplay from '../common/ErrorDisplay'

interface StockMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface TodaysMoversProps {
  onSelectSymbol?: (symbol: string) => void
}

// Today's movers card component
function TodaysMovers({ onSelectSymbol }: TodaysMoversProps) {
  const [movers, setMovers] = useState<StockMover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMovers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 実データを取得（gainersとlosersの両方を取得して上位5つを表示）
        const [gainersResponse, losersResponse] = await Promise.allSettled([
          fetch('/api/market/top-movers?type=gainers&market=ALL&limit=5&real=true', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch('/api/market/top-movers?type=losers&market=ALL&limit=5&real=true', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
        ])

        const allMovers: StockMover[] = []

        // Gainersを処理
        if (gainersResponse.status === 'fulfilled' && gainersResponse.value.ok) {
          const gainersData = await gainersResponse.value.json()
          if (gainersData.movers && Array.isArray(gainersData.movers)) {
            allMovers.push(...gainersData.movers.slice(0, 3).map((m: any) => ({
              symbol: m.symbol,
              name: m.name,
              price: m.price,
              change: m.change,
              changePercent: m.changePercent,
              volume: m.volume || 0,
            })))
          }
        }

        // Losersを処理
        if (losersResponse.status === 'fulfilled' && losersResponse.value.ok) {
          const losersData = await losersResponse.value.json()
          if (losersData.movers && Array.isArray(losersData.movers)) {
            allMovers.push(...losersData.movers.slice(0, 2).map((m: any) => ({
              symbol: m.symbol,
              name: m.name,
              price: m.price,
              change: m.change,
              changePercent: m.changePercent,
              volume: m.volume || 0,
            })))
          }
        }

        // 変化率の絶対値でソートして上位5つを表示
        const sortedMovers = allMovers
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 5)

        if (sortedMovers.length > 0) {
          setMovers(sortedMovers)
        } else {
          setError(new Error('データを取得できませんでした'))
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('本日の値動きデータの取得に失敗しました')
        const { logger } = await import('../../lib/utils/logger')
        logger.error('Error fetching today\'s movers', error, { component: 'TodaysMovers' })
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovers()
  }, [])

  const handleClick = useCallback((symbol: string) => {
    if (onSelectSymbol) {
      onSelectSymbol(symbol)
    }
  }, [onSelectSymbol])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 text-sm font-medium mb-4">本日の値動き</h3>
        <LoadingSpinner size="sm" message="データを読み込み中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 text-sm font-medium mb-4">本日の値動き</h3>
        <ErrorDisplay
          message={error.message}
          type="api"
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  if (movers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 text-sm font-medium mb-4">本日の値動き</h3>
        <EmptyState
          icon="📊"
          title="データがありません"
          message="本日の値動きデータを取得できませんでした。"
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-sm font-medium mb-4">本日の値動き</h3>
      
      <div className="space-y-3">
        {movers.map((stock) => {
          const isPositive = stock.change >= 0
          return (
            <div
              key={stock.symbol}
              onClick={() => handleClick(stock.symbol)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-gray-900 font-semibold">{stock.symbol}</p>
                  <p className="text-gray-600 text-xs">{stock.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </p>
                <p className={`text-xs ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                  {isPositive ? '+' : ''}${stock.change.toFixed(2)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(TodaysMovers)
