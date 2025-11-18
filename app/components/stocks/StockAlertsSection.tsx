'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Alert, AlertType, AlertCondition, AlertStatus } from '../../lib/schema'

interface StockAlertsSectionProps {
  symbol: string
}

export default function StockAlertsSection({ symbol }: StockAlertsSectionProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'PRICE' as AlertType,
    condition: 'ABOVE' as AlertCondition,
    targetValue: '',
    keywords: '',
    reason: '',
    notes: '',
    expiresAt: '',
  })

  useEffect(() => {
    loadAlerts()
  }, [symbol])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const savedAlerts = await storage.getAlerts({ symbol })
      setAlerts(savedAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAlert = async () => {
    if (!formData.targetValue && formData.type !== 'NEWS') {
      alert('目標値を入力してください')
      return
    }

    try {
      const storage = getStorageAdapter()
      const newAlert = await storage.saveAlert({
        symbol,
        type: formData.type,
        condition: formData.condition,
        status: 'ACTIVE',
        notifyOnTrigger: true,
        targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : undefined,
        reason: formData.reason,
        notes: formData.notes,
        expiresAt: formData.expiresAt || undefined,
      })

      setAlerts([...alerts, newAlert])
      setShowAddModal(false)
      setFormData({
        type: 'PRICE',
        condition: 'ABOVE',
        targetValue: '',
        keywords: '',
        reason: '',
        notes: '',
        expiresAt: '',
      })
      alert('アラートを設定しました')
    } catch (error) {
      console.error('Error saving alert:', error)
      alert('アラートの保存に失敗しました')
    }
  }

  const deleteAlert = async (id: string) => {
    if (!confirm('このアラートを削除しますか？')) return

    try {
      const storage = getStorageAdapter()
      await storage.deleteAlert(id)
      setAlerts(alerts.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting alert:', error)
      alert('削除に失敗しました')
    }
  }

  const toggleAlertStatus = async (id: string) => {
    try {
      const storage = getStorageAdapter()
      const alert = alerts.find(a => a.id === id)
      if (!alert) return

      const newStatus = alert.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      await storage.updateAlert(id, { status: newStatus })
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: newStatus } : a))
    } catch (error) {
      console.error('Error updating alert:', error)
      alert('ステータスの更新に失敗しました')
    }
  }

  const getAlertTypeLabel = (type: AlertType): string => {
    const labels: Record<AlertType, string> = {
      PRICE: '価格',
      DIVIDEND: '配当',
      NEWS: 'ニュース',
      VOLUME: '出来高',
      CHANGE_PERCENT: '変動率',
      CUSTOM: 'カスタム',
    }
    return labels[type] || type
  }

  const getConditionLabel = (condition: AlertCondition): string => {
    const labels: Record<AlertCondition, string> = {
      ABOVE: '以上',
      BELOW: '以下',
      EQUALS: '等しい',
      CHANGE: '変動',
      NEWS_KEYWORD: 'キーワード',
    }
    return labels[condition] || condition
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <span>🔔</span>
          アラート設定
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + アラートを追加
        </button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          アラートが設定されていません。価格、配当、ニュースなどの条件でアラートを設定できます。
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.status === 'ACTIVE'
                        ? 'bg-green-900/30 text-green-400 border border-green-700'
                        : 'bg-gray-900/30 text-gray-400 border border-gray-700'
                    }`}>
                      {alert.status === 'ACTIVE' ? '有効' : '一時停止'}
                    </span>
                    <span className="text-white font-medium text-sm">
                      {getAlertTypeLabel(alert.type)}: {getConditionLabel(alert.condition)}
                    </span>
                    {alert.targetValue && (
                      <span className="text-gray-300 text-sm">
                        {alert.targetValue}
                      </span>
                    )}
                  </div>
                  {alert.reason && (
                    <p className="text-gray-300 text-xs mb-1">
                      <span className="text-gray-400">理由:</span> {alert.reason}
                    </p>
                  )}
                  {alert.notes && (
                    <p className="text-gray-400 text-xs">{alert.notes}</p>
                  )}
                  {alert.keywords && alert.keywords.length > 0 && (
                    <p className="text-gray-400 text-xs mt-1">
                      キーワード: {alert.keywords.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlertStatus(alert.id)}
                    className={`px-3 py-1 rounded text-xs ${
                      alert.status === 'ACTIVE'
                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    }`}
                  >
                    {alert.status === 'ACTIVE' ? '一時停止' : '有効化'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="text-gray-400 hover:text-red-400 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                作成日: {new Date(alert.createdAt).toLocaleDateString('ja-JP')}
                {alert.expiresAt && ` | 有効期限: ${new Date(alert.expiresAt).toLocaleDateString('ja-JP')}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-xl font-bold mb-4">アラートを追加</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">アラートタイプ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertType })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRICE">価格</option>
                  <option value="DIVIDEND">配当</option>
                  <option value="NEWS">ニュース</option>
                  <option value="VOLUME">出来高</option>
                  <option value="CHANGE_PERCENT">変動率</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">条件</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertCondition })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ABOVE">以上</option>
                  <option value="BELOW">以下</option>
                  <option value="EQUALS">等しい</option>
                  {formData.type === 'NEWS' && <option value="NEWS_KEYWORD">キーワード</option>}
                </select>
              </div>

              {formData.type !== 'NEWS' ? (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">目標値</label>
                  <input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="例: 150.00"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">キーワード（カンマ区切り）</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="例: 決算, 業績, 買収"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  なんでこのアラートを置いたか（理由）
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="例: 150円を超えたら利益確定を検討するため"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">メモ（任意）</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="追加のメモ..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">有効期限（任意）</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                onClick={saveAlert}
                disabled={!formData.targetValue && formData.type !== 'NEWS'}
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

