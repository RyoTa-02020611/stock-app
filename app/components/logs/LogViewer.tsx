'use client'

import { useState, useEffect, useMemo } from 'react'
import { LogEntry, LogFilter, LogStatistics } from '../../lib/schema'
import { getLogStorage } from '../../lib/utils/logStorage'
import LogEntryComponent from './LogEntry'
import LogFilters from './LogFilters'
import LogStats from './LogStats'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStatistics | null>(null)
  const [filter, setFilter] = useState<LogFilter>({})
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [limit, setLimit] = useState(100)

  const logStorage = typeof window !== 'undefined' ? getLogStorage() : null

  const loadLogs = () => {
    if (!logStorage) {
      setLoading(false)
      return
    }

    try {
      const filteredLogs = logStorage.getLogs(filter, limit)
      const filteredStats = logStorage.getStatistics(filter)

      setLogs(filteredLogs)
      setStats(filteredStats)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filter, limit])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadLogs()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, filter, limit])

  const handleFilterChange = (newFilter: LogFilter) => {
    setFilter(newFilter)
    setLoading(true)
  }

  const handleClearFilter = () => {
    setFilter({})
    setLoading(true)
  }

  const handleExportJSON = () => {
    if (!logStorage) return

    const json = logStorage.exportLogs(filter)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (!logStorage) return

    const csv = logStorage.exportLogsToCSV(filter)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteFiltered = () => {
    if (!logStorage) return
    if (!confirm('フィルタされたログを削除しますか？')) return

    const deleted = logStorage.deleteLogs(filter)
    alert(`${deleted}件のログを削除しました`)
    loadLogs()
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !logStorage) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string
          const imported = logStorage.importLogs(json)
          alert(`${imported}件のログをインポートしました`)
          loadLogs()
        } catch (error) {
          alert('ログのインポートに失敗しました')
          console.error('Import error:', error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleClearAll = () => {
    if (!logStorage) return
    if (!confirm('すべてのログを削除しますか？この操作は取り消せません。')) return

    logStorage.clearAllLogs()
    alert('すべてのログを削除しました')
    loadLogs()
  }

  if (loading && logs.length === 0) {
    return <LoadingSpinner message="ログを読み込んでいます..." />
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && <LogStats stats={stats} />}

      {/* Filters */}
      <LogFilters filter={filter} onFilterChange={handleFilterChange} onClear={handleClearFilter} />

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-700">
              表示件数:
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              />
              自動更新 (5秒間隔)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-md text-sm font-medium shadow-sm"
            >
              更新
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              JSON エクスポート
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              CSV エクスポート
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              インポート
            </button>
            {Object.keys(filter).length > 0 && (
              <button
                onClick={handleDeleteFiltered}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#e53935] rounded-md text-sm font-medium"
              >
                フィルタ済み削除
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#e53935] rounded-md text-sm font-medium"
            >
              全削除
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <EmptyState
          icon="📋"
          title="ログが見つかりませんでした"
          message="フィルタ条件を変更して再度お試しください。"
        />
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <LogEntryComponent
              key={log.id}
              log={log}
              onSelect={setSelectedLog}
            />
          ))}
        </div>
      )}

      {/* Selected Log Details (Modal) */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ログ詳細</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <LogEntryComponent log={selectedLog} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

