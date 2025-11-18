import { NextRequest, NextResponse } from 'next/server'
import { getBrokerClient } from '../../../lib/brokerClient'

/**
 * GET /api/trading/orders
 * 
 * Fetches order history from the broker.
 * 
 * Query parameters:
 * - limit: Maximum number of orders to return (default: 50)
 * - status: Filter by order status (NEW, FILLED, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const status = searchParams.get('status') || undefined

    const broker = getBrokerClient()
    const orders = await broker.getOrders({ limit, status })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('Error fetching orders:', error)
    
    return NextResponse.json(
      { error: '注文履歴の取得に失敗しました。時間をおいて再度お試しください。' },
      { status: 502 }
    )
  }
}

