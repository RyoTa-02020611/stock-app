'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StockItem } from './Watchlist'

export type SearchResult = {
  symbol: string
  name: string
  exchange?: string
  market?: string
  country?: string
  type?: string
  currency?: string
}

interface HeaderProps {
  pageTitle: string
  selectedSymbol?: string
  onSelectSymbol?: (symbol: string) => void
  onAddToWatchlist?: (stock: StockItem) => void
  onMenuClick?: () => void
  showSearch?: boolean
}

const getCountryFlag = (country?: string): string => {
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
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'SG': '🇸🇬',
  }
  return flags[country || ''] || '🌍'
}

const getMarketLabel = (market?: string, exchange?: string): string => {
  if (market && market !== exchange) return market
  if (exchange) {
    const exchangeMap: Record<string, string> = {
      'NASDAQ': 'NASDAQ',
      'NYSE': 'NYSE',
      'AMEX': 'AMEX',
      'TSE': '東京証券取引所',
      'OSE': '大阪証券取引所',
      'LSE': 'ロンドン証券取引所',
      'HKG': '香港証券取引所',
      'SSE': '上海証券取引所',
      'SZSE': '深圳証券取引所',
      'KRX': '韓国取引所',
      'AMS': 'アムステルダム証券取引所',
      'FRA': 'フランクフルト証券取引所',
      'XETR': 'XETRA',
      'EPA': 'ユーロネクスト・パリ',
    }
    return exchangeMap[exchange] || exchange
  }
  return '不明'
}

export default function Header({ 
  pageTitle, 
  selectedSymbol,
  onSelectSymbol,
  onAddToWatchlist,
  onMenuClick,
  showSearch = true,
}: HeaderProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search effect
  useEffect(() => {
    const searchQuery = query.trim()
    
    if (!searchQuery || searchQuery.length < 1) {
      setResults([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/search-symbol?query=${encodeURIComponent(searchQuery)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '検索に失敗しました')
        }
        
        const data = await response.json()
        const searchResults = data.results || []
        
        console.log('Search results:', searchResults) // Debug log
        
        setResults(searchResults)
        setIsOpen(true) // Always show dropdown when searching
      } catch (err: any) {
        console.error('Search error:', err)
        setError(err.message || '検索中にエラーが発生しました。時間をおいて再度お試しください。')
        setResults([])
        setIsOpen(true) // Show error message
      } finally {
        setIsLoading(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    // Navigate to stock detail page
    router.push(`/stocks/${result.symbol}`)
    
    if (onSelectSymbol) {
      onSelectSymbol(result.symbol)
    }
    
    if (onAddToWatchlist) {
      onAddToWatchlist({
        symbol: result.symbol,
        name: result.name,
      })
    }
    
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 lg:left-64 right-0 z-30 shadow-sm">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-gray-900">{pageTitle}</h2>

      {/* Search Bar and User Menu */}
      <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-initial justify-end">
        {/* Search Bar with Dropdown */}
        {showSearch && (
        <div className="relative hidden md:block" ref={searchRef}>
          <input
            type="text"
            placeholder="銘柄名やティッカーで検索（例: AAPL, 7203.T, TSLA）…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.length > 0) setIsOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false)
                setQuery('')
              }
            }}
            className="w-64 lg:w-80 px-4 py-2 pl-10 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-[#0066cc]"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Search Results Dropdown */}
          {(isOpen || query.length > 0) && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
              {isLoading && (
                <div className="p-4 text-center text-gray-600 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0066cc]"></div>
                    <span>世界中の市場から検索中…</span>
                  </div>
                </div>
              )}
              
              {error && !isLoading && (
                <div className="p-4">
                  <div className="text-center text-red-600 text-sm mb-2">{error}</div>
                  <div className="text-center text-gray-500 text-xs">
                    ヒント: 銘柄コード（例: AAPL, 7203.T）または会社名で検索してください
                  </div>
                </div>
              )}
              
              {!isLoading && !error && results.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                    {results.length}件の検索結果
                  </div>
                  {results.map((result, index) => (
                    <button
                      key={`${result.symbol}-${index}`}
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-gray-900 font-semibold text-sm">{result.symbol}</p>
                            {result.country && (
                              <span className="text-lg" title={result.country}>
                                {getCountryFlag(result.country)}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs truncate">{result.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {result.market && (
                              <span className="text-gray-500 text-xs">
                                {getMarketLabel(result.market, result.exchange)}
                              </span>
                            )}
                            {result.currency && (
                              <span className="text-gray-500 text-xs">
                                {result.currency}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {!isLoading && !error && results.length === 0 && query && (
                <div className="p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">検索結果はありません</p>
                  <p className="text-xs text-gray-500 mb-3">別のキーワードで検索してください</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>検索例:</p>
                    <p>• 銘柄コード: AAPL, TSLA, 7203.T</p>
                    <p>• 会社名: Apple, トヨタ, Tesla</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* User Avatar */}
        <div className="w-10 h-10 bg-[#0066cc] rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:bg-[#0052a3] transition-colors shadow-sm">
          JD
        </div>
      </div>
    </header>
  )
}
