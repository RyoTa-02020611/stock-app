'use client'

import MarketIndicesGrid from '../components/markets/MarketIndicesGrid'

export default function MarketsPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">世界の市場指数</h1>
          <p className="text-gray-400 text-sm">
            主要な株式市場のリアルタイム指数を表示しています
          </p>
        </div>

        <MarketIndicesGrid />
      </div>
    </div>
  )
}

