'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { InvestmentHypothesis } from '../../lib/schema'

interface StockHypothesisTrackerProps {
  symbol: string
}

export default function StockHypothesisTracker({ symbol }: StockHypothesisTrackerProps) {
  const [hypotheses, setHypotheses] = useState<InvestmentHypothesis[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showValidateModal, setShowValidateModal] = useState<InvestmentHypothesis | null>(null)
  const [formData, setFormData] = useState({
    hypothesis: '',
  })
  const [validationData, setValidationData] = useState({
    result: 'VALID' as 'VALID' | 'INVALID',
    notes: '',
    earningsDate: '',
  })

  useEffect(() => {
    loadHypotheses()
  }, [symbol])

  const loadHypotheses = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const allHypotheses = await storage.getHypotheses({ symbol })
      setHypotheses(allHypotheses)
    } catch (error) {
      console.error('Error loading hypotheses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.hypothesis.trim()) {
      alert('仮説を入力してください')
      return
    }

    try {
      const storage = getStorageAdapter()
      await storage.saveHypothesis({
        symbol,
        hypothesis: formData.hypothesis,
        status: 'ACTIVE',
        validations: [],
        consecutiveValid: 0,
        consecutiveInvalid: 0,
        totalValid: 0,
        totalInvalid: 0,
      })

      await loadHypotheses()
      setShowAddModal(false)
      setFormData({ hypothesis: '' })
      alert('仮説を追加しました')
    } catch (error) {
      console.error('Error saving hypothesis:', error)
      alert('保存に失敗しました')
    }
  }

  const handleValidate = async (hypothesis: InvestmentHypothesis) => {
    if (!validationData.notes.trim()) {
      alert('検証メモを入力してください')
      return
    }

    try {
      const storage = getStorageAdapter()
      const isValid = validationData.result === 'VALID'
      
      const newValidation = {
        date: new Date().toISOString().split('T')[0],
        result: validationData.result,
        notes: validationData.notes,
        earningsDate: validationData.earningsDate || undefined,
      }

      const updatedValidations = [...(hypothesis.validations || []), newValidation]
      
      // Update statistics
      const consecutiveValid = isValid 
        ? (hypothesis.consecutiveValid || 0) + 1 
        : 0
      const consecutiveInvalid = !isValid 
        ? (hypothesis.consecutiveInvalid || 0) + 1 
        : 0
      const totalValid = (hypothesis.totalValid || 0) + (isValid ? 1 : 0)
      const totalInvalid = (hypothesis.totalInvalid || 0) + (!isValid ? 1 : 0)

      // Update status
      let newStatus = hypothesis.status
      if (consecutiveInvalid >= 3) {
        newStatus = 'INVALIDATED'
      } else if (consecutiveValid >= 5) {
        newStatus = 'VALIDATED'
      }

      await storage.updateHypothesis(hypothesis.id, {
        validations: updatedValidations,
        consecutiveValid,
        consecutiveInvalid,
        totalValid,
        totalInvalid,
        status: newStatus,
        lastValidatedAt: new Date().toISOString(),
      })

      await loadHypotheses()
      setShowValidateModal(null)
      setValidationData({ result: 'VALID', notes: '', earningsDate: '' })
      alert('検証結果を記録しました')
    } catch (error) {
      console.error('Error validating hypothesis:', error)
      alert('検証の記録に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この仮説を削除しますか？')) return

    try {
      const storage = getStorageAdapter()
      await storage.deleteHypothesis(id)
      await loadHypotheses()
    } catch (error) {
      console.error('Error deleting hypothesis:', error)
      alert('削除に失敗しました')
    }
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
          <span>💡</span>
          投資仮説トラッカー
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 仮説を追加
        </button>
      </div>

      {hypotheses.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">
          投資仮説がありません。仮説を追加して、決算ごとに検証していきましょう。
          <br />
          例：「iPhone売上が伸び続ける限り、EPSは平均○%成長」
        </p>
      ) : (
        <div className="space-y-4">
          {hypotheses.map((hypothesis) => (
            <div
              key={hypothesis.id}
              className="bg-gray-700/50 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        hypothesis.status === 'ACTIVE'
                          ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                          : hypothesis.status === 'VALIDATED'
                          ? 'bg-green-900/30 text-green-400 border border-green-700'
                          : hypothesis.status === 'INVALIDATED'
                          ? 'bg-red-900/30 text-red-400 border border-red-700'
                          : 'bg-gray-900/30 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {hypothesis.status === 'ACTIVE'
                        ? '検証中'
                        : hypothesis.status === 'VALIDATED'
                        ? '検証済み'
                        : hypothesis.status === 'INVALIDATED'
                        ? '無効化'
                        : 'アーカイブ'}
                    </span>
                    {hypothesis.consecutiveValid > 0 && (
                      <span className="text-green-400 text-xs font-medium">
                        ✓ {hypothesis.consecutiveValid}回連続で有効
                      </span>
                    )}
                    {hypothesis.consecutiveInvalid > 0 && (
                      <span className="text-red-400 text-xs font-medium">
                        ✗ {hypothesis.consecutiveInvalid}回連続で無効
                      </span>
                    )}
                  </div>
                  <p className="text-white font-medium text-base leading-relaxed">
                    {hypothesis.hypothesis}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setShowValidateModal(hypothesis)
                      setValidationData({ result: 'VALID', notes: '', earningsDate: '' })
                    }}
                    className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors text-xs font-medium"
                  >
                    検証
                  </button>
                  <button
                    onClick={() => handleDelete(hypothesis.id)}
                    className="text-gray-400 hover:text-red-400 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-600">
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">総検証回数</p>
                  <p className="text-white font-semibold">
                    {(hypothesis.validations || []).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">有効回数</p>
                  <p className="text-green-400 font-semibold">
                    {hypothesis.totalValid || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">無効回数</p>
                  <p className="text-red-400 font-semibold">
                    {hypothesis.totalInvalid || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">勝率</p>
                  <p className="text-white font-semibold">
                    {(hypothesis.validations || []).length > 0
                      ? Math.round(
                          ((hypothesis.totalValid || 0) /
                            (hypothesis.validations || []).length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Validation History */}
              {hypothesis.validations && hypothesis.validations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-gray-400 text-xs mb-2">検証履歴</p>
                  <div className="space-y-2">
                    {hypothesis.validations
                      .slice()
                      .reverse()
                      .slice(0, 3)
                      .map((validation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span
                            className={`mt-1 ${
                              validation.result === 'VALID'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {validation.result === 'VALID' ? '✓' : '✗'}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-300">
                              {new Date(validation.date).toLocaleDateString('ja-JP')}
                              {validation.earningsDate &&
                                ` (決算: ${new Date(validation.earningsDate).toLocaleDateString('ja-JP')})`}
                            </p>
                            {validation.notes && (
                              <p className="text-gray-400 mt-1">{validation.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-bold mb-4">仮説を追加</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">投資仮説</label>
                <textarea
                  value={formData.hypothesis}
                  onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                  placeholder="例：iPhone売上が伸び続ける限り、EPSは平均○%成長"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
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
                disabled={!formData.hypothesis.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validate Modal */}
      {showValidateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowValidateModal(null)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-bold mb-4">仮説を検証</h3>
            <p className="text-gray-300 text-sm mb-4">{showValidateModal.hypothesis}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">検証結果</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setValidationData({ ...validationData, result: 'VALID' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      validationData.result === 'VALID'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    ✓ 有効
                  </button>
                  <button
                    onClick={() => setValidationData({ ...validationData, result: 'INVALID' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      validationData.result === 'INVALID'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    ✗ 無効
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">決算日（任意）</label>
                <input
                  type="date"
                  value={validationData.earningsDate}
                  onChange={(e) =>
                    setValidationData({ ...validationData, earningsDate: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">検証メモ</label>
                <textarea
                  value={validationData.notes}
                  onChange={(e) =>
                    setValidationData({ ...validationData, notes: e.target.value })
                  }
                  placeholder="なぜ有効/無効と判断したか、その理由を記入..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowValidateModal(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleValidate(showValidateModal)}
                disabled={!validationData.notes.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                検証結果を記録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

