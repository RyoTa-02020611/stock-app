'use client'

import { useState, useEffect } from 'react'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import Watchlist, { StockItem } from '../components/dashboard/Watchlist'
import TodaysMovers from '../components/dashboard/TodaysMovers'
import StockChart from '../components/dashboard/StockChart'
import TodayFocusCards from '../components/dashboard/TodayFocusCards'
import PortfolioPurposeSection from '../components/dashboard/PortfolioPurposeSection'
import TodayHighlights from '../components/dashboard/TodayHighlights'
import DailyPerformance from '../components/dashboard/DailyPerformance'
import SectorPerformanceChart from '../components/dashboard/SectorPerformanceChart'
import ImpactAnalysisDashboard from '../components/dashboard/ImpactAnalysisDashboard'
import AutoAlertPanel from '../components/dashboard/AutoAlertPanel'
import PortfolioImpactView from '../components/dashboard/PortfolioImpactView'
import RealtimePriceUpdater from '../components/dashboard/RealtimePriceUpdater'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL')
  const [watchlist, setWatchlist] = useState<StockItem[]>([])

  const handleSelectSymbol = (symbol: string) => {
    if (symbol) {
      setSelectedSymbol(symbol)
      router.push(`/stocks/${symbol}`)
    }
  }

  const handleAddToWatchlist = (stock: StockItem) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist([...watchlist, stock])
    }
  }

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s.symbol !== symbol))
  }

  return (
    <div className="p-6">
      <RealtimePriceUpdater />
      <div className="max-w-7xl mx-auto">
        {/* 今日見るべき3つだけ */}
        <TodayHighlights />

        {/* 自動アラート */}
        <div className="mb-6">
          <AutoAlertPanel />
        </div>

        {/* ポートフォリオサマリー */}
        <div className="mb-6">
          <PortfolioSummary />
        </div>

        {/* 今日の全体騰落率とセクター別パフォーマンス */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DailyPerformance />
          <SectorPerformanceChart />
        </div>

        {/* ポートフォリオ影響分析 */}
        <div className="mb-6">
          <PortfolioImpactView />
        </div>

        {/* 統合影響分析ダッシュボード */}
        <div className="mb-6">
          <ImpactAnalysisDashboard />
        </div>

        {/* その他のセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Watchlist 
            stocks={watchlist}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSelectSymbol}
            onRemoveStock={handleRemoveFromWatchlist}
          />
          <div>
            <TodaysMovers onSelectSymbol={handleSelectSymbol} />
          </div>
        </div>

        {/* 目的別ポートフォリオ */}
        <div className="mb-6">
          <PortfolioPurposeSection />
        </div>
      </div>
    </div>
  )
}
