'use client'

import { useState, useEffect } from 'react'

interface SettingsPageProps {
  tradingMode: 'paper' | 'live'
  onTradingModeChange: (mode: 'paper' | 'live') => void
}

export default function SettingsPage({ tradingMode, onTradingModeChange }: SettingsPageProps) {
  const [showLiveModeWarning, setShowLiveModeWarning] = useState(false)
  const [confirmLiveMode, setConfirmLiveMode] = useState(false)

  const handleModeChange = (newMode: 'paper' | 'live') => {
    if (newMode === 'live' && tradingMode !== 'live') {
      setShowLiveModeWarning(true)
      setConfirmLiveMode(false)
    } else {
      onTradingModeChange(newMode)
    }
  }

  const handleConfirmLiveMode = () => {
    if (confirmLiveMode) {
      onTradingModeChange('live')
      setShowLiveModeWarning(false)
      setConfirmLiveMode(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h2 className="text-white text-2xl font-bold mb-2">設定</h2>
        <p className="text-gray-400 text-sm">アプリケーションの設定を管理します</p>
      </div>

      {/* Trading Mode Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">取引モード設定</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm mb-2">現在のモード</p>
            <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
              tradingMode === 'live'
                ? 'bg-red-900/30 text-red-400 border border-red-700'
                : 'bg-blue-900/30 text-blue-400 border border-blue-700'
            }`}>
              {tradingMode === 'live' ? '本番トレードモード' : 'ペーパートレードモード'}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm mb-4">モードを切り替える</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleModeChange('paper')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  tradingMode === 'paper'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                ペーパートレード
              </button>
              <button
                onClick={() => handleModeChange('live')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  tradingMode === 'live'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                本番トレード
              </button>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">ペーパートレードモード:</strong> 実際の取引は行われません。練習やテストに使用できます。
              <br />
              <strong className="text-white">本番トレードモード:</strong> 実際の証券口座に注文が送信されます。十分に注意して使用してください。
            </p>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">一般設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              テーマ
            </label>
            <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>ダークモード</option>
              <option disabled>ライトモード（準備中）</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              言語
            </label>
            <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>日本語</option>
              <option disabled>English（準備中）</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">データ設定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">キャッシュをクリア</p>
              <p className="text-gray-500 text-xs mt-1">保存されたデータを削除します</p>
            </div>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
              クリア
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">免責事項</h3>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            本アプリケーションを使用する際は、以下の点にご注意ください：
            <br /><br />
            • 本番トレードモードでは、実際の証券口座に注文が送信されます。
            <br />
            • 投資にはリスクが伴います。損失が発生する可能性があります。
            <br />
            • 表示される情報は参考情報であり、投資の推奨や保証を意味するものではありません。
            <br />
            • 投資決定は自己責任で行ってください。
            <br />
            • 本番モードを使用する前に、必ずペーパートレードモードで十分にテストしてください。
          </p>
        </div>
      </div>

      {/* Live Mode Warning Modal */}
      {showLiveModeWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-red-700 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold">本番トレードモードへの切り替え</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-400 text-sm leading-relaxed">
                  本番トレードモードに切り替えると、実際の証券口座に注文が送信されます。
                  <br /><br />
                  この操作は取り消せません。十分に注意して使用してください。
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-gray-300 text-sm font-medium">以下の点を確認してください：</p>
                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                  <li>ペーパートレードモードで十分にテストしましたか？</li>
                  <li>ブローカーAPIの認証情報が正しく設定されていますか？</li>
                  <li>リスク管理の設定を確認しましたか？</li>
                  <li>実際の資金で取引する準備ができていますか？</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmLiveMode}
                  onChange={(e) => setConfirmLiveMode(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                />
                <span className="text-gray-300 text-sm">
                  上記の注意事項を理解し、本番トレードモードに切り替えることに同意します
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLiveModeWarning(false)
                  setConfirmLiveMode(false)
                }}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmLiveMode}
                disabled={!confirmLiveMode}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                本番モードに切り替える
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
