/**
 * Multi-source News Client
 * 
 * Fetches news from multiple sources and provides analysis capabilities
 */

export interface NewsArticle {
  id: string
  title: string
  summary?: string
  content?: string
  publishedAt: string
  url: string
  source: string
  sourceType: 'financial' | 'general' | 'social' | 'blog'
  symbol?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentimentScore?: number // -1 to 1
  importance?: number // 0 to 100
  category?: string[]
  author?: string
  imageUrl?: string
}

export interface NewsAnalysis {
  totalArticles: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  averageSentiment: number
  topSources: Array<{ source: string; count: number }>
  topCategories: Array<{ category: string; count: number }>
  trend: 'increasing' | 'decreasing' | 'stable'
  keyTopics: string[]
  timeRange: {
    start: string
    end: string
  }
}

class NewsClient {
  private cache: Map<string, { data: NewsArticle[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Fetch news from multiple sources
   */
  async fetchNewsFromMultipleSources(
    symbol?: string,
    limit: number = 50
  ): Promise<NewsArticle[]> {
    const cacheKey = `news_${symbol || 'all'}_${limit}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const allNews: NewsArticle[] = []

    try {
      // Source 1: Yahoo Finance (via web scraping simulation)
      const yahooNews = await this.fetchYahooFinanceNews(symbol, limit)
      allNews.push(...yahooNews)

      // Source 2: Alpha Vantage News (if API key available)
      try {
        const alphaNews = await this.fetchAlphaVantageNews(symbol, limit)
        allNews.push(...alphaNews)
      } catch (error) {
        console.log('Alpha Vantage news fetch failed:', error)
      }

      // Source 3: Finnhub News (if API key available)
      try {
        const finnhubNews = await this.fetchFinnhubNews(symbol, limit)
        allNews.push(...finnhubNews)
      } catch (error) {
        console.log('Finnhub news fetch failed:', error)
      }

      // Source 4: NewsAPI (if API key available)
      try {
        const newsApiNews = await this.fetchNewsAPINews(symbol, limit)
        allNews.push(...newsApiNews)
      } catch (error) {
        console.log('NewsAPI fetch failed:', error)
      }

      // Source 5: Google News RSS (via proxy)
      try {
        const googleNews = await this.fetchGoogleNews(symbol, limit)
        allNews.push(...googleNews)
      } catch (error) {
        console.log('Google News fetch failed:', error)
      }

      // Remove duplicates and analyze
      const uniqueNews = this.removeDuplicates(allNews)
      const analyzedNews = await this.analyzeNews(uniqueNews)

      // Sort by importance and date
      analyzedNews.sort((a, b) => {
        const importanceDiff = (b.importance || 0) - (a.importance || 0)
        if (importanceDiff !== 0) return importanceDiff
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })

      const result = analyzedNews.slice(0, limit)
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Error fetching news from multiple sources:', error)
      return []
    }
  }

  /**
   * Fetch news from Yahoo Finance (simulated)
   */
  private async fetchYahooFinanceNews(symbol?: string, limit: number = 20): Promise<NewsArticle[]> {
    try {
      const query = symbol ? `${symbol} stock news` : 'stock market news'
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=0&newsCount=${limit}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      })

      if (!response.ok) {
        throw new Error('Yahoo Finance API failed')
      }

      const data = await response.json()
      const news = data.news || []

      return news.map((item: any, index: number) => ({
        id: `yahoo_${item.uuid || index}`,
        title: item.title || '',
        summary: item.summary || '',
        publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
        url: item.link || '',
        source: 'Yahoo Finance',
        sourceType: 'financial' as const,
        symbol,
      }))
    } catch (error) {
      console.error('Yahoo Finance news error:', error)
      return []
    }
  }

  /**
   * Fetch news from Alpha Vantage
   */
  private async fetchAlphaVantageNews(symbol?: string, limit: number = 20): Promise<NewsArticle[]> {
    // Alpha Vantage requires API key
    // For now, return empty array (can be implemented with API key)
    return []
  }

  /**
   * Fetch news from Finnhub
   */
  private async fetchFinnhubNews(symbol?: string, limit: number = 20): Promise<NewsArticle[]> {
    // Finnhub requires API key
    // For now, return empty array (can be implemented with API key)
    return []
  }

  /**
   * Fetch news from NewsAPI
   */
  private async fetchNewsAPINews(symbol?: string, limit: number = 20): Promise<NewsArticle[]> {
    // NewsAPI requires API key
    // For now, return empty array (can be implemented with API key)
    return []
  }

  /**
   * Fetch news from Google News RSS
   */
  private async fetchGoogleNews(symbol?: string, limit: number = 20): Promise<NewsArticle[]> {
    try {
      const query = symbol ? `${symbol} 株価 ニュース` : '株式市場 ニュース'
      // Using a proxy service or RSS feed
      // For now, return empty array (can be implemented with RSS parser)
      return []
    } catch (error) {
      console.error('Google News error:', error)
      return []
    }
  }

  /**
   * Remove duplicate news articles
   */
  private removeDuplicates(news: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>()
    return news.filter((article) => {
      const key = `${article.title}_${article.source}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * Analyze news articles (sentiment, importance, etc.)
   */
  private async analyzeNews(news: NewsArticle[]): Promise<NewsArticle[]> {
    return news.map((article) => {
      // Basic sentiment analysis based on keywords
      const sentiment = this.analyzeSentiment(article.title + ' ' + (article.summary || ''))
      
      // Calculate importance score
      const importance = this.calculateImportance(article)

      // Extract categories
      const categories = this.extractCategories(article)

      return {
        ...article,
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        importance,
        category: categories,
      }
    })
  }

  /**
   * Basic sentiment analysis using keywords
   */
  private analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral'; score: number } {
    const positiveKeywords = [
      '上昇', '成長', '増加', '好調', '好材料', '買い', '強気', '上向き',
      'rise', 'growth', 'increase', 'gain', 'bullish', 'positive', 'up',
      'surge', 'rally', 'boost', 'profit', 'earnings beat'
    ]
    
    const negativeKeywords = [
      '下落', '減少', '減益', '懸念', '売り', '弱気', '下向き', 'リスク',
      'fall', 'decline', 'decrease', 'loss', 'bearish', 'negative', 'down',
      'drop', 'crash', 'worry', 'concern', 'risk', 'earnings miss'
    ]

    const lowerText = text.toLowerCase()
    let positiveCount = 0
    let negativeCount = 0

    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        positiveCount++
      }
    })

    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        negativeCount++
      }
    })

    const score = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1)
    
    if (score > 0.2) {
      return { sentiment: 'positive', score }
    } else if (score < -0.2) {
      return { sentiment: 'negative', score }
    } else {
      return { sentiment: 'neutral', score }
    }
  }

  /**
   * Calculate importance score (0-100)
   */
  private calculateImportance(article: NewsArticle): number {
    let score = 50 // Base score

    // Source type weight
    if (article.sourceType === 'financial') {
      score += 20
    }

    // Title length (longer titles might be more detailed)
    if (article.title.length > 50) {
      score += 10
    }

    // Has summary
    if (article.summary && article.summary.length > 100) {
      score += 10
    }

    // Recent news is more important
    const daysSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePublished < 1) {
      score += 20
    } else if (daysSincePublished < 7) {
      score += 10
    }

    // Has image
    if (article.imageUrl) {
      score += 5
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Extract categories from article
   */
  private extractCategories(article: NewsArticle): string[] {
    const categories: string[] = []
    const text = (article.title + ' ' + (article.summary || '')).toLowerCase()

    const categoryKeywords: Record<string, string[]> = {
      '決算': ['決算', 'earnings', 'financial results'],
      'M&A': ['m&a', 'merger', 'acquisition', '買収', '合併'],
      '配当': ['dividend', '配当', 'dividend yield'],
      '業績予想': ['forecast', 'guidance', '予想', '業績'],
      '新製品': ['product', 'launch', '新製品', 'リリース'],
      '人事': ['executive', 'ceo', '人事', '役員'],
      '規制': ['regulation', 'regulatory', '規制', '当局'],
    }

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.push(category)
      }
    })

    return categories
  }

  /**
   * Analyze news collection
   */
  analyzeNewsCollection(news: NewsArticle[]): NewsAnalysis {
    const totalArticles = news.length
    const positiveCount = news.filter(n => n.sentiment === 'positive').length
    const negativeCount = news.filter(n => n.sentiment === 'negative').length
    const neutralCount = news.filter(n => n.sentiment === 'neutral').length

    const sentimentScores = news
      .map(n => n.sentimentScore || 0)
      .filter(score => score !== 0)
    const averageSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0

    // Top sources
    const sourceCounts = new Map<string, number>()
    news.forEach(article => {
      sourceCounts.set(article.source, (sourceCounts.get(article.source) || 0) + 1)
    })
    const topSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top categories
    const categoryCounts = new Map<string, number>()
    news.forEach(article => {
      article.category?.forEach(cat => {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      })
    })
    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Trend analysis (comparing recent vs older news)
    const recentNews = news.filter(n => {
      const daysSince = (Date.now() - new Date(n.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince < 3
    })
    const recentSentiment = recentNews.length > 0
      ? recentNews.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) / recentNews.length
      : 0
    const olderSentiment = news.length > recentNews.length
      ? news
          .filter(n => {
            const daysSince = (Date.now() - new Date(n.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
            return daysSince >= 3
          })
          .reduce((sum, n) => sum + (n.sentimentScore || 0), 0) / (news.length - recentNews.length)
      : 0

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (recentSentiment > olderSentiment + 0.1) {
      trend = 'increasing'
    } else if (recentSentiment < olderSentiment - 0.1) {
      trend = 'decreasing'
    }

    // Key topics (most common words in titles)
    const allTitles = news.map(n => n.title.toLowerCase())
    const wordCounts = new Map<string, number>()
    allTitles.forEach(title => {
      const words = title.split(/\s+/).filter(w => w.length > 3)
      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      })
    })
    const keyTopics = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    const dates = news.map(n => new Date(n.publishedAt).getTime())
    const timeRange = {
      start: new Date(Math.min(...dates)).toISOString(),
      end: new Date(Math.max(...dates)).toISOString(),
    }

    return {
      totalArticles,
      positiveCount,
      negativeCount,
      neutralCount,
      averageSentiment,
      topSources,
      topCategories,
      trend,
      keyTopics,
      timeRange,
    }
  }
}

// Singleton instance
let newsClientInstance: NewsClient | null = null

export function getNewsClient(): NewsClient {
  if (!newsClientInstance) {
    newsClientInstance = new NewsClient()
  }
  return newsClientInstance
}

