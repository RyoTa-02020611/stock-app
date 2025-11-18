'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Note, NoteType } from '../../lib/schema'

interface StockNotesSectionProps {
  symbol: string
}

export default function StockNotesSection({ symbol }: StockNotesSectionProps) {
  const [myNotes, setMyNotes] = useState<Note | null>(null)
  const [investmentReason, setInvestmentReason] = useState('')
  const [risks, setRisks] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [symbol])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const notes = await storage.getNotes({ symbol })
      
      // 自分のメモを探す（GENERALタイプ）
      const myNote = notes.find(n => n.type === 'GENERAL')
      if (myNote) {
        setMyNotes(myNote)
        const content = myNote.content || ''
        
        // 投資理由とリスクを抽出
        const reasonMatch = content.match(/## 投資理由\s*\n\n([\s\S]*?)(?=\n##|$)/)
        const riskMatch = content.match(/## リスク\s*\n\n([\s\S]*?)(?=\n##|$)/)
        
        if (reasonMatch) {
          setInvestmentReason(reasonMatch[1].trim())
        }
        if (riskMatch) {
          setRisks(riskMatch[1].trim())
        }
      }
      
      // 投資理由専用のメモを探す
      const reasonNote = notes.find(n => n.tags?.includes('投資理由'))
      if (reasonNote && !investmentReason) {
        setInvestmentReason(reasonNote.content || '')
      }
      
      // リスク専用のメモを探す
      const riskNote = notes.find(n => n.tags?.includes('リスク'))
      if (riskNote && !risks) {
        setRisks(riskNote.content || '')
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)
      const storage = getStorageAdapter()
      
      // メモ内容を構築
      const content = `## 投資理由\n\n${investmentReason}\n\n## リスク\n\n${risks}`
      
      if (myNotes) {
        // 既存のメモを更新
        await storage.updateNote(myNotes.id, {
          content,
          title: `${symbol} - 投資メモ`,
        })
      } else {
        // 新しいメモを作成
        await storage.saveNote({
          symbol,
          title: `${symbol} - 投資メモ`,
          content,
          type: 'GENERAL',
          tags: ['投資理由', 'リスク'],
        })
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      // 再読み込み
      await loadNotes()
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('保存に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 自分のメモ */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📝</span>
          自分のメモ
        </h3>
        <textarea
          value={myNotes?.content || ''}
          onChange={(e) => {
            if (myNotes) {
              setMyNotes({ ...myNotes, content: e.target.value })
            } else {
              // 新しいメモを作成する準備
              const content = e.target.value
              const reasonMatch = content.match(/## 投資理由\s*\n\n([\s\S]*?)(?=\n##|$)/)
              const riskMatch = content.match(/## リスク\s*\n\n([\s\S]*?)(?=\n##|$)/)
              
              if (reasonMatch) setInvestmentReason(reasonMatch[1].trim())
              if (riskMatch) setRisks(riskMatch[1].trim())
            }
          }}
          placeholder="この銘柄についてのメモを自由に記入してください。&#10;&#10;例：&#10;## 投資理由&#10;&#10;成長性が高い&#10;&#10;## リスク&#10;&#10;市場変動リスク"
          className="w-full h-48 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={async () => {
              if (!myNotes) return
              try {
                setSaving(true)
                const storage = getStorageAdapter()
                await storage.updateNote(myNotes.id, {
                  content: myNotes.content,
                })
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
              } catch (error) {
                console.error('Error saving note:', error)
                alert('保存に失敗しました')
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving || !myNotes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '保存中...' : saved ? '✓ 保存しました' : '保存'}
          </button>
        </div>
      </div>

      {/* 投資理由 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <span>💡</span>
          投資理由
        </h3>
        <textarea
          value={investmentReason}
          onChange={(e) => setInvestmentReason(e.target.value)}
          placeholder="この銘柄に投資する理由を記入してください。&#10;&#10;例：&#10;・成長性が高い&#10;・財務状況が良好&#10;・業界のリーダー企業"
          className="w-full h-40 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="mt-2 text-xs text-gray-400">
          なぜこの銘柄に投資するのか、その理由を明確にしておくことで、投資判断の一貫性を保つことができます。
        </p>
      </div>

      {/* リスク */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <span>⚠️</span>
          リスク
        </h3>
        <textarea
          value={risks}
          onChange={(e) => setRisks(e.target.value)}
          placeholder="この銘柄に投資する際のリスクを記入してください。&#10;&#10;例：&#10;・市場変動リスク&#10;・業績悪化の可能性&#10;・競合他社の台頭"
          className="w-full h-40 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="mt-2 text-xs text-gray-400">
          リスクを事前に認識しておくことで、適切なリスク管理が可能になります。
        </p>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              保存中...
            </>
          ) : saved ? (
            <>
              <span>✓</span>
              保存しました
            </>
          ) : (
            '投資理由・リスクを保存'
          )}
        </button>
      </div>
    </div>
  )
}

