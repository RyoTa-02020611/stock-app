/**
 * Market Data Client Interface
 * 
 * Abstract interface for fetching market data from various providers.
 * Can be easily swapped with different implementations (Yahoo Finance, Alpha Vantage, etc.)
 */

export type Quote = {
  symbol: string
  name: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  currency: string
  exchange: string
  market: string
  country: string
}

export type HistoricalPrice = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type NewsItem = {
  id: string
  title: string
  summary?: string
  publishedAt: string
  url: string
  source?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export type FinancialMetric = {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
}

export type Financials = {
  symbol: string
  period: string
  revenue?: number
  operatingIncome?: number
  netIncome?: number
  totalAssets?: number
  totalEquity?: number
  metrics: FinancialMetric[]
  // Additional financial data
  totalDebt?: number
  cash?: number
  ebitda?: number
  grossProfit?: number
  error?: string
}

export type StockOverview = {
  symbol: string
  name: string
  quote: Quote
  keyMetrics: FinancialMetric[]
  sector?: string
  industry?: string
  description?: string
  website?: string
}

export interface MarketDataClient {
  getQuote(symbol: string): Promise<Quote>
  getHistoricalPrices(symbol: string, range: '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y'): Promise<HistoricalPrice[]>
  getNews(symbol: string, limit?: number): Promise<NewsItem[]>
  getFinancials(symbol: string): Promise<Financials>
  getOverview(symbol: string): Promise<StockOverview>
  searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; exchange?: string }>>
  getTopMovers(type: 'gainers' | 'losers' | 'volume'): Promise<Quote[]>
  getMarketHeatmap(): Promise<Array<{ sector: string; change: number; stocks: number }>>
}

/**
 * Generic REST API Client Implementation
 * 
 * Assumes a typical REST API structure. Can be configured via environment variables.
 */
export class GenericMarketDataClient implements MarketDataClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.MARKET_DATA_API_URL || ''
    this.apiKey = process.env.MARKET_DATA_API_KEY || ''
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (this.baseUrl && this.apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/quote/${encodeURIComponent(symbol)}?apikey=${this.apiKey}`,
          { next: { revalidate: 10 } }
        )
        if (response.ok) {
          const data = await response.json()
          return this.mapToQuote(data)
        }
      } catch (error) {
        console.error('Custom API quote error:', error)
      }
    }

    // Fallback to Yahoo Finance
    return this.getQuoteFromYahoo(symbol)
  }

  async getHistoricalPrices(symbol: string, range: '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y'): Promise<HistoricalPrice[]> {
    if (this.baseUrl && this.apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/historical/${encodeURIComponent(symbol)}?range=${range}&apikey=${this.apiKey}`,
          { next: { revalidate: 60 } }
        )
        if (response.ok) {
          const data = await response.json()
          return this.mapToHistoricalPrices(data)
        }
      } catch (error) {
        console.error('Custom API historical error:', error)
      }
    }

    // Fallback to Yahoo Finance
    return this.getHistoricalPricesFromYahoo(symbol, range)
  }

  async getNews(symbol: string, limit: number = 20): Promise<NewsItem[]> {
    if (this.baseUrl && this.apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/news/${encodeURIComponent(symbol)}?limit=${limit}&apikey=${this.apiKey}`,
          { next: { revalidate: 300 } }
        )
        if (response.ok) {
          const data = await response.json()
          return this.mapToNewsItems(data)
        }
      } catch (error) {
        console.error('Custom API news error:', error)
      }
    }

    // Fallback to Yahoo Finance RSS
    return this.getNewsFromYahoo(symbol, limit)
  }

  async getFinancials(symbol: string): Promise<Financials> {
    if (this.baseUrl && this.apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/financials/${encodeURIComponent(symbol)}?apikey=${this.apiKey}`,
          { next: { revalidate: 3600 } }
        )
        if (response.ok) {
          const data = await response.json()
          return this.mapToFinancials(data)
        }
      } catch (error) {
        console.error('Custom API financials error:', error)
      }
    }

    // Fallback to Yahoo Finance
    return this.getFinancialsFromYahoo(symbol)
  }

  async getOverview(symbol: string): Promise<StockOverview> {
    const [quote, financials] = await Promise.all([
      this.getQuote(symbol),
      this.getFinancials(symbol).catch(() => null),
    ])

    return {
      symbol,
      name: quote.name,
      quote,
      keyMetrics: financials?.metrics || [],
      sector: undefined,
      industry: undefined,
      description: undefined,
      website: undefined,
    }
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; exchange?: string }>> {
    if (this.baseUrl && this.apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/search?q=${encodeURIComponent(query)}&apikey=${this.apiKey}`,
          { next: { revalidate: 300 } }
        )
        if (response.ok) {
          const data = await response.json()
          return this.mapToSearchResults(data)
        }
      } catch (error) {
        console.error('Custom API search error:', error)
      }
    }

    // Fallback to Yahoo Finance
    return this.searchSymbolsFromYahoo(query)
  }

  async getTopMovers(type: 'gainers' | 'losers' | 'volume'): Promise<Quote[]> {
    // This would typically come from a market data API
    // For now, return empty array (will be implemented in API route)
    return []
  }

  async getMarketHeatmap(): Promise<Array<{ sector: string; change: number; stocks: number }>> {
    // This would typically come from a market data API
    // For now, return empty array (will be implemented in API route)
    return []
  }

  // Yahoo Finance fallback implementations
  private async getQuoteFromYahoo(symbol: string): Promise<Quote> {
    let yahooSymbol = symbol
    if (!symbol.includes('.')) {
      if (/^\d{4}$/.test(symbol)) {
        yahooSymbol = `${symbol}.T`
      }
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 10 },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]
    if (!result) {
      throw new Error('No data available')
    }

    const meta = result.meta
    const price = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || price
    const change = price - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

    return {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      price,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume || 0,
      marketCap: undefined,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || meta.fullExchangeName || 'Unknown',
      market: meta.exchangeName || 'Unknown',
      country: symbol.includes('.T') ? 'JP' : 'US',
    }
  }

  private async getHistoricalPricesFromYahoo(symbol: string, range: '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y'): Promise<HistoricalPrice[]> {
    let yahooSymbol = symbol
    if (!symbol.includes('.')) {
      if (/^\d{4}$/.test(symbol)) {
        yahooSymbol = `${symbol}.T`
      }
    }

    const interval = range === '1d' ? '5m' : range === '5d' ? '1h' : '1d'
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch historical prices: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]
    if (!result) {
      throw new Error('No data available')
    }

    const timestamps = result.timestamp || []
    const opens = result.indicators?.quote?.[0]?.open || []
    const highs = result.indicators?.quote?.[0]?.high || []
    const lows = result.indicators?.quote?.[0]?.low || []
    const closes = result.indicators?.quote?.[0]?.close || []
    const volumes = result.indicators?.quote?.[0]?.volume || []

    const prices: HistoricalPrice[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        prices.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          open: opens[i] || closes[i],
          high: highs[i] || closes[i],
          low: lows[i] || closes[i],
          close: closes[i],
          volume: volumes[i] || 0,
        })
      }
    }

    return prices
  }

  private async getNewsFromYahoo(symbol: string, limit: number): Promise<NewsItem[]> {
    let yahooSymbol = symbol
    if (!symbol.includes('.')) {
      if (/^\d{4}$/.test(symbol)) {
        yahooSymbol = `${symbol}.T`
      }
    }

    try {
      const response = await fetch(
        `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${yahooSymbol}&region=JP&lang=ja-JP`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 300 },
        }
      )

      if (!response.ok) {
        return []
      }

      const text = await response.text()
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      const newsItems: NewsItem[] = []
      let match
      let count = 0

      while ((match = itemRegex.exec(text)) !== null && count < limit) {
        const itemContent = match[1]
        const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/)
        const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)
        const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)

        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : ''
        const link = linkMatch ? linkMatch[1].trim() : ''
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : ''
        const description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : ''

        if (title && link) {
          newsItems.push({
            id: `yahoo-${count}`,
            title,
            summary: description,
            publishedAt: pubDate,
            url: link,
            source: 'Yahoo Finance',
            sentiment: this.analyzeSentiment(title + ' ' + description),
          })
          count++
        }
      }

      return newsItems
    } catch (error) {
      console.error('Yahoo Finance news error:', error)
      return []
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase()
    const positiveKeywords = ['成長', '上昇', '増益', '好調', '拡大', '好材料', '買い', '推奨', 'growth', 'profit', 'gain']
    const negativeKeywords = ['下落', '減益', '不調', '縮小', '悪材料', '売り', '懸念', 'loss', 'decline', 'risk']

    let positiveCount = 0
    let negativeCount = 0

    positiveKeywords.forEach(kw => {
      if (lowerText.includes(kw.toLowerCase())) positiveCount++
    })
    negativeKeywords.forEach(kw => {
      if (lowerText.includes(kw.toLowerCase())) negativeCount++
    })

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private async getFinancialsFromYahoo(symbol: string): Promise<Financials> {
    let yahooSymbol = symbol
    if (!symbol.includes('.')) {
      if (/^\d{4}$/.test(symbol)) {
        yahooSymbol = `${symbol}.T`
      }
    }

    // Try multiple endpoints and strategies
    const endpoints = [
      // Strategy 1: Minimal modules (most likely to work)
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=defaultKeyStatistics,financialData`,
      // Strategy 2: With summaryProfile
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryProfile,defaultKeyStatistics,financialData`,
      // Strategy 3: Chart endpoint (always works)
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
    ]

    for (let i = 0; i < endpoints.length; i++) {
      try {
        const url = endpoints[i]
        const isChartEndpoint = url.includes('/v8/finance/chart/')
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com',
          },
          next: { revalidate: 3600 },
        })

        if (!response.ok) {
          if (i < endpoints.length - 1) {
            console.warn(`Endpoint ${i + 1} failed (${response.status}), trying next...`)
            continue
          }
          // Last endpoint failed, will be handled in catch block
          throw new Error(`All endpoints failed. Last status: ${response.status}`)
        }

        const data = await response.json()
        
        // Handle chart endpoint response
        if (isChartEndpoint || data.chart) {
          const result = data.chart?.result?.[0]
          if (result) {
            const meta = result.meta || {}
            const marketCap = meta.marketCap
            
            const metrics: FinancialMetric[] = []
            
            if (marketCap) {
              const isJPY = symbol.includes('.T') || symbol.includes('.TWO')
              const currency = isJPY ? '¥' : '$'
              const divisor = isJPY ? 1e12 : 1e12
              
              metrics.push({
                label: '時価総額',
                value: marketCap >= divisor
                  ? `${currency}${(marketCap / divisor).toFixed(2)}兆`
                  : marketCap >= (divisor / 1000)
                  ? `${currency}${(marketCap / (divisor / 1000)).toFixed(2)}${isJPY ? '億' : '億'}`
                  : `${currency}${(marketCap / (divisor / 1000000)).toFixed(2)}${isJPY ? '百万' : '百万'}`,
              })
            }
            
            return {
              symbol,
              period: '最新',
              revenue: undefined,
              operatingIncome: undefined,
              netIncome: undefined,
              totalAssets: undefined,
              totalEquity: undefined,
              metrics,
            }
          }
        }
        
        // Handle quoteSummary endpoint response
        const result = data.quoteSummary?.result?.[0]
        if (!result) {
          if (i < endpoints.length - 1) continue
          throw new Error('No financial data available')
        }

        const stats = result.defaultKeyStatistics || {}
        const financial = result.financialData || {}
        const profile = result.summaryProfile || {}
        
        // Try to get historical statements, but don't fail if unavailable
        let incomeStatement: any = {}
        let balanceSheet: any = {}
        let cashflow: any = {}
        
        try {
          incomeStatement = result.incomeStatementHistory?.incomeStatementHistory?.[0] || {}
          balanceSheet = result.balanceSheetHistory?.balanceSheetStatements?.[0] || {}
          cashflow = result.cashflowStatementHistory?.cashflowStatements?.[0] || {}
        } catch (e) {
          console.warn('Could not parse historical statements:', e)
        }

        const metrics: FinancialMetric[] = []

        // Valuation Metrics
        if (stats.trailingPE?.raw !== undefined && stats.trailingPE.raw !== null) {
          metrics.push({
            label: 'PER（株価収益率）',
            value: stats.trailingPE.raw.toFixed(2),
            trend: 'stable',
          })
        }

        if (stats.forwardPE?.raw !== undefined && stats.forwardPE.raw !== null) {
          metrics.push({
            label: '予想PER',
            value: stats.forwardPE.raw.toFixed(2),
            trend: 'stable',
          })
        }

        if (stats.priceToBook?.raw !== undefined && stats.priceToBook.raw !== null) {
          metrics.push({
            label: 'PBR（株価純資産倍率）',
            value: stats.priceToBook.raw.toFixed(2),
            trend: 'stable',
          })
        }

        if (stats.dividendYield?.raw !== undefined && stats.dividendYield.raw !== null) {
          metrics.push({
            label: '配当利回り',
            value: (stats.dividendYield.raw * 100).toFixed(2),
            unit: '%',
            trend: 'stable',
          })
        }

        if (stats.marketCap?.raw !== undefined && stats.marketCap.raw !== null) {
          const marketCap = stats.marketCap.raw
          const isJPY = symbol.includes('.T') || symbol.includes('.TWO')
          const currency = isJPY ? '¥' : '$'
          const divisor = isJPY ? 1e12 : 1e12
          
          metrics.push({
            label: '時価総額',
            value: marketCap >= divisor
              ? `${currency}${(marketCap / divisor).toFixed(2)}兆`
              : marketCap >= (divisor / 1000)
              ? `${currency}${(marketCap / (divisor / 1000)).toFixed(2)}${isJPY ? '億' : '億'}`
              : `${currency}${(marketCap / (divisor / 1000000)).toFixed(2)}${isJPY ? '百万' : '百万'}`,
          })
        }

        // Profitability Metrics
        if (stats.profitMargins?.raw !== undefined && stats.profitMargins.raw !== null) {
          metrics.push({
            label: '利益率',
            value: (stats.profitMargins.raw * 100).toFixed(2),
            unit: '%',
            trend: 'stable',
          })
        }

        if (stats.returnOnEquity?.raw !== undefined && stats.returnOnEquity.raw !== null) {
          metrics.push({
            label: 'ROE（自己資本利益率）',
            value: (stats.returnOnEquity.raw * 100).toFixed(2),
            unit: '%',
            trend: 'stable',
          })
        }

        if (stats.returnOnAssets?.raw !== undefined && stats.returnOnAssets.raw !== null) {
          metrics.push({
            label: 'ROA（総資産利益率）',
            value: (stats.returnOnAssets.raw * 100).toFixed(2),
            unit: '%',
            trend: 'stable',
          })
        }

        // Financial Health
        if (stats.debtToEquity?.raw !== undefined && stats.debtToEquity.raw !== null) {
          metrics.push({
            label: '負債資本比率',
            value: stats.debtToEquity.raw.toFixed(2),
            trend: 'stable',
          })
        }

        if (stats.currentRatio?.raw !== undefined && stats.currentRatio.raw !== null) {
          metrics.push({
            label: '流動比率',
            value: stats.currentRatio.raw.toFixed(2),
            trend: 'stable',
          })
        }

        // Extract financial data
        const revenue = incomeStatement.totalRevenue?.raw || financial.totalRevenue?.raw
        const operatingIncome = incomeStatement.operatingIncome?.raw || financial.operatingCashflow?.raw
        const netIncome = incomeStatement.netIncome?.raw || financial.netIncomeToCommon?.raw
        const totalAssets = balanceSheet.totalAssets?.raw
        const totalEquity = balanceSheet.stockholdersEquity?.raw || balanceSheet.totalStockholderEquity?.raw
        const totalDebt = balanceSheet.totalLiab?.raw
        const cash = balanceSheet.cash?.raw || cashflow.cashflowFromOperatingActivities?.raw

        return {
          symbol,
          period: incomeStatement.endDate?.fmt || '最新',
          revenue: revenue,
          operatingIncome: operatingIncome,
          netIncome: netIncome,
          totalAssets: totalAssets,
          totalEquity: totalEquity,
          metrics,
          // Additional data
          totalDebt: totalDebt,
          cash: cash,
          ebitda: incomeStatement.ebitda?.raw,
          grossProfit: incomeStatement.grossProfit?.raw,
        }
      } catch (endpointError) {
        console.warn(`Endpoint ${i + 1} error:`, endpointError)
        if (i === endpoints.length - 1) {
          // Last endpoint failed, will try final fallback
          break
        }
        // Try next endpoint
        continue
      }
    }

    // Final fallback: Try chart endpoint one more time
    try {
      const fallbackResponse = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          next: { revalidate: 60 },
        }
      )
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        const result = fallbackData.chart?.result?.[0]
        if (result) {
          const meta = result.meta || {}
          const marketCap = meta.marketCap
          const isJPY = symbol.includes('.T') || symbol.includes('.TWO')
          
          const metrics: FinancialMetric[] = []
          if (marketCap) {
            const currency = isJPY ? '¥' : '$'
            const divisor = isJPY ? 1e12 : 1e12
            
            metrics.push({
              label: '時価総額',
              value: marketCap >= divisor
                ? `${currency}${(marketCap / divisor).toFixed(2)}兆`
                : marketCap >= (divisor / 1000)
                ? `${currency}${(marketCap / (divisor / 1000)).toFixed(2)}${isJPY ? '億' : '億'}`
                : `${currency}${(marketCap / (divisor / 1000000)).toFixed(2)}${isJPY ? '百万' : '百万'}`,
            })
          }
          
          return {
            symbol,
            period: '最新',
            revenue: undefined,
            operatingIncome: undefined,
            netIncome: undefined,
            totalAssets: undefined,
            totalEquity: undefined,
            metrics,
            error: '詳細な財務データは利用できませんが、基本情報を表示しています',
          }
        }
      }
    } catch (fallbackError) {
      console.error('Final fallback also failed:', fallbackError)
    }
    
    // Return minimal financials with error info
    return {
      symbol,
      period: '最新',
      metrics: [],
      error: '財務データの取得に失敗しました。時間をおいて再度お試しください。',
    }
  }

  private async searchSymbolsFromYahoo(query: string): Promise<Array<{ symbol: string; name: string; exchange?: string }>> {
    try {
      // Check if query contains Japanese characters
      const containsJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(query)
      
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=true`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': containsJapanese ? 'ja-JP,ja;q=0.9,en-US;q=0.8' : 'en-US,en;q=0.9',
            'Accept-Charset': 'UTF-8',
          },
          next: { revalidate: 300 },
        }
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return (data.quotes || []).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange,
      }))
    } catch (error) {
      console.error('Yahoo Finance search error:', error)
      return []
    }
  }

  // Helper methods for mapping API responses
  private mapToQuote(data: any): Quote {
    return {
      symbol: data.symbol,
      name: data.name,
      price: data.price,
      previousClose: data.previousClose,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: data.marketCap,
      currency: data.currency || 'USD',
      exchange: data.exchange,
      market: data.market,
      country: data.country || 'US',
    }
  }

  private mapToHistoricalPrices(data: any): HistoricalPrice[] {
    return (data.prices || []).map((p: any) => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }))
  }

  private mapToNewsItems(data: any): NewsItem[] {
    return (data.news || []).map((n: any) => ({
      id: n.id || n.url,
      title: n.title,
      summary: n.summary,
      publishedAt: n.publishedAt || n.published_at,
      url: n.url,
      source: n.source,
      sentiment: n.sentiment,
    }))
  }

  private mapToFinancials(data: any): Financials {
    return {
      symbol: data.symbol,
      period: data.period,
      revenue: data.revenue,
      operatingIncome: data.operatingIncome,
      netIncome: data.netIncome,
      totalAssets: data.totalAssets,
      totalEquity: data.totalEquity,
      metrics: data.metrics || [],
    }
  }

  private mapToSearchResults(data: any): Array<{ symbol: string; name: string; exchange?: string }> {
    return (data.results || []).map((r: any) => ({
      symbol: r.symbol,
      name: r.name,
      exchange: r.exchange,
    }))
  }
}

/**
 * Factory function to get market data client
 */
export function getMarketDataClient(): MarketDataClient {
  return new GenericMarketDataClient()
}
