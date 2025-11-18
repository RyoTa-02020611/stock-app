/**
 * ポートフォリオ計算ユーティリティ
 */

import { Position } from '../schema'
import { getSectorFromSymbol } from './sectorMapper'

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercent: number
  dailyPnL: number
  dailyPnLPercent: number
  previousValue: number
}

export interface SectorPerformance {
  sector: string
  totalValue: number
  previousValue: number
  change: number
  changePercent: number
  positions: Position[]
}

/**
 * ポートフォリオの合計値を計算
 */
export function calculatePortfolioSummary(positions: Position[]): PortfolioSummary {
  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
  const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0)
  const totalPnL = totalValue - totalCost
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  // 前日価格を計算（簡易版：現在価格の98%を仮定）
  // 実際の実装では、価格履歴APIから前日価格を取得する
  const previousValue = positions.reduce((sum, pos) => {
    const previousPrice = pos.currentPrice * 0.98 // 仮の計算
    return sum + (previousPrice * pos.quantity)
  }, 0)

  const dailyPnL = totalValue - previousValue
  const dailyPnLPercent = previousValue > 0 ? (dailyPnL / previousValue) * 100 : 0

  return {
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
    dailyPnL,
    dailyPnLPercent,
    previousValue,
  }
}

/**
 * セクター別のパフォーマンスを計算
 */
export function calculateSectorPerformance(positions: Position[]): SectorPerformance[] {
  // セクターごとにグループ化
  const sectorMap = new Map<string, Position[]>()

  positions.forEach((position) => {
    const sector = getSectorFromSymbol(position.symbol)
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, [])
    }
    sectorMap.get(sector)!.push(position)
  })

  // セクターごとのパフォーマンスを計算
  const sectorPerformance: SectorPerformance[] = []

  sectorMap.forEach((sectorPositions, sector) => {
    const totalValue = sectorPositions.reduce((sum, pos) => sum + pos.marketValue, 0)
    
    // 前日価格を計算（簡易版）
    const previousValue = sectorPositions.reduce((sum, pos) => {
      const previousPrice = pos.currentPrice * 0.98 // 仮の計算
      return sum + (previousPrice * pos.quantity)
    }, 0)

    const change = totalValue - previousValue
    const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0

    sectorPerformance.push({
      sector,
      totalValue,
      previousValue,
      change,
      changePercent,
      positions: sectorPositions,
    })
  })

  // 変動率でソート（高い順）
  return sectorPerformance.sort((a, b) => b.changePercent - a.changePercent)
}

/**
 * 今日の損失が最も大きい銘柄を取得
 */
export function getWorstPerformer(positions: Position[]): Position | null {
  if (positions.length === 0) return null

  // 本日の損益を計算（簡易版：現在価格の98%を前日価格と仮定）
  const positionsWithDailyPL = positions.map((pos) => {
    const previousPrice = pos.currentPrice * 0.98
    const dailyChange = (pos.currentPrice - previousPrice) * pos.quantity
    const dailyChangePercent = previousPrice > 0 
      ? ((pos.currentPrice - previousPrice) / previousPrice) * 100 
      : 0

    return {
      ...pos,
      dailyChange,
      dailyChangePercent,
    }
  })

  // 損失が最も大きいものを取得
  const worst = positionsWithDailyPL
    .filter((p) => p.dailyChange < 0)
    .sort((a, b) => a.dailyChange - b.dailyChange)[0]

  return worst || null
}

