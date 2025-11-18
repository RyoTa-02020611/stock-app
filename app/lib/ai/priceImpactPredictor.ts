/**
 * Price Impact Predictor
 * 
 * Analyzes multiple data sources to predict stock price impact
 */

import { getEconomicIndicatorsClient, EconomicIndicatorImpact } from '../dataSources/economicIndicatorsClient'
import { getEarningsClient, EarningsImpact } from '../dataSources/earningsClient'
import { getMarketTrendsClient, MarketTrend } from '../dataSources/marketTrendsClient'
import { getSocialSentimentClient, SocialSentimentImpact } from '../dataSources/socialSentimentClient'
import { getAnalystRatingsClient, AnalystRatingImpact } from '../dataSources/analystRatingsClient'
import { getNewsClient } from '../newsClient'

export interface PriceImpactPrediction {
  symbol: string
  timeframe: 'short' | 'medium' | 'long' // 1日-1週間, 1ヶ月-3ヶ月, 3ヶ月以上
  impactScore: number // -100 to +100
  confidence: number // 0 to 100
  factors: ImpactFactor[]
  predictedPriceRange: {
    low: number
    high: number
    base: number
  }
  recommendation: 'buy' | 'hold' | 'sell' | 'watch'
  description: string
  timestamp: string
}

export interface ImpactFactor {
  source: 'economic' | 'earnings' | 'market_trends' | 'social' | 'analyst' | 'news'
  impactScore: number
  weight: number
  description: string
}

export interface PriceImpactSummary {
  symbol: string
  shortTerm: PriceImpactPrediction
  mediumTerm: PriceImpactPrediction
  longTerm?: PriceImpactPrediction
  overallImpact: number
  overallConfidence: number
}

class PriceImpactPredictor {
  /**
   * Predict price impact for a symbol
   */
  async predict(
    symbol: string,
    currentPrice: number,
    timeframes: ('short' | 'medium' | 'long')[] = ['short', 'medium']
  ): Promise<PriceImpactSummary> {
    // Gather data from all sources
    const [
      economicImpacts,
      earningsImpacts,
      marketTrends,
      socialImpacts,
      analystImpacts,
      newsAnalysis,
    ] = await Promise.all([
      this.getEconomicImpacts(symbol),
      this.getEarningsImpacts(symbol),
      this.getMarketTrends(),
      this.getSocialImpacts(symbol),
      this.getAnalystImpacts(symbol),
      this.getNewsImpacts(symbol),
    ])

    // Generate predictions for each timeframe
    const predictions: Record<string, PriceImpactPrediction> = {}

    for (const timeframe of timeframes) {
      predictions[timeframe] = this.calculatePrediction(
        symbol,
        currentPrice,
        timeframe,
        {
          economicImpacts,
          earningsImpacts,
          marketTrends,
          socialImpacts,
          analystImpacts,
          newsAnalysis,
        }
      )
    }

    // Calculate overall impact
    const overallImpact = this.calculateOverallImpact(predictions)
    const overallConfidence = this.calculateOverallConfidence(predictions)

    return {
      symbol,
      shortTerm: predictions.short,
      mediumTerm: predictions.medium,
      longTerm: predictions.long,
      overallImpact,
      overallConfidence,
    }
  }

  private async getEconomicImpacts(symbol: string): Promise<EconomicIndicatorImpact[]> {
    try {
      const client = getEconomicIndicatorsClient()
      const indicators = await client.getAllIndicators('US')
      const sectors = ['Technology', 'Financials', 'Healthcare']
      return client.analyzeImpact(indicators, sectors)
    } catch (error) {
      console.error('Error getting economic impacts:', error)
      return []
    }
  }

  private async getEarningsImpacts(symbol: string): Promise<EarningsImpact[]> {
    try {
      const client = getEarningsClient()
      const earnings = await client.getEarnings(symbol)
      return earnings.map(report => client.analyzeImpact(report))
    } catch (error) {
      console.error('Error getting earnings impacts:', error)
      return []
    }
  }

  private async getMarketTrends(): Promise<MarketTrend[]> {
    try {
      const client = getMarketTrendsClient()
      return await client.getAllTrends()
    } catch (error) {
      console.error('Error getting market trends:', error)
      return []
    }
  }

  private async getSocialImpacts(symbol: string): Promise<SocialSentimentImpact[]> {
    try {
      const client = getSocialSentimentClient()
      const sentiments = await client.getSentiment(symbol)
      return sentiments.map(sentiment => client.analyzeImpact(sentiment))
    } catch (error) {
      console.error('Error getting social impacts:', error)
      return []
    }
  }

  private async getAnalystImpacts(symbol: string): Promise<AnalystRatingImpact[]> {
    try {
      const client = getAnalystRatingsClient()
      const ratings = await client.getRatings(symbol)
      return ratings.map(rating => client.analyzeImpact(rating))
    } catch (error) {
      console.error('Error getting analyst impacts:', error)
      return []
    }
  }

  private async getNewsImpacts(symbol: string): Promise<ImpactFactor[]> {
    try {
      const client = getNewsClient()
      const news = await client.fetchNewsFromMultipleSources(symbol, 20)
      const analysis = client.analyzeNewsCollection(news)

      // Convert news analysis to impact factors
      const sentimentScore = analysis.averageSentiment || 0
      const impactScore = sentimentScore * 30 // Scale to -30 to +30

      return [{
        source: 'news',
        impactScore,
        weight: 0.3,
        description: `ニュースセンチメント: ${analysis.positiveCount}件の好材料、${analysis.negativeCount}件の懸念材料`,
      }]
    } catch (error) {
      console.error('Error getting news impacts:', error)
      return []
    }
  }

  private calculatePrediction(
    symbol: string,
    currentPrice: number,
    timeframe: 'short' | 'medium' | 'long',
    data: {
      economicImpacts: EconomicIndicatorImpact[]
      earningsImpacts: EarningsImpact[]
      marketTrends: MarketTrend[]
      socialImpacts: SocialSentimentImpact[]
      analystImpacts: AnalystRatingImpact[]
      newsAnalysis: ImpactFactor[]
    }
  ): PriceImpactPrediction {
    const factors: ImpactFactor[] = []

    // Weight factors based on timeframe
    const weights = {
      short: { earnings: 0.4, analyst: 0.3, social: 0.2, news: 0.1, economic: 0.0, market: 0.0 },
      medium: { earnings: 0.3, analyst: 0.25, economic: 0.2, market: 0.15, social: 0.05, news: 0.05 },
      long: { economic: 0.4, market: 0.3, earnings: 0.2, analyst: 0.1, social: 0.0, news: 0.0 },
    }

    const timeframeWeights = weights[timeframe]

    // Add earnings impacts
    data.earningsImpacts.forEach(impact => {
      factors.push({
        source: 'earnings',
        impactScore: impact.impactScore,
        weight: timeframeWeights.earnings,
        description: impact.description,
      })
    })

    // Add analyst impacts
    data.analystImpacts.forEach(impact => {
      factors.push({
        source: 'analyst',
        impactScore: impact.impactScore,
        weight: timeframeWeights.analyst,
        description: impact.description,
      })
    })

    // Add social impacts
    data.socialImpacts.forEach(impact => {
      factors.push({
        source: 'social',
        impactScore: impact.impactScore,
        weight: timeframeWeights.social,
        description: impact.description,
      })
    })

    // Add news impacts
    data.newsAnalysis.forEach(factor => {
      factors.push({
        ...factor,
        weight: timeframeWeights.news,
      })
    })

    // Add economic impacts
    data.economicImpacts.forEach(impact => {
      factors.push({
        source: 'economic',
        impactScore: impact.impactScore,
        weight: timeframeWeights.economic,
        description: impact.description,
      })
    })

    // Add market trends
    data.marketTrends.forEach(trend => {
      factors.push({
        source: 'market_trends',
        impactScore: trend.impactScore,
        weight: timeframeWeights.market,
        description: trend.description,
      })
    })

    // Calculate weighted impact score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    const weightedScore = totalWeight > 0
      ? factors.reduce((sum, f) => sum + (f.impactScore * f.weight), 0) / totalWeight
      : 0

    // Calculate confidence
    const confidence = this.calculateConfidence(factors, timeframe)

    // Predict price range
    const priceChangePercent = weightedScore / 2 // Scale impact to price change
    const predictedPriceRange = {
      base: currentPrice * (1 + priceChangePercent / 100),
      low: currentPrice * (1 + (priceChangePercent - 10) / 100),
      high: currentPrice * (1 + (priceChangePercent + 10) / 100),
    }

    // Determine recommendation
    const recommendation = this.getRecommendation(weightedScore, confidence)

    // Generate description
    const description = this.generateDescription(weightedScore, factors, timeframe)

    return {
      symbol,
      timeframe,
      impactScore: Math.max(-100, Math.min(100, weightedScore)),
      confidence,
      factors,
      predictedPriceRange,
      recommendation,
      description,
      timestamp: new Date().toISOString(),
    }
  }

  private calculateConfidence(factors: ImpactFactor[], timeframe: 'short' | 'medium' | 'long'): number {
    if (factors.length === 0) return 0

    // More factors = higher confidence
    let confidence = Math.min(80, factors.length * 10)

    // Higher weight factors = higher confidence
    const avgWeight = factors.reduce((sum, f) => sum + f.weight, 0) / factors.length
    confidence += avgWeight * 20

    // Timeframe adjustment
    if (timeframe === 'short') {
      confidence = Math.min(90, confidence + 10) // Short-term predictions are more reliable
    } else if (timeframe === 'long') {
      confidence = Math.max(30, confidence - 20) // Long-term predictions are less reliable
    }

    return Math.max(0, Math.min(100, confidence))
  }

  private calculateOverallImpact(predictions: Record<string, PriceImpactPrediction>): number {
    const scores = Object.values(predictions).map(p => p.impactScore)
    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateOverallConfidence(predictions: Record<string, PriceImpactPrediction>): number {
    const confidences = Object.values(predictions).map(p => p.confidence)
    if (confidences.length === 0) return 0
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  }

  private getRecommendation(impactScore: number, confidence: number): 'buy' | 'hold' | 'sell' | 'watch' {
    if (confidence < 50) return 'watch'

    if (impactScore > 30) return 'buy'
    if (impactScore < -30) return 'sell'
    return 'hold'
  }

  private generateDescription(
    impactScore: number,
    factors: ImpactFactor[],
    timeframe: string
  ): string {
    const timeframeText = timeframe === 'short' ? '短期（1日〜1週間）' : timeframe === 'medium' ? '中期（1ヶ月〜3ヶ月）' : '長期（3ヶ月以上）'
    const direction = impactScore > 0 ? '上昇' : impactScore < 0 ? '下落' : '横ばい'
    const magnitude = Math.abs(impactScore)
    const level = magnitude > 50 ? '大幅な' : magnitude > 25 ? '中程度の' : '小幅な'

    const topFactors = factors
      .sort((a, b) => Math.abs(b.impactScore * b.weight) - Math.abs(a.impactScore * a.weight))
      .slice(0, 3)

    let desc = `${timeframeText}で${level}${direction}の可能性があります。`
    
    if (topFactors.length > 0) {
      desc += `主な要因: ${topFactors.map(f => f.description.split('。')[0]).join('、')}。`
    }

    return desc
  }
}

// Singleton instance
let predictorInstance: PriceImpactPredictor | null = null

export function getPriceImpactPredictor(): PriceImpactPredictor {
  if (!predictorInstance) {
    predictorInstance = new PriceImpactPredictor()
  }
  return predictorInstance
}

