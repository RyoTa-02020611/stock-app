'use client'

import { useEffect, useState } from 'react'
import { PlacedOrder, Position } from '../../lib/brokerClient'

interface OrderHistoryPanelProps {
  showPositions?: boolean
}

export default function OrderHistoryPanel({ showPositions = true }: OrderHistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'positions'>('orders')
  const [orders, setOrders] = useState<PlacedOrder[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/trading/orders?limit=50')
      if (!response.ok) throw new Error('注文履歴の取得に失敗しました')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/trading/positions')
      if (!response.ok) throw new Error('保有ポジションの取得に失敗しました')
      const data = await response.json()
      setPositions(data.positions || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      await Promise.all([fetchOrders(), fetchPositions()])
      setLoading(false)
    }

    loadData()

    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: '新規',
      FILLED: '約定',
      PARTIALLY_FILLED: '一部約定',
      CANCELLED: '取消',
      REJECTED: '拒否',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'text-blue-400',
      FILLED: 'text-green-400',
      PARTIALLY_FILLED: 'text-yellow-400',
      CANCELLED: 'text-gray-400',
      REJECTED: 'text-red-400',
    }
    return colors[status] || 'text-gray-300'
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-gray-400 text-sm font-medium mb-4">注文履歴・保有ポジション</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-4">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-gray-400 text-sm font-medium mb-4">注文履歴・保有ポジション</h3>
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
      <div className="p-6">
        <h3 className="text-gray-400 text-sm font-medium mb-4">注文履歴・保有ポジション</h3>

        {/* Tabs */}
        {showPositions && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              注文履歴
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'positions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              保有ポジション
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">注文履歴がありません</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">日時</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">銘柄</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">売買</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">数量</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">価格</th>
                    <th className="text-center py-3 px-4 text-gray-400 text-xs font-medium">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isBuy = order.side === 'BUY'
                    const price = order.avgFillPrice || order.limitPrice || 0
                    
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-white text-sm font-semibold">
                          {order.symbol}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              isBuy
                                ? 'bg-green-900/30 text-green-400 border border-green-700'
                                : 'bg-red-900/30 text-red-400 border border-red-700'
                            }`}
                          >
                            {isBuy ? '買い' : '売り'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          {order.filledQty || order.qty}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          ${price > 0 ? price.toFixed(2) : '--'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">保有ポジションがありません</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">銘柄</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">保有数量</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">平均取得単価</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">現在価格</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">評価額</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">評価損益</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    const isPositive = position.unrealizedPL >= 0
                    
                    return (
                      <tr
                        key={position.symbol}
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-white text-sm font-semibold">
                          {position.symbol}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          {position.qty.toLocaleString()}株
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          ${position.avgEntryPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          ${position.currentPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-white text-sm font-semibold text-right">
                          ${position.marketValue.toFixed(2)}
                        </td>
                        <td className={`py-3 px-4 text-sm font-semibold text-right ${
                          isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                          <br />
                          <span className="text-xs">
                            ({isPositive ? '+' : ''}{position.unrealizedPLPercent.toFixed(2)}%)
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
