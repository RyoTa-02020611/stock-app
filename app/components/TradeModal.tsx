'use client'

import { useState } from 'react'
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

interface TradeModalProps {
  stock: Stock
  tradeType: 'buy' | 'sell'
  onClose: () => void
  onConfirm: (trade: { type: 'buy' | 'sell', quantity: number, price: number }) => void
  onTradeTypeChange?: (type: 'buy' | 'sell') => void
}

export default function TradeModal({ stock, tradeType, onClose, onConfirm, onTradeTypeChange }: TradeModalProps) {
  const [quantity, setQuantity] = useState(100)
  const [price, setPrice] = useState(stock.purchasePrice)
  const [executionType, setExecutionType] = useState<'market' | 'limit'>('market')
  const [tradeMethod, setTradeMethod] = useState<'spot' | 'margin'>('spot')

  const handleConfirm = () => {
    onConfirm({ type: tradeType, quantity, price })
    onClose()
  }

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta)
    setQuantity(newQuantity)
  }

  const adjustPrice = (delta: number) => {
    const newPrice = Math.max(1, price + delta)
    setPrice(newPrice)
  }

  const totalAmount = quantity * price

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:w-[600px] bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {tradeType === 'buy' ? '買い注文' : '売り注文'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 銘柄情報 */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">銘柄</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stock.name} ({stock.symbol})
            </p>
          </div>

          {/* 売買ボタン（タブ切り替え） */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onTradeTypeChange?.('buy')}
              className={`h-16 rounded-xl font-bold text-lg transition-all ${
                tradeType === 'buy'
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              買
            </button>
            <button
              onClick={() => onTradeTypeChange?.('sell')}
              className={`h-16 rounded-xl font-bold text-lg transition-all ${
                tradeType === 'sell'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              売
            </button>
          </div>

          {/* 取引方法 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">取引方法</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTradeMethod('spot')}
                className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                  tradeMethod === 'spot'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                現物
              </button>
              <button
                onClick={() => setTradeMethod('margin')}
                className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                  tradeMethod === 'margin'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                信用
              </button>
            </div>
          </div>

          {/* 執行条件 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">執行条件</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExecutionType('market')}
                className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                  executionType === 'market'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                成行
              </button>
              <button
                onClick={() => setExecutionType('limit')}
                className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                  executionType === 'limit'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                指値
              </button>
            </div>
          </div>

          {/* 数量 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">数量</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustQuantity(-100)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-bold text-xl transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 px-4 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => adjustQuantity(100)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">単位: 株</p>
          </div>

          {/* 価格 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">価格</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustPrice(-10)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-bold text-xl transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Math.max(1, parseFloat(e.target.value) || 1))}
                className="flex-1 h-12 px-4 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => adjustPrice(10)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">円</p>
          </div>

          {/* 注文金額 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90 mb-1">注文金額</p>
            <p className="text-3xl font-extrabold">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>

          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={onClose}
              className="py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              className={`py-4 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl ${
                tradeType === 'buy'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              注文確認
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

