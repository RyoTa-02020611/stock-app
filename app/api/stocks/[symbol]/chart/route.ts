import { NextRequest, NextResponse } from 'next/server'
import { getMarketDataClient } from '../../../../lib/marketDataClient'

/**
 * GET /api/stocks/[symbol]/chart?range=1mo
 * 
 * Returns historical price data for charting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol
    const searchParams = request.nextUrl.searchParams
    const range = (searchParams.get('range') || '1mo') as '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y'

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const client = getMarketDataClient()
    const prices = await client.getHistoricalPrices(symbol, range)

    return NextResponse.json({ data: prices })
  } catch (error: any) {
    console.error('Stock chart API error:', error)
    return NextResponse.json(
      { error: error.message || 'チャートデータの取得に失敗しました', data: [] },
      { status: 500 }
    )
  }
}

