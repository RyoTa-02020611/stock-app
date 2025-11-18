import { NextRequest, NextResponse } from 'next/server'
import { getBrokerClient } from '../../../lib/brokerClient'

/**
 * GET /api/trading/positions
 * 
 * Fetches open positions from the broker.
 */
export async function GET(request: NextRequest) {
  try {
    const broker = getBrokerClient()
    const positions = await broker.getOpenPositions()

    return NextResponse.json({ positions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching positions:', error)
    
    return NextResponse.json(
      { error: '保有ポジションの取得に失敗しました。時間をおいて再度お試しください。' },
      { status: 502 }
    )
  }
}

