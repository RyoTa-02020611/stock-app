import { NextRequest, NextResponse } from 'next/server'
import { getSocialSentimentClient } from '../../../lib/dataSources/socialSentimentClient'

/**
 * GET /api/social-sentiment?symbol=AAPL
 * GET /api/social-sentiment?symbols=AAPL,MSFT,GOOGL
 * 
 * Returns social media sentiment for symbols
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const symbols = searchParams.get('symbols')
    const analyze = searchParams.get('analyze') === 'true'

    const client = getSocialSentimentClient()

    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
      const sentiments = await client.getSentimentsForSymbols(symbolList)
      
      if (analyze) {
        const impacts = sentiments.map(sentiment => client.analyzeImpact(sentiment))
        return NextResponse.json({
          sentiments,
          impacts,
          summary: {
            totalSentiments: sentiments.length,
            positiveCount: sentiments.filter(s => s.sentiment === 'positive').length,
            negativeCount: sentiments.filter(s => s.sentiment === 'negative').length,
            averageScore: sentiments.reduce((sum, s) => sum + s.sentimentScore, 0) / sentiments.length || 0,
          },
        })
      }

      return NextResponse.json({ sentiments })
    }

    if (symbol) {
      const sentiments = await client.getSentiment(symbol)
      
      if (analyze) {
        const impacts = sentiments.map(sentiment => client.analyzeImpact(sentiment))
        return NextResponse.json({
          sentiments,
          impacts,
        })
      }

      return NextResponse.json({ sentiments })
    }

    return NextResponse.json(
      { error: 'symbol or symbols parameter is required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Social sentiment API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social sentiment' },
      { status: 500 }
    )
  }
}

