'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SortButtons from '../components/market/SortButtons'
import StockTable from '../components/market/StockTable'
import StockDetailModal from '../components/market/StockDetailModal'
import StockDetailPanel from '../components/market/StockDetailPanel'
import ErrorDisplay from '../components/common/ErrorDisplay'
import EmptyState from '../components/common/EmptyState'

interface TopMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  exchange?: string
  country?: string
  currency?: string
}

type MarketFilter = 'ALL' | 'US' | 'JP' | 'EU' | 'ASIA'
type SortType = 'gainers' | 'losers' | 'volume' | 'marketcap'

export default function MarketPage() {
  const router = useRouter()
  const [stocks, setStocks] = useState<TopMover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALL')
  const [activeSort, setActiveSort] = useState<{ type: SortType; direction: 'asc' | 'desc' }>({
    type: 'gainers',
    direction: 'desc',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [detailViewMode, setDetailViewMode] = useState<'modal' | 'panel'>('modal')

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true)
      setError(null)
      let retryCount = 0
      const maxRetries = 3
      
      const attemptFetch = async (): Promise<void> => {
        try {
          const initialLimit = 50
          // デフォルトで生成データを使用（確実にデータを表示）
          const response = await fetch(
            `/api/market/top-movers?type=${activeSort.type}&market=${marketFilter}&limit=${initialLimit}&real=false`,
            { 
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data.movers && Array.isArray(data.movers) && data.movers.length > 0) {
              setStocks(data.movers)
              setError(null)
              return
            }
          }
          
          // データが空またはエラーの場合、リトライ
          if (retryCount < maxRetries) {
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
            return attemptFetch()
          }
          
          // リトライ後も失敗した場合、エラーを設定
          throw new Error('マーケットデータの取得に失敗しました')
        } catch (err) {
          if (retryCount < maxRetries) {
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
            return attemptFetch()
          }
          console.error('Error fetching market data:', err)
          setError(err instanceof Error ? err : new Error('マーケットデータの取得に失敗しました'))
          // エラー時でも空配列ではなく、最低限のデータを表示
          setStocks([])
        }
      }
      
      await attemptFetch()
      setLoading(false)
    }

    fetchMarketData()
  }, [marketFilter, activeSort.type])

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol)
    if (detailViewMode === 'modal') {
      setIsModalOpen(true)
    } else {
      setIsPanelOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsPanelOpen(false)
    setSelectedSymbol(null)
  }

  // Filter stocks by search query
  const filteredStocks = stocks.filter(stock => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.exchange?.toLowerCase().includes(query)
    )
  })


  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-gray-900 text-2xl font-bold mb-2">マーケット</h2>
          <p className="text-gray-600 text-sm">世界中の企業情報を一度に確認できます</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Market Filter */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-gray-400 text-sm self-center">市場:</span>
              {(['ALL', 'US', 'JP', 'EU', 'ASIA'] as MarketFilter[]).map((market) => (
                <button
                  key={market}
                  onClick={() => setMarketFilter(market)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    marketFilter === market
                      ? 'bg-[#0066cc] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {market === 'ALL' ? '全世界' : market === 'US' ? '🇺🇸 米国' : market === 'JP' ? '🇯🇵 日本' : market === 'EU' ? '🇪🇺 欧州' : '🌏 アジア'}
                </button>
              ))}
            </div>

            {/* Sort Type */}
            <SortButtons
              activeSort={activeSort}
              onSortChange={(type, direction) => setActiveSort({ type, direction })}
            />

            {/* Search */}
            <div className="flex-1 lg:max-w-xs">
              <input
                type="text"
                placeholder="銘柄コード・企業名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-[#0066cc]"
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorDisplay
            message={error.message}
            type="api"
            onRetry={() => {
              setError(null)
              // useEffectが再実行されるようにする
              const fetchMarketData = async () => {
                setLoading(true)
                setError(null)
                try {
                  const initialLimit = 50
                  let response = await fetch(
                    `/api/market/top-movers?type=${activeSort.type}&market=${marketFilter}&limit=${initialLimit}&real=false`
                  )
                  if (response.ok) {
                    const data = await response.json()
                    setStocks(data.movers || [])
                  }
                } catch (err) {
                  setError(err instanceof Error ? err : new Error('マーケットデータの取得に失敗しました'))
                } finally {
                  setLoading(false)
                }
              }
              fetchMarketData()
            }}
          />
        )}

        {/* Stock Table */}
        {filteredStocks.length === 0 && !loading ? (
          <EmptyState
            icon="📊"
            title="銘柄が見つかりませんでした"
            message={searchQuery ? '検索条件を変更してください。' : 'マーケットデータを読み込めませんでした。ページをリロードしてください。'}
            actionLabel="ページをリロード"
            onAction={() => window.location.reload()}
          />
        ) : (
          <>
            <StockTable stocks={filteredStocks} onRowClick={handleSelectSymbol} />

            {/* Results Count */}
            {filteredStocks.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <p className="text-gray-600 text-xs">
                  {filteredStocks.length}件の銘柄を表示中
                  {searchQuery && ` (検索: "${searchQuery}")`}
                </p>
              </div>
            )}
          </>
        )}

        {/* Stock Detail Modal (パターンB) */}
        <StockDetailModal
          symbol={selectedSymbol}
          isOpen={isModalOpen && detailViewMode === 'modal'}
          onClose={handleCloseModal}
        />

        {/* Stock Detail Panel (パターンA) */}
        <StockDetailPanel
          symbol={selectedSymbol}
          isOpen={isPanelOpen && detailViewMode === 'panel'}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  )
}
