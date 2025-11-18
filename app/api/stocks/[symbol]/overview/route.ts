import { NextRequest, NextResponse } from 'next/server'
import { getMarketDataClient } from '../../../../lib/marketDataClient'

/**
 * GET /api/stocks/[symbol]/overview
 * 
 * Returns comprehensive stock overview data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const client = getMarketDataClient()
    const overview = await client.getOverview(symbol)

    return NextResponse.json(overview)
  } catch (error: any) {
    console.error('Stock overview API error:', error)
    return NextResponse.json(
      { error: error.message || '銘柄情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

