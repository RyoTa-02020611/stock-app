import { NextRequest, NextResponse } from 'next/server'

export type SearchResult = {
  symbol: string
  name: string
  exchange?: string
  market?: string
  country?: string
  type?: string
  currency?: string
}

/**
 * Japanese company name to English/Romaji mapping
 */
const japaneseCompanyNames: Record<string, string[]> = {
  'トヨタ': ['Toyota', '7203'],
  'トヨタ自動車': ['Toyota', '7203'],
  'ソニー': ['Sony', '6758'],
  'ソニーグループ': ['Sony', '6758'],
  'パナソニック': ['Panasonic', '6752'],
  '日立': ['Hitachi', '6501'],
  '日立製作所': ['Hitachi', '6501'],
  '三菱': ['Mitsubishi', '8058'],
  '三菱UFJ': ['Mitsubishi UFJ', '8306'],
  '三井住友': ['Sumitomo Mitsui', '8316'],
  'みずほ': ['Mizuho', '8411'],
  'みずほフィナンシャルグループ': ['Mizuho', '8411'],
  '任天堂': ['Nintendo', '7974'],
  'キーエンス': ['Keyence', '6861'],
  'ファーストリテイリング': ['Fast Retailing', '9983'],
  'ユニクロ': ['Fast Retailing', '9983'],
  'セブン': ['Seven & i', '3382'],
  'セブンイレブン': ['Seven & i', '3382'],
  'KDDI': ['KDDI', '9433'],
  'NTT': ['NTT', '9432'],
  'NTTドコモ': ['NTT Docomo', '9437'],
  'ソフトバンク': ['SoftBank', '9984'],
  'ソフトバンクグループ': ['SoftBank', '9984'],
  '楽天': ['Rakuten', '4755'],
  '楽天グループ': ['Rakuten', '4755'],
  'アマゾン': ['Amazon', 'AMZN'],
  'アップル': ['Apple', 'AAPL'],
  'マイクロソフト': ['Microsoft', 'MSFT'],
  'グーグル': ['Google', 'GOOGL'],
  'テスラ': ['Tesla', 'TSLA'],
}

/**
 * Check if query contains Japanese characters
 */
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

/**
 * Search stocks using Yahoo Finance API with better error handling
 */
async function searchYahooFinance(query: string): Promise<SearchResult[]> {
  try {
    const originalQuery = query.trim()
    const cleanQuery = originalQuery.toUpperCase()
    
    // Try multiple search variations
    const searchVariations: string[] = []
    
    // Add original query (preserves Japanese characters)
    searchVariations.push(originalQuery)
    
    // If query contains Japanese, try English/Romaji variations
    if (containsJapanese(originalQuery)) {
      // Try direct mapping
      const normalizedQuery = originalQuery.replace(/\s+/g, '')
      if (japaneseCompanyNames[normalizedQuery]) {
        searchVariations.push(...japaneseCompanyNames[normalizedQuery])
      }
      
      // Try partial matches
      for (const [jpName, enNames] of Object.entries(japaneseCompanyNames)) {
        if (normalizedQuery.includes(jpName) || jpName.includes(normalizedQuery)) {
          searchVariations.push(...enNames)
        }
      }
      
      // Also try the query as-is (Yahoo Finance sometimes handles Japanese)
      searchVariations.push(originalQuery)
    } else {
      // For non-Japanese queries, add uppercase and space-removed versions
      searchVariations.push(cleanQuery)
      searchVariations.push(cleanQuery.replace(/\s+/g, ''))
    }

    // Add Japanese stock code format if it's 4 digits
    if (/^\d{4}$/.test(originalQuery)) {
      searchVariations.push(`${originalQuery}.T`)
    }
    
    // Remove duplicates
    const uniqueVariations = Array.from(new Set(searchVariations))

    const allResults: SearchResult[] = []
    const seenSymbols = new Set<string>()

    for (const searchQuery of uniqueVariations) {
      try {
        // Use proper encoding for Japanese characters
        const encodedQuery = encodeURIComponent(searchQuery)
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodedQuery}&quotesCount=25&newsCount=0&enableFuzzyQuery=true`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Charset': 'UTF-8',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com',
          },
          // Don't cache to get fresh results
          cache: 'no-store',
        })

        if (!response.ok) {
          console.warn(`Yahoo Finance search failed for "${searchQuery}": ${response.status} ${response.statusText}`)
          // Try to read error body for debugging
          try {
            const errorText = await response.text()
            console.warn('Error response:', errorText.substring(0, 200))
          } catch (e) {
            // Ignore
          }
          continue
        }

        const data = await response.json()
        
        if (!data) {
          console.warn(`No data returned for "${searchQuery}"`)
          continue
        }
        
        if (!data.quotes || !Array.isArray(data.quotes)) {
          console.warn(`Invalid quotes data for "${searchQuery}":`, data)
          continue
        }
        
        if (data.quotes.length === 0) {
          continue // No results for this variation
        }

        for (const quote of data.quotes) {
          if (!quote.symbol || seenSymbols.has(quote.symbol)) continue

          const exchange = quote.exchange || ''
          const symbol = quote.symbol || ''
          
          // Determine market and country
          let market = exchange
          let country = 'US'
          let currency = 'USD'
          
          if (symbol.includes('.T') || symbol.includes('.TWO') || exchange === 'TSE' || exchange === 'OSE' || exchange === 'JPX') {
            country = 'JP'
            market = '東京証券取引所'
            currency = 'JPY'
          } else if (symbol.includes('.L') || exchange === 'LSE' || exchange === 'LON') {
            country = 'UK'
            market = 'ロンドン証券取引所'
            currency = 'GBP'
          } else if (symbol.includes('.HK') || exchange === 'HKG' || exchange === 'HKE') {
            country = 'HK'
            market = '香港証券取引所'
            currency = 'HKD'
          } else if (symbol.includes('.SS') || symbol.includes('.SZ') || exchange === 'SSE' || exchange === 'SZSE') {
            country = 'CN'
            market = '中国証券取引所'
            currency = 'CNY'
          } else if (symbol.includes('.KS') || exchange === 'KRX') {
            country = 'KR'
            market = '韓国取引所'
            currency = 'KRW'
          } else if (symbol.includes('.AS') || exchange === 'AMS') {
            country = 'NL'
            market = 'アムステルダム証券取引所'
            currency = 'EUR'
          } else if (symbol.includes('.DE') || exchange === 'FRA' || exchange === 'XETR') {
            country = 'DE'
            market = 'ドイツ証券取引所'
            currency = 'EUR'
          } else if (symbol.includes('.PA') || exchange === 'EPA') {
            country = 'FR'
            market = 'パリ証券取引所'
            currency = 'EUR'
          } else if (exchange === 'NASDAQ' || exchange === 'NYSE' || exchange === 'AMEX' || exchange === 'NMS' || exchange === 'NYQ') {
            country = 'US'
            market = exchange === 'NMS' ? 'NASDAQ' : exchange
            currency = 'USD'
          }

          allResults.push({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: exchange,
            market: market,
            country: country,
            type: quote.quoteType || 'EQUITY',
            currency: currency,
          })

          seenSymbols.add(quote.symbol)
        }
      } catch (error) {
        console.error(`Search error for "${searchQuery}":`, error)
        continue
      }
    }

    return allResults
  } catch (error) {
    console.error('Yahoo Finance search error:', error)
    return []
  }
}

/**
 * Fallback search using alternative method
 */
async function searchAlternative(query: string): Promise<SearchResult[]> {
  // Try direct symbol lookup for common patterns
  const results: SearchResult[] = []
  
  // Japanese stock code pattern
  if (/^\d{4}$/.test(query.trim())) {
    const jpSymbol = `${query.trim()}.T`
    results.push({
      symbol: jpSymbol,
      name: `${query.trim()} (日本株)`,
      exchange: 'TSE',
      market: '東京証券取引所',
      country: 'JP',
      type: 'EQUITY',
      currency: 'JPY',
    })
  }

  return results
}

/**
 * GET /api/search-symbol?query=XXXX
 * 
 * Comprehensive stock search across global markets
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.trim()

    // Search from multiple sources
    const [yahooResults, alternativeResults] = await Promise.all([
      searchYahooFinance(searchQuery),
      searchAlternative(searchQuery),
    ])

    // Combine results
    const allResults: SearchResult[] = []
    const seenSymbols = new Set<string>()

    // Add Yahoo Finance results
    for (const result of yahooResults) {
      if (!seenSymbols.has(result.symbol)) {
        allResults.push(result)
        seenSymbols.add(result.symbol)
      }
    }

    // Add alternative results
    for (const result of alternativeResults) {
      if (!seenSymbols.has(result.symbol)) {
        allResults.push(result)
        seenSymbols.add(result.symbol)
      }
    }

    // Sort by relevance (case-insensitive, handles Japanese)
    allResults.sort((a, b) => {
      const queryUpper = searchQuery.toUpperCase()
      const queryLower = searchQuery.toLowerCase()
      const aSymbolUpper = a.symbol.toUpperCase()
      const bSymbolUpper = b.symbol.toUpperCase()
      const aNameUpper = a.name.toUpperCase()
      const bNameUpper = b.name.toUpperCase()
      const aNameLower = a.name.toLowerCase()
      const bNameLower = b.name.toLowerCase()

      // Exact symbol match
      if (aSymbolUpper === queryUpper && bSymbolUpper !== queryUpper) return -1
      if (bSymbolUpper === queryUpper && aSymbolUpper !== queryUpper) return 1

      // Exact name match (case-insensitive)
      if (aNameUpper === queryUpper && bNameUpper !== queryUpper) return -1
      if (bNameUpper === queryUpper && aNameUpper !== queryUpper) return 1
      
      // Name contains exact query (for Japanese)
      if (a.name.includes(searchQuery) && !b.name.includes(searchQuery)) return -1
      if (b.name.includes(searchQuery) && !a.name.includes(searchQuery)) return 1

      // Symbol starts with query
      if (aSymbolUpper.startsWith(queryUpper) && !bSymbolUpper.startsWith(queryUpper)) return -1
      if (bSymbolUpper.startsWith(queryUpper) && !aSymbolUpper.startsWith(queryUpper)) return 1

      // Name starts with query
      if (aNameUpper.startsWith(queryUpper) && !bNameUpper.startsWith(queryUpper)) return -1
      if (bNameUpper.startsWith(queryUpper) && !aNameUpper.startsWith(queryUpper)) return 1

      // Name contains query
      if (aNameUpper.includes(queryUpper) && !bNameUpper.includes(queryUpper)) return -1
      if (bNameUpper.includes(queryUpper) && !aNameUpper.includes(queryUpper)) return 1

      // Japanese companies first if query contains Japanese
      if (containsJapanese(searchQuery)) {
        if (a.country === 'JP' && b.country !== 'JP') return -1
        if (b.country === 'JP' && a.country !== 'JP') return 1
      }

      return 0
    })

    // Limit to 30 results
    const limitedResults = allResults.slice(0, 30)

    return NextResponse.json({ results: limitedResults })
  } catch (error: any) {
    console.error('Search symbol API error:', error)
    return NextResponse.json(
      { error: '検索中にエラーが発生しました', results: [] },
      { status: 500 }
    )
  }
}
