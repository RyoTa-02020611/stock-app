import { NextRequest, NextResponse } from 'next/server'
import { getPriceImpactPredictor } from '../../../lib/ai/priceImpactPredictor'
import { getMarketDataClient } from '../../../lib/marketDataClient'

/**
 * GET /api/ai/predict-impact?symbol=AAPL&timeframes=short,medium
 * 
 * Returns price impact predictions for a symbol
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const timeframesParam = searchParams.get('timeframes') || 'short,medium'

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol parameter is required' },
        { status: 400 }
      )
    }

    const timeframes = timeframesParam.split(',').map(t => t.trim()) as ('short' | 'medium' | 'long')[]

    // Get current price
    const marketClient = getMarketDataClient()
    const quote = await marketClient.getQuote(symbol)
    const currentPrice = quote.price

    // Get predictions
    const predictor = getPriceImpactPredictor()
    const summary = await predictor.predict(symbol, currentPrice, timeframes)

    return NextResponse.json({
      symbol,
      currentPrice,
      summary,
    })
  } catch (error: any) {
    console.error('Price impact prediction API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to predict price impact' },
      { status: 500 }
    )
  }
}

