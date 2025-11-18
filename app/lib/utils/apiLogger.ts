/**
 * API Logger
 * 
 * Automatically logs API endpoint calls, requests, and responses.
 */

import { logger } from './logger'

export interface ApiLogEntry {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  requestBody?: any
  responseBody?: any
  error?: Error
  timestamp: string
}

class ApiLogger {
  /**
   * Log an API call
   */
  logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    error?: Error,
    requestBody?: any,
    responseBody?: any
  ): void {
    logger.logApiCall(
      endpoint,
      method,
      statusCode,
      responseTime,
      error,
      {
        requestBody: this.sanitizeBody(requestBody),
        responseBody: this.sanitizeBody(responseBody),
      }
    )
  }

  /**
   * Sanitize request/response body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body) return undefined

    // Don't log large bodies
    const bodyStr = JSON.stringify(body)
    if (bodyStr.length > 10000) {
      return { _truncated: true, _size: bodyStr.length }
    }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'apiKey', 'api_key', 'token', 'authorization', 'auth']
    const sanitized = JSON.parse(bodyStr)

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      } else if (obj && typeof obj === 'object') {
        const result: any = {}
        for (const key in obj) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '***REDACTED***'
          } else {
            result[key] = sanitizeObject(obj[key])
          }
        }
        return result
      }
      return obj
    }

    return sanitizeObject(sanitized)
  }
}

// Export singleton instance
let apiLoggerInstance: ApiLogger | null = null

export function getApiLogger(): ApiLogger {
  if (!apiLoggerInstance) {
    apiLoggerInstance = new ApiLogger()
  }
  return apiLoggerInstance
}

