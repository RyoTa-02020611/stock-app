'use client'

import { useState, useEffect } from 'react'
import { getErrorAnalyzer, ErrorAnalysis } from '../lib/utils/errorAnalyzer'
import { getApiAnalyzer, ApiAnalysis } from '../lib/utils/apiAnalyzer'
import { getLogStorage } from '../lib/utils/logStorage'
import { LogFilter } from '../lib/schema'
import ErrorRateChart from '../components/analytics/ErrorRateChart'
import ApiSuccessRateChart from '../components/analytics/ApiSuccessRateChart'
import PerformanceMetricsChart from '../components/analytics/PerformanceMetricsChart'
import LogTimelineChart from '../components/analytics/LogTimelineChart'
import LogStatistics from '../components/analytics/LogStatistics'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function AnalyticsPage() {
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysis | null>(null)
  const [apiAnalysis, setApiAnalysis] = useState<ApiAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LogFilter>({})
  const [selectedTab, setSelectedTab] = useState<'overview' | 'errors' | 'api' | 'performance'>('overview')

  useEffect(() => {
    loadAnalytics()
  }, [filter])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const errorAnalyzer = getErrorAnalyzer()
      const apiAnalyzer = getApiAnalyzer()

      const errorData = errorAnalyzer.analyzeErrors(filter)
      const apiData = apiAnalyzer.analyzeApiUsage(filter)

      setErrorAnalysis(errorData)
      setApiAnalysis(apiData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <LoadingSpinner message="分析データを読み込んでいます..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">運用分析ダッシュボード</h1>
          <p className="text-gray-600">ログ統計、エラー分析、API使用状況、パフォーマンスメトリクスを可視化</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開始日時</label>
              <input
                type="datetime-local"
                value={filter.startDate ? new Date(filter.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  setFilter({
                    ...filter,
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
                  setFilter({
                    ...filter,
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0066cc] focus:border-[#0066cc]"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: '概要' },
              { id: 'errors', label: 'エラー分析' },
              { id: 'api', label: 'API分析' },
              { id: 'performance', label: 'パフォーマンス' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'text-[#0066cc] border-b-2 border-[#0066cc]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <LogStatistics filter={filter} />
            <LogTimelineChart days={7} />
            {errorAnalysis && errorAnalysis.trends.length > 0 && (
              <ErrorRateChart trends={errorAnalysis.trends} />
            )}
          </div>
        )}

        {/* Errors Tab */}
        {selectedTab === 'errors' && errorAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">総エラー数</div>
                <div className="text-2xl font-bold text-[#e53935]">{errorAnalysis.totalErrors}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">ユニークエラー</div>
                <div className="text-2xl font-bold text-gray-900">{errorAnalysis.uniqueErrors}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">エラー率</div>
                <div className="text-2xl font-bold text-gray-900">{errorAnalysis.errorRate.toFixed(2)}%</div>
              </div>
            </div>

            {errorAnalysis.trends.length > 0 && <ErrorRateChart trends={errorAnalysis.trends} />}

            {/* Most Frequent Errors */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最も頻繁に発生するエラー</h3>
              <div className="space-y-2">
                {errorAnalysis.mostFrequent.slice(0, 10).map((pattern, index) => (
                  <div key={index} className="border border-gray-200 rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{pattern.errorName}</div>
                        <div className="text-sm text-gray-600 mt-1">{pattern.message}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          発生回数: {pattern.count}回 | 初回: {new Date(pattern.firstOccurred).toLocaleString('ja-JP')} | 最終: {new Date(pattern.lastOccurred).toLocaleString('ja-JP')}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-[#e53935]">{pattern.count}</div>
                        <div className="text-xs text-gray-500">回</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Endpoints */}
            {errorAnalysis.affectedEndpoints.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">影響を受けたエンドポイント</h3>
                <div className="space-y-2">
                  {errorAnalysis.affectedEndpoints.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between border border-gray-200 rounded p-3">
                      <div className="font-mono text-sm text-gray-900">{item.endpoint}</div>
                      <div className="text-lg font-bold text-[#e53935]">{item.errorCount}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Tab */}
        {selectedTab === 'api' && apiAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">総API呼び出し</div>
                <div className="text-2xl font-bold text-gray-900">{apiAnalysis.totalApiCalls.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">ユニークエンドポイント</div>
                <div className="text-2xl font-bold text-gray-900">{apiAnalysis.uniqueEndpoints}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">平均応答時間</div>
                <div className="text-2xl font-bold text-gray-900">{apiAnalysis.averageResponseTime.toFixed(0)}ms</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">エラー率</div>
                <div className={`text-2xl font-bold ${apiAnalysis.overallErrorRate > 10 ? 'text-[#e53935]' : 'text-gray-900'}`}>
                  {apiAnalysis.overallErrorRate.toFixed(2)}%
                </div>
              </div>
            </div>

            {apiAnalysis.mostUsed.length > 0 && (
              <ApiSuccessRateChart apiUsage={apiAnalysis.mostUsed} />
            )}

            {apiAnalysis.slowest.length > 0 && (
              <PerformanceMetricsChart apiUsage={apiAnalysis.slowest} />
            )}

            {/* Most Used APIs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最も使用されるAPI</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">エンドポイント</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">呼び出し数</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">成功率</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">平均応答時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {apiAnalysis.mostUsed.slice(0, 10).map((usage, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-sm text-gray-900">
                          {usage.method} {usage.endpoint}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.count}</td>
                        <td className="px-4 py-2 text-right text-sm">
                          <span className={usage.errorRate > 10 ? 'text-[#e53935]' : 'text-[#00c853]'}>
                            {(100 - usage.errorRate).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.averageResponseTime.toFixed(0)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {selectedTab === 'performance' && apiAnalysis && (
          <div className="space-y-6">
            {apiAnalysis.slowest.length > 0 && (
              <PerformanceMetricsChart apiUsage={apiAnalysis.slowest} />
            )}

            {/* Slowest APIs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最も遅いAPI（上位10）</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">エンドポイント</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">平均</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">P50</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">P95</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">P99</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">呼び出し数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {apiAnalysis.slowest.slice(0, 10).map((usage, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-sm text-gray-900">
                          {usage.method} {usage.endpoint}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.averageResponseTime.toFixed(0)}ms</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.p50ResponseTime.toFixed(0)}ms</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.p95ResponseTime.toFixed(0)}ms</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.p99ResponseTime.toFixed(0)}ms</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-600">{usage.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

