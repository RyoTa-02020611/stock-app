'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ImpactDataPoint {
  date: string
  impactScore: number
  price: number
  factors: string[]
}

interface StockImpactTimelineProps {
  symbol: string
}

export default function StockImpactTimeline({ symbol }: StockImpactTimelineProps) {
  const [data, setData] = useState<ImpactDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Generate mock timeline data
    // In production, this would fetch historical impact data
    const generateTimeline = () => {
      const points: ImpactDataPoint[] = []
      const today = new Date()

      for (let i = 30; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        points.push({
          date: date.toISOString().split('T')[0],
          impactScore: (Math.random() - 0.5) * 60,
          price: 100 + (Math.random() - 0.5) * 20,
          factors: ['earnings', 'analyst', 'news'].slice(0, Math.floor(Math.random() * 3) + 1),
        })
      }

      setData(points)
      setLoading(false)
    }

    generateTimeline()
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4">影響スコア推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={[-100, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
          />
          <Line 
            type="monotone" 
            dataKey="impactScore" 
            stroke="#0066cc" 
            strokeWidth={2}
            dot={{ r: 3 }}
            name="影響スコア"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

