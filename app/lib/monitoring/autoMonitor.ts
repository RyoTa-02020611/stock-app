/**
 * Auto Monitor
 * 
 * Automatically monitors stocks, news, and market conditions for alerts
 */

import { getStorageAdapter } from '../storage/localStorageAdapter'
import { Position, Alert } from '../schema'
import { getEarningsClient } from '../dataSources/earningsClient'
import { getAnalystRatingsClient } from '../dataSources/analystRatingsClient'
import { getNewsClient } from '../newsClient'
import { getPriceImpactPredictor } from '../ai/priceImpactPredictor'
import { getMarketDataClient } from '../marketDataClient'

export interface MonitorAlert {
  id: string
  type: 'price' | 'earnings' | 'rating' | 'news' | 'risk' | 'opportunity'
  symbol: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  actionRequired?: boolean
  actionType?: 'buy' | 'sell' | 'hold' | 'watch'
}

class AutoMonitor {
  private checkInterval: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Start monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkAllAlerts().catch(console.error)
    }, 5 * 60 * 1000)

    // Initial check
    await this.checkAllAlerts()
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
  }

  /**
   * Check all alerts
   */
  async checkAllAlerts(): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []

    try {
      const storage = getStorageAdapter()
      const positions = await storage.getPositions()
      const userAlerts = await storage.getAlerts()

      // Check price alerts
      const priceAlerts = await this.checkPriceAlerts(positions, userAlerts)
      alerts.push(...priceAlerts)

      // Check earnings alerts
      const earningsAlerts = await this.checkEarningsAlerts(positions)
      alerts.push(...earningsAlerts)

      // Check rating change alerts
      const ratingAlerts = await this.checkRatingAlerts(positions)
      alerts.push(...ratingAlerts)

      // Check news alerts
      const newsAlerts = await this.checkNewsAlerts(positions, userAlerts)
      alerts.push(...newsAlerts)

      // Check portfolio risk alerts
      const riskAlerts = await this.checkPortfolioRisk(positions)
      alerts.push(...riskAlerts)

      // Check opportunities
      const opportunityAlerts = await this.checkOpportunities(positions)
      alerts.push(...opportunityAlerts)

      return alerts
    } catch (error) {
      console.error('Error checking alerts:', error)
      return []
    }
  }

  private async checkPriceAlerts(
    positions: Position[],
    userAlerts: Alert[]
  ): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []

    for (const position of positions) {
      // Check user-defined price alerts
      const symbolAlerts = userAlerts.filter(a => a.symbol === position.symbol && a.type === 'price')
      
      for (const alert of symbolAlerts) {
        if (alert.condition === 'above' && position.currentPrice >= (alert.value || 0)) {
          alerts.push({
            id: `price-${alert.id}`,
            type: 'price',
            symbol: position.symbol,
            severity: alert.priority === 'high' ? 'high' : 'medium',
            title: `${position.symbol}が目標価格に到達`,
            message: `${position.symbol}の価格が$${position.currentPrice.toFixed(2)}に到達しました（目標: $${alert.value})`,
            timestamp: new Date().toISOString(),
            actionRequired: true,
            actionType: alert.action || 'watch',
          })
        } else if (alert.condition === 'below' && position.currentPrice <= (alert.value || 0)) {
          alerts.push({
            id: `price-${alert.id}`,
            type: 'price',
            symbol: position.symbol,
            severity: alert.priority === 'high' ? 'high' : 'medium',
            title: `${position.symbol}がアラート価格に到達`,
            message: `${position.symbol}の価格が$${position.currentPrice.toFixed(2)}に到達しました（アラート: $${alert.value})`,
            timestamp: new Date().toISOString(),
            actionRequired: true,
            actionType: alert.action || 'watch',
          })
        }
      }

      // Check for significant price movements
      const priceChangePercent = position.averageCost > 0
        ? ((position.currentPrice - position.averageCost) / position.averageCost) * 100
        : 0

      if (priceChangePercent < -10) {
        alerts.push({
          id: `price-drop-${position.symbol}`,
          type: 'price',
          symbol: position.symbol,
          severity: 'high',
          title: `${position.symbol}が10%以上下落`,
          message: `${position.symbol}が平均取得価格から${priceChangePercent.toFixed(1)}%下落しています。`,
          timestamp: new Date().toISOString(),
          actionRequired: true,
          actionType: 'watch',
        })
      } else if (priceChangePercent > 20) {
        alerts.push({
          id: `price-gain-${position.symbol}`,
          type: 'price',
          symbol: position.symbol,
          severity: 'medium',
          title: `${position.symbol}が20%以上上昇`,
          message: `${position.symbol}が平均取得価格から${priceChangePercent.toFixed(1)}%上昇しています。利益確定の検討をお勧めします。`,
          timestamp: new Date().toISOString(),
          actionRequired: false,
          actionType: 'hold',
        })
      }
    }

    return alerts
  }

  private async checkEarningsAlerts(positions: Position[]): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []
    const earningsClient = getEarningsClient()

    for (const position of positions) {
      try {
        const earnings = await earningsClient.getEarnings(position.symbol)
        const upcoming = earnings.filter(e => e.status === 'upcoming')
        
        if (upcoming.length > 0) {
          const nextEarnings = upcoming[0]
          const daysUntil = Math.ceil(
            (new Date(nextEarnings.reportDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )

          if (daysUntil <= 7 && daysUntil >= 0) {
            alerts.push({
              id: `earnings-${position.symbol}`,
              type: 'earnings',
              symbol: position.symbol,
              severity: daysUntil <= 3 ? 'high' : 'medium',
              title: `${position.symbol}の決算発表が近づいています`,
              message: `${position.symbol}の${nextEarnings.fiscalQuarter}決算が${daysUntil}日後に発表されます。`,
              timestamp: new Date().toISOString(),
              actionRequired: daysUntil <= 1,
              actionType: 'watch',
            })
          }
        }
      } catch (error) {
        console.error(`Error checking earnings for ${position.symbol}:`, error)
      }
    }

    return alerts
  }

  private async checkRatingAlerts(positions: Position[]): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []
    const ratingsClient = getAnalystRatingsClient()

    for (const position of positions) {
      try {
        const recentChanges = await ratingsClient.getRecentRatingChanges([position.symbol])
        
        for (const rating of recentChanges) {
          if (rating.previousRating && rating.previousRating !== rating.rating) {
            const isDowngrade = ['strong_buy', 'buy'].includes(rating.previousRating) && 
                                ['sell', 'strong_sell'].includes(rating.rating)
            const isUpgrade = ['sell', 'strong_sell'].includes(rating.previousRating) && 
                              ['strong_buy', 'buy'].includes(rating.rating)

            alerts.push({
              id: `rating-${position.symbol}-${rating.date}`,
              type: 'rating',
              symbol: position.symbol,
              severity: isDowngrade ? 'high' : isUpgrade ? 'medium' : 'low',
              title: `${position.symbol}のアナリスト評価が変更`,
              message: `${rating.analyst}が${position.symbol}を${rating.previousRating}から${rating.rating}に変更しました。`,
              timestamp: rating.date,
              actionRequired: isDowngrade,
              actionType: isDowngrade ? 'watch' : isUpgrade ? 'buy' : 'hold',
            })
          }
        }
      } catch (error) {
        console.error(`Error checking ratings for ${position.symbol}:`, error)
      }
    }

    return alerts
  }

  private async checkNewsAlerts(
    positions: Position[],
    userAlerts: Alert[]
  ): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []
    const newsClient = getNewsClient()

    for (const position of positions) {
      try {
        const news = await newsClient.fetchNewsFromMultipleSources(position.symbol, 10)
        const analysis = newsClient.analyzeNewsCollection(news)

        // Check for significant negative news
        if (analysis.negativeCount > analysis.positiveCount * 2) {
          alerts.push({
            id: `news-negative-${position.symbol}`,
            type: 'news',
            symbol: position.symbol,
            severity: 'medium',
            title: `${position.symbol}に関する懸念材料のニュースが増加`,
            message: `最近のニュースで懸念材料が好材料を上回っています。詳細を確認することをお勧めします。`,
            timestamp: new Date().toISOString(),
            actionRequired: false,
            actionType: 'watch',
          })
        }

        // Check user-defined news alerts
        const newsAlerts = userAlerts.filter(a => a.symbol === position.symbol && a.type === 'news')
        // News alert checking would be implemented here
      } catch (error) {
        console.error(`Error checking news for ${position.symbol}:`, error)
      }
    }

    return alerts
  }

  private async checkPortfolioRisk(positions: Position[]): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []

    if (positions.length === 0) return alerts

    // Check for high concentration risk
    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0)
    const maxPosition = Math.max(...positions.map(p => p.marketValue))
    const concentrationPercent = (maxPosition / totalValue) * 100

    if (concentrationPercent > 40) {
      const topPosition = positions.find(p => p.marketValue === maxPosition)
      alerts.push({
        id: 'portfolio-concentration',
        type: 'risk',
        symbol: 'PORTFOLIO',
        severity: 'high',
        title: 'ポートフォリオの集中リスクが高い',
        message: `${topPosition?.symbol || '特定銘柄'}がポートフォリオの${concentrationPercent.toFixed(1)}%を占めています。分散投資の検討をお勧めします。`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        actionType: 'watch',
      })
    }

    // Check for overall portfolio loss
    const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0)
    const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0)
    const portfolioLossPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    if (portfolioLossPercent < -15) {
      alerts.push({
        id: 'portfolio-loss',
        type: 'risk',
        symbol: 'PORTFOLIO',
        severity: 'critical',
        title: 'ポートフォリオの損失が拡大',
        message: `ポートフォリオ全体で${portfolioLossPercent.toFixed(1)}%の損失が出ています。リスク管理の見直しをお勧めします。`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        actionType: 'watch',
      })
    }

    return alerts
  }

  private async checkOpportunities(positions: Position[]): Promise<MonitorAlert[]> {
    const alerts: MonitorAlert[] = []
    const predictor = getPriceImpactPredictor()
    const marketClient = getMarketDataClient()

    for (const position of positions) {
      try {
        const quote = await marketClient.getQuote(position.symbol)
        const summary = await predictor.predict(position.symbol, quote.price, ['short'])

        if (summary.shortTerm.impactScore > 30 && summary.shortTerm.confidence > 70) {
          alerts.push({
            id: `opportunity-${position.symbol}`,
            type: 'opportunity',
            symbol: position.symbol,
            severity: 'medium',
            title: `${position.symbol}に上昇機会`,
            message: `短期予測で${summary.shortTerm.impactScore.toFixed(1)}のプラス影響が予測されています。買い増しの検討をお勧めします。`,
            timestamp: new Date().toISOString(),
            actionRequired: false,
            actionType: 'buy',
          })
        }
      } catch (error) {
        console.error(`Error checking opportunities for ${position.symbol}:`, error)
      }
    }

    return alerts
  }
}

// Singleton instance
let monitorInstance: AutoMonitor | null = null

export function getAutoMonitor(): AutoMonitor {
  if (!monitorInstance) {
    monitorInstance = new AutoMonitor()
  }
  return monitorInstance
}

