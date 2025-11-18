'use client'

import { format } from 'date-fns'
import { getStockPrice } from '../utils/stockApi'
import { useEffect, useState } from 'react'

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

interface StockCardProps {
  stock: Stock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Stock>) => void
  onDelete: () => void
  onTrade: (type: 'buy' | 'sell') => void
}

interface LivePrice {
  currentPrice: number
  change: number
  changePercent: number
  lastUpdated: Date
}

export default function StockCard({ 
  stock, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onTrade 
}: StockCardProps) {
  const [livePrice, setLivePrice] = useState<LivePrice | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  // リアルタイム価格を取得・更新
  useEffect(() => {
    const fetchPrice = async () => {
      setLoadingPrice(true)
      try {
        const quote = await getStockPrice(stock.symbol)
        if (quote) {
          setLivePrice({
            currentPrice: quote.currentPrice,
            change: quote.change,
            changePercent: quote.changePercent,
            lastUpdated: new Date(),
          })
        }
      } catch (error) {
        console.error('価格取得エラー:', error)
      } finally {
        setLoadingPrice(false)
      }
    }

    // 初回取得
    fetchPrice()

    // 30秒ごとに更新
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [stock.symbol])

  const currentPrice = livePrice?.currentPrice || stock.purchasePrice
  const purchaseTotal = stock.purchasePrice * stock.quantity
  const currentTotal = currentPrice * stock.quantity
  const profit = currentTotal - purchaseTotal
  const profitPercent = (profit / purchaseTotal) * 100

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
        isSelected 
          ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-200 dark:ring-blue-900/50' 
          : 'border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700'
      } overflow-hidden`}
    >
      {/* グラデーションアクセント */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {stock.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stock.symbol}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              📅 {format(new Date(stock.purchaseDate), 'yyyy年MM月dd日')} 購入
            </p>
          </div>
          
          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newMemo = prompt('メモを編集:', stock.memo)
                if (newMemo !== null) {
                  onUpdate({ memo: newMemo })
                }
              }}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="メモ編集"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* リアルタイム価格情報 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">現在価格</span>
            {loadingPrice && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            )}
            {livePrice && !loadingPrice && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                livePrice.changePercent >= 0
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {livePrice.changePercent >= 0 ? '↑' : '↓'} {livePrice.changePercent >= 0 ? '+' : ''}{livePrice.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
              ¥{currentPrice.toLocaleString()}
            </p>
            {livePrice && (
              <p className={`text-sm font-semibold ${
                livePrice.change >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {livePrice.change >= 0 ? '+' : ''}¥{livePrice.change.toFixed(2)}
              </p>
            )}
          </div>
          {livePrice && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {livePrice.lastUpdated.toLocaleTimeString('ja-JP')} 更新
            </p>
          )}
        </div>

        {/* 価格情報 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">購入価格</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ¥{stock.purchasePrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">保有株数</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stock.quantity.toLocaleString()}
              <span className="text-base text-gray-500 dark:text-gray-400 ml-1">株</span>
            </p>
          </div>
        </div>

        {/* 損益情報 */}
        <div className={`bg-gradient-to-r rounded-xl p-4 mb-4 text-white shadow-lg ${
          profit >= 0
            ? 'from-green-500 to-emerald-600'
            : 'from-red-500 to-rose-600'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs opacity-90">評価損益</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {profit >= 0 ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6 6" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-3xl font-extrabold mb-1">
            {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
          </p>
          <p className="text-sm font-semibold opacity-90">
            損益率: {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
          </p>
        </div>

        {/* 投資総額 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-4 text-white">
          <p className="text-xs opacity-90 mb-1">投資総額</p>
          <p className="text-3xl font-extrabold">
            ¥{purchaseTotal.toLocaleString()}
          </p>
        </div>

        {/* 取引ボタン */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTrade('buy')
            }}
            className="h-14 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            買
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTrade('sell')
            }}
            className="h-14 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            売
          </button>
        </div>

        {/* メモ */}
        {stock.memo && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              購入理由・メモ
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {stock.memo}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}



