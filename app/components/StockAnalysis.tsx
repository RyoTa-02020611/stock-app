'use client'

import { useState, useEffect } from 'react'

interface Stock {
  id: string
  symbol: string
  name: string
  purchaseDate: string
  purchasePrice: number
  quantity: number
  memo: string
  createdAt: string
}

interface StockAnalysisProps {
  stock: Stock
  onTrade?: (stock: Stock, type: 'buy' | 'sell') => void
}

interface NewsItem {
  title: string
  link: string
  pubDate: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  impactScore?: number
  category?: string
  keywords?: string[]
  impactDescription?: string
}

interface StockInfo {
  currentPrice?: number
  change?: number
  changePercent?: number
  news?: NewsItem[]
  analysis?: {
    purchaseTotal: number
    currentTotal: number
    profit: number
    profitPercent: number
    recommendation: string
  }
  futureImpact?: {
    sentiment: 'positive' | 'negative' | 'neutral'
    impact: string
    confidence: number
    factors: string[]
    shortTerm?: string
    mediumTerm?: string
    riskFactors?: string[]
    opportunityFactors?: string[]
  }
}

export default function StockAnalysis({ stock, onTrade }: StockAnalysisProps) {
  const [stockInfo, setStockInfo] = useState<StockInfo>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStockData()
  }, [stock.symbol])

  const fetchStockData = async () => {
    setLoading(true)
    try {
      const symbol = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.T`
      
      // 株価情報取得
      const priceResponse = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
      )
      
      let currentPrice = stock.purchasePrice
      let change = 0
      let changePercent = 0
      let priceHistory: number[] = []

      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        const result = priceData.chart?.result?.[0]
        if (result) {
          const meta = result.meta
          const previousClose = meta.previousClose || stock.purchasePrice
          currentPrice = meta.regularMarketPrice || meta.previousClose || stock.purchasePrice
          change = currentPrice - previousClose
          changePercent = (change / previousClose) * 100

          // 価格履歴を取得（5日間）
          const timestamps = result.timestamp || []
          const closes = result.indicators?.quote?.[0]?.close || []
          if (timestamps.length > 0 && closes.length > 0) {
            priceHistory = closes.filter((p: number) => p !== null).slice(-5)
          }

          setStockInfo(prev => ({
            ...prev,
            currentPrice,
            change,
            changePercent,
          }))
        }
      }

      // ニュース取得と詳細分析
      let rawNews: Array<{ title: string; link: string; pubDate: string }> = []
      try {
        const newsResponse = await fetch(
          `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=JP&lang=ja-JP`
        )
        if (newsResponse.ok) {
          const newsText = await newsResponse.text()
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(newsText, 'text/xml')
          const items = xmlDoc.querySelectorAll('item')
          
          rawNews = Array.from(items).slice(0, 15).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            link: item.querySelector('link')?.textContent || '',
            pubDate: item.querySelector('pubDate')?.textContent || '',
          }))
        }
      } catch (error) {
        console.error('ニュース取得エラー:', error)
      }

      // 各ニュースを詳細分析
      const analyzedNews = rawNews.map(newsItem => analyzeNewsItem(newsItem, stock.name, currentPrice))

      // 分析と将来予測を生成（ニュース情報を統合）
      const analysis = generateAnalysis(stock, currentPrice)
      const futureImpact = analyzeFutureImpact(analyzedNews, stock, currentPrice, changePercent, priceHistory)

      setStockInfo(prev => ({
        ...prev,
        news: analyzedNews,
        analysis,
        futureImpact,
      }))

    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAnalysis = (stock: Stock, currentPrice: number) => {
    const purchaseTotal = stock.purchasePrice * stock.quantity
    const currentTotal = currentPrice * stock.quantity
    const profit = currentTotal - purchaseTotal
    const profitPercent = (profit / purchaseTotal) * 100

    return {
      purchaseTotal,
      currentTotal,
      profit,
      profitPercent,
      recommendation: profitPercent > 10 
        ? '大幅な上昇が見られます。利益確定を検討するタイミングかもしれません。'
        : profitPercent < -10
        ? '下落が続いています。損失の拡大に注意が必要です。'
        : '安定した推移です。継続的な監視を推奨します。'
    }
  }

  // 個別ニュースの詳細分析
  const analyzeNewsItem = (
    newsItem: { title: string; link: string; pubDate: string },
    companyName: string,
    currentPrice: number
  ): NewsItem => {
    const title = newsItem.title.toLowerCase()
    const lowerName = companyName.toLowerCase()

    // 拡張キーワード分析
    const positiveKeywords = [
      '成長', '上昇', '増益', '好調', '拡大', '好材料', '上向き', '改善', '黒字', '利益',
      '増収', '増配', '買い', '推奨', '目標株価引き上げ', '業績上方修正', '新規事業', '技術革新',
      '契約獲得', '出荷増', '売上高', 'V字回復', '過去最高', '好業績'
    ]
    const negativeKeywords = [
      '下落', '減益', '不調', '縮小', '悪材料', '下向き', '悪化', '赤字', '損失', 'リスク',
      '減収', '減配', '売り', '下方修正', '業績悪化', 'リストラ', '撤退', '事故', '不祥事',
      '違反', '訴訟', '倒産', '破綻', 'リコール', '欠陥'
    ]

    // カテゴリ判定
    let category = 'その他'
    if (title.includes('業績') || title.includes('決算') || title.includes('収益')) {
      category = '業績'
    } else if (title.includes('合併') || title.includes('買収') || title.includes('M&A')) {
      category = 'M&A'
    } else if (title.includes('新製品') || title.includes('技術') || title.includes('開発')) {
      category = '技術・製品'
    } else if (title.includes('規制') || title.includes('法改正') || title.includes('政策')) {
      category = '規制・政策'
    } else if (title.includes('取締役') || title.includes('人事') || title.includes('役員')) {
      category = '人事'
    }

    // センチメントスコア計算
    let positiveScore = 0
    let negativeScore = 0
    const foundKeywords: string[] = []

    positiveKeywords.forEach(kw => {
      if (title.includes(kw.toLowerCase())) {
        positiveScore += 2
        foundKeywords.push(kw)
      }
    })

    negativeKeywords.forEach(kw => {
      if (title.includes(kw.toLowerCase())) {
        negativeScore += 2
        foundKeywords.push(kw)
      }
    })

    // 重要キーワードの重み付け
    if (title.includes('大幅') || title.includes('急') || title.includes('劇的')) {
      positiveScore *= 1.5
      negativeScore *= 1.5
    }

    // センチメント判定
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (positiveScore > negativeScore + 1) {
      sentiment = 'positive'
    } else if (negativeScore > positiveScore + 1) {
      sentiment = 'negative'
    }

    // 影響度スコア（0-100）
    const impactScore = Math.min(100, Math.abs(positiveScore - negativeScore) * 10 + 
      (foundKeywords.length > 3 ? 20 : foundKeywords.length * 5))

    // 影響の説明生成
    let impactDescription = ''
    if (sentiment === 'positive') {
      impactDescription = `このニュースは株価に好影響を与える可能性があります。${category}に関する好材料として評価できます。`
    } else if (sentiment === 'negative') {
      impactDescription = `このニュースは株価に悪影響を与える可能性があります。${category}に関する懸念材料として注意が必要です。`
    } else {
      impactDescription = `このニュースの影響は中立的です。${category}に関する情報として継続的に監視を推奨します。`
    }

    return {
      ...newsItem,
      sentiment,
      impactScore,
      category,
      keywords: foundKeywords.slice(0, 5),
      impactDescription,
    }
  }

  // 統合分析（ニュース + 価格動向）
  const analyzeFutureImpact = (
    analyzedNews: NewsItem[],
    stock: Stock,
    currentPrice: number,
    changePercent: number,
    priceHistory: number[]
  ) => {
    // ニュースの集計分析
    const positiveNews = analyzedNews.filter(n => n.sentiment === 'positive')
    const negativeNews = analyzedNews.filter(n => n.sentiment === 'negative')
    const neutralNews = analyzedNews.filter(n => n.sentiment === 'neutral')

    const totalImpactScore = analyzedNews.reduce((sum, n) => sum + (n.impactScore || 0), 0)
    const avgImpactScore = analyzedNews.length > 0 ? totalImpactScore / analyzedNews.length : 0

    // カテゴリ別の影響分析
    const categoryImpact: Record<string, number> = {}
    analyzedNews.forEach(news => {
      if (news.category) {
        categoryImpact[news.category] = (categoryImpact[news.category] || 0) + (news.impactScore || 0)
      }
    })

    const topCategory = Object.entries(categoryImpact)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '不明'

    // テクニカル分析
    let technicalTrend = '横ばい'
    let technicalStrength = 0
    if (priceHistory.length >= 3) {
      const recent = priceHistory.slice(-3)
      const trend = recent[recent.length - 1] - recent[0]
      const trendPercent = (trend / recent[0]) * 100
      
      if (trendPercent > 2) {
        technicalTrend = '上昇傾向'
        technicalStrength = Math.min(100, trendPercent * 10)
      } else if (trendPercent < -2) {
        technicalTrend = '下落傾向'
        technicalStrength = Math.min(100, Math.abs(trendPercent) * 10)
      }
    }

    // 統合センチメント判定
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    let confidence = 50

    // ニュースセンチメントと価格動向の整合性チェック
    const newsScore = (positiveNews.length - negativeNews.length) * 10
    const priceScore = changePercent * 5

    if (newsScore + priceScore > 15) {
      sentiment = 'positive'
      confidence = Math.min(85, 50 + (newsScore + priceScore) / 2)
    } else if (newsScore + priceScore < -15) {
      sentiment = 'negative'
      confidence = Math.min(85, 50 + Math.abs(newsScore + priceScore) / 2)
    } else {
      sentiment = 'neutral'
      confidence = 60
    }

    // リスク要因と機会要因
    const riskFactors: string[] = []
    const opportunityFactors: string[] = []

    negativeNews.slice(0, 3).forEach(news => {
      if (news.impactScore && news.impactScore > 50) {
        riskFactors.push(`${news.category}: ${news.title.slice(0, 30)}...`)
      }
    })

    positiveNews.slice(0, 3).forEach(news => {
      if (news.impactScore && news.impactScore > 50) {
        opportunityFactors.push(`${news.category}: ${news.title.slice(0, 30)}...`)
      }
    })

    // 価格変動を追加要因として
    if (changePercent > 5) {
      riskFactors.push('直近の大幅上昇による調整圧力')
    } else if (changePercent < -5) {
      opportunityFactors.push('直近の大幅下落による反発期待')
    }

    // 短期予測（1-2週間）
    let shortTerm = ''
    if (sentiment === 'positive') {
      shortTerm = `ニュース分析と価格動向から、今後1-2週間で上昇傾向が継続する可能性が${confidence}%あります。特に${topCategory}関連の好材料が影響を与える可能性があります。`
    } else if (sentiment === 'negative') {
      shortTerm = `ニュース分析と価格動向から、今後1-2週間で下落リスクが${confidence}%あります。特に${topCategory}関連の懸念材料に注意が必要です。`
    } else {
      shortTerm = `ニュース分析と価格動向から、今後1-2週間は現状維持の可能性が高いです。継続的な監視を推奨します。`
    }

    // 中期予測（1-3ヶ月）
    let mediumTerm = ''
    const purchasePriceDiff = ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100
    
    if (sentiment === 'positive' && purchasePriceDiff > 0) {
      mediumTerm = `現在の価格は購入価格より${purchasePriceDiff.toFixed(1)}%高い水準です。好材料が継続すれば、さらに上昇の余地があります。`
    } else if (sentiment === 'positive' && purchasePriceDiff < 0) {
      mediumTerm = `現在の価格は購入価格より${Math.abs(purchasePriceDiff).toFixed(1)}%低い水準です。好材料により、購入価格への回復が期待できます。`
    } else if (sentiment === 'negative') {
      mediumTerm = `悪材料が継続する場合、損失拡大のリスクがあります。損切りラインの設定を検討してください。`
    } else {
      mediumTerm = `現状のニュースと価格動向から、中期では横ばい推移の可能性が高いです。`
    }

    // 統合影響説明
    let impact = ''
    if (positiveNews.length > negativeNews.length * 1.5) {
      impact = `ニュース分析では好材料が優勢（${positiveNews.length}件 vs ${negativeNews.length}件）で、平均影響度は${avgImpactScore.toFixed(0)}点です。`
    } else if (negativeNews.length > positiveNews.length * 1.5) {
      impact = `ニュース分析では悪材料が優勢（${negativeNews.length}件 vs ${positiveNews.length}件）で、平均影響度は${avgImpactScore.toFixed(0)}点です。`
    } else {
      impact = `ニュース分析では好悪材料が拮抗（好材料${positiveNews.length}件、悪材料${negativeNews.length}件）しています。`
    }

    impact += ` テクニカル分析では${technicalTrend}を示しており、`
    if (sentiment === 'positive') {
      impact += '今後上昇傾向が見込まれます。'
    } else if (sentiment === 'negative') {
      impact += '今後下落リスクに注意が必要です。'
    } else {
      impact += '現状維持の可能性が高いです。'
    }

    const factors: string[] = []
    if (topCategory !== '不明') {
      factors.push(`主要影響カテゴリ: ${topCategory}`)
    }
    if (technicalTrend !== '横ばい') {
      factors.push(`テクニカル: ${technicalTrend} (強度: ${technicalStrength.toFixed(0)}%)`)
    }
    if (changePercent > 3 || changePercent < -3) {
      factors.push(`価格変動: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`)
    }

    return {
      sentiment,
      impact,
      confidence: Math.round(confidence),
      factors,
      shortTerm,
      mediumTerm,
      riskFactors: riskFactors.slice(0, 3),
      opportunityFactors: opportunityFactors.slice(0, 3),
    }
  }

  const analysis = stockInfo.analysis
  const isProfit = analysis ? analysis.profit >= 0 : false
  const futureImpact = stockInfo.futureImpact

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 sticky top-4 border border-gray-200/50 dark:border-gray-700/50">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {stock.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{stock.symbol}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">データを取得・分析中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 現在価格 */}
          {stockInfo.currentPrice && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">現在価格</span>
                {stockInfo.change !== undefined && (
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      stockInfo.change >= 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {stockInfo.change >= 0 ? '↑' : '↓'} {stockInfo.changePercent !== undefined && 
                      `${stockInfo.changePercent >= 0 ? '+' : ''}${stockInfo.changePercent.toFixed(2)}%`}
                  </span>
                )}
              </div>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                ¥{stockInfo.currentPrice.toLocaleString()}
              </p>
              {stockInfo.change !== undefined && (
                <p className={`text-sm mt-2 font-semibold ${
                  stockInfo.change >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stockInfo.change >= 0 ? '+' : ''}¥{stockInfo.change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* 損益情報 */}
          {analysis && (
            <>
              <div className={`bg-gradient-to-br ${
                isProfit 
                  ? 'from-green-500 to-emerald-600' 
                  : 'from-red-500 to-rose-600'
              } rounded-2xl p-6 text-white shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm opacity-90">評価損益</span>
                  <div className={`w-10 h-10 rounded-full ${
                    isProfit ? 'bg-green-400/30' : 'bg-red-400/30'
                  } flex items-center justify-center`}>
                    {isProfit ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6 6" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-4xl font-extrabold mb-2">
                  {isProfit ? '+' : ''}¥{analysis.profit.toLocaleString()}
                </p>
                <p className="text-lg font-semibold opacity-90">
                  損益率: {isProfit ? '+' : ''}{analysis.profitPercent.toFixed(2)}%
                </p>
              </div>

              {/* 詳細情報 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">購入価格</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ¥{stock.purchasePrice.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">保有株数</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stock.quantity.toLocaleString()}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">株</span>
                  </p>
                </div>
              </div>

              {/* 推奨アクション */}
              <div className={`p-4 rounded-xl border-2 ${
                isProfit 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${
                    isProfit 
                      ? 'bg-green-100 dark:bg-green-900/50' 
                      : 'bg-red-100 dark:bg-red-900/50'
                  } flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {isProfit ? (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${
                      isProfit 
                        ? 'text-green-900 dark:text-green-200' 
                        : 'text-red-900 dark:text-red-200'
                    }`}>
                      アナリスト推奨
                    </p>
                    <p className={`text-xs leading-relaxed ${
                      isProfit 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 今後の株価への影響（統合分析） */}
          {futureImpact && (
            <div className="space-y-4">
              {/* メイン予測 */}
              <div className={`p-4 rounded-xl border-2 ${
                futureImpact.sentiment === 'positive'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : futureImpact.sentiment === 'negative'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full ${
                    futureImpact.sentiment === 'positive'
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : futureImpact.sentiment === 'negative'
                      ? 'bg-orange-100 dark:bg-orange-900/50'
                      : 'bg-gray-100 dark:bg-gray-700'
                  } flex items-center justify-center flex-shrink-0`}>
                    <svg className={`w-5 h-5 ${
                      futureImpact.sentiment === 'positive'
                        ? 'text-blue-600 dark:text-blue-400'
                        : futureImpact.sentiment === 'negative'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold ${
                        futureImpact.sentiment === 'positive'
                          ? 'text-blue-900 dark:text-blue-200'
                          : futureImpact.sentiment === 'negative'
                          ? 'text-orange-900 dark:text-orange-200'
                          : 'text-gray-900 dark:text-gray-200'
                      }`}>
                        統合分析：今後の株価への影響予測
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        futureImpact.sentiment === 'positive'
                          ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                          : futureImpact.sentiment === 'negative'
                          ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        信頼度: {futureImpact.confidence}%
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed mb-3 ${
                      futureImpact.sentiment === 'positive'
                        ? 'text-blue-800 dark:text-blue-300'
                        : futureImpact.sentiment === 'negative'
                        ? 'text-orange-800 dark:text-orange-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {futureImpact.impact}
                    </p>
                    {futureImpact.factors.length > 0 && (
                      <div className="space-y-1 mb-3">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">主要要因:</p>
                        {futureImpact.factors.map((factor, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 flex-1">{factor}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 短期予測 */}
              {futureImpact.shortTerm && (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">短期予測（1-2週間）</p>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {futureImpact.shortTerm}
                  </p>
                </div>
              )}

              {/* 中期予測 */}
              {futureImpact.mediumTerm && (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">中期予測（1-3ヶ月）</p>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {futureImpact.mediumTerm}
                  </p>
                </div>
              )}

              {/* 機会要因 */}
              {futureImpact.opportunityFactors && futureImpact.opportunityFactors.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-xs font-bold text-green-900 dark:text-green-200">機会要因</p>
                  </div>
                  <div className="space-y-1">
                    {futureImpact.opportunityFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <p className="text-xs text-green-800 dark:text-green-300 flex-1">{factor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* リスク要因 */}
              {futureImpact.riskFactors && futureImpact.riskFactors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs font-bold text-red-900 dark:text-red-200">リスク要因</p>
                  </div>
                  <div className="space-y-1">
                    {futureImpact.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-xs text-red-600 dark:text-red-400 mt-0.5">⚠</span>
                        <p className="text-xs text-red-800 dark:text-red-300 flex-1">{factor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 取引ボタン */}
          {onTrade && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onTrade(stock, 'buy')}
                className="h-14 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                買
              </button>
              <button
                onClick={() => onTrade(stock, 'sell')}
                className="h-14 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                売
              </button>
            </div>
          )}

          {/* 関連ニュース（詳細分析付き） */}
          {stockInfo.news && stockInfo.news.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {stock.symbol} 関連ニュース（自動取得・分析済み）
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                銘柄コード {stock.symbol} に基づいて自動取得したニュースを分析しています
              </p>
              <div className="space-y-3">
                {stockInfo.news.slice(0, 5).map((item, index) => (
                  <a
                    key={index}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block p-3 rounded-xl hover:shadow-md transition-all border-2 ${
                      item.sentiment === 'positive'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : item.sentiment === 'negative'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.category && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {item.category}
                            </span>
                          )}
                          {item.sentiment && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              item.sentiment === 'positive'
                                ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                : item.sentiment === 'negative'
                                ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {item.sentiment === 'positive' ? '好材料' : item.sentiment === 'negative' ? '悪材料' : '中立'}
                            </span>
                          )}
                          {item.impactScore !== undefined && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              影響度: {item.impactScore}%
                            </span>
                          )}
                        </div>
                      </div>
                      {item.sentiment === 'positive' && (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      )}
                      {item.sentiment === 'negative' && (
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6 6" />
                        </svg>
                      )}
                    </div>
                    {item.impactDescription && (
                      <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 mt-2 mb-1">
                        {item.impactDescription}
                      </p>
                    )}
                    {item.keywords && item.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.keywords.map((kw, kwIndex) => (
                          <span key={kwIndex} className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(item.pubDate).toLocaleDateString('ja-JP')}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
