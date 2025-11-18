/**
 * Broker Client Interface and Implementations
 * 
 * This module provides a generic interface for broker integration,
 * with implementations for paper trading and live trading.
 * 
 * SECURITY: All broker credentials must be stored in environment variables
 * and never exposed to the client side.
 */

export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT'
export type TimeInForce = 'DAY' | 'GTC'
export type OrderStatus = 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED'

export type PlaceOrderInput = {
  symbol: string
  side: OrderSide
  qty: number
  type: OrderType
  limitPrice?: number
  timeInForce: TimeInForce
}

export type PlacedOrder = {
  id: string
  symbol: string
  side: OrderSide
  qty: number
  type: OrderType
  status: OrderStatus
  limitPrice?: number
  avgFillPrice?: number
  filledQty?: number
  createdAt: string
  updatedAt?: string
}

export type Position = {
  symbol: string
  qty: number
  avgEntryPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPL: number
  unrealizedPLPercent: number
}

export type Quote = {
  symbol: string
  lastPrice: number
  bid?: number
  ask?: number
  volume?: number
}

/**
 * Generic broker client interface
 */
export interface BrokerClient {
  placeOrder(input: PlaceOrderInput): Promise<PlacedOrder>
  getOpenPositions(): Promise<Position[]>
  getOrders(params?: { limit?: number; status?: string }): Promise<PlacedOrder[]>
  getQuote(symbol: string): Promise<Quote>
  cancelOrder(orderId: string): Promise<void>
}

/**
 * Paper Trading Client (In-memory simulation)
 * 
 * This client simulates trading without making real API calls.
 * Useful for testing and development.
 */
export class PaperBrokerClient implements BrokerClient {
  private orders: Map<string, PlacedOrder> = new Map()
  private positions: Map<string, Position> = new Map()
  private orderCounter = 0

  async placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
    // Simulate order processing delay
    await new Promise(resolve => setTimeout(resolve, 100))

    const orderId = `PAPER-${Date.now()}-${++this.orderCounter}`
    const now = new Date().toISOString()

    // For paper trading, immediately fill market orders
    // Limit orders are filled if price is favorable
    let status: OrderStatus = 'NEW'
    let avgFillPrice: number | undefined
    let filledQty: number | undefined

    if (input.type === 'MARKET') {
      // Simulate market price (in real app, fetch from quote)
      const mockPrice = 150 + Math.random() * 50
      status = 'FILLED'
      avgFillPrice = mockPrice
      filledQty = input.qty

      // Update position
      this.updatePosition(input.symbol, input.side, input.qty, mockPrice)
    } else if (input.type === 'LIMIT' && input.limitPrice) {
      // For limit orders, simulate partial fill or pending
      const mockCurrentPrice = 150 + Math.random() * 50
      if (
        (input.side === 'BUY' && mockCurrentPrice <= input.limitPrice) ||
        (input.side === 'SELL' && mockCurrentPrice >= input.limitPrice)
      ) {
        status = 'FILLED'
        avgFillPrice = input.limitPrice
        filledQty = input.qty
        this.updatePosition(input.symbol, input.side, input.qty, input.limitPrice)
      } else {
        status = 'NEW'
      }
    }

    const order: PlacedOrder = {
      id: orderId,
      symbol: input.symbol,
      side: input.side,
      qty: input.qty,
      type: input.type,
      status,
      limitPrice: input.limitPrice,
      avgFillPrice,
      filledQty,
      createdAt: now,
      updatedAt: now,
    }

    this.orders.set(orderId, order)
    return order
  }

  private updatePosition(symbol: string, side: OrderSide, qty: number, price: number) {
    const existing = this.positions.get(symbol)
    const currentPrice = price // In real app, fetch from quote

    if (!existing) {
      if (side === 'BUY') {
        this.positions.set(symbol, {
          symbol,
          qty,
          avgEntryPrice: price,
          currentPrice,
          marketValue: qty * currentPrice,
          unrealizedPL: (currentPrice - price) * qty,
          unrealizedPLPercent: ((currentPrice - price) / price) * 100,
        })
      }
    } else {
      if (side === 'BUY') {
        const totalCost = existing.avgEntryPrice * existing.qty + price * qty
        const newQty = existing.qty + qty
        const newAvgPrice = totalCost / newQty

        this.positions.set(symbol, {
          symbol,
          qty: newQty,
          avgEntryPrice: newAvgPrice,
          currentPrice,
          marketValue: newQty * currentPrice,
          unrealizedPL: (currentPrice - newAvgPrice) * newQty,
          unrealizedPLPercent: ((currentPrice - newAvgPrice) / newAvgPrice) * 100,
        })
      } else if (side === 'SELL') {
        const newQty = existing.qty - qty
        if (newQty <= 0) {
          this.positions.delete(symbol)
        } else {
          this.positions.set(symbol, {
            ...existing,
            qty: newQty,
            marketValue: newQty * currentPrice,
            unrealizedPL: (currentPrice - existing.avgEntryPrice) * newQty,
            unrealizedPLPercent: ((currentPrice - existing.avgEntryPrice) / existing.avgEntryPrice) * 100,
          })
        }
      }
    }
  }

  async getOpenPositions(): Promise<Position[]> {
    // Update current prices (simulate)
    const positions: Position[] = []
    for (const [symbol, pos] of this.positions.entries()) {
      const currentPrice = pos.avgEntryPrice * (1 + (Math.random() - 0.5) * 0.1)
      positions.push({
        ...pos,
        currentPrice,
        marketValue: pos.qty * currentPrice,
        unrealizedPL: (currentPrice - pos.avgEntryPrice) * pos.qty,
        unrealizedPLPercent: ((currentPrice - pos.avgEntryPrice) / pos.avgEntryPrice) * 100,
      })
    }
    return positions
  }

  async getOrders(params?: { limit?: number; status?: string }): Promise<PlacedOrder[]> {
    let orders = Array.from(this.orders.values())
    
    if (params?.status) {
      orders = orders.filter(o => o.status === params.status)
    }
    
    // Sort by createdAt descending
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    if (params?.limit) {
      orders = orders.slice(0, params.limit)
    }
    
    return orders
  }

  async getQuote(symbol: string): Promise<Quote> {
    // Simulate quote
    const basePrice = 150 + Math.random() * 50
    return {
      symbol,
      lastPrice: basePrice,
      bid: basePrice * 0.999,
      ask: basePrice * 1.001,
      volume: Math.floor(Math.random() * 1000000),
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId)
    if (order && order.status === 'NEW') {
      order.status = 'CANCELLED'
      order.updatedAt = new Date().toISOString()
    }
  }
}

/**
 * Live Broker Client (Real API Integration)
 * 
 * This client makes actual API calls to a broker.
 * 
 * NOTE: This is a generic implementation. You need to adapt it
 * to your specific broker's API (Alpaca, Interactive Brokers, etc.)
 * 
 * SECURITY: API keys are read from environment variables only.
 */
export class LiveBrokerClient implements BrokerClient {
  private baseUrl: string
  private apiKey: string
  private apiSecret: string

  constructor() {
    this.baseUrl = process.env.BROKER_API_BASE_URL || ''
    this.apiKey = process.env.BROKER_API_KEY || ''
    this.apiSecret = process.env.BROKER_API_SECRET || ''

    if (!this.baseUrl || !this.apiKey || !this.apiSecret) {
      throw new Error('Broker API credentials not configured. Set BROKER_API_BASE_URL, BROKER_API_KEY, and BROKER_API_SECRET environment variables.')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Add authentication headers
    // NOTE: Adapt this to your broker's auth method (Basic, Bearer, custom headers, etc.)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Broker API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
    // Map our generic format to broker-specific format
    // NOTE: Adapt this to your broker's API structure
    const brokerOrder = {
      symbol: input.symbol,
      side: input.side.toLowerCase(), // Some brokers use lowercase
      qty: input.qty,
      type: input.type.toLowerCase(),
      limit_price: input.limitPrice,
      time_in_force: input.timeInForce,
    }

    const response = await this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(brokerOrder),
    })

    // Map broker response to our format
    return {
      id: response.id || response.order_id,
      symbol: response.symbol,
      side: response.side.toUpperCase() as OrderSide,
      qty: response.qty || response.quantity,
      type: response.type.toUpperCase() as OrderType,
      status: this.mapStatus(response.status),
      limitPrice: response.limit_price,
      avgFillPrice: response.filled_avg_price || response.avg_fill_price,
      filledQty: response.filled_qty || response.filled_quantity,
      createdAt: response.created_at || response.submitted_at,
      updatedAt: response.updated_at,
    }
  }

  private mapStatus(brokerStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      new: 'NEW',
      filled: 'FILLED',
      partially_filled: 'PARTIALLY_FILLED',
      cancelled: 'CANCELLED',
      rejected: 'REJECTED',
    }
    return statusMap[brokerStatus.toLowerCase()] || 'NEW'
  }

  async getOpenPositions(): Promise<Position[]> {
    const response = await this.request<any[]>('/positions')

    return response.map((pos: any) => ({
      symbol: pos.symbol,
      qty: pos.qty || pos.quantity,
      avgEntryPrice: pos.avg_entry_price || pos.average_entry_price,
      currentPrice: pos.current_price || pos.market_price,
      marketValue: pos.market_value,
      unrealizedPL: pos.unrealized_pl || pos.unrealized_pl_usd,
      unrealizedPLPercent: pos.unrealized_plpc || 0,
    }))
  }

  async getOrders(params?: { limit?: number; status?: string }): Promise<PlacedOrder[]> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const response = await this.request<any[]>(`/orders?${queryParams.toString()}`)

    return response.map((order: any) => ({
      id: order.id || order.order_id,
      symbol: order.symbol,
      side: order.side.toUpperCase() as OrderSide,
      qty: order.qty || order.quantity,
      type: order.type.toUpperCase() as OrderType,
      status: this.mapStatus(order.status),
      limitPrice: order.limit_price,
      avgFillPrice: order.filled_avg_price || order.avg_fill_price,
      filledQty: order.filled_qty || order.filled_quantity,
      createdAt: order.created_at || order.submitted_at,
      updatedAt: order.updated_at,
    }))
  }

  async getQuote(symbol: string): Promise<Quote> {
    const response = await this.request<any>(`/quotes/${symbol}`)

    return {
      symbol: response.symbol,
      lastPrice: response.last_price || response.last,
      bid: response.bid_price || response.bid,
      ask: response.ask_price || response.ask,
      volume: response.volume,
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request(`/orders/${orderId}`, {
      method: 'DELETE',
    })
  }
}

/**
 * Factory function to get the appropriate broker client
 * 
 * Uses TRADING_MODE environment variable:
 * - "paper" or undefined → PaperBrokerClient
 * - "live" → LiveBrokerClient
 * 
 * SECURITY: Never expose this decision logic or credentials to the client.
 */
export function getBrokerClient(): BrokerClient {
  const mode = process.env.TRADING_MODE || 'paper'

  if (mode === 'live') {
    try {
      return new LiveBrokerClient()
    } catch (error) {
      console.error('Failed to initialize live broker client:', error)
      console.warn('Falling back to paper trading mode')
      return new PaperBrokerClient()
    }
  }

  return new PaperBrokerClient()
}

