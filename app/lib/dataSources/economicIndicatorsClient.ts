/**
 * Economic Indicators Client
 * 
 * Fetches economic indicators from FRED API and Trading Economics API
 */

import { logger } from '../utils/logger'

export interface EconomicIndicator {
  id: string
  name: string
  value: number
  unit: string
  date: string
  country: string
  category: 'gdp' | 'inflation' | 'unemployment' | 'interest_rate' | 'currency' | 'other'
  change?: number
  changePercent?: number
  previousValue?: number
}

export interface EconomicIndicatorImpact {
  indicator: EconomicIndicator
  impactScore: number // -100 to +100
  affectedSectors: string[]
  description: string
}

class EconomicIndicatorsClient {
  private fredApiKey: string
  private tradingEconomicsApiKey: string
  private cache: Map<string, { data: EconomicIndicator[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  constructor() {
    this.fredApiKey = process.env.FRED_API_KEY || ''
    this.tradingEconomicsApiKey = process.env.TRADING_ECONOMICS_API_KEY || ''
  }

  /**
   * Fetch GDP data
   */
  async getGDP(country: string = 'US'): Promise<EconomicIndicator | null> {
    try {
      if (this.fredApiKey) {
        return await this.getGDPFromFRED(country)
      }
      return await this.getGDPFromTradingEconomics(country)
    } catch (error) {
      logger.error('Error fetching GDP', error instanceof Error ? error : new Error(String(error)), { country })
      return null
    }
  }

  /**
   * Fetch inflation rate
   */
  async getInflationRate(country: string = 'US'): Promise<EconomicIndicator | null> {
    try {
      if (this.fredApiKey) {
        return await this.getInflationFromFRED(country)
      }
      return await this.getInflationFromTradingEconomics(country)
    } catch (error) {
      logger.error('Error fetching inflation', error instanceof Error ? error : new Error(String(error)), { country })
      return null
    }
  }

  /**
   * Fetch unemployment rate
   */
  async getUnemploymentRate(country: string = 'US'): Promise<EconomicIndicator | null> {
    try {
      if (this.fredApiKey) {
        return await this.getUnemploymentFromFRED(country)
      }
      return await this.getUnemploymentFromTradingEconomics(country)
    } catch (error) {
      logger.error('Error fetching unemployment', error instanceof Error ? error : new Error(String(error)), { country })
      return null
    }
  }

  /**
   * Fetch interest rate
   */
  async getInterestRate(country: string = 'US'): Promise<EconomicIndicator | null> {
    try {
      if (this.fredApiKey) {
        return await this.getInterestRateFromFRED(country)
      }
      return await this.getInterestRateFromTradingEconomics(country)
    } catch (error) {
      logger.error('Error fetching interest rate', error instanceof Error ? error : new Error(String(error)), { country })
      return null
    }
  }

  /**
   * Get all major economic indicators
   */
  async getAllIndicators(country: string = 'US'): Promise<EconomicIndicator[]> {
    const cacheKey = `indicators_${country}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const [gdp, inflation, unemployment, interestRate] = await Promise.all([
        this.getGDP(country),
        this.getInflationRate(country),
        this.getUnemploymentRate(country),
        this.getInterestRate(country),
      ])

      const indicators: EconomicIndicator[] = []
      if (gdp) indicators.push(gdp)
      if (inflation) indicators.push(inflation)
      if (unemployment) indicators.push(unemployment)
      if (interestRate) indicators.push(interestRate)

      this.cache.set(cacheKey, { data: indicators, timestamp: Date.now() })
      return indicators
    } catch (error) {
      logger.error('Error fetching all economic indicators', error instanceof Error ? error : new Error(String(error)), { country })
      return []
    }
  }

  /**
   * Analyze impact of economic indicators on stock sectors
   */
  analyzeImpact(
    indicators: EconomicIndicator[],
    sectors: string[]
  ): EconomicIndicatorImpact[] {
    const impacts: EconomicIndicatorImpact[] = []

    indicators.forEach(indicator => {
      let impactScore = 0
      const affectedSectors: string[] = []

      switch (indicator.category) {
        case 'gdp':
          // GDP growth generally positive for all sectors
          impactScore = indicator.value > 0 ? 30 : -30
          affectedSectors.push(...sectors)
          break

        case 'inflation':
          // High inflation negative for growth stocks, positive for value stocks
          if (indicator.value > 3) {
            impactScore = -20
            affectedSectors.push('Technology', 'Consumer Discretionary')
            affectedSectors.push('Financials', 'Energy') // Value stocks benefit
          }
          break

        case 'unemployment':
          // Low unemployment positive for consumer sectors
          if (indicator.value < 4) {
            impactScore = 15
            affectedSectors.push('Consumer Discretionary', 'Consumer Staples')
          } else if (indicator.value > 6) {
            impactScore = -20
            affectedSectors.push(...sectors)
          }
          break

        case 'interest_rate':
          // High interest rates negative for growth stocks
          if (indicator.value > 4) {
            impactScore = -25
            affectedSectors.push('Technology', 'Real Estate', 'Utilities')
          } else if (indicator.value < 2) {
            impactScore = 20
            affectedSectors.push('Technology', 'Consumer Discretionary')
          }
          break
      }

      if (impactScore !== 0) {
        impacts.push({
          indicator,
          impactScore,
          affectedSectors: [...new Set(affectedSectors)],
          description: this.generateImpactDescription(indicator, impactScore),
        })
      }
    })

    return impacts
  }

  private generateImpactDescription(
    indicator: EconomicIndicator,
    impactScore: number
  ): string {
    const direction = impactScore > 0 ? 'プラス' : 'マイナス'
    const magnitude = Math.abs(impactScore)
    const level = magnitude > 20 ? '大きな' : magnitude > 10 ? '中程度の' : '小さな'

    return `${indicator.name}が${indicator.value}${indicator.unit}で、株式市場に${level}${direction}の影響を与える可能性があります。`
  }

  // FRED API implementations
  private async getGDPFromFRED(country: string): Promise<EconomicIndicator | null> {
    if (!this.fredApiKey) return null

    const seriesId = country === 'US' ? 'GDP' : country === 'JP' ? 'JPNRGDPEXP' : 'GDP'
    
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=2`,
        { next: { revalidate: 3600 } }
      )

      if (!response.ok) return null

      const data = await response.json()
      const observations = data.observations || []
      if (observations.length === 0) return null

      const latest = observations[0]
      const previous = observations[1]

      return {
        id: `gdp-${country}`,
        name: 'GDP成長率',
        value: parseFloat(latest.value) || 0,
        unit: '%',
        date: latest.date,
        country,
        category: 'gdp',
        change: previous ? parseFloat(latest.value) - parseFloat(previous.value) : undefined,
        changePercent: previous && parseFloat(previous.value) !== 0
          ? ((parseFloat(latest.value) - parseFloat(previous.value)) / Math.abs(parseFloat(previous.value))) * 100
          : undefined,
        previousValue: previous ? parseFloat(previous.value) : undefined,
      }
    } catch (error) {
      logger.error('FRED GDP fetch error', error instanceof Error ? error : new Error(String(error)), { country, source: 'FRED' })
      return null
    }
  }

  private async getInflationFromFRED(country: string): Promise<EconomicIndicator | null> {
    if (!this.fredApiKey) return null

    const seriesId = country === 'US' ? 'CPIAUCSL' : country === 'JP' ? 'JPNCPIALLMINMEI' : 'CPIAUCSL'
    
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=2`,
        { next: { revalidate: 3600 } }
      )

      if (!response.ok) return null

      const data = await response.json()
      const observations = data.observations || []
      if (observations.length < 2) return null

      const latest = observations[0]
      const previous = observations[1]

      const inflationRate = previous && parseFloat(previous.value) !== 0
        ? ((parseFloat(latest.value) - parseFloat(previous.value)) / parseFloat(previous.value)) * 100 * 12 // Annualized
        : 0

      return {
        id: `inflation-${country}`,
        name: 'インフレ率',
        value: inflationRate,
        unit: '%',
        date: latest.date,
        country,
        category: 'inflation',
        previousValue: previous ? parseFloat(previous.value) : undefined,
      }
    } catch (error) {
      logger.error('FRED Inflation fetch error', error instanceof Error ? error : new Error(String(error)), { country, source: 'FRED' })
      return null
    }
  }

  private async getUnemploymentFromFRED(country: string): Promise<EconomicIndicator | null> {
    if (!this.fredApiKey) return null

    const seriesId = country === 'US' ? 'UNRATE' : country === 'JP' ? 'LRUNTTTTJPM156S' : 'UNRATE'
    
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=2`,
        { next: { revalidate: 3600 } }
      )

      if (!response.ok) return null

      const data = await response.json()
      const observations = data.observations || []
      if (observations.length === 0) return null

      const latest = observations[0]
      const previous = observations[1]

      return {
        id: `unemployment-${country}`,
        name: '失業率',
        value: parseFloat(latest.value) || 0,
        unit: '%',
        date: latest.date,
        country,
        category: 'unemployment',
        change: previous ? parseFloat(latest.value) - parseFloat(previous.value) : undefined,
        previousValue: previous ? parseFloat(previous.value) : undefined,
      }
    } catch (error) {
      logger.error('FRED Unemployment fetch error', error instanceof Error ? error : new Error(String(error)), { country, source: 'FRED' })
      return null
    }
  }

  private async getInterestRateFromFRED(country: string): Promise<EconomicIndicator | null> {
    if (!this.fredApiKey) return null

    const seriesId = country === 'US' ? 'FEDFUNDS' : country === 'JP' ? 'IRLTLT01JPM156N' : 'FEDFUNDS'
    
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=2`,
        { next: { revalidate: 3600 } }
      )

      if (!response.ok) return null

      const data = await response.json()
      const observations = data.observations || []
      if (observations.length === 0) return null

      const latest = observations[0]
      const previous = observations[1]

      return {
        id: `interest-rate-${country}`,
        name: '政策金利',
        value: parseFloat(latest.value) || 0,
        unit: '%',
        date: latest.date,
        country,
        category: 'interest_rate',
        change: previous ? parseFloat(latest.value) - parseFloat(previous.value) : undefined,
        previousValue: previous ? parseFloat(previous.value) : undefined,
      }
    } catch (error) {
      logger.error('FRED Interest Rate fetch error', error instanceof Error ? error : new Error(String(error)), { country, source: 'FRED' })
      return null
    }
  }

  // Trading Economics API implementations (fallback)
  private async getGDPFromTradingEconomics(country: string): Promise<EconomicIndicator | null> {
    // TODO: Implement actual API call when key is available
    // For now, return null if API key not available
    return null
  }

  private async getInflationFromTradingEconomics(country: string): Promise<EconomicIndicator | null> {
    // TODO: Implement actual API call when key is available
    return null
  }

  private async getUnemploymentFromTradingEconomics(country: string): Promise<EconomicIndicator | null> {
    // TODO: Implement actual API call when key is available
    return null
  }

  private async getInterestRateFromTradingEconomics(country: string): Promise<EconomicIndicator | null> {
    // TODO: Implement actual API call when key is available
    return null
  }
}

// Singleton instance
let clientInstance: EconomicIndicatorsClient | null = null

export function getEconomicIndicatorsClient(): EconomicIndicatorsClient {
  if (!clientInstance) {
    clientInstance = new EconomicIndicatorsClient()
  }
  return clientInstance
}

