'use client'

import { useEffect, useState } from 'react'

interface StockInfo {
  symbol: string
  companyName: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  peRatio?: number
  dividendYield?: number
  currency: string
  exchange: string
  market: string
  country: string
  sector?: string
  industry?: string
  website?: string
  description?: string
}

interface StockInfoPanelProps {
  symbol: string
}

const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'JP': '🇯🇵',
    'UK': '🇬🇧',
    'HK': '🇭🇰',
    'CN': '🇨🇳',
    'KR': '🇰🇷',
    'NL': '🇳🇱',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
  }
  return flags[country] || '🌍'
}

const formatNumber = (num: number | undefined, currency?: string): string => {
  if (num === undefined || num === null) return '--'
  
  if (num >= 1e12) {
    return `${currency || ''}${(num / 1e12).toFixed(2)}兆`
  } else if (num >= 1e9) {
    return `${currency || ''}${(num / 1e9).toFixed(2)}億`
  } else if (num >= 1e6) {
    return `${currency || ''}${(num / 1e6).toFixed(2)}百万`
  } else if (num >= 1e3) {
    return `${currency || ''}${(num / 1e3).toFixed(2)}千`
  }
  return `${currency || ''}${num.toLocaleString()}`
}

export default function StockInfoPanel({ symbol }: StockInfoPanelProps) {
  const [info, setInfo] = useState<StockInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) {
      setInfo(null)
      return
    }

    const fetchInfo = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/stock-info?symbol=${encodeURIComponent(symbol)}`)
        
        if (!response.ok) {
          throw new Error('情報の取得に失敗しました')
        }

        const data = await response.json()
        setInfo(data)
      } catch (err: any) {
        console.error('Error fetching stock info:', err)
        setError(err.message || '株価情報を取得できませんでした')
      } finally {
        setLoading(false)
      }
    }

    fetchInfo()
  }, [symbol])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!info) {
    return null
  }

  const isPositive = info.change >= 0

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-white text-2xl font-bold">{info.companyName}</h3>
          {info.country && (
            <span className="text-2xl" title={info.country}>
              {getCountryFlag(info.country)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-400 text-sm">{info.symbol}</p>
          <span className="text-gray-500">•</span>
          <p className="text-gray-400 text-sm">{info.market}</p>
        </div>

        {/* Price Info */}
        <div className="flex items-baseline gap-3 mb-4">
          <p className="text-white text-3xl font-bold">
            {info.currency === 'JPY' ? '¥' : '$'}{info.currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className={`flex items-baseline gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <span className="text-lg font-semibold">
              {isPositive ? '+' : ''}{info.change.toFixed(2)}
            </span>
            <span className="text-sm">
              ({isPositive ? '+' : ''}{info.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">前日終値</p>
          <p className="text-white font-semibold">
            {info.currency === 'JPY' ? '¥' : '$'}{info.previousClose.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">出来高</p>
          <p className="text-white font-semibold">{formatNumber(info.volume)}</p>
        </div>
        {info.marketCap && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">時価総額</p>
            <p className="text-white font-semibold">{formatNumber(info.marketCap, info.currency === 'JPY' ? '¥' : '$')}</p>
          </div>
        )}
        {info.peRatio && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">P/E比</p>
            <p className="text-white font-semibold">{info.peRatio.toFixed(2)}</p>
          </div>
        )}
        {info.dividendYield && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">配当利回り</p>
            <p className="text-white font-semibold">{(info.dividendYield * 100).toFixed(2)}%</p>
          </div>
        )}
        {info.sector && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">セクター</p>
            <p className="text-white font-semibold text-xs">{info.sector}</p>
          </div>
        )}
      </div>

      {/* Company Description */}
      {info.description && (
        <div className="mb-4 pb-4 border-b border-gray-700">
          <p className="text-gray-400 text-xs font-medium mb-2">会社概要</p>
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
            {info.description}
          </p>
        </div>
      )}

      {/* Website */}
      {info.website && (
        <div>
          <a
            href={info.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>公式ウェブサイト</span>
          </a>
        </div>
      )}
    </div>
  )
}

