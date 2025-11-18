/**
 * Data Sync Job
 * 
 * Background job for syncing data from various sources
 */

import { getStorageAdapter } from '../storage/localStorageAdapter'
import { Position } from '../schema'
import { getMarketDataClient } from '../marketDataClient'
import { getEconomicIndicatorsClient } from '../dataSources/economicIndicatorsClient'
import { getEarningsClient } from '../dataSources/earningsClient'
import { getMarketTrendsClient } from '../dataSources/marketTrendsClient'
import { getPriceImpactPredictor } from '../ai/priceImpactPredictor'

export interface SyncResult {
  success: boolean
  itemsSynced: number
  errors: string[]
  timestamp: string
}

class DataSyncJob {
  private isRunning = false
  private lastSyncTime: Date | null = null

  /**
   * Run full data sync
   */
  async runFullSync(): Promise<SyncResult> {
    if (this.isRunning) {
      return {
        success: false,
        itemsSynced: 0,
        errors: ['Sync job is already running'],
        timestamp: new Date().toISOString(),
      }
    }

    this.isRunning = true
    const errors: string[] = []
    let itemsSynced = 0

    try {
      // 1. Sync stock prices
      const priceResult = await this.syncStockPrices()
      itemsSynced += priceResult.itemsSynced
      errors.push(...priceResult.errors)

      // 2. Sync economic indicators
      try {
        await this.syncEconomicIndicators()
        itemsSynced += 1
      } catch (error) {
        errors.push(`Economic indicators sync failed: ${error}`)
      }

      // 3. Sync earnings calendar
      try {
        await this.syncEarningsCalendar()
        itemsSynced += 1
      } catch (error) {
        errors.push(`Earnings calendar sync failed: ${error}`)
      }

      // 4. Sync market trends
      try {
        await this.syncMarketTrends()
        itemsSynced += 1
      } catch (error) {
        errors.push(`Market trends sync failed: ${error}`)
      }

      // 5. Update impact predictions
      try {
        await this.updateImpactPredictions()
        itemsSynced += 1
      } catch (error) {
        errors.push(`Impact predictions update failed: ${error}`)
      }

      this.lastSyncTime = new Date()

      return {
        success: errors.length === 0,
        itemsSynced,
        errors,
        timestamp: new Date().toISOString(),
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Sync stock prices for all positions
   */
  private async syncStockPrices(): Promise<{ itemsSynced: number; errors: string[] }> {
    const errors: string[] = []
    let itemsSynced = 0

    try {
      const storage = getStorageAdapter()
      const positions = await storage.getPositions()
      const marketClient = getMarketDataClient()

      for (const position of positions) {
        try {
          const quote = await marketClient.getQuote(position.symbol)
          
          const updatedPosition: Position = {
            ...position,
            currentPrice: quote.price,
            lastUpdated: new Date().toISOString(),
            marketValue: position.quantity * quote.price,
            unrealizedPnL: (quote.price - position.averageCost) * position.quantity,
            unrealizedPnLPercent: position.averageCost > 0
              ? ((quote.price - position.averageCost) / position.averageCost) * 100
              : 0,
          }

          await storage.updatePosition(position.id, updatedPosition)
          itemsSynced++
        } catch (error) {
          errors.push(`Failed to sync price for ${position.symbol}: ${error}`)
        }
      }
    } catch (error) {
      errors.push(`Stock prices sync failed: ${error}`)
    }

    return { itemsSynced, errors }
  }

  /**
   * Sync economic indicators
   */
  private async syncEconomicIndicators(): Promise<void> {
    const client = getEconomicIndicatorsClient()
    // Cache will be updated automatically
    await client.getAllIndicators('US')
    await client.getAllIndicators('JP')
  }

  /**
   * Sync earnings calendar
   */
  private async syncEarningsCalendar(): Promise<void> {
    const client = getEarningsClient()
    const storage = getStorageAdapter()
    const positions = await storage.getPositions()
    const symbols = positions.map(p => p.symbol)

    // Fetch upcoming earnings for all positions
    await client.getUpcomingEarningsForSymbols(symbols)
  }

  /**
   * Sync market trends
   */
  private async syncMarketTrends(): Promise<void> {
    const client = getMarketTrendsClient()
    // Cache will be updated automatically
    await client.getAllTrends()
  }

  /**
   * Update impact predictions for all positions
   */
  private async updateImpactPredictions(): Promise<void> {
    const storage = getStorageAdapter()
    const positions = await storage.getPositions()
    const predictor = getPriceImpactPredictor()
    const marketClient = getMarketDataClient()

    // Update predictions for top 10 positions (to avoid rate limits)
    const topPositions = positions
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 10)

    for (const position of topPositions) {
      try {
        const quote = await marketClient.getQuote(position.symbol)
        await predictor.predict(position.symbol, quote.price, ['short', 'medium'])
      } catch (error) {
        console.error(`Failed to update prediction for ${position.symbol}:`, error)
      }
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime
  }

  /**
   * Check if sync is running
   */
  isSyncRunning(): boolean {
    return this.isRunning
  }
}

// Singleton instance
let jobInstance: DataSyncJob | null = null

export function getDataSyncJob(): DataSyncJob {
  if (!jobInstance) {
    jobInstance = new DataSyncJob()
  }
  return jobInstance
}

