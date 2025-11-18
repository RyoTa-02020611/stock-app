'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Trade } from '../../lib/schema'

interface TradeAnalysis {
  totalTrades: number
  buyTrades: number
  sellTrades: number
  winningTrades: number
  losingTrades: number
  breakEvenTrades: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netPnL: number
  averageProfit: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  mostTradedSymbol: string
  mostTradedSymbolCount: number
  recentPerformance: 'positive' | 'negative' | 'neutral'
  recentTradesCount: number
  recentNetPnL: number
  suggestions: string[]
}

export default function TradeAnalysisCard() {
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showHypothesisCheck, setShowHypothesisCheck] = useState(false)
  const [hypothesis, setHypothesis] = useState('')
  const [hypothesisResult, setHypothesisResult] = useState<{
    supported: boolean
    confidence: number
    evidence: string
    details: string
  } | null>(null)
  const [loadingHypothesis, setLoadingHypothesis] = useState(false)
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    loadAnalysis()
  }, [])

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const allTrades = await storage.getTrades()
      setTrades(allTrades)
      
      // Filter only filled trades
      const filledTrades = allTrades.filter(t => t.status === 'FILLED' && t.averageFillPrice && t.filledQuantity)
      
      if (filledTrades.length === 0) {
        setAnalysis(null)
        return
      }

      const analysis = analyzeTrades(filledTrades)
      setAnalysis(analysis)
    } catch (error) {
      console.error('Error loading trade analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAISummary = async () => {
    if (!analysis || trades.length === 0) return

    try {
      setLoadingSummary(true)
      const response = await fetch('/api/ai/analyze-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades,
          analysisType: 'summary',
        }),
      })

      if (!response.ok) {
        throw new Error('AI要約の取得に失敗しました')
      }

      const data = await response.json()
      setAiSummary(data.summary)
    } catch (error) {
      console.error('Error loading AI summary:', error)
      setAiSummary('AI要約の生成中にエラーが発生しました。')
    } finally {
      setLoadingSummary(false)
    }
  }

  const checkHypothesis = async () => {
    if (!hypothesis.trim() || trades.length === 0) return

    try {
      setLoadingHypothesis(true)
      const response = await fetch('/api/ai/analyze-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades,
          analysisType: 'hypothesis',
          hypothesis: hypothesis.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('仮説チェックに失敗しました')
      }

      const data = await response.json()
      setHypothesisResult(data.result)
    } catch (error) {
      console.error('Error checking hypothesis:', error)
      setHypothesisResult({
        supported: false,
        confidence: 0,
        evidence: '仮説チェック中にエラーが発生しました',
        details: '時間をおいて再度お試しください。',
      })
    } finally {
      setLoadingHypothesis(false)
    }
  }

  const analyzeTrades = (trades: Trade[]): TradeAnalysis => {
    const totalTrades = trades.length
    const buyTrades = trades.filter(t => t.side === 'BUY').length
    const sellTrades = trades.filter(t => t.side === 'SELL').length

    // Calculate P&L for each trade
    // For simplicity, we'll use averageFillPrice * quantity as the trade value
    // In a real scenario, you'd track entry/exit prices
    const tradePnLs: Array<{ trade: Trade; pnl: number }> = []
    
    // Group trades by symbol to calculate position-based P&L
    const symbolGroups = new Map<string, Trade[]>()
    trades.forEach(trade => {
      if (!symbolGroups.has(trade.symbol)) {
        symbolGroups.set(trade.symbol, [])
      }
      symbolGroups.get(trade.symbol)!.push(trade)
    })

    // Calculate realized P&L (simplified: assumes SELL after BUY)
    let totalProfit = 0
    let totalLoss = 0
    let winningTrades = 0
    let losingTrades = 0
    let breakEvenTrades = 0
    const wins: number[] = []
    const losses: number[] = []

    symbolGroups.forEach((symbolTrades, symbol) => {
      // Sort by date
      const sorted = symbolTrades.sort((a, b) => 
        new Date(a.filledAt || a.createdAt).getTime() - new Date(b.filledAt || b.createdAt).getTime()
      )

      let position = 0
      let averageCost = 0
      const realizedPnLs: number[] = []

      sorted.forEach(trade => {
        const price = trade.averageFillPrice || trade.price || 0
        const quantity = trade.filledQuantity || trade.quantity || 0

        if (trade.side === 'BUY') {
          if (position === 0) {
            averageCost = price
            position = quantity
          } else {
            // Average cost calculation
            averageCost = ((averageCost * position) + (price * quantity)) / (position + quantity)
            position += quantity
          }
        } else if (trade.side === 'SELL' && position > 0) {
          const sellQuantity = Math.min(quantity, position)
          const pnl = (price - averageCost) * sellQuantity
          realizedPnLs.push(pnl)
          
          if (pnl > 0) {
            totalProfit += pnl
            winningTrades++
            wins.push(pnl)
          } else if (pnl < 0) {
            totalLoss += Math.abs(pnl)
            losingTrades++
            losses.push(Math.abs(pnl))
          } else {
            breakEvenTrades++
          }

          position -= sellQuantity
          if (position === 0) {
            averageCost = 0
          }
        }
      })
    })

    // If no realized P&L (only BUY orders or no SELL orders yet), 
    // we can't calculate actual P&L, so we'll show 0 or use position data
    // This is expected for users who haven't closed any positions yet

    const netPnL = totalProfit - totalLoss
    // Win rate: percentage of closed positions that were profitable
    // If we have closed positions (wins + losses > 0), calculate from that
    // Otherwise, we can't calculate a meaningful win rate
    const closedPositions = winningTrades + losingTrades + breakEvenTrades
    const winRate = closedPositions > 0 
      ? (winningTrades / closedPositions) * 100 
      : 0
    const averageProfit = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
    const averageLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0
    const largestWin = wins.length > 0 ? Math.max(...wins) : 0
    const largestLoss = losses.length > 0 ? Math.max(...losses) : 0

    // Most traded symbol
    const symbolCounts = new Map<string, number>()
    trades.forEach(trade => {
      symbolCounts.set(trade.symbol, (symbolCounts.get(trade.symbol) || 0) + 1)
    })
    let mostTradedSymbol = ''
    let mostTradedSymbolCount = 0
    symbolCounts.forEach((count, symbol) => {
      if (count > mostTradedSymbolCount) {
        mostTradedSymbolCount = count
        mostTradedSymbol = symbol
      }
    })

    // Recent performance (last 10 trades)
    const recentTrades = trades
      .sort((a, b) => new Date(b.filledAt || b.createdAt).getTime() - new Date(a.filledAt || a.createdAt).getTime())
      .slice(0, 10)
    
    // Simplified recent P&L calculation
    const recentNetPnL = netPnL * 0.3 // Estimate 30% from recent trades
    const recentPerformance: 'positive' | 'negative' | 'neutral' = 
      recentNetPnL > 0 ? 'positive' : recentNetPnL < 0 ? 'negative' : 'neutral'

    // Generate suggestions
    const suggestions: string[] = []
    
    if (closedPositions === 0) {
      suggestions.push('まだポジションをクローズしていません。取引を完了すると、より詳細な分析が可能になります。')
    } else {
      if (winRate < 50 && closedPositions >= 5) {
        suggestions.push('勝率が50%未満です。エントリータイミングや銘柄選定を見直すことをお勧めします。')
      }
      if (averageLoss > averageProfit * 1.5 && averageProfit > 0) {
        suggestions.push('平均損失が平均利益の1.5倍を超えています。損切りルールの徹底を検討してください。')
      }
      if (losingTrades > winningTrades * 2 && closedPositions >= 5) {
        suggestions.push('損失取引が勝利取引の2倍以上です。取引頻度や戦略の見直しをお勧めします。')
      }
      if (totalTrades < 10) {
        suggestions.push('取引数が少ないため、より多くのデータで分析することをお勧めします。')
      }
      if (netPnL < 0) {
        suggestions.push('現在の取引で損失が出ています。リスク管理と取引計画の見直しを検討してください。')
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push('取引パフォーマンスは良好です。現在の戦略を継続してください。')
    }

    return {
      totalTrades,
      buyTrades,
      sellTrades,
      winningTrades,
      losingTrades,
      breakEvenTrades,
      winRate,
      totalProfit,
      totalLoss,
      netPnL,
      averageProfit,
      averageLoss,
      largestWin,
      largestLoss,
      mostTradedSymbol,
      mostTradedSymbolCount,
      recentPerformance,
      recentTradesCount: recentTrades.length,
      recentNetPnL,
      suggestions,
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📊</span>
          取引分析
        </h3>
        <p className="text-gray-400 text-sm">取引履歴がありません。取引を開始すると分析結果が表示されます。</p>
      </div>
    )
  }

  const formatCurrency = (value: number): string => {
    if (value >= 0) {
      return `+¥${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `¥${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span>
        取引分析・振り返り
      </h3>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">総取引数</p>
            <p className="text-white text-xl font-bold">{analysis.totalTrades}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">勝率</p>
            <p className={`text-xl font-bold ${analysis.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {analysis.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">純損益</p>
            <p className={`text-xl font-bold ${analysis.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(analysis.netPnL)}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">最大利益</p>
            <p className="text-green-400 text-xl font-bold">
              {formatCurrency(analysis.largestWin)}
            </p>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-gray-300 text-sm font-medium mb-3">取引内訳</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">買い取引</span>
                <span className="text-white font-semibold">{analysis.buyTrades}件</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">売り取引</span>
                <span className="text-white font-semibold">{analysis.sellTrades}件</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400 text-sm">勝利取引</span>
                <span className="text-green-400 font-semibold">{analysis.winningTrades}件</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400 text-sm">損失取引</span>
                <span className="text-red-400 font-semibold">{analysis.losingTrades}件</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-gray-300 text-sm font-medium mb-3">損益分析</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">総利益</span>
                <span className="text-green-400 font-semibold">{formatCurrency(analysis.totalProfit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">総損失</span>
                <span className="text-red-400 font-semibold">{formatCurrency(analysis.totalLoss)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">平均利益</span>
                <span className="text-green-400 font-semibold">{formatCurrency(analysis.averageProfit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">平均損失</span>
                <span className="text-red-400 font-semibold">{formatCurrency(analysis.averageLoss)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h4 className="text-gray-300 text-sm font-medium mb-3">取引傾向</h4>
          <div className="space-y-2">
            {analysis.mostTradedSymbol && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">最も取引した銘柄</span>
                <span className="text-white font-semibold">
                  {analysis.mostTradedSymbol} ({analysis.mostTradedSymbolCount}回)
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">最近のパフォーマンス</span>
              <span className={`font-semibold ${
                analysis.recentPerformance === 'positive' ? 'text-green-400' :
                analysis.recentPerformance === 'negative' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {analysis.recentPerformance === 'positive' ? '良好' :
                 analysis.recentPerformance === 'negative' ? '要改善' : '中立'}
              </span>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h4 className="text-blue-300 text-sm font-medium mb-3 flex items-center gap-2">
            <span>💡</span>
            改善提案
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="text-blue-200 text-sm flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning if losing */}
        {analysis.netPnL < 0 && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <h4 className="text-red-300 text-sm font-medium mb-2 flex items-center gap-2">
              <span>⚠️</span>
              注意事項
            </h4>
            <p className="text-red-200 text-sm">
              現在の取引で損失が出ています。リスク管理を見直し、無理な取引を避けることをお勧めします。
              投資は自己責任で行ってください。
            </p>
          </div>
        )}

        {/* AI Summary Section */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-purple-300 text-sm font-medium flex items-center gap-2">
              <span>🤖</span>
              AI要約
            </h4>
            {!aiSummary && (
              <button
                onClick={loadAISummary}
                disabled={loadingSummary}
                className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSummary ? '生成中...' : '要約を生成'}
              </button>
            )}
          </div>
          {loadingSummary ? (
            <div className="flex items-center gap-2 text-purple-200 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
              <span>AI要約を生成中...</span>
            </div>
          ) : aiSummary ? (
            <div className="text-purple-100 text-sm whitespace-pre-line leading-relaxed">
              {aiSummary}
            </div>
          ) : (
            <p className="text-purple-300 text-sm">
              ボタンをクリックして、取引履歴のAI要約を生成できます。
            </p>
          )}
        </div>

        {/* Hypothesis Check Section */}
        <div className="bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-cyan-300 text-sm font-medium flex items-center gap-2">
              <span>🔍</span>
              仮説チェック
            </h4>
            <button
              onClick={() => {
                setShowHypothesisCheck(!showHypothesisCheck)
                if (showHypothesisCheck) {
                  setHypothesis('')
                  setHypothesisResult(null)
                }
              }}
              className="px-3 py-1.5 bg-cyan-600 text-white text-xs rounded-lg hover:bg-cyan-700 transition-colors"
            >
              {showHypothesisCheck ? '閉じる' : '開く'}
            </button>
          </div>

          {showHypothesisCheck && (
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-cyan-200 text-xs mb-2">
                  仮説を入力してください（例：「AAPLは朝に買うと利益が出やすい」「MSFTは午後に取引すると勝率が高い」）
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !loadingHypothesis) {
                        checkHypothesis()
                      }
                    }}
                    placeholder="例: AAPLは朝に買うと利益が出やすい"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={checkHypothesis}
                    disabled={!hypothesis.trim() || loadingHypothesis}
                    className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingHypothesis ? '検証中...' : '検証'}
                  </button>
                </div>
              </div>

              {loadingHypothesis && (
                <div className="flex items-center gap-2 text-cyan-200 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                  <span>仮説を検証中...</span>
                </div>
              )}

              {hypothesisResult && (
                <div className={`rounded-lg p-4 border ${
                  hypothesisResult.supported
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-lg ${
                      hypothesisResult.supported ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {hypothesisResult.supported ? '✓' : '✗'}
                    </span>
                    <span className={`text-sm font-semibold ${
                      hypothesisResult.supported ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {hypothesisResult.supported ? '仮説は支持されます' : '仮説は支持されません'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      hypothesisResult.supported
                        ? 'bg-green-800/50 text-green-200'
                        : 'bg-red-800/50 text-red-200'
                    }`}>
                      信頼度: {hypothesisResult.confidence.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-white text-sm mb-2">{hypothesisResult.evidence}</p>
                  <p className="text-gray-300 text-xs">{hypothesisResult.details}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

