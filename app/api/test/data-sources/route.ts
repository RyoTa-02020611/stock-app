/**
 * Data Sources Logger Test API Route
 * 
 * This endpoint tests the logger integration in data source clients
 * by attempting to fetch data (which may fail) and verifying logs are generated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEarningsClient } from '../../../lib/dataSources/earningsClient'
import { getMarketTrendsClient } from '../../../lib/dataSources/marketTrendsClient'
import { getAnalystRatingsClient } from '../../../lib/dataSources/analystRatingsClient'
import { getSocialSentimentClient } from '../../../lib/dataSources/socialSentimentClient'
import { getEconomicIndicatorsClient } from '../../../lib/dataSources/economicIndicatorsClient'
import { logger } from '../../../lib/utils/logger'

export async function GET(request: NextRequest) {
  const results: Record<string, { success: boolean; message: string; error?: string }> = {}
  
  try {
    logger.info('Starting data sources logger test', { test: 'data-sources' })

    // Test Earnings Client
    try {
      const earningsClient = getEarningsClient()
      await earningsClient.getEarnings('AAPL')
      results.earnings = { success: true, message: 'Earnings client test completed (check logs for any errors)' }
    } catch (error) {
      results.earnings = { 
        success: false, 
        message: 'Earnings client test failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // Test Market Trends Client
    try {
      const marketTrendsClient = getMarketTrendsClient()
      await marketTrendsClient.getExchangeRates(['USD/JPY'])
      results.marketTrends = { success: true, message: 'Market trends client test completed (check logs for any errors)' }
    } catch (error) {
      results.marketTrends = { 
        success: false, 
        message: 'Market trends client test failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // Test Analyst Ratings Client
    try {
      const analystRatingsClient = getAnalystRatingsClient()
      await analystRatingsClient.getRatings('AAPL')
      results.analystRatings = { success: true, message: 'Analyst ratings client test completed (check logs for any errors)' }
    } catch (error) {
      results.analystRatings = { 
        success: false, 
        message: 'Analyst ratings client test failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // Test Social Sentiment Client
    try {
      const socialSentimentClient = getSocialSentimentClient()
      await socialSentimentClient.getSentiment('AAPL')
      results.socialSentiment = { success: true, message: 'Social sentiment client test completed (check logs for any errors)' }
    } catch (error) {
      results.socialSentiment = { 
        success: false, 
        message: 'Social sentiment client test failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // Test Economic Indicators Client
    try {
      const economicIndicatorsClient = getEconomicIndicatorsClient()
      await economicIndicatorsClient.getGDP('US')
      results.economicIndicators = { success: true, message: 'Economic indicators client test completed (check logs for any errors)' }
    } catch (error) {
      results.economicIndicators = { 
        success: false, 
        message: 'Economic indicators client test failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }

    logger.info('Data sources logger test completed', { test: 'data-sources', results })

    return NextResponse.json({
      success: true,
      message: 'Data sources logger test completed. Check the console/server logs for detailed output.',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      results,
    })
  } catch (error) {
    logger.error('Error in data sources logger test endpoint', error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/test/data-sources'
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      results,
    }, { status: 500 })
  }
}

