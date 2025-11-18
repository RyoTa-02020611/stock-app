'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { CustomMetricView, MetricType } from '../../lib/schema'

interface StockCustomMetricsSectionProps {
  symbol: string
  financialData?: any
}

const AVAILABLE_METRICS: Array<{ type: MetricType; label: string; icon: string }> = [
  { type: 'PRICE', label: '現在価格', icon: '💰' },
  { type: 'CHANGE_PERCENT', label: '変動率', icon: '📈' },
  { type: 'VOLUME', label: '出来高', icon: '📊' },
  { type: 'MARKET_CAP', label: '時価総額', icon: '🏢' },
  { type: 'PE_RATIO', label: 'PER', icon: '📐' },
  { type: 'PB_RATIO', label: 'PBR', icon: '📊' },
  { type: 'DIVIDEND_YIELD', label: '配当利回り', icon: '💵' },
  { type: 'DIVIDEND_PAYOUT_RATIO', label: '配当性向', icon: '📈' },
  { type: 'CONSECUTIVE_DIVIDEND_YEARS', label: '連続増配年数', icon: '📅' },
  { type: 'EPS', label: 'EPS', icon: '📊' },
  { type: 'ROE', label: 'ROE', icon: '📈' },
  { type: 'ROA', label: 'ROA', icon: '📊' },
  { type: 'DEBT_TO_EQUITY', label: '負債資本比率', icon: '⚖️' },
  { type: 'CURRENT_RATIO', label: '流動比率', icon: '💧' },
  { type: 'PROFIT_MARGIN', label: '利益率', icon: '💎' },
]

export default function StockCustomMetricsSection({ symbol, financialData }: StockCustomMetricsSectionProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([])
  const [viewName, setViewName] = useState('')
  const [savedViews, setSavedViews] = useState<CustomMetricView[]>([])
  const [activeView, setActiveView] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadSavedViews()
  }, [symbol])

  const loadSavedViews = async () => {
    try {
      const storage = getStorageAdapter()
      const views = await storage.getCustomMetricViews({ symbol })
      setSavedViews(views)
      // Set default view if exists
      const defaultView = views.find(v => v.isDefault)
      if (defaultView) {
        // Load metrics for default view
        const metricIds = defaultView.metrics
        const allMetrics = await storage.getCustomMetrics({ symbol })
        const defaultMetrics = allMetrics
          .filter(m => metricIds.includes(m.id))
          .sort((a, b) => a.order - b.order)
          .map(m => m.metricType)
        setActiveView(defaultView.id)
        setSelectedMetrics(defaultMetrics)
      }
    } catch (error) {
      console.error('Error loading saved views:', error)
    }
  }

  const saveView = async () => {
    if (!viewName.trim() || selectedMetrics.length === 0) {
      alert('ビュー名と指標を選択してください')
      return
    }

    try {
      const storage = getStorageAdapter()
      
      // First, save individual metrics
      const metricIds: string[] = []
      for (let i = 0; i < selectedMetrics.length; i++) {
        const metricType = selectedMetrics[i]
        const metric = await storage.saveCustomMetric({
          symbol,
          metricType,
          displayName: AVAILABLE_METRICS.find(m => m.type === metricType)?.label || metricType,
          order: i,
          visible: true,
        })
        metricIds.push(metric.id)
      }

      // Then save the view
      const newView = await storage.saveCustomMetricView({
        symbol,
        name: viewName,
        metrics: metricIds,
        isDefault: savedViews.length === 0,
      })

      await loadSavedViews() // Reload views
      setActiveView(newView.id)
      setViewName('')
      setShowAddModal(false)
      alert('ビューを保存しました')
    } catch (error) {
      console.error('Error saving view:', error)
      alert('ビューの保存に失敗しました')
    }
  }

  const loadView = async (viewId: string) => {
    try {
      const storage = getStorageAdapter()
      const view = await storage.getCustomMetricView(viewId)
      if (view) {
        const allMetrics = await storage.getCustomMetrics({ symbol })
        const viewMetrics = allMetrics
          .filter(m => view.metrics.includes(m.id))
          .sort((a, b) => a.order - b.order)
          .map(m => m.metricType)
        setActiveView(viewId)
        setSelectedMetrics(viewMetrics)
      }
    } catch (error) {
      console.error('Error loading view:', error)
    }
  }

  const deleteView = async (viewId: string) => {
    if (!confirm('このビューを削除しますか？')) return

    try {
      const storage = getStorageAdapter()
      await storage.deleteCustomMetricView(viewId)
      setSavedViews(savedViews.filter(v => v.id !== viewId))
      if (activeView === viewId) {
        setActiveView(null)
        setSelectedMetrics([])
      }
    } catch (error) {
      console.error('Error deleting view:', error)
      alert('削除に失敗しました')
    }
  }

  const getMetricValue = (metricType: MetricType): string | number => {
    if (!financialData) return '--'
    
    switch (metricType) {
      case 'PRICE':
        return financialData.quote?.price || '--'
      case 'CHANGE_PERCENT':
        return financialData.quote?.changePercent || '--'
      case 'VOLUME':
        return financialData.quote?.volume || '--'
      case 'MARKET_CAP':
        return financialData.quote?.marketCap || '--'
      case 'PE_RATIO':
        return financialData.metrics?.find((m: any) => m.label === 'PER')?.value || '--'
      case 'PB_RATIO':
        return financialData.metrics?.find((m: any) => m.label === 'PBR')?.value || '--'
      case 'DIVIDEND_YIELD':
        return financialData.metrics?.find((m: any) => m.label === '配当利回り')?.value || '--'
      case 'DIVIDEND_PAYOUT_RATIO':
        return financialData.metrics?.find((m: any) => m.label === '配当性向')?.value || '--'
      default:
        return '--'
    }
  }

  const formatValue = (value: string | number, metricType: MetricType): string => {
    if (value === '--' || value === null || value === undefined) return '--'
    
    if (typeof value === 'string') return value
    
    switch (metricType) {
      case 'PRICE':
      case 'MARKET_CAP':
        return typeof value === 'number' ? value.toLocaleString() : value
      case 'CHANGE_PERCENT':
      case 'PE_RATIO':
      case 'PB_RATIO':
      case 'DIVIDEND_YIELD':
      case 'DIVIDEND_PAYOUT_RATIO':
      case 'ROE':
      case 'ROA':
      case 'PROFIT_MARGIN':
        return typeof value === 'number' ? `${value.toFixed(2)}%` : value
      case 'VOLUME':
        return typeof value === 'number' ? value.toLocaleString() : value
      default:
        return String(value)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <span>📊</span>
          自分の指標ビュー
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + ビューを作成
        </button>
      </div>

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-2">保存されたビュー:</p>
          <div className="flex flex-wrap gap-2">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeView === view.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <button
                  onClick={() => loadView(view.id)}
                  className="text-sm font-medium"
                >
                  {view.name}
                </button>
                <button
                  onClick={() => deleteView(view.id)}
                  className="text-xs hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Selection */}
      {selectedMetrics.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          指標を選択して、自分だけの指標ビューを作成できます。
          <br />
          例：配当目的なら「配当利回り・連続増配年数・配当性向」だけを表示
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedMetrics.map((metricType) => {
            const metric = AVAILABLE_METRICS.find(m => m.type === metricType)
            const value = getMetricValue(metricType)
            
            return (
              <div
                key={metricType}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{metric?.icon}</span>
                    <p className="text-white font-medium text-sm">{metric?.label}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMetrics(selectedMetrics.filter(m => m !== metricType))}
                    className="text-gray-400 hover:text-red-400 text-xs"
                  >
                    ×
                  </button>
                </div>
                <p className="text-white text-2xl font-bold">
                  {formatValue(value, metricType)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Metric Button */}
      {selectedMetrics.length < AVAILABLE_METRICS.length && (
        <div className="mt-4">
          <button
            onClick={() => {
              const available = AVAILABLE_METRICS.filter(m => !selectedMetrics.includes(m.type))
              if (available.length > 0) {
                const metric = available[0]
                setSelectedMetrics([...selectedMetrics, metric.type])
              }
            }}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            + 指標を追加
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-xl font-bold mb-4">指標ビューを作成</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">ビュー名</label>
                <input
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="例: 配当重視、成長株、バリュー株"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">表示する指標を選択</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {AVAILABLE_METRICS.map((metric) => (
                    <label
                      key={metric.type}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedMetrics.includes(metric.type)
                          ? 'bg-blue-600/20 border-2 border-blue-500'
                          : 'bg-gray-700 border-2 border-transparent hover:bg-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMetrics([...selectedMetrics, metric.type])
                          } else {
                            setSelectedMetrics(selectedMetrics.filter(m => m !== metric.type))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                      />
                      <span className="text-lg">{metric.icon}</span>
                      <span className="text-white text-sm">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={saveView}
                disabled={!viewName.trim() || selectedMetrics.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

