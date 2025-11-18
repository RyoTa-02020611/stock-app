'use client'

import { MarketIndex } from '../../lib/types/indices'

interface MarketIndexCardProps {
  index: MarketIndex
}

export default function MarketIndexCard({ index }: MarketIndexCardProps) {
  const isPositive = index.change >= 0

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all shadow-lg hover:shadow-xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{index.name}</h3>
          <p className="text-gray-400 text-sm">{index.symbol}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isPositive 
            ? 'bg-green-900/30 text-green-400 border border-green-700' 
            : 'bg-red-900/30 text-red-400 border border-red-700'
        }`}>
          {index.region}
        </div>
      </div>

      {/* 価格 */}
      <div className="mb-4">
        <p className="text-white text-3xl font-bold mb-1">
          {index.price.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(index.change).toFixed(2)}
          </span>
          <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {index.marketStatus === 'open' ? '🟢 取引中' : 
           index.marketStatus === 'closed' ? '🔴 取引終了' :
           index.marketStatus === 'pre-market' ? '🟡 前場' : '🟡 後場'}
        </span>
        <span>{new Date(index.lastUpdate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}

