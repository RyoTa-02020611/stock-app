import { NextRequest, NextResponse } from 'next/server'
import { getBrokerClient, PlaceOrderInput } from '../../../lib/brokerClient'

/**
 * POST /api/trading/place-order
 * 
 * Places an order through the broker client.
 * 
 * SECURITY:
 * - All validation happens server-side
 * - Broker credentials are never exposed to client
 * - Risk checks are performed before placing order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationError = validateOrderInput(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Risk checks
    const riskCheckError = performRiskChecks(body)
    if (riskCheckError) {
      return NextResponse.json(
        { error: riskCheckError },
        { status: 400 }
      )
    }

    // Prepare order input
    const orderInput: PlaceOrderInput = {
      symbol: body.symbol.trim().toUpperCase(),
      side: body.side,
      qty: Math.floor(body.qty),
      type: body.type,
      limitPrice: body.limitPrice,
      timeInForce: body.timeInForce || 'DAY',
    }

    // Get broker client and place order
    const broker = getBrokerClient()
    const order = await broker.placeOrder(orderInput)

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error placing order:', error)
    
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'ブローカーAPIでエラーが発生しました。時間をおいて再度お試しください。' },
      { status: 502 }
    )
  }
}

/**
 * Validate order input from client
 */
function validateOrderInput(body: any): string | null {
  if (!body.symbol || typeof body.symbol !== 'string' || body.symbol.trim().length === 0) {
    return '銘柄コードを入力してください。'
  }

  if (!body.side || (body.side !== 'BUY' && body.side !== 'SELL')) {
    return '売買区分が不正です。'
  }

  if (!body.qty || typeof body.qty !== 'number' || body.qty <= 0) {
    return '数量は1以上の数値を入力してください。'
  }

  if (body.qty % 1 !== 0) {
    return '数量は整数で入力してください。'
  }

  if (!body.type || (body.type !== 'MARKET' && body.type !== 'LIMIT')) {
    return '注文タイプが不正です。'
  }

  if (body.type === 'LIMIT') {
    if (!body.limitPrice || typeof body.limitPrice !== 'number' || body.limitPrice <= 0) {
      return '指値注文の場合は価格を入力してください。'
    }
  }

  return null
}

/**
 * Perform risk checks before placing order
 */
function performRiskChecks(body: any): string | null {
  // Check maximum order quantity
  const maxOrderQty = parseInt(process.env.MAX_ORDER_QTY || '1000', 10)
  if (body.qty > maxOrderQty) {
    return `注文数量が上限（${maxOrderQty}株）を超えています。`
  }

  // Check symbol whitelist (if configured)
  const allowedSymbols = process.env.ALLOWED_SYMBOLS
  if (allowedSymbols) {
    const symbols = allowedSymbols.split(',').map(s => s.trim().toUpperCase())
    if (!symbols.includes(body.symbol.trim().toUpperCase())) {
      return `この銘柄（${body.symbol}）は取引できません。`
    }
  }

  // Check if trading is disabled (safety mode)
  const tradingEnabled = process.env.TRADING_ENABLED !== 'false'
  if (!tradingEnabled) {
    return '現在、取引は一時的に停止されています。'
  }

  return null
}

