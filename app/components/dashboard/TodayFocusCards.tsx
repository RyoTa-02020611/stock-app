'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position, Alert, InvestmentHypothesis } from '../../lib/schema'

interface TodayFocusCard {
  type: 'earnings' | 'target_price' | 'hypothesis_risk'
  symbol: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionUrl?: string
}

export default function TodayFocusCards() {
  const router = useRouter()
  const [cards, setCards] = useState<TodayFocusCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodayFocus()
  }, [])

  const loadTodayFocus = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const today = new Date().toISOString().split('T')[0]
      
      // Get positions
      const positions = await storage.getPositions()
      
      // Get alerts
      const alerts = await storage.getAlerts({ status: 'ACTIVE' })
      
      // Get hypotheses
      const hypotheses = await storage.getHypotheses({ status: 'ACTIVE' })
      
      const focusCards: TodayFocusCard[] = []
      
      // 1. Check for earnings today (simplified - would need earnings calendar API)
      // For now, we'll check if any positions have alerts or hypotheses that might indicate earnings
      positions.forEach(position => {
        const symbolAlerts = alerts.filter(a => a.symbol === position.symbol)
        const symbolHypotheses = hypotheses.filter(h => h.symbol === position.symbol)
        
        // Check if target price is close (within 5%)
        if (position.targetPrice) {
          const priceDiff = Math.abs(position.currentPrice - position.targetPrice) / position.targetPrice
          if (priceDiff <= 0.05 && priceDiff > 0) {
            focusCards.push({
              type: 'target_price',
              symbol: position.symbol,
              title: `${position.symbol}: 目標株価に接近`,
              description: `現在価格: ¥${position.currentPrice.toLocaleString()} / 目標: ¥${position.targetPrice.toLocaleString()} (差: ${(priceDiff * 100).toFixed(1)}%)`,
              priority: priceDiff <= 0.02 ? 'high' : 'medium',
              actionUrl: `/stocks/${position.symbol}`,
            })
          }
        }
      })
      
      // 2. Check for hypothesis risks
      hypotheses.forEach(hypothesis => {
        if (hypothesis.consecutiveInvalid >= 2) {
          focusCards.push({
            type: 'hypothesis_risk',
            symbol: hypothesis.symbol,
            title: `${hypothesis.symbol}: 仮説が崩れそう`,
            description: `「${hypothesis.hypothesis.substring(0, 50)}...」が${hypothesis.consecutiveInvalid}回連続で無効`,
            priority: 'high',
            actionUrl: `/stocks/${hypothesis.symbol}?tab=hypothesis`,
          })
        }
      })
      
      // 3. Check for alerts near trigger
      alerts.forEach(alert => {
        if (alert.targetValue) {
          // Would need current price to check, but for now just show active alerts
          focusCards.push({
            type: 'target_price',
            symbol: alert.symbol,
            title: `${alert.symbol}: アラート設定中`,
            description: `${alert.type === 'PRICE' ? '価格' : alert.type}アラートが設定されています`,
            priority: 'medium',
            actionUrl: `/stocks/${alert.symbol}?tab=alerts`,
          })
        }
      })
      
      // Sort by priority and limit to 3
      focusCards.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      
      setCards(focusCards.slice(0, 3))
    } catch (error) {
      console.error('Error loading today focus:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 text-lg font-semibold flex items-center gap-2 mb-4">
          <span>🎯</span>
          今日見るべき3つだけ
        </h3>
        <p className="text-gray-600 text-sm text-center py-8">
          今日特に注意すべき項目はありません。
          <br />
          すべて順調です！
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold flex items-center gap-2 mb-4">
        <span>🎯</span>
        今日見るべき3つだけ
      </h3>
      <div className="space-y-3">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => card.actionUrl && router.push(card.actionUrl)}
            className={`bg-gray-50 rounded-lg p-4 border ${
              card.priority === 'high'
                ? 'border-red-200 hover:border-red-300'
                : card.priority === 'medium'
                ? 'border-amber-200 hover:border-amber-300'
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors cursor-pointer`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      card.priority === 'high'
                        ? 'bg-red-50 text-[#e53935]'
                        : card.priority === 'medium'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {card.priority === 'high' ? '高' : card.priority === 'medium' ? '中' : '低'}
                  </span>
                  <span className="text-gray-900 font-semibold text-sm">{card.title}</span>
                </div>
                <p className="text-gray-600 text-xs mt-1">{card.description}</p>
              </div>
              {card.actionUrl && (
                <span className="text-[#0066cc] text-xs ml-2">→</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

