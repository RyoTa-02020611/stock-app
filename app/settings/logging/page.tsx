'use client'

import { useState, useEffect } from 'react'
import { getLogStorage } from '../../lib/utils/logStorage'
import { getErrorNotifier, ErrorThreshold } from '../../lib/utils/errorNotifier'
import { getPerformanceMonitor } from '../../lib/utils/performanceMonitor'
import { logger } from '../../lib/utils/logger'
import { LogLevel } from '../../lib/schema'

export default function LoggingSettingsPage() {
  const [maxLogs, setMaxLogs] = useState(10000)
  const [retentionDays, setRetentionDays] = useState(30)
  const [enableRotation, setEnableRotation] = useState(true)
  const [minLogLevel, setMinLogLevel] = useState<LogLevel>('debug')
  const [enablePersistence, setEnablePersistence] = useState(true)
  const [errorThresholds, setErrorThresholds] = useState<ErrorThreshold[]>([])
  const [performanceThresholds, setPerformanceThresholds] = useState<Array<{ name: string; threshold: number; action: 'warn' | 'error' }>>([])
  const [saved, setSaved] = useState(false)

  const logStorage = typeof window !== 'undefined' ? getLogStorage() : null
  const errorNotifier = typeof window !== 'undefined' ? getErrorNotifier() : null
  const performanceMonitor = typeof window !== 'undefined' ? getPerformanceMonitor() : null

  useEffect(() => {
    if (logStorage) {
      const settings = logStorage.getSettings()
      setMaxLogs(settings.maxLogs)
      setRetentionDays(settings.retentionDays)
      setEnableRotation(settings.enableRotation)
    }

    if (errorNotifier) {
      setErrorThresholds(errorNotifier.getThresholds())
    }

    // Load performance thresholds (if stored)
    if (performanceMonitor) {
      // Performance thresholds are managed in memory for now
      // Could be stored in localStorage if needed
    }
  }, [])

  const handleSave = () => {
    if (logStorage) {
      logStorage.saveSettings({
        maxLogs,
        retentionDays,
        enableRotation,
      })
    }

    logger.setMinLogLevel(minLogLevel)
    logger.setPersistenceEnabled(enablePersistence)

    if (errorNotifier) {
      errorNotifier.setThresholds(errorThresholds)
    }

    if (performanceMonitor) {
      performanceThresholds.forEach(pt => {
        performanceMonitor.setThreshold(pt.name, pt.threshold, pt.action)
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const addErrorThreshold = () => {
    setErrorThresholds([
      ...errorThresholds,
      {
        errorRate: 10,
        action: 'warn',
      },
    ])
  }

  const removeErrorThreshold = (index: number) => {
    setErrorThresholds(errorThresholds.filter((_, i) => i !== index))
  }

  const updateErrorThreshold = (index: number, updates: Partial<ErrorThreshold>) => {
    const newThresholds = [...errorThresholds]
    newThresholds[index] = { ...newThresholds[index], ...updates }
    setErrorThresholds(newThresholds)
  }

  const addPerformanceThreshold = () => {
    setPerformanceThresholds([
      ...performanceThresholds,
      {
        name: '',
        threshold: 1000,
        action: 'warn',
      },
    ])
  }

  const removePerformanceThreshold = (index: number) => {
    setPerformanceThresholds(performanceThresholds.filter((_, i) => i !== index))
  }

  const updatePerformanceThreshold = (
    index: number,
    updates: Partial<{ name: string; threshold: number; action: 'warn' | 'error' }>
  ) => {
    const newThresholds = [...performanceThresholds]
    newThresholds[index] = { ...newThresholds[index], ...updates }
    setPerformanceThresholds(newThresholds)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ロギング設定</h1>
          <p className="text-gray-600">ログの保持期間、レベル、閾値、通知設定を管理できます</p>
        </div>

        {/* Log Storage Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ログストレージ設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大ログ数
              </label>
              <input
                type="number"
                value={maxLogs}
                onChange={(e) => setMaxLogs(parseInt(e.target.value) || 10000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                min={100}
                max={100000}
              />
              <p className="text-xs text-gray-500 mt-1">保持するログの最大数（100〜100,000）</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保持期間（日）
              </label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                min={1}
                max={365}
              />
              <p className="text-xs text-gray-500 mt-1">ログを保持する日数（1〜365日）</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableRotation"
                checked={enableRotation}
                onChange={(e) => setEnableRotation(e.target.checked)}
                className="rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              />
              <label htmlFor="enableRotation" className="text-sm text-gray-700">
                自動ローテーションを有効にする
              </label>
            </div>
          </div>
        </div>

        {/* Log Level Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ログレベル設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最小ログレベル（永続化）
              </label>
              <select
                value={minLogLevel}
                onChange={(e) => setMinLogLevel(e.target.value as LogLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              >
                <option value="debug">DEBUG</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">このレベル以上のログが永続化されます</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enablePersistence"
                checked={enablePersistence}
                onChange={(e) => setEnablePersistence(e.target.checked)}
                className="rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              />
              <label htmlFor="enablePersistence" className="text-sm text-gray-700">
                ログの永続化を有効にする
              </label>
            </div>
          </div>
        </div>

        {/* Error Thresholds */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">エラー閾値</h2>
            <button
              onClick={addErrorThreshold}
              className="px-4 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-md text-sm font-medium shadow-sm"
            >
              追加
            </button>
          </div>
          <div className="space-y-4">
            {errorThresholds.map((threshold, index) => (
              <div key={index} className="border border-gray-200 rounded p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      エラー率 (%)
                    </label>
                    <input
                      type="number"
                      value={threshold.errorRate || ''}
                      onChange={(e) =>
                        updateErrorThreshold(index, {
                          errorRate: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                      placeholder="例: 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      エラー数
                    </label>
                    <input
                      type="number"
                      value={threshold.errorCount || ''}
                      onChange={(e) =>
                        updateErrorThreshold(index, {
                          errorCount: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                      placeholder="例: 100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アクション
                    </label>
                    <select
                      value={threshold.action}
                      onChange={(e) =>
                        updateErrorThreshold(index, {
                          action: e.target.value as 'warn' | 'error' | 'critical',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                    >
                      <option value="warn">警告</option>
                      <option value="error">エラー</option>
                      <option value="critical">重大</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => removeErrorThreshold(index)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#e53935] rounded-md text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {errorThresholds.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">閾値が設定されていません</p>
            )}
          </div>
        </div>

        {/* Performance Thresholds */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">パフォーマンス閾値</h2>
            <button
              onClick={addPerformanceThreshold}
              className="px-4 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-md text-sm font-medium shadow-sm"
            >
              追加
            </button>
          </div>
          <div className="space-y-4">
            {performanceThresholds.map((threshold, index) => (
              <div key={index} className="border border-gray-200 rounded p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メトリクス名
                    </label>
                    <input
                      type="text"
                      value={threshold.name}
                      onChange={(e) =>
                        updatePerformanceThreshold(index, { name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                      placeholder="例: api_call"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      閾値 (ms)
                    </label>
                    <input
                      type="number"
                      value={threshold.threshold}
                      onChange={(e) =>
                        updatePerformanceThreshold(index, {
                          threshold: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アクション
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={threshold.action}
                        onChange={(e) =>
                          updatePerformanceThreshold(index, {
                            action: e.target.value as 'warn' | 'error',
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
                      >
                        <option value="warn">警告</option>
                        <option value="error">エラー</option>
                      </select>
                      <button
                        onClick={() => removePerformanceThreshold(index)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-[#e53935] rounded-md text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {performanceThresholds.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">閾値が設定されていません</p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-md font-medium shadow-sm ${
              saved
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-[#0066cc] hover:bg-[#0052a3] text-white'
            }`}
          >
            {saved ? '✓ 保存しました' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

