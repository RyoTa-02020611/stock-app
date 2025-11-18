// 株式APIユーティリティ

export interface StockQuote {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

/**
 * 銘柄コードから会社名を取得
 */
export async function getCompanyName(symbol: string): Promise<string | null> {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.T`
    
    // Yahoo Finance APIから基本情報を取得
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`
    )
    
    if (response.ok) {
      const data = await response.json()
      const result = data.chart?.result?.[0]
      if (result) {
        const longName = result.meta?.longName || result.meta?.shortName
        if (longName) {
          return longName
        }
      }
    }
    
    // フォールバック: Yahoo Finance検索API
    try {
      const searchResponse = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`
      )
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        const quotes = searchData.quotes
        if (quotes && quotes.length > 0) {
          return quotes[0].longname || quotes[0].shortname || null
        }
      }
    } catch (error) {
      console.error('会社名検索エラー:', error)
    }
    
    return null
  } catch (error) {
    console.error('会社名取得エラー:', error)
    return null
  }
}

/**
 * 複数の銘柄の現在価格を一括取得
 */
export async function getStockPrices(symbols: string[]): Promise<Map<string, StockQuote>> {
  const prices = new Map<string, StockQuote>()
  
  // 並列で取得
  const promises = symbols.map(async (symbol) => {
    try {
      const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.T`
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`
      )
      
      if (response.ok) {
        const data = await response.json()
        const result = data.chart?.result?.[0]
        if (result) {
          const meta = result.meta
          const currentPrice = meta.regularMarketPrice || meta.previousClose
          const previousClose = meta.previousClose || currentPrice
          const change = currentPrice - previousClose
          const changePercent = (change / previousClose) * 100
          const name = meta.longName || meta.shortName || symbol
          
          prices.set(symbol, {
            symbol,
            name,
            currentPrice,
            change,
            changePercent,
          })
        }
      }
    } catch (error) {
      console.error(`価格取得エラー (${symbol}):`, error)
    }
  })
  
  await Promise.all(promises)
  return prices
}

/**
 * 単一銘柄の現在価格を取得
 */
export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
  const prices = await getStockPrices([symbol])
  return prices.get(symbol) || null
}



