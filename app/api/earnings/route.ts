import { NextRequest, NextResponse } from 'next/server'
import { getEarningsClient } from '../../../lib/dataSources/earningsClient'

/**
 * GET /api/earnings?symbol=AAPL
 * GET /api/earnings?calendar=true&days=30
 * GET /api/earnings?symbols=AAPL,MSFT,GOOGL
 * 
 * Returns earnings data for symbols or earnings calendar
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const symbols = searchParams.get('symbols')
    const calendar = searchParams.get('calendar') === 'true'
    const days = parseInt(searchParams.get('days') || '30', 10)
    const analyze = searchParams.get('analyze') === 'true'

    const client = getEarningsClient()

    if (calendar) {
      const calendarData = await client.getEarningsCalendar(days)
      return NextResponse.json({ calendar: calendarData })
    }

    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
      const upcomingEarnings = await client.getUpcomingEarningsForSymbols(symbolList)
      
      if (analyze) {
        const impacts = upcomingEarnings.map(report => client.analyzeImpact(report))
        return NextResponse.json({
          earnings: upcomingEarnings,
          impacts,
          summary: {
            totalUpcoming: upcomingEarnings.length,
            positiveImpacts: impacts.filter(i => i.impactScore > 0).length,
            negativeImpacts: impacts.filter(i => i.impactScore < 0).length,
          },
        })
      }

      return NextResponse.json({ earnings: upcomingEarnings })
    }

    if (symbol) {
      const earnings = await client.getEarnings(symbol)
      
      if (analyze) {
        const impacts = earnings.map(report => client.analyzeImpact(report))
        return NextResponse.json({
          earnings,
          impacts,
        })
      }

      return NextResponse.json({ earnings })
    }

    return NextResponse.json(
      { error: 'symbol, symbols, or calendar parameter is required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Earnings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}

