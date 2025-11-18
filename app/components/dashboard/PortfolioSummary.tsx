'use client'

import { useEffect, useState } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position } from '../../lib/schema'
import { calculatePortfolioSummary } from '../../lib/utils/portfolioCalculator'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import EmptyState from '../common/EmptyState'

export default function PortfolioSummary() {
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
        const error = err instanceof Error ? err : new Error('ポートフォリオの読み込みに失敗しました')
        const { logger } = await import('../../lib/utils/logger')
        logger.error('Error loading portfolio', error, { component: 'PortfolioSummary' })
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolio()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 text-sm font-medium mb-4">ポートフォリオサマリー</h3>
        <LoadingSpinner size="md" message="データを読み込み中..." />
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
          icon="💼"
          title="ポートフォリオが空です"
          message="まだポジションがありません。銘柄を追加してポートフォリオを構築しましょう。"
          actionLabel="銘柄を追加"
          onAction={() => window.location.href = '/market'}
        />
      </div>
    )
  }

  const portfolioData = calculatePortfolioSummary(positions)
  const isPositive = portfolioData.dailyPnL >= 0

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-sm font-medium mb-4">ポートフォリオサマリー</h3>
      
      {/* Total Balance */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm mb-1">ポートフォリオ評価額</p>
        <p className="text-gray-900 text-3xl font-bold">
          ¥{portfolioData.totalValue.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Daily P/L */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-gray-600 text-sm mb-1">本日の損益</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-2xl font-bold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
            {isPositive ? '+' : ''}¥{portfolioData.dailyPnL.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm font-medium ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
            ({isPositive ? '+' : ''}{portfolioData.dailyPnLPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Overall P/L */}
      <div>
        <p className="text-gray-600 text-sm mb-1">累計損益</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-bold ${portfolioData.totalPnL >= 0 ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
            {portfolioData.totalPnL >= 0 ? '+' : ''}¥{portfolioData.totalPnL.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm font-medium ${portfolioData.totalPnL >= 0 ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
            ({portfolioData.totalPnL >= 0 ? '+' : ''}{portfolioData.totalPnLPercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  )
}
