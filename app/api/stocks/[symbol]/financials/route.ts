import { NextRequest, NextResponse } from 'next/server'
import { getMarketDataClient } from '../../../../lib/marketDataClient'

/**
 * GET /api/stocks/[symbol]/financials
 * 
 * Returns financial data and metrics
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
    const financials = await client.getFinancials(symbol)

    return NextResponse.json(financials)
  } catch (error: any) {
    console.error('Stock financials API error:', error)
    return NextResponse.json(
      { error: error.message || '財務データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

