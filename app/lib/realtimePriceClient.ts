/**
 * Real-time Price Update Client
 * 
 * Handles real-time stock price updates via WebSocket/SSE and background jobs
 */

export interface PriceUpdate {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
  previousClose?: number
}

export interface PriceUpdateCallback {
  (update: PriceUpdate): void
}

class RealtimePriceClient {
  private ws: WebSocket | null = null
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false

  /**
   * Subscribe to price updates for a symbol
   */
  subscribe(symbol: string, callback: PriceUpdateCallback): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set())
    }
    this.subscribers.get(symbol)!.add(callback)

    // Connect if not already connected
    if (!this.isConnected) {
      this.connect()
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol)
        }
      }
    }
  }

  /**
   * Connect to WebSocket server
   */
  private connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Use SSE (Server-Sent Events) for better compatibility
      // WebSocket fallback can be added later
      this.setupSSEConnection()
    } catch (error) {
      console.error('Failed to connect to price update server:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Setup Server-Sent Events connection
   */
  private setupSSEConnection() {
    // For now, use polling as fallback
    // SSE/WebSocket will be implemented in the API route
    this.startPolling()
  }

  /**
   * Start polling for price updates
   */
  private startPolling() {
    const symbols = Array.from(this.subscribers.keys())
    if (symbols.length === 0) return

    const poll = async () => {
      try {
        const response = await fetch(`/api/realtime/prices?symbols=${symbols.join(',')}`)
        if (response.ok) {
          const updates: PriceUpdate[] = await response.json()
          updates.forEach(update => {
            const callbacks = this.subscribers.get(update.symbol)
            if (callbacks) {
              callbacks.forEach(callback => callback(update))
            }
          })
        }
      } catch (error) {
        console.error('Error polling price updates:', error)
      }
    }

    // Poll every 5 seconds
    const intervalId = setInterval(poll, 5000)
    poll() // Initial poll

    // Store interval ID for cleanup
    this.ws = { close: () => clearInterval(intervalId) } as any
    this.isConnected = true
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      if ('close' in this.ws && typeof this.ws.close === 'function') {
        this.ws.close()
      }
      this.ws = null
    }
    this.isConnected = false
    this.subscribers.clear()
  }
}

// Singleton instance
let clientInstance: RealtimePriceClient | null = null

export function getRealtimePriceClient(): RealtimePriceClient {
  if (!clientInstance) {
    clientInstance = new RealtimePriceClient()
  }
  return clientInstance
}

