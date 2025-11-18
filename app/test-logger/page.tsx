'use client'

import { useState } from 'react'

/**
 * Logger Test Page
 * 
 * This page provides a UI to test the logger functionality.
 * Use this to verify that logging is working correctly in the browser and server.
 */

export default function TestLoggerPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  const testBasicLogger = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/test/logger')
      const data = await response.json()
      setResults({
        success: data.success,
        message: data.message,
        data: data,
      })
    } catch (error) {
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const testDataSourcesLogger = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/test/data-sources')
      const data = await response.json()
      setResults({
        success: data.success,
        message: data.message,
        data: data,
      })
    } catch (error) {
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const testClientSideLogger = () => {
    // Test client-side logging (if logger is available on client)
    try {
      // This will only work if logger is imported on client side
      console.log('[CLIENT] Test log message')
      console.warn('[CLIENT] Test warn message')
      console.error('[CLIENT] Test error message')
      
      setResults({
        success: true,
        message: 'Client-side console logs generated. Check browser console.',
      })
    } catch (error) {
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">ロガー動作確認</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">テスト方法</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-6">
            <li>以下のボタンをクリックしてテストを実行</li>
            <li>ブラウザの開発者ツール（F12）を開く</li>
            <li>「Console」タブを確認</li>
            <li>サーバーサイドのログは、ターミナル（Next.js開発サーバー）で確認</li>
          </ol>

          <div className="space-y-4">
            <button
              onClick={testBasicLogger}
              disabled={loading}
              className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white font-medium py-3 px-6 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'テスト実行中...' : '基本ロガーテスト（サーバーサイド）'}
            </button>

            <button
              onClick={testDataSourcesLogger}
              disabled={loading}
              className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white font-medium py-3 px-6 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'テスト実行中...' : 'データソースロガーテスト（サーバーサイド）'}
            </button>

            <button
              onClick={testClientSideLogger}
              disabled={loading}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              クライアントサイドコンソールログテスト
            </button>
          </div>
        </div>

        {results && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${
            results.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              results.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {results.success ? '✓ テスト成功' : '✗ テスト失敗'}
            </h3>
            <p className={`mb-4 ${results.success ? 'text-green-700' : 'text-red-700'}`}>
              {results.message}
            </p>
            {results.data && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  詳細情報を表示
                </summary>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">確認ポイント</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
            <li>開発環境（development）では、すべてのログがコンソールに表示されます</li>
            <li>本番環境（production）では、ERRORレベルのログのみがエラートラッキングサービスに送信されます</li>
            <li>ログにはタイムスタンプ、メッセージ、コンテキスト情報が含まれます</li>
            <li>エラーログには、エラーオブジェクトの詳細（name、message、stack）が含まれます</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">注意事項</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
            <li>データソースのテストは、APIキーが設定されていない場合、エラーログが生成される可能性があります（これは正常な動作です）</li>
            <li>サーバーサイドのログは、Next.js開発サーバーのターミナル出力で確認できます</li>
            <li>ブラウザのコンソールでは、クライアントサイドのログのみが表示されます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

