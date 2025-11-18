/**
 * Social Sentiment Client
 * 
 * Fetches social media sentiment from Twitter/X API and other sources
 */

import { logger } from '../utils/logger'

export interface SocialSentiment {
  symbol: string
  platform: 'twitter' | 'reddit' | 'news' | 'general'
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number // -1 to 1
  mentions: number
  engagement: number
  timestamp: string
  topKeywords: string[]
}

export interface SocialSentimentImpact {
  sentiment: SocialSentiment
  impactScore: number // -100 to +100
  affectedSectors: string[]
  description: string
  confidence: number // 0 to 100
}

class SocialSentimentClient {
  private twitterApiKey: string
  private twitterApiSecret: string
  private cache: Map<string, { data: SocialSentiment[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes

  constructor() {
    this.twitterApiKey = process.env.TWITTER_API_KEY || ''
    this.twitterApiSecret = process.env.TWITTER_API_SECRET || ''
  }

  /**
   * Get social sentiment for a symbol
   */
  async getSentiment(symbol: string): Promise<SocialSentiment[]> {
    const cacheKey = `sentiment_${symbol}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const sentiments = await this.fetchSentimentFromMultipleSources(symbol)
      this.cache.set(cacheKey, { data: sentiments, timestamp: Date.now() })
      return sentiments
    } catch (error) {
      logger.error(`Error fetching sentiment for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      return []
    }
  }

  /**
   * Get sentiment for multiple symbols
   */
  async getSentimentsForSymbols(symbols: string[]): Promise<SocialSentiment[]> {
    const allSentiments: SocialSentiment[] = []
    
    for (const symbol of symbols) {
      try {
        const sentiments = await this.getSentiment(symbol)
        allSentiments.push(...sentiments)
      } catch (error) {
        logger.error(`Error fetching sentiment for ${symbol}`, error instanceof Error ? error : new Error(String(error)), { symbol })
      }
    }

    return allSentiments
  }

  /**
   * Analyze impact of social sentiment
   */
  analyzeImpact(sentiment: SocialSentiment): SocialSentimentImpact {
    let impactScore = 0
    const affectedSectors: string[] = []
    let confidence = 50

    // Calculate impact based on sentiment score and mentions
    if (sentiment.sentimentScore > 0.3) {
      // Strong positive sentiment
      impactScore = Math.min(50, sentiment.sentimentScore * 100 + (sentiment.mentions / 100))
      confidence = Math.min(90, 50 + (sentiment.mentions / 10))
    } else if (sentiment.sentimentScore < -0.3) {
      // Strong negative sentiment
      impactScore = Math.max(-50, sentiment.sentimentScore * 100 - (sentiment.mentions / 100))
      confidence = Math.min(90, 50 + (sentiment.mentions / 10))
    } else {
      // Neutral sentiment
      impactScore = sentiment.sentimentScore * 20
      confidence = 30
    }

    // Higher engagement increases confidence
    if (sentiment.engagement > 1000) {
      confidence = Math.min(95, confidence + 20)
    } else if (sentiment.engagement > 100) {
      confidence = Math.min(85, confidence + 10)
    }

    // Determine affected sectors (simplified)
    affectedSectors.push('Technology', 'Consumer Discretionary', 'Communication Services')

    const description = this.generateImpactDescription(sentiment, impactScore)

    return {
      sentiment,
      impactScore,
      affectedSectors,
      description,
      confidence,
    }
  }

  private generateImpactDescription(
    sentiment: SocialSentiment,
    impactScore: number
  ): string {
    const direction = impactScore > 0 ? 'プラス' : impactScore < 0 ? 'マイナス' : '中立'
    const magnitude = Math.abs(impactScore)
    const level = magnitude > 30 ? '大きな' : magnitude > 15 ? '中程度の' : '小さな'
    const platform = sentiment.platform === 'twitter' ? 'Twitter/X' : sentiment.platform

    return `${sentiment.symbol}に関する${platform}でのセンチメントが${sentiment.sentiment}で、${sentiment.mentions}件の言及があります。株価に${level}${direction}の影響を与える可能性があります。`
  }

  private async fetchSentimentFromMultipleSources(symbol: string): Promise<SocialSentiment[]> {
    const sentiments: SocialSentiment[] = []

    // Try Twitter/X API
    if (this.twitterApiKey && this.twitterApiSecret) {
      try {
        const twitterSentiment = await this.fetchFromTwitter(symbol)
        if (twitterSentiment) {
          sentiments.push(twitterSentiment)
        }
      } catch (error) {
        logger.error('Twitter sentiment fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Twitter/X' })
      }
    }

    // Try Reddit (via web scraping or API)
    try {
      const redditSentiment = await this.fetchFromReddit(symbol)
      if (redditSentiment) {
        sentiments.push(redditSentiment)
      }
    } catch (error) {
      logger.error('Reddit sentiment fetch error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Reddit' })
    }

    // Return sentiments (empty array if none found)
    return sentiments
  }

  private async fetchFromTwitter(symbol: string): Promise<SocialSentiment | null> {
    // Twitter API v2 implementation
    // This requires OAuth 2.0 authentication
    try {
      // For now, return null - full implementation would require OAuth setup
      return null
    } catch (error) {
      logger.error('Twitter API error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Twitter/X' })
      return null
    }
  }

  private async fetchFromReddit(symbol: string): Promise<SocialSentiment | null> {
    try {
      // Reddit API doesn't require authentication for read access
      const response = await fetch(
        `https://www.reddit.com/r/stocks/search.json?q=${symbol}&limit=10&sort=relevance`,
        {
          headers: {
            'User-Agent': 'Stock Library App',
          },
          next: { revalidate: 900 },
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      const posts = data.data?.children || []

      if (posts.length === 0) return null

      // Analyze sentiment from post titles and content
      let positiveCount = 0
      let negativeCount = 0
      let totalScore = 0
      const keywords: string[] = []

      interface RedditPost {
        data?: {
          title?: string
          selftext?: string
          score?: number
        }
      }

      posts.forEach((post: RedditPost) => {
        const title = post.data?.title || ''
        const selftext = post.data?.selftext || ''
        const text = (title + ' ' + selftext).toLowerCase()

        // Simple sentiment analysis
        const positiveKeywords = ['buy', 'bullish', 'growth', 'profit', 'gain', 'up', 'good', 'strong']
        const negativeKeywords = ['sell', 'bearish', 'loss', 'down', 'bad', 'weak', 'crash', 'drop']

        let postScore = 0
        positiveKeywords.forEach(kw => {
          if (text.includes(kw)) {
            postScore += 1
            positiveCount++
            keywords.push(kw)
          }
        })
        negativeKeywords.forEach(kw => {
          if (text.includes(kw)) {
            postScore -= 1
            negativeCount++
            keywords.push(kw)
          }
        })

        totalScore += postScore
      })

      const sentimentScore = posts.length > 0 ? totalScore / posts.length : 0
      const normalizedScore = Math.max(-1, Math.min(1, sentimentScore / 5))

      return {
        symbol,
        platform: 'reddit',
        sentiment: normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral',
        sentimentScore: normalizedScore,
        mentions: posts.length,
        engagement: posts.reduce((sum: number, post: RedditPost) => sum + (post.data?.score || 0), 0),
        timestamp: new Date().toISOString(),
        topKeywords: [...new Set(keywords)].slice(0, 5),
      }
    } catch (error) {
      logger.error('Reddit API error', error instanceof Error ? error : new Error(String(error)), { symbol, source: 'Reddit' })
      return null
    }
  }

}

// Singleton instance
let clientInstance: SocialSentimentClient | null = null

export function getSocialSentimentClient(): SocialSentimentClient {
  if (!clientInstance) {
    clientInstance = new SocialSentimentClient()
  }
  return clientInstance
}

