'use client'

import { useEffect, useState, memo } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import LoadingSpinner from '../common/LoadingSpinner'

interface PriceData {
  date: string
  price: number
}

interface StockSparklineProps {
  symbol: string
  currentPrice: number
  data?: PriceData[]
}

function StockSparkline({ symbol, currentPrice, data: propData }: StockSparklineProps) {
  const [chartData, setChartData] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(!propData)
  const [error, setError] = useState(false)

  useEffect(() => {
    // propDataが提供されている場合はそれを使用
    if (propData && propData.length > 0) {
      setChartData(propData)
      setLoading(false)
      setError(false)
      return
    }

    // 実データを取得
    const fetchSparklineData = async () => {
      try {
        setLoading(true)
        setError(false)
        
        const response = await fetch(`/api/stocks/${symbol}/chart?range=5d`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // APIレスポンスの構造に応じて変換
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            const formattedData = result.data.map((item: any) => ({
              date: item.date || item.timestamp || new Date().toISOString().split('T')[0],
              price: item.price || item.close || item.value || currentPrice,
            }))
            setChartData(formattedData)
          } else {
            // データが空の場合はエラー
            setError(true)
            setChartData([])
          }
        } else {
          // APIエラーの場合はエラー状態にする
          setError(true)
          setChartData([])
        }
      } catch (err) {
        const { logger } = await import('../../lib/utils/logger')
        logger.error(`Error fetching sparkline data for ${symbol}`, err instanceof Error ? err : new Error(String(err)), { component: 'StockSparkline', symbol })
        setError(true)
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchSparklineData()
  }, [symbol, currentPrice, propData])

  if (loading) {
    return (
      <div className="w-[120px] h-[40px] flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (error || chartData.length === 0) {
    // エラー時は空の表示（または小さなエラーアイコン）
    return (
      <div className="w-[120px] h-[40px] flex items-center justify-center text-gray-400 text-xs">
        N/A
      </div>
    )
  }
  
  // 価格の変動を判定（上昇/下降）
  const firstPrice = chartData[0]?.price || currentPrice
  const lastPrice = chartData[chartData.length - 1]?.price || currentPrice
  const isPositive = lastPrice >= firstPrice
  const lineColor = isPositive ? '#00c853' : '#e53935' // SBI証券風の色

  return (
    <div className="w-[120px] h-[40px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default memo(StockSparkline)

