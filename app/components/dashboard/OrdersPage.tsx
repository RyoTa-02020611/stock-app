'use client'

import OrderHistoryPanel from './OrderHistoryPanel'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h2 className="text-white text-2xl font-bold mb-2">注文履歴</h2>
        <p className="text-gray-400 text-sm">これまでに送信した注文の一覧です（シミュレーション）</p>
      </div>

      <OrderHistoryPanel />
    </div>
  )
}

