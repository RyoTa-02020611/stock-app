import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/stock-quote?symbol=XXXX
 * 
 * Get real-time or latest stock quote
 * Similar to moomoo's quote functionality
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

    // Determine symbol format
    let yahooSymbol = symbol
    if (!symbol.includes('.')) {
      if (/^\d{4}$/.test(symbol)) {
        yahooSymbol = `${symbol}.T` // Japanese stock
      }
    }

    // Fetch quote data
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 10 }, // Cache for 10 seconds for near real-time
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
    const quote = {
      symbol: symbol,
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice || meta.previousClose || 0,
      previousClose: meta.previousClose || meta.regularMarketPrice || 0,
      open: meta.regularMarketOpen || meta.previousClose || 0,
      high: meta.regularMarketDayHigh || meta.previousClose || 0,
      low: meta.regularMarketDayLow || meta.previousClose || 0,
      volume: meta.regularMarketVolume || 0,
      change: (meta.regularMarketPrice || meta.previousClose || 0) - (meta.previousClose || meta.regularMarketPrice || 0),
      changePercent: meta.regularMarketPrice && meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : 0,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || meta.fullExchangeName || 'Unknown',
      marketState: meta.marketState || 'REGULAR',
      timestamp: meta.regularMarketTime || Date.now() / 1000,
    }

    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('Stock quote API error:', error)
    return NextResponse.json(
      { error: error.message || '株価情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

