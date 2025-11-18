'use client'

interface ErrorDisplayProps {
  title?: string
  message: string
  error?: Error | unknown
  onRetry?: () => void
  type?: 'network' | 'api' | 'data' | 'unknown'
}

export default function ErrorDisplay({
  title,
  message,
  error,
  onRetry,
  type = 'unknown',
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )
      case 'api':
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'data':
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
    }
  }

  const getErrorColor = () => {
    switch (type) {
      case 'network':
        return 'text-amber-600'
      case 'api':
        return 'text-orange-600'
      case 'data':
        return 'text-blue-600'
      default:
        return 'text-red-600'
    }
  }

  return (
    <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className={`${getErrorColor()}`}>
          {getErrorIcon()}
        </div>
        
        <div>
          <h3 className={`text-lg font-semibold ${getErrorColor()} mb-2`}>
            {title || 'エラーが発生しました'}
          </h3>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        {error !== undefined && error !== null && process.env.NODE_ENV === 'development' && (
          <details className="w-full mt-4">
            <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-700">
              詳細情報（開発モード）
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-red-600 overflow-auto max-h-32">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </details>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-6 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  )
}

