'use client'

import LogViewer from '../components/logs/LogViewer'

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ログビューアー</h1>
          <p className="text-gray-600">アプリケーションのログを閲覧・検索・分析できます</p>
        </div>
        <LogViewer />
      </div>
    </div>
  )
}

