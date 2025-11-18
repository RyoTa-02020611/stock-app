import { NextRequest, NextResponse } from 'next/server'

export type StockInfo = {
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

/**
 * GET /api/stock-info?symbol=XXXX
 * 
 * Fetches comprehensive stock information from Yahoo Finance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    // Determine symbol format for Yahoo Finance
    let yahooSymbol = symbol
    if (!symbol.includes('.')) {
      // Try to detect market
      if (/^\d{4}$/.test(symbol)) {
        yahooSymbol = `${symbol}.T` // Japanese stock
      }
    }

    // Fetch comprehensive stock data
    const [quoteData, summaryData] = await Promise.all([
      // Get current quote
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
        {
          next: { revalidate: 60 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        }
      ),
      // Get company summary
      fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryProfile,defaultKeyStatistics,financialData`,
        {
          next: { revalidate: 3600 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        }
      ),
    ])

    if (!quoteData.ok) {
      throw new Error(`Failed to fetch quote data: ${quoteData.statusText}`)
    }

    const quoteJson = await quoteData.json()
    const result = quoteJson.chart?.result?.[0]

    if (!result) {
      throw new Error('No data available for this symbol')
    }

    const meta = result.meta
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || currentPrice
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100
    const volume = meta.regularMarketVolume || 0
    const currency = meta.currency || 'USD'
    const exchange = meta.exchangeName || meta.fullExchangeName || 'Unknown'
    const companyName = meta.longName || meta.shortName || symbol

    // Determine market and country
    let market = exchange
    let country = 'US'
    
    if (symbol.includes('.T') || exchange.includes('Tokyo') || exchange.includes('TSE')) {
      country = 'JP'
      market = '東京証券取引所'
    } else if (symbol.includes('.L') || exchange.includes('London')) {
      country = 'UK'
      market = 'ロンドン証券取引所'
    } else if (symbol.includes('.HK') || exchange.includes('Hong Kong')) {
      country = 'HK'
      market = '香港証券取引所'
    } else if (exchange === 'NASDAQ' || exchange === 'NYSE' || exchange === 'AMEX') {
      country = 'US'
      market = exchange
    }

    // Get additional data from summary
    let marketCap: number | undefined
    let peRatio: number | undefined
    let dividendYield: number | undefined
    let sector: string | undefined
    let industry: string | undefined
    let website: string | undefined
    let description: string | undefined

    if (summaryData.ok) {
      try {
        const summaryJson = await summaryData.json()
        const summaryResult = summaryJson.quoteSummary?.result?.[0]

        if (summaryResult) {
          const profile = summaryResult.summaryProfile
          const stats = summaryResult.defaultKeyStatistics
          const financial = summaryResult.financialData

          if (profile) {
            sector = profile.sector
            industry = profile.industry
            website = profile.website
            description = profile.longBusinessSummary
          }

          if (stats) {
            marketCap = stats.marketCap?.raw
            peRatio = stats.trailingPE?.raw
            dividendYield = stats.dividendYield?.raw
          }

          if (financial) {
            if (!peRatio) peRatio = financial.currentPrice?.raw / financial.earningsPerShare?.raw
          }
        }
      } catch (error) {
        console.error('Error parsing summary data:', error)
        // Continue without summary data
      }
    }

    const stockInfo: StockInfo = {
      symbol,
      companyName,
      currentPrice,
      previousClose,
      change,
      changePercent,
      volume,
      marketCap,
      peRatio,
      dividendYield,
      currency,
      exchange,
      market,
      country,
      sector,
      industry,
      website,
      description,
    }

    return NextResponse.json(stockInfo)
  } catch (error: any) {
    console.error('Stock info API error:', error)
    return NextResponse.json(
      { error: error.message || '株価情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

