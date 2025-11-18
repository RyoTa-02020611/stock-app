import { NextRequest, NextResponse } from 'next/server'
import { 
  fetchMultipleStockData, 
  getMajorStockSymbols,
} from '../../../lib/realStockDataClient'

interface StockMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  exchange?: string
  country?: string
  currency?: string
}

/**
 * GET /api/market/top-movers?type=gainers|losers|volume&market=US|JP|ALL&limit=50
 * 
 * Returns top movers in the market with global coverage
 * Only returns real data - no dummy data generation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = (searchParams.get('type') || 'gainers') as 'gainers' | 'losers' | 'volume'
    const market = searchParams.get('market') || 'ALL'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Always try to fetch real stock data
    try {
      const majorSymbols = getMajorStockSymbols()
      // For performance: limit initial fetch to reasonable number
      // Use smaller batches and longer delays to avoid rate limits
      const maxFetch = Math.min(limit * 2, 200) // Fetch more than needed for filtering
      const realData = await fetchMultipleStockData(majorSymbols.slice(0, maxFetch), 3, 300)
      
      if (realData.length > 0) {
        let movers = realData.map(data => ({
          symbol: data.symbol,
          name: data.name,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          marketCap: data.marketCap,
          exchange: data.exchange,
          country: data.country,
          currency: data.currency,
        }))

        // Filter by market
        if (market !== 'ALL') {
          if (market === 'US') {
            movers = movers.filter(m => !m.symbol.includes('.') || m.country === 'US')
          } else if (market === 'JP') {
            movers = movers.filter(m => m.symbol.includes('.T') || m.country === 'JP')
          } else if (market === 'EU') {
            movers = movers.filter(m => ['NL', 'DE', 'FR', 'IT', 'ES', 'UK', 'DK', 'NO', 'SE', 'CH'].includes(m.country || ''))
          } else if (market === 'ASIA') {
            movers = movers.filter(m => ['TW', 'CN', 'HK', 'KR', 'SG', 'IN', 'TH', 'ID', 'PH', 'MY', 'VN'].includes(m.country || ''))
          }
        }

        // Sort by type
        if (type === 'gainers') {
          const positiveMovers = movers.filter(m => m.changePercent > 0)
          if (positiveMovers.length > 0) {
            movers = positiveMovers.sort((a, b) => b.changePercent - a.changePercent)
          } else {
            movers = movers.sort((a, b) => b.changePercent - a.changePercent)
          }
        } else if (type === 'losers') {
          const negativeMovers = movers.filter(m => m.changePercent < 0)
          if (negativeMovers.length > 0) {
            movers = negativeMovers.sort((a, b) => a.changePercent - b.changePercent)
          } else {
            movers = movers.sort((a, b) => a.changePercent - b.changePercent)
          }
        } else if (type === 'volume') {
          movers = movers.sort((a, b) => b.volume - a.volume)
        } else if (type === 'marketcap') {
          movers = movers.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        }

        if (movers.length > 0) {
          return NextResponse.json({ movers: movers.slice(0, limit) })
        }
      }
    } catch (error) {
      console.error('Error fetching real stock data:', error)
      // Continue to try fallback
    }

    // If real data fetch failed or returned empty, try to fetch minimal real data as fallback
    // Attempt to fetch at least a few major stocks
    try {
      const fallbackSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
      const fallbackData = await fetchMultipleStockData(fallbackSymbols, 2, 200)
      
      if (fallbackData.length > 0) {
        let movers = fallbackData.map(data => ({
          symbol: data.symbol,
          name: data.name,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          marketCap: data.marketCap,
          exchange: data.exchange,
          country: data.country,
          currency: data.currency,
        }))

        // Filter by market
        if (market !== 'ALL') {
          if (market === 'US') {
            movers = movers.filter(m => !m.symbol.includes('.') || m.country === 'US')
          } else if (market === 'JP') {
            movers = movers.filter(m => m.symbol.includes('.T') || m.country === 'JP')
          } else if (market === 'EU') {
            movers = movers.filter(m => ['NL', 'DE', 'FR', 'IT', 'ES', 'UK', 'DK', 'NO', 'SE', 'CH'].includes(m.country || ''))
          } else if (market === 'ASIA') {
            movers = movers.filter(m => ['TW', 'CN', 'HK', 'KR', 'SG', 'IN', 'TH', 'ID', 'PH', 'MY', 'VN'].includes(m.country || ''))
          }
        }

        // Sort by type
        if (type === 'gainers') {
          const positiveMovers = movers.filter(m => m.changePercent > 0)
          if (positiveMovers.length > 0) {
            movers = positiveMovers.sort((a, b) => b.changePercent - a.changePercent)
          } else {
            movers = movers.sort((a, b) => b.changePercent - a.changePercent)
          }
        } else if (type === 'losers') {
          const negativeMovers = movers.filter(m => m.changePercent < 0)
          if (negativeMovers.length > 0) {
            movers = negativeMovers.sort((a, b) => a.changePercent - b.changePercent)
          } else {
            movers = movers.sort((a, b) => a.changePercent - b.changePercent)
          }
        } else if (type === 'volume') {
          movers = movers.sort((a, b) => b.volume - a.volume)
        } else if (type === 'marketcap') {
          movers = movers.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        }

        if (movers.length > 0) {
          return NextResponse.json({ movers: movers.slice(0, limit) })
        }
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback stock data:', fallbackError)
    }

    // If all real data fetching failed, return empty array
    // The frontend should handle empty state appropriately
    return NextResponse.json({ movers: [] }, { status: 200 })
  } catch (error: any) {
    console.error('Top movers API error:', error)
    // Return empty array on error - frontend should handle empty state
    return NextResponse.json({ movers: [] }, { status: 200 })
  }
}
