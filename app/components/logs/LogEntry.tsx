'use client'

import { LogEntry, LogLevel } from '../../../lib/schema'
import { useState } from 'react'

interface LogEntryProps {
  log: LogEntry
  onSelect?: (log: LogEntry) => void
}

export default function LogEntryComponent({ log, onSelect }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false)

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error':
        return 'text-[#e53935] bg-red-50 border-red-200'
      case 'warn':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div
      className={`border rounded-md p-4 cursor-pointer transition-colors hover:bg-gray-50 ${getLevelColor(log.level)}`}
      onClick={() => {
        setExpanded(!expanded)
        onSelect?.(log)
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm uppercase">{log.level}</span>
            <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
            {log.source && (
              <span className="text-xs px-2 py-0.5 bg-white rounded border border-gray-300">
                {log.source}
              </span>
            )}
            {log.component && (
              <span className="text-xs px-2 py-0.5 bg-white rounded border border-gray-300">
                {log.component}
              </span>
            )}
            {log.endpoint && (
              <span className="text-xs px-2 py-0.5 bg-white rounded border border-gray-300 font-mono">
                {log.method} {log.endpoint}
              </span>
            )}
            {log.statusCode && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  log.statusCode >= 400
                    ? 'bg-red-100 text-red-700'
                    : log.statusCode >= 300
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {log.statusCode}
              </span>
            )}
            {log.responseTime !== undefined && (
              <span className="text-xs text-gray-500">
                {log.responseTime}ms
              </span>
            )}
          </div>
          <p className="text-sm text-gray-900 break-words">{log.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {log.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="font-semibold text-red-900 text-sm mb-1">Error Details</div>
              <div className="text-xs text-red-800">
                <div><strong>Name:</strong> {log.error.name}</div>
                <div><strong>Message:</strong> {log.error.message}</div>
                {log.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 bg-red-100 p-2 rounded">
                      {log.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {log.context && Object.keys(log.context).length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 text-sm mb-1">Context</div>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60 border border-gray-200">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          )}

          {log.performance && (
            <div>
              <div className="font-semibold text-gray-700 text-sm mb-1">Performance</div>
              <div className="text-xs text-gray-600 space-y-1">
                {log.performance.duration !== undefined && (
                  <div>Duration: {log.performance.duration.toFixed(2)}ms</div>
                )}
                {log.performance.memoryUsage !== undefined && (
                  <div>Memory: {(log.performance.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>
                )}
              </div>
            </div>
          )}

          {log.action && (
            <div className="text-xs text-gray-500">
              <strong>Action:</strong> {log.action}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

