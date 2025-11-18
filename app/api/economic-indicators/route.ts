import { NextRequest, NextResponse } from 'next/server'
import { getEconomicIndicatorsClient } from '../../../lib/dataSources/economicIndicatorsClient'

/**
 * GET /api/economic-indicators?country=US
 * 
 * Returns economic indicators for a country
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country') || 'US'
    const analyze = searchParams.get('analyze') === 'true'

    const client = getEconomicIndicatorsClient()
    const indicators = await client.getAllIndicators(country)

    if (analyze) {
      const sectors = [
        'Technology',
        'Financials',
        'Healthcare',
        'Consumer Discretionary',
        'Consumer Staples',
        'Energy',
        'Industrials',
        'Real Estate',
        'Utilities',
        'Materials',
      ]

      const impacts = client.analyzeImpact(indicators, sectors)

      return NextResponse.json({
        indicators,
        impacts,
        summary: {
          totalIndicators: indicators.length,
          positiveImpacts: impacts.filter(i => i.impactScore > 0).length,
          negativeImpacts: impacts.filter(i => i.impactScore < 0).length,
        },
      })
    }

    return NextResponse.json({ indicators })
  } catch (error: any) {
    console.error('Economic indicators API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch economic indicators' },
      { status: 500 }
    )
  }
}

