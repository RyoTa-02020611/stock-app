'use client'

import { useEffect, useState } from 'react'

interface StockAnalysisSectionProps {
  symbol: string
}

export default function StockAnalysisSection({ symbol }: StockAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true)
      try {
        // Fetch multiple data sources for analysis
        const [overviewRes, financialsRes, newsRes, chartRes] = await Promise.all([
          fetch(`/api/stocks/${encodeURIComponent(symbol)}/overview`),
          fetch(`/api/stocks/${encodeURIComponent(symbol)}/financials`),
          fetch(`/api/stocks/${encodeURIComponent(symbol)}/news?limit=10`),
          fetch(`/api/stocks/${encodeURIComponent(symbol)}/chart?range=3mo`),
        ])

        const overview = overviewRes.ok ? await overviewRes.json() : null
        const financials = financialsRes.ok ? await financialsRes.json() : null
        const news = newsRes.ok ? await newsRes.json() : null
        const chart = chartRes.ok ? await chartRes.json() : null

        // Generate analysis
        const observations: string[] = []
        let impactSummary = ''

        // Price trend analysis
        if (chart?.data && chart.data.length >= 2) {
          const firstPrice = chart.data[0].close
          const lastPrice = chart.data[chart.data.length - 1].close
          const trendPercent = ((lastPrice - firstPrice) / firstPrice) * 100

          if (trendPercent > 5) {
            observations.push(`直近3ヶ月で株価は上昇傾向（約 +${trendPercent.toFixed(1)}%）です。`)
          } else if (trendPercent < -5) {
            observations.push(`直近3ヶ月で株価は下落傾向（約 ${trendPercent.toFixed(1)}%）です。`)
          } else {
            observations.push(`直近3ヶ月の株価は横ばい推移（変動幅: ${Math.abs(trendPercent).toFixed(1)}%）となっています。`)
          }
        }

        // Financial metrics analysis
        if (financials?.metrics) {
          const peRatio = financials.metrics.find((m: any) => m.label.includes('PER'))
          if (peRatio) {
            const peValue = typeof peRatio.value === 'number' ? peRatio.value : parseFloat(peRatio.value)
            if (peValue > 30) {
              observations.push(`PER（${peValue.toFixed(2)}）は同業平均と比べてやや高めです。市場の期待値が高い可能性があります。`)
            } else if (peValue < 15) {
              observations.push(`PER（${peValue.toFixed(2)}）は同業平均と比べて低めです。割安感がある可能性があります。`)
            }
          }

          const pbrRatio = financials.metrics.find((m: any) => m.label.includes('PBR'))
          if (pbrRatio) {
            const pbrValue = typeof pbrRatio.value === 'number' ? pbrRatio.value : parseFloat(pbrRatio.value)
            if (pbrValue > 2) {
              observations.push(`PBR（${pbrValue.toFixed(2)}）は高めです。`)
            } else if (pbrValue < 1) {
              observations.push(`PBR（${pbrValue.toFixed(2)}）は1倍を下回っており、割安感がある可能性があります。`)
            }
          }
        }

        // News sentiment analysis
        if (news?.news && news.news.length > 0) {
          const positiveCount = news.news.filter((n: any) => n.sentiment === 'positive').length
          const negativeCount = news.news.filter((n: any) => n.sentiment === 'negative').length
          const neutralCount = news.news.length - positiveCount - negativeCount

          if (positiveCount > negativeCount) {
            observations.push(`最近のニュース見出しではポジティブなトピックが${positiveCount}件、ネガティブが${negativeCount}件あります。好材料が優勢です。`)
          } else if (negativeCount > positiveCount) {
            observations.push(`最近のニュース見出しではネガティブなトピックが${negativeCount}件、ポジティブが${positiveCount}件あります。懸念材料が目立ちます。`)
          } else {
            observations.push(`最近のニュース見出しではポジティブが${positiveCount}件、ネガティブが${negativeCount}件、中立が${neutralCount}件あります。`)
          }
        }

        // Generate impact summary
        if (chart?.data && chart.data.length > 0) {
          const firstPrice = chart.data[0].close
          const lastPrice = chart.data[chart.data.length - 1].close
          const trendPercent = ((lastPrice - firstPrice) / firstPrice) * 100

          if (trendPercent > 5 && news?.news && news.news.filter((n: any) => n.sentiment === 'positive').length > 0) {
            impactSummary = `現在の上昇トレンドと好材料のニュースが相まって、短期的には市場の楽観的な見方が継続する可能性があります。ただし、大幅な上昇後の調整圧力も意識されるため、今後の動向には注意が必要です。中長期的には、業績の実績や市場環境の変化が価格に反映されると解釈できる可能性があります。`
          } else if (trendPercent < -5 && news?.news && news.news.filter((n: any) => n.sentiment === 'negative').length > 0) {
            impactSummary = `現在の下落トレンドと懸念材料のニュースが重なり、短期的には市場の慎重な見方が続く可能性があります。根本的な懸念材料が解決されない限り、下落傾向が継続するリスクも意識されます。一方で、過度な下落は反発の機会を生む可能性もあるため、今後のニュースや業績発表に注目が必要です。`
          } else {
            impactSummary = `現在の価格水準とニュースのバランスから見ると、短期的には現状維持の可能性が高いと解釈できます。ただし、市場環境や業績発表などの外部要因により、価格が大きく動く可能性もあります。継続的な情報収集と市場動向の監視を推奨します。`
          }
        } else {
          impactSummary = `データが不足しているため、詳細な分析ができませんでした。継続的な情報収集と市場動向の監視を推奨します。`
        }

        setAnalysis({
          observations: observations.length > 0 ? observations : ['データ分析中...'],
          impactSummary,
        })
      } catch (error) {
        console.error('Error generating analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [symbol])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-700 rounded"></div>
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">分析データを取得できませんでした</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Observations */}
      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-4">分析結果</h3>
        <ul className="space-y-3">
          {analysis.observations.map((obs: string, index: number) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">•</span>
              <p className="text-gray-300 text-sm flex-1 leading-relaxed">{obs}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Impact Summary */}
      {analysis.impactSummary && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium mb-3">今後の株価への影響の可能性</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.impactSummary}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-700/30 rounded-lg p-4 border-l-4 border-yellow-500">
        <p className="text-gray-400 text-xs leading-relaxed">
          ※この分析は自動生成された参考情報であり、将来の株価を保証するものではありません。投資判断はご自身の責任で行ってください。
        </p>
      </div>
    </div>
  )
}

