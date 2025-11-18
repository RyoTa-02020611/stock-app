'use client'

import { StockItem } from './Watchlist'

interface WatchlistPageProps {
  watchlist: StockItem[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onRemoveStock: (symbol: string) => void
}

export default function WatchlistPage({
  watchlist,
  selectedSymbol,
  onSelectSymbol,
  onRemoveStock,
}: WatchlistPageProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h2 className="text-white text-2xl font-bold mb-2">ウォッチリスト</h2>
        <p className="text-gray-400 text-sm">監視したい銘柄を管理します</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg mb-2">ウォッチリストが空です</p>
          <p className="text-gray-500 text-sm">検索バーから銘柄を追加してください</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 text-xs font-medium">銘柄コード</th>
                  <th className="text-left py-4 px-6 text-gray-400 text-xs font-medium">会社名</th>
                  <th className="text-right py-4 px-6 text-gray-400 text-xs font-medium">価格</th>
                  <th className="text-right py-4 px-6 text-gray-400 text-xs font-medium">変動率</th>
                  <th className="text-center py-4 px-6 text-gray-400 text-xs font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((stock) => {
                  const isPositive = (stock.changePercent || 0) >= 0
                  const isSelected = stock.symbol === selectedSymbol

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectSymbol(stock.symbol)}
                      className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-600/10' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <p className={`font-semibold ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                          {stock.symbol}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-300 text-sm">{stock.name}</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {stock.price !== undefined ? (
                          <p className="text-white font-semibold">${stock.price.toFixed(2)}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">--</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {stock.changePercent !== undefined ? (
                          <p className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm">--</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveStock(stock.symbol)
                          }}
                          className="p-2 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300 transition-colors"
                          title="ウォッチリストから削除"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

