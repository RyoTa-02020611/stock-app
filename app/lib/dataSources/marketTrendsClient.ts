/**
 * Market Trends Client
 * 
 * Fetches market trends data: exchange rates, commodity prices, VIX index
 */

import { logger } from '../utils/logger'

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  change: number
  changePercent: number
  timestamp: string
}

export interface CommodityPrice {
  symbol: string
  name: string
  price: number
  unit: string
  change: number
  changePercent: number
  timestamp: string
}

export interface VIXData {
  value: number
  change: number
  changePercent: number
  timestamp: string
  level: 'low' | 'normal' | 'high' | 'extreme'
}

export interface MarketTrend {
  type: 'exchange_rate' | 'commodity' | 'vix'
  data: ExchangeRate | CommodityPrice | VIXData
  impactScore: number // -100 to +100
  affectedSectors: string[]
  description: string
}

class MarketTrendsClient {
  private alphaVantageApiKey: string
  private cache: Map<string, { data: ExchangeRate[] | CommodityPrice[] | VIXData | null; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || ''
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(pairs: string[] = ['USD/JPY', 'EUR/USD', 'GBP/USD']): Promise<ExchangeRate[]> {
    const cacheKey = `exchange_rates_${pairs.join(',')}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const rates = await Promise.all(
        pairs.map(pair => this.fetchExchangeRate(pair))
      )

      const validRates = rates.filter((r): r is ExchangeRate => r !== null)
      this.cache.set(cacheKey, { data: validRates, timestamp: Date.now() })
      return validRates
    } catch (error) {
      logger.error('Error fetching exchange rates', error instanceof Error ? error : new Error(String(error)), { pairs })
      return []
    }
  }

  /**
   * Get commodity prices
   */
  async getCommodityPrices(symbols: string[] = ['GOLD', 'OIL', 'SILVER']): Promise<CommodityPrice[]> {
    const cacheKey = `commodities_${symbols.join(',')}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const prices = await Promise.all(
        symbols.map(symbol => this.fetchCommodityPrice(symbol))
      )

      const validPrices = prices.filter((p): p is CommodityPrice => p !== null)
      this.cache.set(cacheKey, { data: validPrices, timestamp: Date.now() })
      return validPrices
    } catch (error) {
      logger.error('Error fetching commodity prices', error instanceof Error ? error : new Error(String(error)), { symbols })
      return []
    }
  }

  /**
   * Get VIX index
   */
  async getVIX(): Promise<VIXData | null> {
    const cacheKey = 'vix'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const vix = await this.fetchVIX()
      if (vix) {
        this.cache.set(cacheKey, { data: vix, timestamp: Date.now() })
      }
      return vix
    } catch (error) {
      logger.error('Error fetching VIX', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  /**
   * Get all market trends
   */
  async getAllTrends(): Promise<MarketTrend[]> {
    try {
      const [exchangeRates, commodities, vix] = await Promise.all([
        this.getExchangeRates(),
        this.getCommodityPrices(),
        this.getVIX(),
      ])

      const trends: MarketTrend[] = []

      // Analyze exchange rates
      exchangeRates.forEach(rate => {
        const impact = this.analyzeExchangeRateImpact(rate)
        trends.push({
          type: 'exchange_rate',
          data: rate,
          ...impact,
        })
      })

      // Analyze commodities
      commodities.forEach(commodity => {
        const impact = this.analyzeCommodityImpact(commodity)
        trends.push({
          type: 'commodity',
          data: commodity,
          ...impact,
        })
      })

      // Analyze VIX
      if (vix) {
        const impact = this.analyzeVIXImpact(vix)
        trends.push({
          type: 'vix',
          data: vix,
          ...impact,
        })
      }

      return trends
    } catch (error) {
      logger.error('Error fetching all market trends', error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }

  private analyzeExchangeRateImpact(rate: ExchangeRate): {
    impactScore: number
    affectedSectors: string[]
    description: string
  } {
    let impactScore = 0
    const affectedSectors: string[] = []

    // USD/JPY impact
    if (rate.from === 'USD' && rate.to === 'JPY') {
      if (rate.changePercent > 2) {
        // Strong yen appreciation - negative for exporters
        impactScore = -30
        affectedSectors.push('Technology', 'Automotive', 'Electronics')
      } else if (rate.changePercent < -2) {
        // Strong yen depreciation - positive for exporters
        impactScore = 30
        affectedSectors.push('Technology', 'Automotive', 'Electronics')
      }
    }

    // EUR/USD impact
    if (rate.from === 'EUR' && rate.to === 'USD') {
      if (rate.changePercent > 1) {
        // Strong euro - positive for European stocks
        impactScore = 20
        affectedSectors.push('Financials', 'Consumer Goods')
      }
    }

    const description = `${rate.from}/${rate.to}が${rate.rate.toFixed(2)}で、${rate.changePercent > 0 ? '上昇' : '下落'}しています。${affectedSectors.length > 0 ? affectedSectors.join('、') + 'セクターに影響を与える可能性があります。' : ''}`

    return { impactScore, affectedSectors, description }
  }

  private analyzeCommodityImpact(commodity: CommodityPrice): {
    impactScore: number
    affectedSectors: string[]
    description: string
  } {
    let impactScore = 0
    const affectedSectors: string[] = []

    if (commodity.symbol === 'GOLD' || commodity.symbol === 'SILVER') {
      // Gold/silver price increase - positive for mining, negative for tech
      if (commodity.changePercent > 3) {
        impactScore = 25
        affectedSectors.push('Materials', 'Mining')
        impactScore -= 10
        affectedSectors.push('Technology')
      }
    } else if (commodity.symbol === 'OIL') {
      // Oil price increase - positive for energy, negative for transportation
      if (commodity.changePercent > 5) {
        impactScore = 30
        affectedSectors.push('Energy')
        impactScore -= 20
        affectedSectors.push('Airlines', 'Transportation')
      } else if (commodity.changePercent < -5) {
        impactScore = -25
        affectedSectors.push('Energy')
        impactScore += 15
        affectedSectors.push('Airlines', 'Transportation')
      }
    }

    const description = `${commodity.name}が${commodity.price.toFixed(2)}${commodity.unit}で、${commodity.changePercent > 0 ? '上昇' : '下落'}しています。${affectedSectors.length > 0 ? affectedSectors.join('、') + 'セクターに影響を与える可能性があります。' : ''}`

    return { impactScore, affectedSectors, description }
  }

  private analyzeVIXImpact(vix: VIXData): {
    impactScore: number
    affectedSectors: string[]
    description: string
  } {
    let impactScore = 0
    const affectedSectors: string[] = ['All Sectors']

    // VIX > 30: High fear - negative for all sectors
    if (vix.value > 30) {
      impactScore = -40
    } else if (vix.value > 20) {
      impactScore = -20
    } else if (vix.value < 15) {
      impactScore = 15 // Low fear - positive
    }

    const description = `VIX指数が${vix.value.toFixed(2)}で${vix.level === 'high' || vix.level === 'extreme' ? '高水準' : '低水準'}です。市場の${vix.level === 'high' || vix.level === 'extreme' ? '不安心理' : '安定感'}を示しています。`

    return { impactScore, affectedSectors, description }
  }

  private async fetchExchangeRate(pair: string): Promise<ExchangeRate | null> {
    const [from, to] = pair.split('/')
    
    try {
      if (this.alphaVantageApiKey) {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${this.alphaVantageApiKey}`,
          { next: { revalidate: 300 } }
        )

        if (response.ok) {
          const data = await response.json()
          const rateData = data['Realtime Currency Exchange Rate']
          if (rateData) {
            const rate = parseFloat(rateData['5. Exchange Rate'])
            // Calculate change (simplified - would need historical data for accurate change)
            const change = 0
            const changePercent = 0

            return {
              from,
              to,
              rate,
              change,
              changePercent,
              timestamp: rateData['6. Last Refreshed'],
            }
          }
        }
      }

      // If API key not available or fetch failed, return null
      return null
    } catch (error) {
      logger.error(`Error fetching exchange rate for ${pair}`, error instanceof Error ? error : new Error(String(error)), { pair, source: 'Alpha Vantage' })
      return null
    }
  }

  private async fetchCommodityPrice(symbol: string): Promise<CommodityPrice | null> {
    try {
      // Use Alpha Vantage or other commodity API
      // For now, return null if API key not available
      if (!this.alphaVantageApiKey) {
        return null
      }
      // TODO: Implement actual commodity price fetching
      return null
    } catch (error) {
      logger.error(`Error fetching commodity price for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      return null
    }
  }

  private async fetchVIX(): Promise<VIXData | null> {
    try {
      // Fetch VIX from Yahoo Finance or CBOE
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 300 },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const result = data.chart?.result?.[0]
        if (result) {
          const meta = result.meta
          const value = meta.regularMarketPrice || 0
          const previousClose = meta.previousClose || value
          const change = value - previousClose
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

          let level: 'low' | 'normal' | 'high' | 'extreme'
          if (value > 30) level = 'extreme'
          else if (value > 20) level = 'high'
          else if (value < 15) level = 'low'
          else level = 'normal'

          return {
            value,
            change,
            changePercent,
            timestamp: new Date().toISOString(),
            level,
          }
        }
      }

      // If fetch failed, return null
      return null
    } catch (error) {
      logger.error('Error fetching VIX from Yahoo Finance', error instanceof Error ? error : new Error(String(error)), { source: 'Yahoo Finance' })
      return null
    }
  }

}

// Singleton instance
let clientInstance: MarketTrendsClient | null = null

export function getMarketTrendsClient(): MarketTrendsClient {
  if (!clientInstance) {
    clientInstance = new MarketTrendsClient()
  }
  return clientInstance
}

