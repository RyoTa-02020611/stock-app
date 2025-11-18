import { NextRequest, NextResponse } from 'next/server'
import { getAdvancedAnalyzer } from '../../../lib/ai/advancedAnalyzer'

/**
 * POST /api/ai/advanced-analysis
 * 
 * Performs advanced AI analysis on various data types
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, context } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'type and data parameters are required' },
        { status: 400 }
      )
    }

    const analyzer = getAdvancedAnalyzer()
    let result

    switch (type) {
      case 'news':
        result = await analyzer.analyzeNews(data)
        break
      case 'trades':
        result = await analyzer.analyzeTrades(data)
        break
      case 'portfolio':
        result = await analyzer.analyzePortfolio(data)
        break
      case 'stock':
        result = await analyzer.analyzeStock(data)
        break
      case 'contradictions':
        result = await analyzer.detectContradictions(data)
        return NextResponse.json({ contradictions: result })
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      type,
      result,
      context,
    })
  } catch (error: any) {
    console.error('Advanced AI analysis API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform advanced analysis' },
      { status: 500 }
    )
  }
}

