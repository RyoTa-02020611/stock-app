'use client'

import { useState, useEffect } from 'react'
import { PlacedOrder } from '../../lib/brokerClient'

interface OrderPanelProps {
  symbol: string
  tradingMode: 'paper' | 'live'
  onOrderPlaced?: (order: PlacedOrder) => void
}

// Order confirmation modal
function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  orderDetails,
  tradingMode,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  orderDetails: {
    symbol: string
    side: 'BUY' | 'SELL'
    qty: number
    type: 'MARKET' | 'LIMIT'
    limitPrice?: number
  }
  tradingMode: 'paper' | 'live'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl max-w-md w-full p-6">
        <h3 className="text-white text-xl font-bold mb-4">注文確認</h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">銘柄:</span>
            <span className="text-white font-semibold">{orderDetails.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">売買区分:</span>
            <span className={`font-semibold ${orderDetails.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
              {orderDetails.side === 'BUY' ? '買い' : '売り'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">数量:</span>
            <span className="text-white font-semibold">{orderDetails.qty}株</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">注文タイプ:</span>
            <span className="text-white font-semibold">
              {orderDetails.type === 'MARKET' ? '成行' : '指値'}
            </span>
          </div>
          {orderDetails.type === 'LIMIT' && orderDetails.limitPrice && (
            <div className="flex justify-between">
              <span className="text-gray-400">指値価格:</span>
              <span className="text-white font-semibold">${orderDetails.limitPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">モード:</span>
              <span className={`font-semibold ${
                tradingMode === 'live' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {tradingMode === 'live' 
                  ? '本番トレードモード（実際に注文が発注されます）'
                  : 'ペーパートレードモード'}
              </span>
            </div>
          </div>
        </div>

        {tradingMode === 'live' && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">
              ⚠️ 本番モードでは、実際の証券口座に注文が送信されます。この操作は取り消せません。
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
              orderDetails.side === 'BUY'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            注文を確定
          </button>
        </div>
      </div>
    </div>
  )
}

// Order panel component for buy/sell orders
export default function OrderPanel({ symbol, tradingMode, onOrderPlaced }: OrderPanelProps) {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [orderMethod, setOrderMethod] = useState<'market' | 'limit'>('market')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [timeInForce, setTimeInForce] = useState<'DAY' | 'GTC'>('DAY')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<any>(null)

  // Update symbol when prop changes
  useEffect(() => {
    setQuantity('')
    setPrice('')
    setMessage(null)
  }, [symbol])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validation
    const qty = parseFloat(quantity)
    const priceValue = parseFloat(price)

    if (!qty || qty <= 0 || qty % 1 !== 0) {
      setMessage({ type: 'error', text: '数量は1以上の整数を入力してください。' })
      return
    }

    if (orderMethod === 'limit' && (!priceValue || priceValue <= 0)) {
      setMessage({ type: 'error', text: '価格を正しく入力してください。' })
      return
    }

    // Prepare order details for confirmation
    const orderDetails = {
      symbol,
      side: (orderType === 'buy' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
      qty: Math.floor(qty),
      type: (orderMethod === 'market' ? 'MARKET' : 'LIMIT') as 'MARKET' | 'LIMIT',
      limitPrice: orderMethod === 'limit' ? priceValue : undefined,
    }

    setPendingOrder(orderDetails)
    setShowConfirmation(true)
  }

  const handleConfirmOrder = async () => {
    if (!pendingOrder) return

    setIsSubmitting(true)
    setShowConfirmation(false)

    try {
      const response = await fetch('/api/trading/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: pendingOrder.symbol,
          side: pendingOrder.side,
          qty: pendingOrder.qty,
          type: pendingOrder.type,
          limitPrice: pendingOrder.limitPrice,
          timeInForce,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '注文の送信に失敗しました。')
      }

      // Success
      const orderTypeText = pendingOrder.side === 'BUY' ? '買い' : '売り'
      const modeText = tradingMode === 'live' 
        ? 'ブローカーに注文を送信しました。'
        : 'ペーパートレード注文を送信しました。'

      setMessage({ 
        type: 'success', 
        text: `${orderTypeText}注文を送信しました。${modeText}` 
      })

      // Clear form
      setQuantity('')
      setPrice('')
      setPendingOrder(null)

      // Notify parent
      if (onOrderPlaced) {
        onOrderPlaced(data)
      }

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } catch (error: any) {
      console.error('Order submission error:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || '注文の送信に失敗しました。時間をおいて再度お試しください。' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">注文パネル</h3>
          <span className={`text-xs px-2 py-1 rounded ${
            tradingMode === 'live' 
              ? 'bg-red-900/30 text-red-400 border border-red-700'
              : 'bg-blue-900/30 text-blue-400 border border-blue-700'
          }`}>
            {tradingMode === 'live' ? '本番' : 'ペーパー'}
          </span>
        </div>

        {/* Buy/Sell Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setOrderType('buy')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              orderType === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            買い
          </button>
          <button
            onClick={() => setOrderType('sell')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              orderType === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            売り
          </button>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol Display */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              銘柄コード
            </label>
            <div className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold">
              {symbol}
            </div>
          </div>

          {/* Order Type (Market/Limit) */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              注文方法
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderMethod('market')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  orderMethod === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                成行
              </button>
              <button
                type="button"
                onClick={() => setOrderMethod('limit')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  orderMethod === 'limit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                指値
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              数量
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="1"
              step="1"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Price Input (only for Limit orders) */}
          {orderMethod === 'limit' && (
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                価格 ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          )}

          {/* Time in Force */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              執行条件
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTimeInForce('DAY')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeInForce === 'DAY'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                当日有効
              </button>
              <button
                type="button"
                onClick={() => setTimeInForce('GTC')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeInForce === 'GTC'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                取消まで有効
              </button>
            </div>
          </div>

          {/* Estimated Total */}
          {quantity && orderMethod === 'limit' && price && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">概算金額</span>
                <span className="text-white font-semibold">
                  ${(parseFloat(price || '0') * parseFloat(quantity || '0')).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-900/30 text-green-400 border border-green-700' 
                : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              orderType === 'buy'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? '送信中...' : `${orderType === 'buy' ? '買い' : '売り'}注文を送信`}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmOrder}
        orderDetails={pendingOrder || {
          symbol: '',
          side: 'BUY',
          qty: 0,
          type: 'MARKET',
        }}
        tradingMode={tradingMode}
      />
    </>
  )
}
