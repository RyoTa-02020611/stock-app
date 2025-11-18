import { NextRequest, NextResponse } from 'next/server'
import { getAnalystRatingsClient } from '../../../lib/dataSources/analystRatingsClient'

/**
 * GET /api/analyst-ratings?symbol=AAPL
 * GET /api/analyst-ratings?symbols=AAPL,MSFT,GOOGL&recent=true
 * 
 * Returns analyst ratings for symbols
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const symbols = searchParams.get('symbols')
    const recent = searchParams.get('recent') === 'true'
    const analyze = searchParams.get('analyze') === 'true'

    const client = getAnalystRatingsClient()

    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
      const ratings = recent
        ? await client.getRecentRatingChanges(symbolList)
        : await Promise.all(symbolList.map(s => client.getRatings(s))).then(results => results.flat())
      
      if (analyze) {
        const impacts = ratings.map(rating => client.analyzeImpact(rating))
        return NextResponse.json({
          ratings,
          impacts,
          summary: {
            totalRatings: ratings.length,
            buyCount: ratings.filter(r => r.rating === 'buy' || r.rating === 'strong_buy').length,
            holdCount: ratings.filter(r => r.rating === 'hold').length,
            sellCount: ratings.filter(r => r.rating === 'sell' || r.rating === 'strong_sell').length,
            averageTargetPrice: ratings.filter(r => r.targetPrice).reduce((sum, r) => sum + r.targetPrice, 0) / ratings.filter(r => r.targetPrice).length || 0,
          },
        })
      }

      return NextResponse.json({ ratings })
    }

    if (symbol) {
      const ratings = await client.getRatings(symbol)
      
      if (analyze) {
        const impacts = ratings.map(rating => client.analyzeImpact(rating))
        return NextResponse.json({
          ratings,
          impacts,
        })
      }

      return NextResponse.json({ ratings })
    }

    return NextResponse.json(
      { error: 'symbol or symbols parameter is required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Analyst ratings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analyst ratings' },
      { status: 500 }
    )
  }
}

