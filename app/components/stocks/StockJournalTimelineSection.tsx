'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { InvestmentJournalEntry } from '../../lib/schema'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface StockJournalTimelineSectionProps {
  symbol: string
}

export default function StockJournalTimelineSection({ symbol }: StockJournalTimelineSectionProps) {
  const [entries, setEntries] = useState<InvestmentJournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<InvestmentJournalEntry | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
  })

  useEffect(() => {
    loadEntries()
  }, [symbol])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const allEntries = await storage.getJournalEntries({ symbol })
      
      // Fetch price data for entries that don't have it
      const entriesWithPrices = await Promise.all(
        allEntries.map(async (entry) => {
          if (entry.priceAtDate) {
            return entry
          }
          
          // Try to fetch historical price for this date
          try {
            const response = await fetch(
              `/api/stocks/${encodeURIComponent(symbol)}/chart?range=1y&endDate=${entry.date}`
            )
            if (response.ok) {
              const chartData = await response.json()
              if (chartData.data && chartData.data.length > 0) {
                const priceData = chartData.data[chartData.data.length - 1]
                return {
                  ...entry,
                  priceAtDate: priceData.close || priceData.price,
                  changeAtDate: priceData.change,
                  changePercentAtDate: priceData.changePercent,
                  volumeAtDate: priceData.volume,
                  chartDataSnapshot: chartData.data.slice(-30), // Last 30 days
                }
              }
            }
          } catch (error) {
            console.error('Error fetching price data:', error)
          }
          
          return entry
        })
      )
      
      setEntries(entriesWithPrices)
    } catch (error) {
      console.error('Error loading journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.content.trim()) {
      alert('内容を入力してください')
      return
    }

    try {
      const storage = getStorageAdapter()
      
      // Fetch current price data
      let priceData: any = null
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/overview`)
        if (response.ok) {
          const data = await response.json()
          priceData = data.quote
        }
      } catch (error) {
        console.error('Error fetching price data:', error)
      }

      // Fetch chart data for snapshot
      let chartSnapshot: any[] = []
      try {
        const chartResponse = await fetch(
          `/api/stocks/${encodeURIComponent(symbol)}/chart?range=1mo&endDate=${formData.date}`
        )
        if (chartResponse.ok) {
          const chartData = await chartResponse.json()
          chartSnapshot = chartData.data?.slice(-30) || []
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      }

      if (editingEntry) {
        await storage.updateJournalEntry(editingEntry.id, {
          date: formData.date,
          title: formData.title,
          content: formData.content,
          priceAtDate: priceData?.price,
          changeAtDate: priceData?.change,
          changePercentAtDate: priceData?.changePercent,
          volumeAtDate: priceData?.volume,
          chartDataSnapshot: chartSnapshot,
        })
      } else {
        await storage.saveJournalEntry({
          symbol,
          date: formData.date,
          title: formData.title,
          content: formData.content,
          priceAtDate: priceData?.price,
          changeAtDate: priceData?.change,
          changePercentAtDate: priceData?.changePercent,
          volumeAtDate: priceData?.volume,
          chartDataSnapshot: chartSnapshot,
        })
      }

      await loadEntries()
      setShowAddModal(false)
      setEditingEntry(null)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: '',
      })
      alert(editingEntry ? '日記を更新しました' : '日記を追加しました')
    } catch (error) {
      console.error('Error saving journal entry:', error)
      alert('保存に失敗しました')
    }
  }

  const handleEdit = (entry: InvestmentJournalEntry) => {
    setEditingEntry(entry)
    setFormData({
      date: entry.date,
      title: entry.title || '',
      content: entry.content,
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この日記エントリを削除しますか？')) return

    try {
      const storage = getStorageAdapter()
      await storage.deleteJournalEntry(id)
      await loadEntries()
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      alert('削除に失敗しました')
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <span>📔</span>
          投資日記タイムライン
        </h3>
        <button
          onClick={() => {
            setEditingEntry(null)
            setFormData({
              date: new Date().toISOString().split('T')[0],
              title: '',
              content: '',
            })
            setShowAddModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 日記を追加
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">
          投資日記がありません。日記を追加して、投資の記録を残しましょう。
          <br />
          例：「決算を見て長期ホールドに方針変更」「目標株価を上方修正」
        </p>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex gap-6">
                {/* Left: Timeline and Content */}
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-gray-800"></div>
                      <div className="w-0.5 h-full bg-gray-600 mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {formatDate(entry.date)}
                          </p>
                          {entry.title && (
                            <p className="text-gray-300 text-sm mt-1">{entry.title}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-gray-400 hover:text-blue-400 text-sm"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-gray-400 hover:text-red-400 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Price and Chart */}
                {entry.priceAtDate && (
                  <div className="w-80 space-y-4">
                    {/* Price Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                      <p className="text-gray-400 text-xs mb-2">その日の株価</p>
                      <div className="flex items-baseline gap-2 mb-1">
                        <p className="text-white text-2xl font-bold">
                          ¥{entry.priceAtDate.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        {entry.changeAtDate !== undefined && (
                          <p
                            className={`text-sm font-semibold ${
                              entry.changeAtDate >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {entry.changeAtDate >= 0 ? '+' : ''}
                            {entry.changeAtDate.toFixed(2)} (
                            {entry.changePercentAtDate !== undefined &&
                              `${entry.changePercentAtDate >= 0 ? '+' : ''}${entry.changePercentAtDate.toFixed(2)}%`}
                            )
                          </p>
                        )}
                      </div>
                      {entry.volumeAtDate && (
                        <p className="text-gray-400 text-xs">
                          出来高: {entry.volumeAtDate.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Mini Chart */}
                    {entry.chartDataSnapshot && entry.chartDataSnapshot.length > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                        <p className="text-gray-400 text-xs mb-2">その時点でのチャート（過去30日）</p>
                        <ResponsiveContainer width="100%" height={120}>
                          <LineChart data={entry.chartDataSnapshot.map((d: any) => ({
                            date: d.date,
                            close: d.close || d.price || d.value,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#9CA3AF', fontSize: 10 }}
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getMonth() + 1}/${date.getDate()}`
                              }}
                            />
                            <YAxis
                              tick={{ fill: '#9CA3AF', fontSize: 10 }}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                              }}
                              labelFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('ja-JP')
                              }}
                              formatter={(value: any, name: any, props: any) => {
                                const price = props.payload.close || props.payload.price || props.payload.value || value
                                return [
                                  `¥${price.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`,
                                  '価格',
                                ]
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="close"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowAddModal(false)
            setEditingEntry(null)
          }}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-bold mb-4">
              {editingEntry ? '日記を編集' : '日記を追加'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">日付</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">タイトル（任意）</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例: 決算を見て長期ホールドに方針変更"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="例：決算を見て長期ホールドに方針変更。業績が堅調で配当も増額されたため、目標株価を上方修正。"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingEntry(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.content.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingEntry ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

