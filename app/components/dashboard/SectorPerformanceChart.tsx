'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position } from '../../lib/schema'
import { calculateSectorPerformance } from '../../lib/utils/portfolioCalculator'
import { getSectorColor } from '../../lib/utils/sectorMapper'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import EmptyState from '../common/EmptyState'

interface SectorData {
  name: string
  changePercent: number
  color: string
}

export default function SectorPerformanceChart() {
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
        <h3 className="text-gray-900 text-lg font-semibold mb-6 flex items-center gap-2">
          <span>📈</span>
          セクター別パフォーマンス
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
          icon="📈"
          title="データがありません"
          message="ポートフォリオにポジションがありません。"
        />
      </div>
    )
  }

  // セクター別パフォーマンスを計算
  const sectorPerformance = calculateSectorPerformance(positions)
  
  // チャート用データに変換
  const chartData: SectorData[] = sectorPerformance.map(sector => ({
    name: sector.sector,
    changePercent: sector.changePercent,
    color: getSectorColor(sector.sector as any),
  }))

  // データをソート（高い順）
  const sortedData = [...chartData].sort((a, b) => b.changePercent - a.changePercent)

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SectorData
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <p className="text-gray-900 font-semibold mb-1">{data.name}</p>
          <p className={`text-sm font-bold ${
            data.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#e53935]'
          }`}>
            {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-6 flex items-center gap-2">
        <span>📈</span>
        セクター別パフォーマンス
      </h3>

      <div className="space-y-4">
        {/* チャート */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={['auto', 'auto']}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#1a1a1a', fontSize: 12 }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="changePercent"
                radius={[0, 8, 8, 0]}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 凡例（カラーコード） */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-200">
          {sortedData.map((sector, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: sector.color }}
              ></div>
              <span className="text-gray-600 text-xs">{sector.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

