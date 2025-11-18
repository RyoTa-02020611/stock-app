import { NextRequest, NextResponse } from 'next/server'
import { getBrokerClient } from '../../../lib/brokerClient'

/**
 * GET /api/trading/quote?symbol=XXXX
 * 
 * Fetches current quote for a symbol.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { error: '銘柄コードが必要です。' },
        { status: 400 }
      )
    }

    const broker = getBrokerClient()
    const quote = await broker.getQuote(symbol.trim().toUpperCase())

    return NextResponse.json(quote, { status: 200 })
  } catch (error) {
    console.error('Error fetching quote:', error)
    
    return NextResponse.json(
      { error: '価格情報の取得に失敗しました。時間をおいて再度お試しください。' },
      { status: 502 }
    )
  }
}

