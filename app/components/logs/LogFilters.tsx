'use client'

import { LogFilter, LogLevel } from '../../lib/schema'
import { useState } from 'react'

interface LogFiltersProps {
  filter: LogFilter
  onFilterChange: (filter: LogFilter) => void
  onClear: () => void
}

export default function LogFilters({ filter, onFilterChange, onClear }: LogFiltersProps) {
  const [expanded, setExpanded] = useState(false)

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']

  const updateFilter = (updates: Partial<LogFilter>) => {
    onFilterChange({ ...filter, ...updates })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">フィルタ</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            クリア
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-[#0066cc] hover:text-[#0052a3] px-3 py-1.5 rounded-md hover:bg-blue-50"
          >
            {expanded ? '折りたたむ' : '展開'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Log Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ログレベル</label>
            <div className="flex flex-wrap gap-2">
              {levels.map(level => {
                const isSelected = Array.isArray(filter.level)
                  ? filter.level.includes(level)
                  : filter.level === level
                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (Array.isArray(filter.level)) {
                        const newLevels = isSelected
                          ? filter.level.filter(l => l !== level)
                          : [...filter.level, level]
                        updateFilter({ level: newLevels.length > 0 ? newLevels : undefined })
                      } else {
                        updateFilter({ level: isSelected ? undefined : level })
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#0066cc] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開始日時</label>
              <input
                type="datetime-local"
                value={filter.startDate ? new Date(filter.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  updateFilter({
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">終了日時</label>
              <input
                type="datetime-local"
                value={filter.endDate ? new Date(filter.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  updateFilter({
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              />
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
            <input
              type="text"
              placeholder="メッセージやコンテキストを検索..."
              value={filter.search || ''}
              onChange={(e) => updateFilter({ search: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
            />
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ソース</label>
            <input
              type="text"
              placeholder="ソース名でフィルタ..."
              value={filter.source || ''}
              onChange={(e) => updateFilter({ source: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
            />
          </div>

          {/* Component Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">コンポーネント</label>
            <input
              type="text"
              placeholder="コンポーネント名でフィルタ..."
              value={filter.component || ''}
              onChange={(e) => updateFilter({ component: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
            />
          </div>

          {/* Endpoint Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">エンドポイント</label>
            <input
              type="text"
              placeholder="エンドポイントでフィルタ..."
              value={filter.endpoint || ''}
              onChange={(e) => updateFilter({ endpoint: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
            />
          </div>

          {/* Status Code Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータスコード</label>
            <input
              type="number"
              placeholder="ステータスコードでフィルタ..."
              value={filter.statusCode || ''}
              onChange={(e) => updateFilter({ statusCode: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
            />
          </div>

          {/* Response Time Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最小応答時間 (ms)</label>
              <input
                type="number"
                placeholder="最小..."
                value={filter.minResponseTime || ''}
                onChange={(e) => updateFilter({ minResponseTime: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最大応答時間 (ms)</label>
              <input
                type="number"
                placeholder="最大..."
                value={filter.maxResponseTime || ''}
                onChange={(e) => updateFilter({ maxResponseTime: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

