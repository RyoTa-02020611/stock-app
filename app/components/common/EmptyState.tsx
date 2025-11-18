'use client'

interface EmptyStateProps {
  icon?: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg p-12 border border-gray-200 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {icon ? (
          <div className="text-5xl">{icon}</div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        )}
        
        <div>
          <h3 className="text-gray-900 text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-4 px-6 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

