/**
 * API Key Manager
 * 
 * Provides secure API key management and validation
 */

export interface ApiKeyConfig {
  name: string
  envVar: string
  required: boolean
  description?: string
}

export const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    name: 'Yahoo Finance',
    envVar: 'YAHOO_FINANCE_API_KEY',
    required: false,
    description: 'Yahoo Finance API key (optional, uses public endpoints if not provided)',
  },
  {
    name: 'Alpha Vantage',
    envVar: 'ALPHA_VANTAGE_API_KEY',
    required: false,
    description: 'Alpha Vantage API key for market data',
  },
  {
    name: 'Finnhub',
    envVar: 'FINNHUB_API_KEY',
    required: false,
    description: 'Finnhub API key for stock data and news',
  },
  {
    name: 'NewsAPI',
    envVar: 'NEWS_API_KEY',
    required: false,
    description: 'NewsAPI key for news aggregation',
  },
  {
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI analysis features',
  },
  {
    name: 'FRED',
    envVar: 'FRED_API_KEY',
    required: false,
    description: 'FRED API key for economic indicators',
  },
  {
    name: 'Polygon.io',
    envVar: 'POLYGON_API_KEY',
    required: false,
    description: 'Polygon.io API key for market data',
  },
]

/**
 * Get API key from environment variable
 */
export function getApiKey(config: ApiKeyConfig): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: API keys should not be exposed
    return undefined
  }
  
  return process.env[config.envVar]
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured(config: ApiKeyConfig): boolean {
  return !!getApiKey(config)
}

/**
 * Get all configured API keys status
 */
export function getApiKeysStatus(): Record<string, { configured: boolean; required: boolean }> {
  const status: Record<string, { configured: boolean; required: boolean }> = {}
  
  for (const config of API_KEY_CONFIGS) {
    status[config.name] = {
      configured: isApiKeyConfigured(config),
      required: config.required,
    }
  }
  
  return status
}

/**
 * Validate API key format (basic validation)
 */
export function validateApiKey(key: string, minLength: number = 10): boolean {
  return typeof key === 'string' && key.length >= minLength && key.trim().length > 0
}

/**
 * Mask API key for logging (show only first and last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) {
    return '****'
  }
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
}

