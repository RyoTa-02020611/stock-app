import { NextRequest, NextResponse } from 'next/server'
import { getMarketTrendsClient } from '../../../lib/dataSources/marketTrendsClient'

/**
 * GET /api/market-trends?type=all
 * GET /api/market-trends?type=exchange_rates
 * GET /api/market-trends?type=commodities
 * GET /api/market-trends?type=vix
 * 
 * Returns market trends data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'

    const client = getMarketTrendsClient()

    if (type === 'all') {
      const trends = await client.getAllTrends()
      return NextResponse.json({ trends })
    }

    if (type === 'exchange_rates') {
      const rates = await client.getExchangeRates()
      return NextResponse.json({ exchangeRates: rates })
    }

    if (type === 'commodities') {
      const commodities = await client.getCommodityPrices()
      return NextResponse.json({ commodities })
    }

    if (type === 'vix') {
      const vix = await client.getVIX()
      return NextResponse.json({ vix })
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Market trends API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch market trends' },
      { status: 500 }
    )
  }
}

