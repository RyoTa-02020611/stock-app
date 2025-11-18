/**
 * Earnings Client
 * 
 * Fetches earnings data from SEC EDGAR API and earnings calendar APIs
 */

import { logger } from '../utils/logger'

export interface EarningsReport {
  symbol: string
  companyName: string
  reportDate: string
  fiscalQuarter: string
  fiscalYear: number
  eps: number | null
  epsEstimate: number | null
  epsSurprise: number | null
  revenue: number | null
  revenueEstimate: number | null
  revenueSurprise: number | null
  announcementTime: 'before_market_open' | 'during_market' | 'after_market_close' | 'unknown'
  status: 'upcoming' | 'reported' | 'delayed'
}

export interface EarningsCalendar {
  date: string
  reports: EarningsReport[]
}

export interface EarningsImpact {
  report: EarningsReport
  impactScore: number // -100 to +100
  affectedSectors: string[]
  description: string
  recommendation: 'buy' | 'hold' | 'sell' | 'watch'
}

class EarningsClient {
  private secApiKey: string
  private alphaVantageApiKey: string
  private cache: Map<string, { data: EarningsReport[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  constructor() {
    this.secApiKey = process.env.SEC_EDGAR_API_KEY || ''
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || ''
  }

  /**
   * Get earnings for a specific symbol
   */
  async getEarnings(symbol: string): Promise<EarningsReport[]> {
    const cacheKey = `earnings_${symbol}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const reports = await this.fetchEarningsFromMultipleSources(symbol)
      this.cache.set(cacheKey, { data: reports, timestamp: Date.now() })
      return reports
    } catch (error) {
      logger.error(`Error fetching earnings for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      return []
    }
  }

  /**
   * Get earnings calendar for upcoming reports
   */
  async getEarningsCalendar(days: number = 30): Promise<EarningsCalendar[]> {
    try {
      const calendar: EarningsCalendar[] = []
      const today = new Date()
      
      // Fetch from Alpha Vantage if available
      if (this.alphaVantageApiKey) {
        const reports = await this.fetchEarningsCalendarFromAlphaVantage()
        const groupedByDate = this.groupReportsByDate(reports)
        
        for (let i = 0; i < days; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          
          if (groupedByDate[dateStr]) {
            calendar.push({
              date: dateStr,
              reports: groupedByDate[dateStr],
            })
          }
        }
      }
      // If no API key, return empty calendar

      return calendar
    } catch (error) {
      logger.error('Error fetching earnings calendar', error instanceof Error ? error : new Error(String(error)), { days })
      return []
    }
  }

  /**
   * Get upcoming earnings for symbols in portfolio
   */
  async getUpcomingEarningsForSymbols(symbols: string[]): Promise<EarningsReport[]> {
    const allReports: EarningsReport[] = []
    
    for (const symbol of symbols) {
      try {
        const reports = await this.getEarnings(symbol)
        const upcoming = reports.filter(r => r.status === 'upcoming')
        allReports.push(...upcoming)
      } catch (error) {
        logger.error(`Error fetching upcoming earnings for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      }
    }

    // Sort by report date
    return allReports.sort((a, b) => 
      new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
    )
  }

  /**
   * Analyze impact of earnings report
   */
  analyzeImpact(report: EarningsReport): EarningsImpact {
    let impactScore = 0
    const affectedSectors: string[] = []
    let recommendation: 'buy' | 'hold' | 'sell' | 'watch' = 'hold'

    // Analyze EPS surprise
    if (report.epsSurprise !== null) {
      if (report.epsSurprise > 0.1) {
        impactScore += 40 // Strong beat
        recommendation = 'buy'
      } else if (report.epsSurprise > 0) {
        impactScore += 20 // Beat
        recommendation = 'buy'
      } else if (report.epsSurprise < -0.1) {
        impactScore -= 40 // Strong miss
        recommendation = 'sell'
      } else if (report.epsSurprise < 0) {
        impactScore -= 20 // Miss
        recommendation = 'sell'
      }
    }

    // Analyze revenue surprise
    if (report.revenueSurprise !== null) {
      if (report.revenueSurprise > 0.05) {
        impactScore += 30
        if (recommendation === 'hold') recommendation = 'buy'
      } else if (report.revenueSurprise < -0.05) {
        impactScore -= 30
        if (recommendation === 'buy') recommendation = 'hold'
        if (recommendation === 'hold') recommendation = 'sell'
      }
    }

    // Cap impact score
    impactScore = Math.max(-100, Math.min(100, impactScore))

    // Determine affected sectors (simplified)
    affectedSectors.push('Technology', 'Financials', 'Healthcare')

    const description = this.generateImpactDescription(report, impactScore)

    return {
      report,
      impactScore,
      affectedSectors,
      description,
      recommendation,
    }
  }

  private generateImpactDescription(
    report: EarningsReport,
    impactScore: number
  ): string {
    const direction = impactScore > 0 ? 'プラス' : impactScore < 0 ? 'マイナス' : '中立'
    const magnitude = Math.abs(impactScore)
    const level = magnitude > 50 ? '非常に大きな' : magnitude > 25 ? '大きな' : '中程度の'

    let desc = `${report.companyName}の${report.fiscalQuarter}決算が`
    
    if (report.epsSurprise !== null) {
      if (report.epsSurprise > 0) {
        desc += `EPSが予想を${(report.epsSurprise * 100).toFixed(1)}%上回り、`
      } else if (report.epsSurprise < 0) {
        desc += `EPSが予想を${Math.abs(report.epsSurprise * 100).toFixed(1)}%下回り、`
      }
    }

    desc += `株価に${level}${direction}の影響を与える可能性があります。`

    return desc
  }

  private async fetchEarningsFromMultipleSources(symbol: string): Promise<EarningsReport[]> {
    const reports: EarningsReport[] = []

    // Try Alpha Vantage first
    if (this.alphaVantageApiKey) {
      try {
        const alphaReports = await this.fetchEarningsFromAlphaVantage(symbol)
        reports.push(...alphaReports)
      } catch (error) {
        logger.error('Alpha Vantage earnings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Alpha Vantage' })
      }
    }

    // Try SEC EDGAR
    try {
      const secReports = await this.fetchEarningsFromSEC(symbol)
      reports.push(...secReports)
    } catch (error) {
      logger.error('SEC EDGAR earnings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'SEC EDGAR' })
    }

    // Return reports (empty array if none found)
    return reports
  }

  private async fetchEarningsFromAlphaVantage(symbol: string): Promise<EarningsReport[]> {
    if (!this.alphaVantageApiKey) return []

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`,
        { next: { revalidate: 3600 } }
      )

      if (!response.ok) return []

      const data = await response.json()
      const quarterlyEarnings = data.quarterlyEarnings || []

      interface AlphaVantageEarning {
        fiscalDateEnding: string
        reportedEPS?: string
        estimatedEPS?: string
      }

      return quarterlyEarnings.map((earning: AlphaVantageEarning) => ({
        symbol,
        companyName: data.name || symbol,
        reportDate: earning.fiscalDateEnding,
        fiscalQuarter: earning.reportedEPS ? `Q${earning.reportedEPS}` : 'Unknown',
        fiscalYear: new Date(earning.fiscalDateEnding).getFullYear(),
        eps: parseFloat(earning.reportedEPS) || null,
        epsEstimate: parseFloat(earning.estimatedEPS) || null,
        epsSurprise: earning.reportedEPS && earning.estimatedEPS
          ? parseFloat(earning.reportedEPS) - parseFloat(earning.estimatedEPS)
          : null,
        revenue: null,
        revenueEstimate: null,
        revenueSurprise: null,
        announcementTime: 'unknown',
        status: new Date(earning.fiscalDateEnding) > new Date() ? 'upcoming' : 'reported',
      }))
    } catch (error) {
      logger.error('Alpha Vantage earnings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Alpha Vantage' })
      return []
    }
  }

  private async fetchEarningsFromSEC(symbol: string): Promise<EarningsReport[]> {
    // SEC EDGAR API implementation
    // This is a simplified version - full implementation would require more complex parsing
    try {
      const response = await fetch(
        `https://data.sec.gov/submissions/CIK${symbol}.json`,
        {
          headers: {
            'User-Agent': 'Stock Library App contact@example.com',
          },
          next: { revalidate: 3600 },
        }
      )

      if (!response.ok) return []

      // SEC EDGAR requires more complex parsing
      // For now, return empty array
      return []
    } catch (error) {
      logger.error('SEC EDGAR earnings fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'SEC EDGAR' })
      return []
    }
  }

  private async fetchEarningsCalendarFromAlphaVantage(): Promise<EarningsReport[]> {
    // Alpha Vantage doesn't have a direct earnings calendar endpoint
    // This would need to be implemented with a different API or web scraping
    return []
  }


  private groupReportsByDate(reports: EarningsReport[]): Record<string, EarningsReport[]> {
    const grouped: Record<string, EarningsReport[]> = {}
    
    reports.forEach(report => {
      const date = report.reportDate.split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(report)
    })

    return grouped
  }
}

// Singleton instance
let clientInstance: EarningsClient | null = null

export function getEarningsClient(): EarningsClient {
  if (!clientInstance) {
    clientInstance = new EarningsClient()
  }
  return clientInstance
}

