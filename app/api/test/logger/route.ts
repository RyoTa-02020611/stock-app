/**
 * Logger Test API Route
 * 
 * This endpoint tests the logger functionality by generating logs at different levels.
 * Use this to verify that logging is working correctly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Test different log levels
    logger.debug('Test debug log', { test: true, level: 'debug' })
    logger.info('Test info log', { test: true, level: 'info' })
    logger.warn('Test warn log', { test: true, level: 'warn' })
    
    // Test error logging with Error object
    const testError = new Error('Test error message')
    logger.error('Test error log with Error object', testError, { test: true, level: 'error' })
    
    // Test error logging with string error
    logger.error('Test error log with string error', new Error('String error'), { test: true, level: 'error' })
    
    // Test error logging with context
    logger.error('Test error log with context', new Error('Context error'), { 
      test: true, 
      level: 'error',
      symbol: 'AAPL',
      source: 'Test API',
      additionalInfo: 'This is a test'
    })

    return NextResponse.json({
      success: true,
      message: 'Logger test completed. Check the console/server logs for output.',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  } catch (error) {
    logger.error('Error in logger test endpoint', error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/test/logger'
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

