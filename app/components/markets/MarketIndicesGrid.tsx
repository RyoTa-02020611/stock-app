'use client'

import { useEffect, useState } from 'react'
import MarketIndexCard from './MarketIndexCard'
import { MarketIndex } from '../../lib/types/indices'

export default function MarketIndicesGrid() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/indices')
        if (!response.ok) throw new Error('データの取得に失敗しました')
        
        const data = await response.json()
        if (data.success) {
          setIndices(data.indices || [])
        } else {
          throw new Error(data.error || 'データの取得に失敗しました')
        }
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching indices:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchIndices()
    // 30秒ごとに更新
    const interval = setInterval(fetchIndices, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          再試行
        </button>
      </div>
    )
  }

  if (indices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">市場指数データがありません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {indices.map((index) => (
        <MarketIndexCard key={index.symbol} index={index} />
      ))}
    </div>
  )
}

