'use client'

import { useEffect, useState } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position } from '../../lib/schema'
import { calculatePortfolioSummary } from '../../lib/utils/portfolioCalculator'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import EmptyState from '../common/EmptyState'

export default function DailyPerformance() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true)
        setError(null)
        const storage = getStorageAdapter()
        const fetchedPositions = await storage.getPositions()
        setPositions(fetchedPositions)
      } catch (err) {
        console.error('Error loading portfolio:', err)
        setError(err instanceof Error ? err : new Error('ポートフォリオの読み込みに失敗しました'))
      } finally {
        setLoading(false)
      }
    }

    loadPortfolio()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📊</span>
          今日の全体騰落率
        </h3>
        <LoadingSpinner size="md" message="データを計算中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <ErrorDisplay
          message={error.message}
          type="data"
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <EmptyState
          icon="📊"
          title="データがありません"
          message="ポートフォリオにポジションがありません。"
        />
      </div>
    )
  }

  const portfolioData = calculatePortfolioSummary(positions)
  const isPositive = portfolioData.dailyPnL >= 0

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span>
        今日の全体騰落率
      </h3>
      
      <div className="space-y-4">
        {/* 評価額 */}
        <div>
          <p className="text-gray-600 text-sm mb-1">ポートフォリオ評価額</p>
          <p className="text-gray-900 text-2xl font-bold">
            ¥{portfolioData.totalValue.toLocaleString('ja-JP', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* 本日の騰落率 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-baseline gap-3">
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-2">本日の騰落率（評価額ベース）</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                  {isPositive ? '+' : ''}{portfolioData.dailyPnLPercent.toFixed(2)}%
                </span>
                <span className={`text-lg font-semibold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                  ({isPositive ? '+' : ''}¥{Math.abs(portfolioData.dailyPnL).toLocaleString('ja-JP', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })})
                </span>
              </div>
            </div>
            
            {/* アイコン */}
            <div className={`text-4xl ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
              {isPositive ? '📈' : '📉'}
            </div>
          </div>
        </div>

        {/* 前日比 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">前日終値</span>
          <span className="text-gray-900">
            ¥{portfolioData.previousValue.toLocaleString('ja-JP', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

