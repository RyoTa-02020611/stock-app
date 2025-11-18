/**
 * Logging Middleware for Next.js API Routes
 * 
 * Automatically logs requests and responses for API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiLogger } from './apiLogger'

export interface LoggingMiddlewareOptions {
  logRequestBody?: boolean // Log request body (default: false for security)
  logResponseBody?: boolean // Log response body (default: false for security)
  excludePaths?: string[] // Paths to exclude from logging
  excludeMethods?: string[] // HTTP methods to exclude from logging
}

const DEFAULT_OPTIONS: LoggingMiddlewareOptions = {
  logRequestBody: false,
  logResponseBody: false,
  excludePaths: [],
  excludeMethods: [],
}

/**
 * Create a logging middleware function
 */
export function createLoggingMiddleware(options: LoggingMiddlewareOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const apiLogger = getApiLogger()

  return async function loggingMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const { pathname, search } = request.nextUrl
    const endpoint = pathname + search
    const method = request.method

    // Check if path should be excluded
    if (opts.excludePaths?.some(path => pathname.includes(path))) {
      return handler(request)
    }

    // Check if method should be excluded
    if (opts.excludeMethods?.includes(method)) {
      return handler(request)
    }

    let requestBody: any = undefined
    if (opts.logRequestBody && request.body) {
      try {
        const clonedRequest = request.clone()
        requestBody = await clonedRequest.json().catch(() => undefined)
      } catch {
        // Ignore errors reading body
      }
    }

    let response: NextResponse
    let responseBody: any = undefined
    let error: Error | undefined = undefined

    try {
      response = await handler(request)

      // Try to read response body if logging is enabled
      if (opts.logResponseBody && response.body) {
        try {
          const clonedResponse = response.clone()
          responseBody = await clonedResponse.json().catch(() => undefined)
        } catch {
          // Ignore errors reading body
        }
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }

    const responseTime = Date.now() - startTime
    const statusCode = response.status

    // Log the API call
    apiLogger.logApiCall(
      endpoint,
      method,
      statusCode,
      responseTime,
      error,
      requestBody,
      responseBody
    )

    return response
  }
}

/**
 * Wrap an API route handler with logging
 */
export function withLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options?: LoggingMiddlewareOptions
): T {
  const middleware = createLoggingMiddleware(options)

  return (async (request: NextRequest, ...args: any[]) => {
    return middleware(request, handler as any)
  }) as T
}

