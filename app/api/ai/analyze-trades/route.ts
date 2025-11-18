import { NextRequest, NextResponse } from 'next/server'
import { getStorageAdapter } from '../../../lib/storage/localStorageAdapter'
import { Trade } from '../../../lib/schema'

/**
 * AI Trade Analysis API Route
 * Analyzes trade history and generates AI-powered insights
 */

interface AnalyzeRequest {
  trades: Trade[]
  analysisType: 'summary' | 'hypothesis'
  hypothesis?: string // For hypothesis checking
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()
    const { trades, analysisType, hypothesis } = body

    if (!trades || trades.length === 0) {
      return NextResponse.json(
        { error: '取引履歴がありません' },
        { status: 400 }
      )
    }

    // Filter filled trades
    const filledTrades = trades.filter(
      t => t.status === 'FILLED' && t.averageFillPrice && t.filledQuantity
    )

    if (filledTrades.length === 0) {
      return NextResponse.json(
        { error: '約定した取引がありません' },
        { status: 400 }
      )
    }

    if (analysisType === 'summary') {
      const summary = generateAISummary(filledTrades)
      return NextResponse.json({ summary })
    } else if (analysisType === 'hypothesis' && hypothesis) {
      const result = checkHypothesis(filledTrades, hypothesis)
      return NextResponse.json({ result })
    } else {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: '分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * Generate AI-powered summary of trades
 * In a production environment, this would call an actual AI API (OpenAI, Anthropic, etc.)
 */
function generateAISummary(trades: Trade[]): string {
  // Calculate key metrics
  const totalTrades = trades.length
  const buyTrades = trades.filter(t => t.side === 'BUY').length
  const sellTrades = trades.filter(t => t.side === 'SELL').length

  // Group by symbol
  const symbolGroups = new Map<string, Trade[]>()
  trades.forEach(trade => {
    if (!symbolGroups.has(trade.symbol)) {
      symbolGroups.set(trade.symbol, [])
    }
    symbolGroups.get(trade.symbol)!.push(trade)
  })

  // Calculate P&L per symbol
  const symbolPnLs: Array<{ symbol: string; pnl: number; trades: number }> = []
  symbolGroups.forEach((symbolTrades, symbol) => {
    const sorted = symbolTrades.sort(
      (a, b) =>
        new Date(a.filledAt || a.createdAt).getTime() -
        new Date(b.filledAt || b.createdAt).getTime()
    )

    let position = 0
    let averageCost = 0
    let totalPnL = 0

    sorted.forEach(trade => {
      const price = trade.averageFillPrice || trade.price || 0
      const quantity = trade.filledQuantity || trade.quantity || 0

      if (trade.side === 'BUY') {
        if (position === 0) {
          averageCost = price
          position = quantity
        } else {
          averageCost =
            (averageCost * position + price * quantity) / (position + quantity)
          position += quantity
        }
      } else if (trade.side === 'SELL' && position > 0) {
        const sellQuantity = Math.min(quantity, position)
        const pnl = (price - averageCost) * sellQuantity
        totalPnL += pnl
        position -= sellQuantity
        if (position === 0) {
          averageCost = 0
        }
      }
    })

    symbolPnLs.push({
      symbol,
      pnl: totalPnL,
      trades: symbolTrades.length,
    })
  })

  // Sort by P&L
  symbolPnLs.sort((a, b) => b.pnl - a.pnl)

  // Analyze time patterns
  const hourGroups = new Map<number, number>()
  trades.forEach(trade => {
    const date = new Date(trade.filledAt || trade.createdAt)
    const hour = date.getHours()
    hourGroups.set(hour, (hourGroups.get(hour) || 0) + 1)
  })

  const mostActiveHour = Array.from(hourGroups.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0]

  // Generate summary
  const bestPerformer = symbolPnLs[0]
  const worstPerformer = symbolPnLs[symbolPnLs.length - 1]

  let summary = `## 取引履歴のAI分析\n\n`
  summary += `**総取引数**: ${totalTrades}件（買い: ${buyTrades}件、売り: ${sellTrades}件）\n\n`

  if (symbolPnLs.length > 0) {
    summary += `**銘柄別パフォーマンス**:\n`
    if (bestPerformer && bestPerformer.pnl > 0) {
      summary += `- 最も利益が出た銘柄: ${bestPerformer.symbol}（¥${bestPerformer.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）\n`
    }
    if (worstPerformer && worstPerformer.pnl < 0) {
      summary += `- 最も損失が出た銘柄: ${worstPerformer.symbol}（¥${worstPerformer.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）\n`
    }
    summary += `\n`
  }

  if (mostActiveHour !== undefined) {
    summary += `**取引時間の傾向**: 最も活発な時間帯は${mostActiveHour}時台です。\n\n`
  }

  // Add insights
  const totalPnL = symbolPnLs.reduce((sum, s) => sum + s.pnl, 0)
  if (totalPnL > 0) {
    summary += `**総合評価**: 現在の取引は利益が出ています。特に${bestPerformer?.symbol || '特定の銘柄'}での取引が良好なパフォーマンスを示しています。\n\n`
  } else if (totalPnL < 0) {
    summary += `**総合評価**: 現在の取引で損失が出ています。リスク管理と取引戦略の見直しを検討してください。特に${worstPerformer?.symbol || '特定の銘柄'}での取引パターンを分析することをお勧めします。\n\n`
  } else {
    summary += `**総合評価**: 取引はほぼ損益トントンです。より多くのデータを蓄積して分析を続けることをお勧めします。\n\n`
  }

  summary += `**推奨事項**:\n`
  if (symbolPnLs.length > 3) {
    summary += `- 複数の銘柄に分散投資できています。\n`
  } else {
    summary += `- より多くの銘柄に分散投資することでリスクを軽減できます。\n`
  }

  if (buyTrades > sellTrades * 2) {
    summary += `- 買い取引が売り取引の2倍以上です。利益確定のタイミングを見直すことを検討してください。\n`
  }

  return summary
}

/**
 * Check if a hypothesis is supported by trade data
 */
function checkHypothesis(trades: Trade[], hypothesis: string): {
  supported: boolean
  confidence: number
  evidence: string
  details: string
} {
  const hypothesisLower = hypothesis.toLowerCase()

  // Extract key elements from hypothesis
  const symbolMatch = hypothesis.match(/([A-Z0-9.]+)/i)
  const symbol = symbolMatch ? symbolMatch[1] : null

  const timeMatch = hypothesis.match(/(朝|午前|午後|夜|(\d+)時)/)
  const timeKeyword = timeMatch ? timeMatch[0] : null

  const actionMatch = hypothesis.match(/(買|売|購入|売却)/)
  const action = actionMatch ? actionMatch[0] : null

  // Filter trades by symbol if specified
  let relevantTrades = trades
  if (symbol) {
    relevantTrades = trades.filter(t => t.symbol.toUpperCase() === symbol.toUpperCase())
  }

  if (relevantTrades.length === 0) {
    return {
      supported: false,
      confidence: 0,
      evidence: '該当する取引データがありません',
      details: `仮説「${hypothesis}」を検証するための取引データが見つかりませんでした。`,
    }
  }

  // Analyze time-based hypothesis
  if (timeKeyword) {
    const hourRanges: { [key: string]: number[] } = {
      朝: [6, 7, 8, 9, 10, 11],
      午前: [9, 10, 11, 12],
      午後: [13, 14, 15, 16, 17],
      夜: [18, 19, 20, 21, 22, 23],
    }

    let targetHours: number[] = []
    if (hourRanges[timeKeyword]) {
      targetHours = hourRanges[timeKeyword]
    } else {
      const hourMatch = timeKeyword.match(/(\d+)時/)
      if (hourMatch) {
        targetHours = [parseInt(hourMatch[1])]
      }
    }

    if (targetHours.length > 0) {
      const tradesInTimeRange = relevantTrades.filter(trade => {
        const date = new Date(trade.filledAt || trade.createdAt)
        return targetHours.includes(date.getHours())
      })

      const tradesOutsideTimeRange = relevantTrades.filter(trade => {
        const date = new Date(trade.filledAt || trade.createdAt)
        return !targetHours.includes(date.getHours())
      })

      // Calculate P&L for each group
      const pnlInRange = calculatePnLForTrades(tradesInTimeRange)
      const pnlOutsideRange = calculatePnLForTrades(tradesOutsideTimeRange)

      const supported = pnlInRange > pnlOutsideRange
      const confidence = Math.min(
        90,
        Math.max(
          10,
          (tradesInTimeRange.length / relevantTrades.length) * 100
        )
      )

      let evidence = ''
      if (supported) {
        evidence = `${timeKeyword}の取引の平均損益（¥${pnlInRange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）は、他の時間帯（¥${pnlOutsideRange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）よりも良好です。`
      } else {
        evidence = `${timeKeyword}の取引の平均損益（¥${pnlInRange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）は、他の時間帯（¥${pnlOutsideRange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）と比較して劣っています。`
      }

      return {
        supported,
        confidence,
        evidence,
        details: `時間帯別分析: ${timeKeyword}の取引は${tradesInTimeRange.length}件、その他の時間帯は${tradesOutsideTimeRange.length}件です。`,
      }
    }
  }

  // Analyze symbol-specific hypothesis
  if (symbol) {
    const symbolTrades = relevantTrades
    const pnl = calculatePnLForTrades(symbolTrades)
    const supported = pnl > 0
    const confidence = Math.min(90, Math.max(10, (symbolTrades.length / 5) * 100))

    return {
      supported,
      confidence,
      evidence: `${symbol}の取引の総損益は¥${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}です。`,
      details: `${symbol}に関する取引は${symbolTrades.length}件あります。`,
    }
  }

  // Default: analyze overall pattern
  const pnl = calculatePnLForTrades(relevantTrades)
  return {
    supported: pnl > 0,
    confidence: 50,
    evidence: `総損益は¥${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}です。`,
    details: `仮説を検証するには、より具体的な条件（銘柄、時間帯など）を指定してください。`,
  }
}

/**
 * Calculate P&L for a set of trades
 */
function calculatePnLForTrades(trades: Trade[]): number {
  const sorted = trades.sort(
    (a, b) =>
      new Date(a.filledAt || a.createdAt).getTime() -
      new Date(b.filledAt || b.createdAt).getTime()
  )

  let position = 0
  let averageCost = 0
  let totalPnL = 0

  sorted.forEach(trade => {
    const price = trade.averageFillPrice || trade.price || 0
    const quantity = trade.filledQuantity || trade.quantity || 0

    if (trade.side === 'BUY') {
      if (position === 0) {
        averageCost = price
        position = quantity
      } else {
        averageCost =
          (averageCost * position + price * quantity) / (position + quantity)
        position += quantity
      }
    } else if (trade.side === 'SELL' && position > 0) {
      const sellQuantity = Math.min(quantity, position)
      const pnl = (price - averageCost) * sellQuantity
      totalPnL += pnl
      position -= sellQuantity
      if (position === 0) {
        averageCost = 0
      }
    }
  })

  // If no closed positions, return average per trade
  if (totalPnL === 0 && trades.length > 0) {
    return 0 // Can't calculate P&L without closed positions
  }

  return totalPnL
}

