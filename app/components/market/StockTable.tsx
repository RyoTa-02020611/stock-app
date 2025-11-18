'use client'

import { memo, useMemo } from 'react'
import StockSparkline from './StockSparkline'

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

interface StockTableProps {
  stocks: TopMover[]
  onRowClick: (symbol: string) => void
}

function StockTable({ stocks, onRowClick }: StockTableProps) {
  const getCountryFlag = (country?: string): string => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'JP': '🇯🇵',
      'NL': '🇳🇱',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'DK': '🇩🇰',
      'TW': '🇹🇼',
      'CN': '🇨🇳',
      'HK': '🇭🇰',
      'KR': '🇰🇷',
    }
    return flags[country || ''] || '🌍'
  }

  const formatMarketCap = (marketCap?: number): string => {
    if (!marketCap) return '--'
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}兆`
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}億`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}百万`
    return `$${marketCap.toLocaleString()}`
  }

  const formatPrice = (price: number, currency?: string): string => {
    if (currency === 'JPY') {
      return `¥${price.toLocaleString()}`
    }
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-4 px-4 text-gray-600 text-xs font-medium">銘柄</th>
              <th className="text-left py-4 px-4 text-gray-600 text-xs font-medium">市場</th>
              <th className="text-left py-4 px-4 text-gray-600 text-xs font-medium">チャート</th>
              <th className="text-right py-4 px-4 text-gray-600 text-xs font-medium">価格</th>
              <th className="text-right py-4 px-4 text-gray-600 text-xs font-medium">変動</th>
              <th className="text-right py-4 px-4 text-gray-600 text-xs font-medium">変動率</th>
              <th className="text-right py-4 px-4 text-gray-600 text-xs font-medium">出来高</th>
              <th className="text-right py-4 px-4 text-gray-600 text-xs font-medium">時価総額</th>
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  該当する銘柄がありません
                </td>
              </tr>
            ) : (
              stocks.map((stock, index) => {
                const isPositive = stock.changePercent >= 0
                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onRowClick(stock.symbol)}
                    className={`border-b border-gray-100 transition-colors cursor-pointer group ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-[#e6f2ff]`}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-gray-900 font-semibold text-sm group-hover:text-[#0066cc] transition-colors">
                          {stock.symbol}
                        </p>
                        <p className="text-gray-600 text-xs">{stock.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(stock.country)}</span>
                        <span className="text-gray-600 text-xs">{stock.exchange || '--'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StockSparkline
                        symbol={stock.symbol}
                        currentPrice={stock.price}
                      />
                    </td>
                    <td className="py-4 px-4 text-gray-900 text-sm text-right font-medium">
                      {formatPrice(stock.price, stock.currency)}
                    </td>
                    <td className={`py-4 px-4 text-sm text-right font-semibold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                      {isPositive ? '+' : ''}{formatPrice(stock.change, stock.currency)}
                    </td>
                    <td className={`py-4 px-4 text-sm text-right font-semibold ${isPositive ? 'text-[#00c853]' : 'text-[#e53935]'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-sm text-right">
                      {stock.volume.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-sm text-right">
                      {formatMarketCap(stock.marketCap)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default memo(StockTable)

