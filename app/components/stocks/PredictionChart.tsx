'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface PredictionDataPoint {
  date: string
  historical: number | null
  predicted: number | null
  optimistic: number | null
  pessimistic: number | null
}

interface PredictionChartProps {
  symbol: string
  currentPrice: number
}

export default function PredictionChart({ symbol, currentPrice }: PredictionChartProps) {
  const [data, setData] = useState<PredictionDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/ai/predict-impact?symbol=${symbol}&timeframes=short,medium`)
        
        if (response.ok) {
          const result = await response.json()
          const shortTerm = result.summary.shortTerm
          const mediumTerm = result.summary.mediumTerm

          // Generate historical data (last 30 days)
          const historicalData: PredictionDataPoint[] = []
          const today = new Date()

          for (let i = 30; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            
            if (i === 0) {
              // Today - current price
              historicalData.push({
                date: date.toISOString().split('T')[0],
                historical: currentPrice,
                predicted: currentPrice,
                optimistic: null,
                pessimistic: null,
              })
            } else {
              // Historical - mock data
              historicalData.push({
                date: date.toISOString().split('T')[0],
                historical: currentPrice * (0.95 + Math.random() * 0.1),
                predicted: null,
                optimistic: null,
                pessimistic: null,
              })
            }
          }

          // Add prediction data (next 30 days)
          const predictionDays = 30
          for (let i = 1; i <= predictionDays; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)
            
            // Use short-term prediction for first week, medium-term for rest
            const prediction = i <= 7 ? shortTerm : mediumTerm
            const basePrice = prediction.predictedPriceRange.base
            const optimistic = prediction.predictedPriceRange.high
            const pessimistic = prediction.predictedPriceRange.low

            historicalData.push({
              date: date.toISOString().split('T')[0],
              historical: null,
              predicted: basePrice,
              optimistic,
              pessimistic,
            })
          }

          setData(historicalData)
        }
      } catch (error) {
        console.error('Error fetching prediction:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [symbol, currentPrice])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4">価格予測チャート</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
          />
          <ReferenceLine 
            x={data[30]?.date} 
            stroke="#9ca3af" 
            strokeDasharray="3 3"
            label={{ value: '現在', position: 'top', fill: '#6b7280' }}
          />
          <Line 
            type="monotone" 
            dataKey="historical" 
            stroke="#0066cc" 
            strokeWidth={2}
            dot={{ r: 3 }}
            name="過去の価格"
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#00c853" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            name="予測価格（現実的）"
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="optimistic" 
            stroke="#00c853" 
            strokeWidth={1}
            strokeDasharray="2 2"
            dot={false}
            name="予測価格（楽観的）"
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="pessimistic" 
            stroke="#e53935" 
            strokeWidth={1}
            strokeDasharray="2 2"
            dot={false}
            name="予測価格（悲観的）"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#0066cc]"></div>
          <span>過去の価格</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#00c853] border-dashed border"></div>
          <span>予測価格（現実的）</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#00c853] border-dashed border opacity-50"></div>
          <span>予測価格（楽観的）</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#e53935] border-dashed border opacity-50"></div>
          <span>予測価格（悲観的）</span>
        </div>
      </div>
    </div>
  )
}

