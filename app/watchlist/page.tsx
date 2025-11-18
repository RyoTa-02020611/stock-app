'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Watchlist, { StockItem } from '../components/dashboard/Watchlist'
import { getStorageAdapter } from '../lib/storage/localStorageAdapter'
import { Position } from '../lib/schema'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'

export default function WatchlistPage() {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<StockItem[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        setLoading(true)
        setError(null)
        const storage = getStorageAdapter()
        
        // ポジションからウォッチリストを構築（または専用のウォッチリストストレージがあればそれを使用）
        const positions = await storage.getPositions()
        
        // ポジションをStockItemに変換
        const watchlistItems: StockItem[] = positions.map(pos => ({
          symbol: pos.symbol,
          name: `${pos.symbol} Corporation`, // 実際の実装では銘柄名を取得
          price: pos.currentPrice,
          change: pos.currentPrice - pos.averageCost,
          changePercent: pos.averageCost > 0
            ? ((pos.currentPrice - pos.averageCost) / pos.averageCost) * 100
            : 0,
          volume: 0,
        }))
        
        // localStorageから直接ウォッチリストを読み込む（もしあれば）
        if (typeof window !== 'undefined') {
          try {
            const savedWatchlist = localStorage.getItem('watchlist')
            if (savedWatchlist) {
              const parsed = JSON.parse(savedWatchlist)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setWatchlist(parsed)
                setLoading(false)
                return
              }
            }
          } catch (e) {
            console.warn('Failed to load watchlist from localStorage:', e)
          }
        }
        
        // ポジションからウォッチリストを構築
        setWatchlist(watchlistItems)
      } catch (err) {
        console.error('Error loading watchlist:', err)
        setError(err instanceof Error ? err : new Error('ウォッチリストの読み込みに失敗しました'))
      } finally {
        setLoading(false)
      }
    }

    loadWatchlist()
  }, [])

  const handleSelectSymbol = (symbol: string) => {
    if (symbol) {
      router.push(`/stocks/${symbol}`)
    }
  }

  const handleRemoveFromWatchlist = (symbol: string) => {
    const updated = watchlist.filter(s => s.symbol !== symbol)
    setWatchlist(updated)
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('watchlist', JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save watchlist to localStorage:', e)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="md" message="ウォッチリストを読み込み中..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorDisplay
            message={error.message}
            type="data"
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-gray-900 text-2xl font-bold mb-2">ウォッチリスト</h2>
          <p className="text-gray-600 text-sm">監視したい銘柄を管理します</p>
        </div>

        <Watchlist
          stocks={watchlist}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={handleSelectSymbol}
          onRemoveStock={handleRemoveFromWatchlist}
        />
      </div>
    </div>
  )
}

