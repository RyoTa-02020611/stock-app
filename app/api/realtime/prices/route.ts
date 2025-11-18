import { NextRequest, NextResponse } from 'next/server'
import { getMarketDataClient } from '../../../lib/marketDataClient'

/**
 * GET /api/realtime/prices?symbols=AAPL,MSFT,GOOGL
 * 
 * Returns current prices for requested symbols
 * Supports Server-Sent Events (SSE) for real-time updates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbolsParam = searchParams.get('symbols')
    
    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      )
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean)
    
    if (symbols.length === 0) {
      return NextResponse.json(
        { error: 'At least one symbol is required' },
        { status: 400 }
      )
    }

    // Check if client wants SSE stream
    const acceptHeader = request.headers.get('accept')
    const wantsSSE = acceptHeader?.includes('text/event-stream')

    if (wantsSSE) {
      // Return SSE stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          
          const sendUpdate = async () => {
            try {
              const client = getMarketDataClient()
              const updates = await Promise.all(
                symbols.map(async (symbol) => {
                  try {
                    const quote = await client.getQuote(symbol)
                    if (quote) {
                      return {
                        symbol,
                        price: quote.price,
                        change: quote.change || 0,
                        changePercent: quote.changePercent || 0,
                        volume: quote.volume || 0,
                        timestamp: new Date().toISOString(),
                        previousClose: quote.previousClose,
                      }
                    }
                  } catch (error) {
                    console.error(`Error fetching quote for ${symbol}:`, error)
                    return null
                  }
                })
              )

              const validUpdates = updates.filter(Boolean)
              if (validUpdates.length > 0) {
                const data = JSON.stringify(validUpdates)
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            } catch (error) {
              console.error('Error in SSE update:', error)
            }
          }

          // Send initial update
          await sendUpdate()

          // Send updates every 5 seconds
          const interval = setInterval(sendUpdate, 5000)

          // Cleanup on close
          request.signal.addEventListener('abort', () => {
            clearInterval(interval)
            controller.close()
          })
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Return single JSON response
      const client = getMarketDataClient()
      const updates = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const quote = await client.getQuote(symbol)
            if (quote) {
              return {
                symbol,
                price: quote.price,
                change: quote.change || 0,
                changePercent: quote.changePercent || 0,
                volume: quote.volume || 0,
                timestamp: new Date().toISOString(),
                previousClose: quote.previousClose,
              }
            }
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error)
            return null
          }
        })
      )

      const validUpdates = updates.filter(Boolean)
      return NextResponse.json(validUpdates)
    }
  } catch (error: any) {
    console.error('Realtime prices API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch real-time prices' },
      { status: 500 }
    )
  }
}

