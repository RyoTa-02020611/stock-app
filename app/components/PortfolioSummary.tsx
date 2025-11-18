'use client'

import { useMemo, useState, useEffect } from 'react'
import { getStockPrices, StockQuote } from '../utils/stockApi'

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

interface PortfolioSummaryProps {
  stocks: Stock[]
}

export default function PortfolioSummary({ stocks }: PortfolioSummaryProps) {
  const [livePrices, setLivePrices] = useState<Map<string, StockQuote>>(new Map())
  const [loadingPrices, setLoadingPrices] = useState(false)

  // リアルタイム価格を取得
  useEffect(() => {
    const fetchPrices = async () => {
      if (stocks.length === 0) return
      
      setLoadingPrices(true)
      try {
        const symbols = stocks.map(s => s.symbol)
        const prices = await getStockPrices(symbols)
        setLivePrices(prices)
      } catch (error) {
        console.error('価格取得エラー:', error)
      } finally {
        setLoadingPrices(false)
      }
    }

    // 初回取得
    fetchPrices()

    // 30秒ごとに更新
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [stocks])

  const summary = useMemo(() => {
    const totalInvestment = stocks.reduce((sum, stock) => 
      sum + (stock.purchasePrice * stock.quantity), 0
    )
    
    // リアルタイム価格ベースの評価額を計算
    const totalCurrentValue = stocks.reduce((sum, stock) => {
      const livePrice = livePrices.get(stock.symbol)
      const currentPrice = livePrice?.currentPrice || stock.purchasePrice
      return sum + (currentPrice * stock.quantity)
    }, 0)
    
    const totalProfit = totalCurrentValue - totalInvestment
    const totalProfitPercent = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0
    
    return {
      totalStocks: stocks.length,
      totalInvestment,
      totalShares: stocks.reduce((sum, stock) => sum + stock.quantity, 0),
      totalCurrentValue,
      totalProfit,
      totalProfitPercent,
    }
  }, [stocks, livePrices])

  return (
    <div className="mb-6 space-y-4">
      {/* ポートフォリオ評価 */}
      <div className={`bg-gradient-to-br rounded-2xl shadow-xl p-6 border-2 text-white ${
        summary.totalProfit >= 0
          ? 'from-green-500 to-emerald-600 border-green-400'
          : 'from-red-500 to-rose-600 border-red-400'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1">ポートフォリオ評価額</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold">
                ¥{summary.totalCurrentValue.toLocaleString()}
              </p>
              {loadingPrices && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90 mb-1">総損益</p>
            <p className={`text-3xl font-extrabold ${
              summary.totalProfit >= 0 ? 'text-green-100' : 'text-red-100'
            }`}>
              {summary.totalProfit >= 0 ? '+' : ''}¥{summary.totalProfit.toLocaleString()}
            </p>
            <p className={`text-lg font-semibold mt-1 ${
              summary.totalProfit >= 0 ? 'text-green-100' : 'text-red-100'
            }`}>
              ({summary.totalProfitPercent >= 0 ? '+' : ''}{summary.totalProfitPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-90">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          リアルタイム価格で自動更新（30秒ごと）
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 保有銘柄数 */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">保有銘柄数</span>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalStocks}
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">銘柄</span>
          </p>
        </div>

        {/* 総投資額 */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">総投資額</span>
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ¥{summary.totalInvestment.toLocaleString()}
          </p>
        </div>

        {/* 総保有株数 */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">総保有株数</span>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalShares.toLocaleString()}
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">株</span>
          </p>
        </div>
      </div>
    </div>
  )
}

