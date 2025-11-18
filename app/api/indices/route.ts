import { NextResponse } from 'next/server'
import { MAJOR_INDICES, MarketIndex } from '../../lib/types/indices'

/**
 * GET /api/indices
 * 
 * Returns market indices data from multiple global markets
 */
async function fetchIndexFromYahoo(symbol: string): Promise<MarketIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 10 }, // 10秒キャッシュ
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol}`)
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || price
    const change = price - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

    const indexInfo = MAJOR_INDICES.find(i => i.symbol === symbol)
    
    return {
      symbol,
      name: indexInfo?.name || symbol,
      price,
      change,
      changePercent,
      region: indexInfo?.region || 'Unknown',
      lastUpdate: new Date().toISOString(),
      volume: meta.regularMarketVolume,
      marketStatus: meta.marketState === 'REGULAR' ? 'open' : 
                   meta.marketState === 'CLOSED' ? 'closed' :
                   meta.marketState === 'PRE' ? 'pre-market' : 'after-hours',
    }
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    return null
  }
}

export async function GET() {
  try {
    // すべての指数を並列取得
    const promises = MAJOR_INDICES.map(index => fetchIndexFromYahoo(index.symbol))
    const results = await Promise.all(promises)
    
    // nullを除外
    const indices = results.filter((index): index is MarketIndex => index !== null)

    return NextResponse.json({
      success: true,
      indices,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Indices API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '市場指数の取得に失敗しました',
        indices: [],
      },
      { status: 500 }
    )
  }
}

