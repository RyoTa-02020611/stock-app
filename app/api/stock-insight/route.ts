import { NextRequest, NextResponse } from 'next/server'

export type PricePoint = {
  date: string
  close: number
  volume?: number
}

export type NewsItem = {
  title: string
  publishedAt: string
  url: string
  source?: string
}

export interface StockInsightResponse {
  symbol: string
  companyName?: string
  latestPrice?: number
  changePercent?: number
  trend30d?: 'up' | 'down' | 'sideways'
  volatilityLevel?: 'low' | 'medium' | 'high'
  newsSummary?: {
    positiveCount: number
    negativeCount: number
    neutralCount: number
    latestNews: NewsItem[]
  }
  observations: string[]
  impactSummary: string
}

/**
 * Analyze news sentiment using keyword matching
 */
function analyzeNewsSentiment(newsItems: NewsItem[]): {
  positiveCount: number
  negativeCount: number
  neutralCount: number
} {
  const positiveKeywords = [
    '成長', '上昇', '増益', '好調', '拡大', '好材料', '上向き', '改善', '黒字', '利益',
    '増収', '増配', '買い', '推奨', '目標株価引き上げ', '業績上方修正', '新規事業', '技術革新',
    '契約獲得', '出荷増', '売上高', 'V字回復', '過去最高', '好業績',
    'record profit', 'growth', 'increase', 'positive', 'upgrade', 'buy', 'recommend'
  ]
  
  const negativeKeywords = [
    '下落', '減益', '不調', '縮小', '悪材料', '下向き', '悪化', '赤字', '損失', 'リスク',
    '減収', '減配', '売り', '下方修正', '業績悪化', 'リストラ', '撤退', '事故', '不祥事',
    '違反', '訴訟', '倒産', '破綻', 'リコール', '欠陥',
    'loss', 'decrease', 'negative', 'downgrade', 'sell', 'lawsuit', 'violation', 'scandal'
  ]

  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  newsItems.forEach(news => {
    const title = news.title.toLowerCase()
    let hasPositive = false
    let hasNegative = false

    positiveKeywords.forEach(kw => {
      if (title.includes(kw.toLowerCase())) {
        hasPositive = true
      }
    })

    negativeKeywords.forEach(kw => {
      if (title.includes(kw.toLowerCase())) {
        hasNegative = true
      }
    })

    if (hasPositive && !hasNegative) {
      positiveCount++
    } else if (hasNegative && !hasPositive) {
      negativeCount++
    } else {
      neutralCount++
    }
  })

  return { positiveCount, negativeCount, neutralCount }
}

/**
 * Compute 30-day trend from price history
 */
function computeTrend30d(priceHistory: PricePoint[]): 'up' | 'down' | 'sideways' {
  if (priceHistory.length < 2) return 'sideways'

  const firstPrice = priceHistory[0].close
  const lastPrice = priceHistory[priceHistory.length - 1].close
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100

  if (changePercent > 5) {
    return 'up'
  } else if (changePercent < -5) {
    return 'down'
  } else {
    return 'sideways'
  }
}

/**
 * Compute volatility level from price history
 */
function computeVolatility(priceHistory: PricePoint[]): 'low' | 'medium' | 'high' {
  if (priceHistory.length < 3) return 'medium'

  // Calculate daily returns
  const returns: number[] = []
  for (let i = 1; i < priceHistory.length; i++) {
    const dailyReturn = Math.abs((priceHistory[i].close - priceHistory[i - 1].close) / priceHistory[i - 1].close) * 100
    returns.push(dailyReturn)
  }

  // Calculate average absolute return
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length

  if (avgReturn < 1.5) {
    return 'low'
  } else if (avgReturn > 3.0) {
    return 'high'
  } else {
    return 'medium'
  }
}

/**
 * Generate observations and impact summary
 */
function generateAnalysis(
  symbol: string,
  priceHistory: PricePoint[],
  changePercent: number,
  trend30d: 'up' | 'down' | 'sideways',
  volatilityLevel: 'low' | 'medium' | 'high',
  newsSummary: { positiveCount: number; negativeCount: number; neutralCount: number }
): { observations: string[]; impactSummary: string } {
  const observations: string[] = []

  // Trend observation
  if (priceHistory.length >= 30) {
    const firstPrice = priceHistory[0].close
    const lastPrice = priceHistory[priceHistory.length - 1].close
    const trendPercent = ((lastPrice - firstPrice) / firstPrice) * 100

    if (trend30d === 'up') {
      observations.push(`直近30日間の株価はおおむね上昇傾向にあります（約 +${Math.abs(trendPercent).toFixed(1)}%）。`)
    } else if (trend30d === 'down') {
      observations.push(`直近30日間の株価は下落傾向にあります（約 ${trendPercent.toFixed(1)}%）。`)
    } else {
      observations.push(`直近30日間の株価は横ばい推移となっています（変動幅: ${Math.abs(trendPercent).toFixed(1)}%）。`)
    }
  }

  // Volatility observation
  if (volatilityLevel === 'high') {
    observations.push(`日々の値動きから見ると、ボラティリティは高めです。価格変動が大きい傾向にあります。`)
  } else if (volatilityLevel === 'low') {
    observations.push(`日々の値動きから見ると、ボラティリティは低めです。比較的安定した推移となっています。`)
  } else {
    observations.push(`日々の値動きから見ると、ボラティリティは中程度です。`)
  }

  // News sentiment observation
  const totalNews = newsSummary.positiveCount + newsSummary.negativeCount + newsSummary.neutralCount
  if (totalNews > 0) {
    if (newsSummary.positiveCount > newsSummary.negativeCount * 1.5) {
      observations.push(`最近のニュースではポジティブな見出しが${newsSummary.positiveCount}件、ネガティブな見出しが${newsSummary.negativeCount}件見られます。好材料が優勢です。`)
    } else if (newsSummary.negativeCount > newsSummary.positiveCount * 1.5) {
      observations.push(`最近のニュースではネガティブな見出しが${newsSummary.negativeCount}件、ポジティブな見出しが${newsSummary.positiveCount}件見られます。懸念材料が目立ちます。`)
    } else {
      observations.push(`最近のニュースではポジティブな見出しが${newsSummary.positiveCount}件、ネガティブな見出しが${newsSummary.negativeCount}件見られます。好悪材料が拮抗しています。`)
    }
  }

  // Recent price change observation
  if (Math.abs(changePercent) > 3) {
    if (changePercent > 0) {
      observations.push(`直近の価格変動は+${changePercent.toFixed(1)}%と、比較的大きな上昇が見られます。`)
    } else {
      observations.push(`直近の価格変動は${changePercent.toFixed(1)}%と、比較的大きな下落が見られます。`)
    }
  }

  // Generate impact summary
  let impactSummary = ''

  if (trend30d === 'up' && newsSummary.positiveCount > newsSummary.negativeCount) {
    impactSummary = `現在の上昇トレンドと好材料のニュースが相まって、短期的には市場の楽観的な見方が継続する可能性があります。ただし、大幅な上昇後の調整圧力も意識されるため、今後の動向には注意が必要です。中長期的には、業績の実績や市場環境の変化が価格に反映されると解釈できる可能性があります。`
  } else if (trend30d === 'down' && newsSummary.negativeCount > newsSummary.positiveCount) {
    impactSummary = `現在の下落トレンドと懸念材料のニュースが重なり、短期的には市場の慎重な見方が続く可能性があります。根本的な懸念材料が解決されない限り、下落傾向が継続するリスクも意識されます。一方で、過度な下落は反発の機会を生む可能性もあるため、今後のニュースや業績発表に注目が必要です。`
  } else if (trend30d === 'up' && newsSummary.negativeCount > newsSummary.positiveCount) {
    impactSummary = `上昇トレンドが続いている一方で、懸念材料のニュースも見られます。このような状況では、トレンドの継続性に疑問が生じる可能性があり、短期的な調整が発生するリスクも考えられます。市場の反応を慎重に観察し、今後のニュースや業績動向に注意を払うことが重要です。`
  } else if (trend30d === 'down' && newsSummary.positiveCount > newsSummary.negativeCount) {
    impactSummary = `下落トレンドが続いているものの、好材料のニュースも見られます。このような状況では、下落の底打ちや反発の機会が生じる可能性があります。ただし、トレンド転換には時間がかかることもあるため、継続的な監視が必要です。今後の業績発表や市場環境の変化に注目してください。`
  } else {
    impactSummary = `現在の価格水準とニュースのバランスから見ると、短期的には現状維持の可能性が高いと解釈できます。ただし、市場環境や業績発表などの外部要因により、価格が大きく動く可能性もあります。継続的な情報収集と市場動向の監視を推奨します。`
  }

  return {
    observations: observations.length > 0 ? observations : ['データ分析中...'],
    impactSummary: impactSummary || 'データが不足しているため、詳細な分析ができませんでした。',
  }
}

/**
 * Fetch stock data from external API or generate deterministic fake data
 */
async function fetchStockData(symbol: string): Promise<Partial<StockInsightResponse>> {
  // Try to use environment variable API if available
  const priceApiUrl = process.env.STOCK_PRICE_API_URL
  const priceApiKey = process.env.STOCK_PRICE_API_KEY
  const newsApiUrl = process.env.STOCK_NEWS_API_URL
  const newsApiKey = process.env.STOCK_NEWS_API_KEY

  if (priceApiUrl && priceApiKey) {
    try {
      // Fetch historical prices (90 days)
      const priceResponse = await fetch(
        `${priceApiUrl}?symbol=${encodeURIComponent(symbol)}&range=90d&apikey=${priceApiKey}`,
        { next: { revalidate: 300 } } // Cache for 5 minutes
      )

      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        // Map API response to our format
        // Implementation depends on your API structure
        // This is a placeholder
      }
    } catch (error) {
      console.error('Custom API error:', error)
      // Fall through to Yahoo Finance
    }
  }

  // Fallback: Use Yahoo Finance API
  try {
    // Determine symbol format for global markets
    let yahooSymbol = symbol
    
    // If symbol already has exchange suffix, use as is
    if (symbol.includes('.')) {
      yahooSymbol = symbol
    } else {
      // Try to detect market from common patterns
      // For now, assume US market for common symbols, otherwise try Japanese
      const usSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC', 'SPY', 'QQQ', 'DIA']
      if (usSymbols.includes(symbol.toUpperCase())) {
        yahooSymbol = symbol
      } else if (/^\d{4}$/.test(symbol)) {
        // 4-digit number likely Japanese stock
        yahooSymbol = `${symbol}.T`
      } else {
        // Try US first, then Japanese
        yahooSymbol = symbol
      }
    }

    // Fetch historical price data (90 days)
    const priceResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=90d`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (!priceResponse.ok) {
      throw new Error('Price data fetch failed')
    }

    const priceData = await priceResponse.json()
    const result = priceData.chart?.result?.[0]

    if (!result) {
      throw new Error('No data available')
    }

    const meta = result.meta
    const latestPrice = meta.regularMarketPrice || meta.previousClose
    const previousClose = meta.previousClose || latestPrice
    const changePercent = ((latestPrice - previousClose) / previousClose) * 100
    const companyName = meta.longName || meta.shortName || symbol

    // Get price history
    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []
    const volumes = result.indicators?.quote?.[0]?.volume || []

    const priceHistory: PricePoint[] = []
    for (let i = 0; i < timestamps.length && i < closes.length; i++) {
      if (closes[i] !== null) {
        priceHistory.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          close: closes[i],
          volume: volumes[i] || undefined,
        })
      }
    }

    // Fetch recent news
    const newsItems: NewsItem[] = []
    try {
      const newsResponse = await fetch(
        `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${yahooSymbol}&region=JP&lang=ja-JP`,
        { next: { revalidate: 300 } } // Cache for 5 minutes
      )

      if (newsResponse.ok) {
        const newsText = await newsResponse.text()
        
        // Parse RSS XML using regex (server-side compatible)
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let match
        let count = 0
        
        while ((match = itemRegex.exec(newsText)) !== null && count < 10) {
          const itemContent = match[1]
          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/)
          const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)
          
          const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : ''
          const link = linkMatch ? linkMatch[1].trim() : ''
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : ''
          
          if (title && link) {
            newsItems.push({
              title,
              publishedAt: pubDate,
              url: link,
              source: 'Yahoo Finance',
            })
            count++
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    }

    // Analyze data
    const trend30d = computeTrend30d(priceHistory)
    const volatilityLevel = computeVolatility(priceHistory)
    const newsSummary = analyzeNewsSentiment(newsItems)

    // Generate analysis
    const analysis = generateAnalysis(
      symbol,
      priceHistory,
      changePercent,
      trend30d,
      volatilityLevel,
      newsSummary
    )

    return {
      symbol,
      companyName,
      latestPrice,
      changePercent,
      trend30d,
      volatilityLevel,
      newsSummary: {
        ...newsSummary,
        latestNews: newsItems.slice(0, 5),
      },
      observations: analysis.observations,
      impactSummary: analysis.impactSummary,
    }
  } catch (error) {
    console.error('Error fetching stock data from Yahoo Finance:', error)
    
    // Fallback: Generate deterministic fake data
    return generateDeterministicFakeData(symbol)
  }
}

/**
 * Generate deterministic fake data based on symbol (fallback)
 */
function generateDeterministicFakeData(symbol: string): StockInsightResponse {
  // Create hash from symbol for consistent data
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i)
    hash = hash & hash
  }

  // Use hash to generate consistent values
  const basePrice = 100 + (Math.abs(hash) % 200)
  const changePercent = ((hash % 200) - 100) / 10 // -10% to +10%
  const latestPrice = basePrice * (1 + changePercent / 100)

  // Generate price history (90 days)
  const priceHistory: PricePoint[] = []
  const now = Date.now()
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const variation = ((hash + i * 17) % 20 - 10) / 100
    priceHistory.push({
      date: date.toISOString(),
      close: basePrice * (1 + variation),
    })
  }

  // Determine trend and volatility
  const trend30d = computeTrend30d(priceHistory)
  const volatilityLevel = computeVolatility(priceHistory)

  // Generate fake news
  const newsItems: NewsItem[] = []
  const newsTemplates = [
    { title: `${symbol}の業績が市場予想を上回る`, sentiment: 'positive' },
    { title: `${symbol}が新製品を発表`, sentiment: 'positive' },
    { title: `${symbol}の株価が下落`, sentiment: 'negative' },
    { title: `${symbol}に関する市場分析`, sentiment: 'neutral' },
  ]

  for (let i = 0; i < 5; i++) {
    const template = newsTemplates[Math.abs(hash + i) % newsTemplates.length]
    newsItems.push({
      title: template.title,
      publishedAt: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://example.com/news/${symbol}-${i}`,
      source: 'サンプルニュース',
    })
  }

  const newsSummary = analyzeNewsSentiment(newsItems)
  const analysis = generateAnalysis(
    symbol,
    priceHistory,
    changePercent,
    trend30d,
    volatilityLevel,
    newsSummary
  )

  return {
    symbol,
    companyName: `${symbol} Corporation`,
    latestPrice,
    changePercent,
    trend30d,
    volatilityLevel,
    newsSummary: {
      ...newsSummary,
      latestNews: newsItems,
    },
    observations: analysis.observations,
    impactSummary: analysis.impactSummary,
  }
}

/**
 * GET /api/stock-insight?symbol=XXXX
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')

    if (!symbol || symbol.trim().length === 0) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    // Fetch stock data
    const stockData = await fetchStockData(symbol.trim())

    // Ensure all required fields are present
    const response: StockInsightResponse = {
      symbol: stockData.symbol || symbol,
      companyName: stockData.companyName,
      latestPrice: stockData.latestPrice,
      changePercent: stockData.changePercent,
      trend30d: stockData.trend30d || 'sideways',
      volatilityLevel: stockData.volatilityLevel || 'medium',
      newsSummary: stockData.newsSummary || {
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        latestNews: [],
      },
      observations: stockData.observations || ['データ分析中...'],
      impactSummary: stockData.impactSummary || 'データが不足しているため、詳細な分析ができませんでした。',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Stock insight API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock insight',
        observations: ['外部データの取得に失敗しました。後ほど再度お試しください。'],
        impactSummary: 'データ取得エラーのため、分析を完了できませんでした。',
      },
      { status: 500 }
    )
  }
}
