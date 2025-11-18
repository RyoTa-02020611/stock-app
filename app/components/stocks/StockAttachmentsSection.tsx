'use client'

import { useState, useEffect } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Attachment, AttachmentType, AttachmentStorage } from '../../lib/schema'

interface StockAttachmentsSectionProps {
  symbol: string
}

export default function StockAttachmentsSection({ symbol }: StockAttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: '決算短信',
    type: 'LINK' as AttachmentType,
    storage: 'URL' as AttachmentStorage,
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadAttachments()
  }, [symbol])

  const loadAttachments = async () => {
    try {
      setLoading(true)
      const storage = getStorageAdapter()
      const allAttachments = await storage.getAttachments({ symbol })
      setAttachments(allAttachments)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB for localStorage)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズが大きすぎます（最大5MB）')
      return
    }

    try {
      setUploading(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const fileData = e.target?.result as string
        const base64Data = fileData.split(',')[1] || fileData

        // Determine file type
        let type: AttachmentType = 'OTHER'
        if (file.type === 'application/pdf') type = 'PDF'
        else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) type = 'EXCEL'
        else if (file.type.startsWith('image/')) type = 'IMAGE'
        else if (file.type.startsWith('image/') && file.name.includes('スクショ')) type = 'SCREENSHOT'

        const storage = getStorageAdapter()
        const attachment = await storage.saveAttachment({
          symbol,
          name: file.name,
          description: formData.description,
          type,
          storage: 'LOCAL',
          fileData: base64Data,
          fileSize: file.size,
          mimeType: file.type,
          category: formData.category,
        })

        setAttachments([...attachments, attachment])
        setShowAddModal(false)
        setFormData({ name: '', description: '', url: '', category: '決算短信', type: 'LINK', storage: 'URL' })
        alert('ファイルを保存しました')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('ファイルのアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveLink = async () => {
    if (!formData.url.trim()) {
      alert('URLを入力してください')
      return
    }

    try {
      setUploading(true)
      const storage = getStorageAdapter()
      const attachment = await storage.saveAttachment({
        symbol,
        name: formData.name || formData.url,
        description: formData.description,
        url: formData.url,
        type: 'LINK',
        storage: 'URL',
        category: formData.category,
      })

      setAttachments([...attachments, attachment])
      setShowAddModal(false)
      setFormData({ name: '', description: '', url: '', category: '決算短信', type: 'LINK', storage: 'URL' })
      alert('リンクを保存しました')
    } catch (error) {
      console.error('Error saving link:', error)
      alert('リンクの保存に失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この添付ファイルを削除しますか？')) return

    try {
      const storage = getStorageAdapter()
      await storage.deleteAttachment(id)
      setAttachments(attachments.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('削除に失敗しました')
    }
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case '決算短信': return '📄'
      case '決算説明資料': return '📊'
      case 'IRページ': return '🔗'
      case 'エクセル': return '📈'
      case 'スクショ': return '📷'
      default: return '📎'
    }
  }

  const getTypeIcon = (type: AttachmentType) => {
    switch (type) {
      case 'PDF': return '📄'
      case 'EXCEL': return '📊'
      case 'IMAGE': return '🖼️'
      case 'SCREENSHOT': return '📷'
      case 'LINK': return '🔗'
      default: return '📎'
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <span>📎</span>
          ファイル・リンク保管
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 追加
        </button>
      </div>

      {attachments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          添付ファイルがありません。決算短信PDF、IRページのURL、エクセルファイルなどを保存できます。
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{getTypeIcon(attachment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{attachment.name}</p>
                    {attachment.category && (
                      <p className="text-gray-400 text-xs flex items-center gap-1">
                        {getCategoryIcon(attachment.category)} {attachment.category}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors text-sm"
                >
                  ×
                </button>
              </div>

              {attachment.description && (
                <p className="text-gray-300 text-xs mb-2 line-clamp-2">{attachment.description}</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                {attachment.storage === 'URL' && attachment.url ? (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                  >
                    🔗 リンクを開く
                  </a>
                ) : attachment.storage === 'LOCAL' && attachment.fileData ? (
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `data:${attachment.mimeType};base64,${attachment.fileData}`
                      link.download = attachment.name
                      link.click()
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                  >
                    📥 ダウンロード
                  </button>
                ) : null}
                <span className="text-gray-500 text-xs">
                  {new Date(attachment.createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-xl font-bold mb-4">ファイル・リンクを追加</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">カテゴリ</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="決算短信">決算短信</option>
                  <option value="決算説明資料">決算説明資料</option>
                  <option value="IRページ">IRページ</option>
                  <option value="エクセル">エクセル</option>
                  <option value="スクショ">スクショ</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">種類</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'LINK', storage: 'URL' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.type === 'LINK'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    リンク
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'PDF', storage: 'LOCAL' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.type !== 'LINK'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    ファイル
                  </button>
                </div>
              </div>

              {formData.type === 'LINK' ? (
                <>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">URL</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">タイトル（任意）</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="リンクのタイトル"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">ファイルを選択</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">PDF、Excel、画像ファイル（最大5MB）</p>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">メモ（任意）</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="メモを記入..."
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
              {formData.type === 'LINK' && (
                <button
                  onClick={handleSaveLink}
                  disabled={uploading || !formData.url.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '保存中...' : '保存'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

