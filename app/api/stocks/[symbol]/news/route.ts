import { NextRequest, NextResponse } from 'next/server'
import { getNewsClient } from '../../../../lib/newsClient'

/**
 * GET /api/stocks/[symbol]/news?limit=20&analyze=true
 * 
 * Returns news articles from multiple sources with analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const analyze = searchParams.get('analyze') === 'true'

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const client = getNewsClient()
    const news = await client.fetchNewsFromMultipleSources(symbol, limit)

    if (analyze) {
      const analysis = client.analyzeNewsCollection(news)
      return NextResponse.json({ news, analysis })
    }

    return NextResponse.json({ news })
  } catch (error: any) {
    console.error('Stock news API error:', error)
    return NextResponse.json(
      { error: error.message || 'ニュースの取得に失敗しました', news: [] },
      { status: 500 }
    )
  }
}

