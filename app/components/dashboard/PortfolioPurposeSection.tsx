'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { PortfolioPurposeTag, PortfolioPurpose } from '../../lib/schema'

export default function PortfolioPurposeSection() {
  const [purposes, setPurposes] = useState<PortfolioPurposeTag[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    purpose: 'その他' as PortfolioPurpose,
    customPurpose: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    priority: '5',
  })

  useEffect(() => {
    loadPurposes()
  }, [])

  const loadPurposes = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const allPurposes = await storage.getPortfolioPurposes()
      
      // Calculate current amounts from positions
      const positions = await storage.getPositions()
      const updatedPurposes = await Promise.all(
        allPurposes.map(async (purpose) => {
          let currentAmount = 0
          if (purpose.positionIds) {
            const purposePositions = positions.filter(pos =>
              purpose.positionIds?.includes(pos.id)
            )
            currentAmount = purposePositions.reduce(
              (sum, pos) => sum + pos.marketValue,
              0
            )
          }
          return { ...purpose, currentAmount }
        })
      )
      
      setPurposes(updatedPurposes)
    } catch (error) {
      console.error('Error loading purposes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      alert('目標金額を入力してください')
      return
    }

    try {
      const storage = getStorageAdapter()
      await storage.savePortfolioPurpose({
        purpose: formData.purpose,
        customPurpose: formData.purpose === 'その他' ? formData.customPurpose : undefined,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: 0,
        targetDate: formData.targetDate || undefined,
        description: formData.description || undefined,
        priority: parseInt(formData.priority) || 5,
      })

      await loadPurposes()
      setShowAddModal(false)
      setFormData({
        purpose: 'その他',
        customPurpose: '',
        targetAmount: '',
        targetDate: '',
        description: '',
        priority: '5',
      })
      alert('目的を追加しました')
    } catch (error) {
      console.error('Error saving purpose:', error)
      alert('保存に失敗しました')
    }
  }

  const calculateProgress = (purpose: PortfolioPurposeTag): number => {
    if (purpose.targetAmount === 0) return 0
    return Math.min((purpose.currentAmount / purpose.targetAmount) * 100, 100)
  }

  const calculateProjectedAmount = (purpose: PortfolioPurposeTag, years: number): number => {
    // Simple projection: assume current growth rate continues
    const currentAmount = purpose.currentAmount
    const targetAmount = purpose.targetAmount
    const yearsToTarget = years
    
    if (currentAmount === 0) return 0
    
    // Simple linear projection (would be better with actual return rate)
    const annualGrowth = (targetAmount - currentAmount) / (yearsToTarget || 1)
    return currentAmount + (annualGrowth * years)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-900 text-lg font-semibold flex items-center gap-2">
          <span>🎯</span>
          目的別ポートフォリオ
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#0066cc] text-white rounded-md hover:bg-[#0052a3] transition-colors text-sm font-medium shadow-sm"
        >
          + 目的を追加
        </button>
      </div>

      {purposes.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">
          目的が設定されていません。「留学資金」「老後」「趣味」などの目的を設定して、進捗を管理しましょう。
        </p>
      ) : (
        <div className="space-y-4">
          {purposes.map((purpose) => {
            const progress = calculateProgress(purpose)
            const projected5y = calculateProjectedAmount(purpose, 5)
            
            return (
              <div
                key={purpose.id}
                className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-900 font-semibold text-lg">
                        {purpose.purpose === 'その他' ? purpose.customPurpose : purpose.purpose}
                      </span>
                      {purpose.priority && (
                        <span className="text-gray-600 text-xs">
                          優先度: {purpose.priority}/10
                        </span>
                      )}
                    </div>
                    {purpose.description && (
                      <p className="text-gray-600 text-sm mt-1">{purpose.description}</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-xs">進捗</span>
                    <span className="text-gray-900 font-semibold text-sm">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0066cc] to-[#00c853] h-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-600">
                      現在: ¥{purpose.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-gray-600">
                      目標: ¥{purpose.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Projection */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-600 text-xs mb-1">1年後予測</p>
                    <p className="text-gray-900 font-semibold text-sm">
                      ¥{calculateProjectedAmount(purpose, 1).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-xs mb-1">3年後予測</p>
                    <p className="text-gray-900 font-semibold text-sm">
                      ¥{calculateProjectedAmount(purpose, 3).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-xs mb-1">5年後予測</p>
                    <p className="text-gray-900 font-semibold text-sm">
                      ¥{projected5y.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                {purpose.targetDate && (
                  <p className="text-gray-600 text-xs mt-3 text-center">
                    目標日: {new Date(purpose.targetDate).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-bold mb-4">目的を追加</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">目的</label>
                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value as PortfolioPurpose })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="留学資金">留学資金</option>
                  <option value="老後">老後</option>
                  <option value="趣味">趣味</option>
                  <option value="住宅購入">住宅購入</option>
                  <option value="教育資金">教育資金</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              {formData.purpose === 'その他' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">カスタム目的名</label>
                  <input
                    type="text"
                    value={formData.customPurpose}
                    onChange={(e) =>
                      setFormData({ ...formData, customPurpose: e.target.value })
                    }
                    placeholder="目的名を入力"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">目標金額（円）</label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                  placeholder="1000000"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">目標日（任意）</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDate: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">優先度（1-10）</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">説明（任意）</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="この目的についての説明..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
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
                onClick={handleSave}
                disabled={!formData.targetAmount}
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

