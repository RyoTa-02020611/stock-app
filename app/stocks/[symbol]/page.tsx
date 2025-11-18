'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StockOverviewSection from '../../components/stocks/StockOverviewSection'
import StockChartSection from '../../components/stocks/StockChartSection'
import StockNewsSection from '../../components/stocks/StockNewsSection'
import StockFinancialsSection from '../../components/stocks/StockFinancialsSection'
import StockAnalysisSection from '../../components/stocks/StockAnalysisSection'
import StockOrderSection from '../../components/stocks/StockOrderSection'
import StockNotesSection from '../../components/stocks/StockNotesSection'
import StockAttachmentsSection from '../../components/stocks/StockAttachmentsSection'
import StockCustomMetricsSection from '../../components/stocks/StockCustomMetricsSection'
import StockAlertsSection from '../../components/stocks/StockAlertsSection'
import StockJournalTimelineSection from '../../components/stocks/StockJournalTimelineSection'
import StockHypothesisTracker from '../../components/stocks/StockHypothesisTracker'
import PriceImpactPanel from '../../components/stocks/PriceImpactPanel'
import PredictionChart from '../../components/stocks/PredictionChart'
import ImpactScoreCard from '../../components/stocks/ImpactScoreCard'
import StockImpactTimeline from '../../components/stocks/StockImpactTimeline'

type TabType = 'overview' | 'chart' | 'news' | 'financials' | 'analysis' | 'order' | 'notes' | 'attachments' | 'metrics' | 'alerts' | 'journal' | 'hypothesis' | 'impact' | 'prediction'

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = (params?.symbol as string) || ''
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stockData, setStockData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) {
      router.push('/')
      return
    }

    // Fetch stock overview data
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/overview`)
        if (response.ok) {
          const data = await response.json()
          setStockData(data)
        }
      } catch (error) {
        console.error('Error fetching stock data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [symbol, router])

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: '概要', icon: '📊' },
    { id: 'chart', label: 'チャート', icon: '📈' },
    { id: 'news', label: 'ニュース', icon: '📰' },
    { id: 'financials', label: '財務', icon: '💰' },
    { id: 'analysis', label: '指標・分析', icon: '🔍' },
    { id: 'impact', label: '影響分析', icon: '⚡' },
    { id: 'prediction', label: '価格予測', icon: '🔮' },
    { id: 'order', label: '注文', icon: '📝' },
    { id: 'notes', label: 'メモ', icon: '📋' },
    { id: 'attachments', label: 'ファイル・リンク', icon: '📎' },
    { id: 'metrics', label: '指標ビュー', icon: '📊' },
    { id: 'alerts', label: 'アラート', icon: '🔔' },
    { id: 'journal', label: '投資日記', icon: '📔' },
    { id: 'hypothesis', label: '投資仮説', icon: '💡' },
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stock Header */}
        {stockData && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-white text-3xl font-bold mb-2">
                  {stockData.name || symbol}
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-gray-400 text-lg">{symbol}</p>
                  {stockData.quote && (
                    <>
                      <span className="text-gray-500">•</span>
                      <p className="text-gray-400 text-sm">{stockData.quote.exchange}</p>
                    </>
                  )}
                </div>
              </div>
              {stockData.quote && (
                <div className="text-right">
                  <p className="text-white text-3xl font-bold mb-1">
                    {stockData.quote.currency === 'JPY' ? '¥' : '$'}{stockData.quote.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <div className={`flex items-center gap-2 ${stockData.quote.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="text-lg font-semibold">
                      {stockData.quote.change >= 0 ? '+' : ''}{stockData.quote.change.toFixed(2)}
                    </span>
                    <span className="text-sm">
                      ({stockData.quote.change >= 0 ? '+' : ''}{stockData.quote.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    出来高: {stockData.quote.volume.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg mb-6">
          <div className="flex overflow-x-auto border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <StockOverviewSection symbol={symbol} />}
            {activeTab === 'chart' && <StockChartSection symbol={symbol} />}
            {activeTab === 'news' && <StockNewsSection symbol={symbol} />}
            {activeTab === 'financials' && <StockFinancialsSection symbol={symbol} />}
            {activeTab === 'analysis' && <StockAnalysisSection symbol={symbol} />}
            {activeTab === 'order' && <StockOrderSection symbol={symbol} />}
            {activeTab === 'notes' && <StockNotesSection symbol={symbol} />}
            {activeTab === 'attachments' && <StockAttachmentsSection symbol={symbol} />}
            {activeTab === 'metrics' && (
              <StockCustomMetricsSection 
                symbol={symbol} 
                financialData={stockData}
              />
            )}
            {activeTab === 'alerts' && <StockAlertsSection symbol={symbol} />}
            {activeTab === 'journal' && <StockJournalTimelineSection symbol={symbol} />}
            {activeTab === 'hypothesis' && <StockHypothesisTracker symbol={symbol} />}
            {activeTab === 'impact' && stockData?.quote && (
              <div className="space-y-6">
                <ImpactScoreCard symbol={symbol} currentPrice={stockData.quote.price} />
                <PriceImpactPanel symbol={symbol} currentPrice={stockData.quote.price} />
                <StockImpactTimeline symbol={symbol} />
              </div>
            )}
            {activeTab === 'prediction' && stockData?.quote && (
              <div className="space-y-6">
                <PredictionChart symbol={symbol} currentPrice={stockData.quote.price} />
                <PriceImpactPanel symbol={symbol} currentPrice={stockData.quote.price} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

