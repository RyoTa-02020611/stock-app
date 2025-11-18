/**
 * API Retry Utility
 * 
 * Provides unified retry logic for API calls with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
  retryableErrors?: string[]
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['NetworkError', 'TimeoutError', 'Failed to fetch'],
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, options: Required<RetryOptions>): boolean {
  if (error?.response?.status) {
    return options.retryableStatuses.includes(error.response.status)
  }
  
  if (error?.message) {
    return options.retryableErrors.some(retryableError =>
      error.message.includes(retryableError)
    )
  }
  
  if (error?.name) {
    return options.retryableErrors.includes(error.name)
  }
  
  return false
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === opts.maxRetries || !isRetryableError(error, opts)) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      )
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

/**
 * Rate limit handler - tracks API call frequency
 */
class RateLimiter {
  private calls: Map<string, number[]> = new Map()
  
  /**
   * Check if we can make an API call for the given key
   */
  canMakeCall(key: string, maxCalls: number, windowMs: number): boolean {
    const now = Date.now()
    const callHistory = this.calls.get(key) || []
    
    // Remove old calls outside the window
    const recentCalls = callHistory.filter(timestamp => now - timestamp < windowMs)
    
    if (recentCalls.length >= maxCalls) {
      return false
    }
    
    // Update call history
    recentCalls.push(now)
    this.calls.set(key, recentCalls)
    
    return true
  }
  
  /**
   * Get time until next call is allowed
   */
  getTimeUntilNextCall(key: string, maxCalls: number, windowMs: number): number {
    const now = Date.now()
    const callHistory = this.calls.get(key) || []
    const recentCalls = callHistory.filter(timestamp => now - timestamp < windowMs)
    
    if (recentCalls.length < maxCalls) {
      return 0
    }
    
    const oldestCall = Math.min(...recentCalls)
    return windowMs - (now - oldestCall)
  }
  
  /**
   * Clear rate limit history for a key
   */
  clear(key: string) {
    this.calls.delete(key)
  }
  
  /**
   * Clear all rate limit history
   */
  clearAll() {
    this.calls.clear()
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Make an API call with rate limiting and retry
 */
export async function makeApiCallWithRetry<T>(
  fn: () => Promise<T>,
  rateLimitKey: string,
  rateLimitOptions: { maxCalls: number; windowMs: number } = { maxCalls: 10, windowMs: 60000 },
  retryOptions: RetryOptions = {}
): Promise<T> {
  // Check rate limit
  const timeUntilNext = rateLimiter.getTimeUntilNextCall(
    rateLimitKey,
    rateLimitOptions.maxCalls,
    rateLimitOptions.windowMs
  )
  
  if (timeUntilNext > 0) {
    await sleep(timeUntilNext)
  }
  
  // Make the call with retry
  return retryWithBackoff(fn, retryOptions)
}

