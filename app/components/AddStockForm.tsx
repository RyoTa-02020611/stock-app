'use client'

import { useState, useEffect } from 'react'
import { getCompanyName, getStockPrice } from '../utils/stockApi'

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

interface AddStockFormProps {
  onSubmit: (stock: Omit<Stock, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

export default function AddStockForm({ onSubmit, onCancel }: AddStockFormProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    quantity: '',
    memo: '',
  })
  const [loadingCompanyName, setLoadingCompanyName] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)

  // 銘柄コードから会社名を自動取得
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (formData.symbol && formData.symbol.length >= 4) {
        setLoadingCompanyName(true)
        try {
          const companyName = await getCompanyName(formData.symbol)
          if (companyName) {
            // 会社名が空の場合のみ自動設定（手動入力は尊重）
            setFormData(prev => {
              if (!prev.name || prev.name.trim() === '') {
                return { ...prev, name: companyName }
              }
              return prev
            })
          }
        } catch (error) {
          console.error('会社名取得エラー:', error)
        } finally {
          setLoadingCompanyName(false)
        }
      }
    }

    // デバウンス処理（500ms後に実行）
    const timer = setTimeout(fetchCompanyName, 500)
    return () => clearTimeout(timer)
  }, [formData.symbol])

  // 会社名が取得できたら、現在価格も自動取得
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (formData.name && formData.symbol && formData.purchasePrice === '') {
        setLoadingPrice(true)
        try {
          const quote = await getStockPrice(formData.symbol)
          if (quote && quote.currentPrice) {
            setFormData(prev => ({ ...prev, purchasePrice: quote.currentPrice.toFixed(2) }))
          }
        } catch (error) {
          console.error('価格取得エラー:', error)
        } finally {
          setLoadingPrice(false)
        }
      }
    }

    const timer = setTimeout(fetchCurrentPrice, 300)
    return () => clearTimeout(timer)
  }, [formData.name, formData.symbol])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      purchaseDate: formData.purchaseDate,
      purchasePrice: parseFloat(formData.purchasePrice),
      quantity: parseInt(formData.quantity),
      memo: formData.memo,
    })
    setFormData({
      symbol: '',
      name: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: '',
      quantity: '',
      memo: '',
    })
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            新しい株式を追加
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            保有株式の情報を入力してください
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <span className="text-red-500">*</span>
              銘柄コード
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase(), name: '' })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="例: 7203"
                maxLength={10}
              />
              {loadingCompanyName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              銘柄コードを入力すると、会社名と現在価格を自動取得します
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <span className="text-red-500">*</span>
              会社名
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder={loadingCompanyName ? '会社名を取得中...' : '例: トヨタ自動車株式会社'}
                disabled={loadingCompanyName}
              />
              {formData.name && !loadingCompanyName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <span className="text-red-500">*</span>
              購入日
            </label>
            <input
              type="date"
              required
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <span className="text-red-500">*</span>
              購入価格 (円)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder={loadingPrice ? '現在価格を取得中...' : '例: 2500'}
                disabled={loadingPrice}
              />
              {loadingPrice && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
              {formData.purchasePrice && !loadingPrice && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  現在の市場価格を自動取得しました
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <span className="text-red-500">*</span>
            保有株数
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            placeholder="例: 100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            購入理由・メモ
          </label>
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all resize-none"
            placeholder="なぜこの株を買ったのか、将来の期待などを記録しておきましょう..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            追加する
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-200 border-2 border-gray-200 dark:border-gray-600"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}

