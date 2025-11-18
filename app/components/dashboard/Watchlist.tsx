'use client'

import { useEffect, useState } from 'react'

// Watchlist component - clickable stock list with real-time prices
export interface StockItem {
  symbol: string
  name: string
  price?: number
  changePercent?: number
  change?: number
  volume?: number
}

interface WatchlistProps {
  stocks: StockItem[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onRemoveStock?: (symbol: string) => void
}

/**
 * Fetch real-time quote for a symbol
 */
async function fetchQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const response = await fetch(`/api/stock-quote?symbol=${encodeURIComponent(symbol)}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      price: data.price || 0,
      change: data.change || 0,
      changePercent: data.changePercent || 0,
    }
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error)
    return null
  }
}

export default function Watchlist({ stocks, selectedSymbol, onSelectSymbol, onRemoveStock }: WatchlistProps) {
  const [stockPrices, setStockPrices] = useState<Record<string, { price: number; change: number; changePercent: number }>>({})

  // Fetch prices for all stocks in watchlist
  useEffect(() => {
    if (stocks.length === 0) return

    const fetchPrices = async () => {
      const pricePromises = stocks.map(async (stock) => {
        const quote = await fetchQuote(stock.symbol)
        if (quote) {
          return { symbol: stock.symbol, ...quote }
        }
        return null
      })

      const results = await Promise.all(pricePromises)
      const priceMap: Record<string, { price: number; change: number; changePercent: number }> = {}
      
      results.forEach((result) => {
        if (result) {
          priceMap[result.symbol] = {
            price: result.price,
            change: result.change,
            changePercent: result.changePercent,
          }
        }
      })

      setStockPrices(priceMap)
    }

    fetchPrices()

    // Update prices every 10 seconds (like moomoo)
    const interval = setInterval(fetchPrices, 10000)

    return () => clearInterval(interval)
  }, [stocks])

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 text-sm font-medium">ウォッチリスト</h3>
        <span className="text-xs text-gray-500">{stocks.length}銘柄</span>
      </div>
      
      {stocks.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm mb-2">ウォッチリストが空です</p>
          <p className="text-gray-500 text-xs">検索バーから銘柄を追加してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stocks.map((stock) => {
            const priceData = stockPrices[stock.symbol] || {
              price: stock.price || 0,
              change: stock.change || 0,
              changePercent: stock.changePercent || 0,
            }
            const isPositive = priceData.changePercent >= 0
            const isSelected = stock.symbol === selectedSymbol
            
            return (
              <div
                key={stock.symbol}
                className={`flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer relative group ${
                  isSelected
                    ? 'bg-[#e6f2ff] border-2 border-[#0066cc]'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div
                  className="flex-1"
                  onClick={() => onSelectSymbol(stock.symbol)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold ${isSelected ? 'text-[#0066cc]' : 'text-gray-900'}`}>
                      {stock.symbol}
                    </p>
                    <p className="text-gray-600 text-xs truncate">{stock.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {priceData.price > 0 && (
                      <p className="text-gray-900 text-sm font-semibold">
                        ${priceData.price.toFixed(2)}
                      </p>
                    )}
                    {priceData.changePercent !== 0 && (
                      <p className={`text-sm font-bold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                        {isPositive ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Remove button */}
                {onRemoveStock && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveStock(stock.symbol)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-red-50 rounded text-[#e53935] hover:text-[#c62828]"
                    title="ウォッチリストから削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
