/**
 * Analyst Ratings Client
 * 
 * Fetches analyst ratings and target price changes
 */

import { logger } from '../utils/logger'

export interface AnalystRating {
  symbol: string
  analyst: string
  rating: 'buy' | 'hold' | 'sell' | 'strong_buy' | 'strong_sell'
  targetPrice: number
  currentPrice: number
  priceChange: number
  priceChangePercent: number
  previousRating?: 'buy' | 'hold' | 'sell' | 'strong_buy' | 'strong_sell'
  previousTargetPrice?: number
  date: string
  reason?: string
}

export interface AnalystRatingImpact {
  rating: AnalystRating
  impactScore: number // -100 to +100
  affectedSectors: string[]
  description: string
  recommendation: 'buy' | 'hold' | 'sell' | 'watch'
}

class AnalystRatingsClient {
  private alphaVantageApiKey: string
  private finnhubApiKey: string
  private cache: Map<string, { data: AnalystRating[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || ''
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || ''
  }

  /**
   * Get analyst ratings for a symbol
   */
  async getRatings(symbol: string): Promise<AnalystRating[]> {
    const cacheKey = `ratings_${symbol}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const ratings = await this.fetchRatingsFromMultipleSources(symbol)
      this.cache.set(cacheKey, { data: ratings, timestamp: Date.now() })
      return ratings
    } catch (error) {
      logger.error(`Error fetching ratings for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      return []
    }
  }

  /**
   * Get recent rating changes
   */
  async getRecentRatingChanges(symbols: string[] = []): Promise<AnalystRating[]> {
    const allRatings: AnalystRating[] = []
    
    for (const symbol of symbols) {
      try {
        const ratings = await this.getRatings(symbol)
        // Filter for recent changes (last 7 days)
        const recent = ratings.filter(r => {
          const ratingDate = new Date(r.date)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return ratingDate > weekAgo && r.previousRating
        })
        allRatings.push(...recent)
      } catch (error) {
        logger.error(`Error fetching recent rating changes for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      }
    }

    // Sort by date (newest first)
    return allRatings.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  /**
   * Analyze impact of analyst rating
   */
  analyzeImpact(rating: AnalystRating): AnalystRatingImpact {
    let impactScore = 0
    const affectedSectors: string[] = []
    let recommendation: 'buy' | 'hold' | 'sell' | 'watch' = 'hold'

    // Rating impact
    switch (rating.rating) {
      case 'strong_buy':
        impactScore = 40
        recommendation = 'buy'
        break
      case 'buy':
        impactScore = 25
        recommendation = 'buy'
        break
      case 'hold':
        impactScore = 0
        recommendation = 'hold'
        break
      case 'sell':
        impactScore = -25
        recommendation = 'sell'
        break
      case 'strong_sell':
        impactScore = -40
        recommendation = 'sell'
        break
    }

    // Rating change impact
    if (rating.previousRating) {
      const ratingValues: Record<string, number> = {
        'strong_buy': 5,
        'buy': 4,
        'hold': 3,
        'sell': 2,
        'strong_sell': 1,
      }

      const currentValue = ratingValues[rating.rating] || 3
      const previousValue = ratingValues[rating.previousRating] || 3
      const change = currentValue - previousValue

      if (change > 0) {
        // Upgrade
        impactScore += 30
        if (recommendation === 'hold') recommendation = 'buy'
      } else if (change < 0) {
        // Downgrade
        impactScore -= 30
        if (recommendation === 'hold') recommendation = 'sell'
      }
    }

    // Target price impact
    if (rating.targetPrice && rating.currentPrice) {
      const upside = ((rating.targetPrice - rating.currentPrice) / rating.currentPrice) * 100
      
      if (upside > 20) {
        impactScore += 20
        if (recommendation === 'hold') recommendation = 'buy'
      } else if (upside < -20) {
        impactScore -= 20
        if (recommendation === 'hold') recommendation = 'sell'
      }

      // Target price change
      if (rating.previousTargetPrice) {
        const targetChange = ((rating.targetPrice - rating.previousTargetPrice) / rating.previousTargetPrice) * 100
        if (targetChange > 10) {
          impactScore += 15
        } else if (targetChange < -10) {
          impactScore -= 15
        }
      }
    }

    // Cap impact score
    impactScore = Math.max(-100, Math.min(100, impactScore))

    // Determine affected sectors
    affectedSectors.push('Technology', 'Financials', 'Healthcare')

    const description = this.generateImpactDescription(rating, impactScore)

    return {
      rating,
      impactScore,
      affectedSectors,
      description,
      recommendation,
    }
  }

  private generateImpactDescription(
    rating: AnalystRating,
    impactScore: number
  ): string {
    const ratingText: Record<string, string> = {
      'strong_buy': '強気推奨',
      'buy': '買い',
      'hold': '中立',
      'sell': '売り',
      'strong_sell': '強気売り',
    }

    let desc = `${rating.analyst}が${rating.symbol}を${ratingText[rating.rating]}に`

    if (rating.previousRating && rating.previousRating !== rating.rating) {
      desc += `変更（前回: ${ratingText[rating.previousRating]}）。`
    } else {
      desc += '評価。'
    }

    if (rating.targetPrice) {
      const upside = ((rating.targetPrice - rating.currentPrice) / rating.currentPrice) * 100
      desc += `目標株価は$${rating.targetPrice.toFixed(2)}（現在価格から${upside > 0 ? '+' : ''}${upside.toFixed(1)}%）。`
    }

    const direction = impactScore > 0 ? 'プラス' : impactScore < 0 ? 'マイナス' : '中立'
    desc += `株価に${direction}の影響を与える可能性があります。`

    return desc
  }

  private async fetchRatingsFromMultipleSources(symbol: string): Promise<AnalystRating[]> {
    const ratings: AnalystRating[] = []

    // Try Finnhub
    if (this.finnhubApiKey) {
      try {
        const finnhubRatings = await this.fetchFromFinnhub(symbol)
        ratings.push(...finnhubRatings)
      } catch (error) {
        logger.error('Finnhub ratings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Finnhub' })
      }
    }

    // Try Alpha Vantage
    if (this.alphaVantageApiKey) {
      try {
        const alphaRatings = await this.fetchFromAlphaVantage(symbol)
        ratings.push(...alphaRatings)
      } catch (error) {
        logger.error('Alpha Vantage ratings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Alpha Vantage' })
      }
    }

    // Return ratings (empty array if none found)
    return ratings
  }

  private async fetchFromFinnhub(symbol: string): Promise<AnalystRating[]> {
    if (!this.finnhubApiKey) return []

    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${this.finnhubApiKey}`,
        { next: { revalidate: 3600 } }
      )

      if (!response.ok) return []

      const data = await response.json()
      const recommendations = data || []

      // Get current price for comparison
      const priceResponse = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubApiKey}`,
        { next: { revalidate: 60 } }
      )

      let currentPrice = 0
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        currentPrice = priceData.c || 0
      }

      interface FinnhubRecommendation {
        rating?: string
      }

      return recommendations.slice(0, 5).map((rec: FinnhubRecommendation) => {
        const ratingMap: Record<string, 'buy' | 'hold' | 'sell' | 'strong_buy' | 'strong_sell'> = {
          'strongBuy': 'strong_buy',
          'buy': 'buy',
          'hold': 'hold',
          'sell': 'sell',
          'strongSell': 'strong_sell',
        }

        const rating = rec.rating && ratingMap[rec.rating] ? ratingMap[rec.rating] : 'hold'

        return {
          symbol,
          analyst: 'Finnhub Consensus',
          rating,
          targetPrice: currentPrice * 1.1, // Estimate
          currentPrice,
          priceChange: 0,
          priceChangePercent: 0,
          date: new Date().toISOString(),
        }
      })
    } catch (error) {
      logger.error('Finnhub ratings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Finnhub' })
      return []
    }
  }

  private async fetchFromAlphaVantage(symbol: string): Promise<AnalystRating[]> {
    // Alpha Vantage doesn't have a direct analyst ratings endpoint
    // This would need to be implemented with a different API
    return []
  }

}

// Singleton instance
let clientInstance: AnalystRatingsClient | null = null

export function getAnalystRatingsClient(): AnalystRatingsClient {
  if (!clientInstance) {
    clientInstance = new AnalystRatingsClient()
  }
  return clientInstance
}

