'use client'

import { format } from 'date-fns'

interface Stock {
  id: string
  symbol: string
  name: string
  purchaseDate: string
  purchasePrice: number
  quantity: number
  memo: string
  createdAt: string
}

interface StockListProps {
  stocks: Stock[]
  onSelect: (stock: Stock) => void
  selectedStockId?: string | null
  onUpdate: (id: string, updates: Partial<Stock>) => void
  onDelete: (id: string) => void
  onTrade: (stock: Stock, type: 'buy' | 'sell') => void
}

export default function StockList({ stocks, onSelect, selectedStockId, onUpdate, onDelete, onTrade }: StockListProps) {
  if (stocks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          まだ株式が登録されていません
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          「+ 株式を追加」ボタンから追加してください
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stocks.map((stock) => (
        <div
          key={stock.id}
          onClick={() => onSelect(stock)}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
            selectedStockId === stock.id ? 'border-blue-600' : 'border-blue-500'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {stock.name} ({stock.symbol})
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                購入日: {format(new Date(stock.purchaseDate), 'yyyy年MM月dd日')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stock.quantity}株
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                購入価格: ¥{stock.purchasePrice.toLocaleString()}
              </p>
            </div>
          </div>

          {stock.memo && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {stock.memo}
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newMemo = prompt('メモを編集:', stock.memo)
                if (newMemo !== null) {
                  onUpdate(stock.id, { memo: newMemo })
                }
              }}
              className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded"
            >
              メモ編集
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(stock.id)
              }}
              className="text-sm bg-red-200 hover:bg-red-300 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-300 px-3 py-1 rounded"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
