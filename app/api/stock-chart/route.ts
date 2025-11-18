import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/stock-chart?symbol=XXXX&range=1mo&interval=1d
 * 
 * Fetches historical chart data for a stock
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const range = searchParams.get('range') || '1mo'
    const interval = searchParams.get('interval') || '1d'

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    // Determine symbol format
    let yahooSymbol = symbol.trim()
    if (!yahooSymbol.includes('.')) {
      if (/^\d{4}$/.test(yahooSymbol)) {
        yahooSymbol = `${yahooSymbol}.T` // Japanese stock
      }
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch chart data: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]

    if (!result) {
      throw new Error('No chart data available')
    }

    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []

    if (timestamps.length === 0 || closes.length === 0) {
      throw new Error('Empty chart data')
    }

    const chartData: Array<{ time: string; price: number }> = []
    
    for (let i = 0; i < timestamps.length && i < closes.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined && !isNaN(closes[i])) {
        const date = new Date(timestamps[i] * 1000)
        let timeLabel = ''
        
        if (range === '1d') {
          timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        } else if (range === '5d') {
          timeLabel = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}時`
        } else {
          timeLabel = `${date.getMonth() + 1}/${date.getDate()}`
        }

        chartData.push({
          time: timeLabel,
          price: Math.round(closes[i] * 100) / 100,
        })
      }
    }

    if (chartData.length === 0) {
      throw new Error('No valid data points')
    }

    return NextResponse.json({ data: chartData })
  } catch (error: any) {
    console.error('Stock chart API error:', error)
    return NextResponse.json(
      { error: error.message || 'チャートデータの取得に失敗しました', data: [] },
      { status: 500 }
    )
  }
}

