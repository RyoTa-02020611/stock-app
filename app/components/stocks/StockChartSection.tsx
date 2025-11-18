'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Trade, TradeSide } from '../../lib/schema'
import ChartPinMarker, { ChartPin } from './ChartPin'

interface StockChartSectionProps {
  symbol: string
}

export default function StockChartSection({ symbol }: StockChartSectionProps) {
  const [timeRange, setTimeRange] = useState<'1d' | '5d' | '1mo' | '3mo' | '1y' | '5y'>('1mo')
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showVolume, setShowVolume] = useState(false)
  const [showMA, setShowMA] = useState(false)
  const [pins, setPins] = useState<ChartPin[]>([])
  const [showPinModal, setShowPinModal] = useState(false)
  const [selectedPin, setSelectedPin] = useState<ChartPin | null>(null)
  const [pinForm, setPinForm] = useState({ side: 'BUY' as TradeSide, quantity: '', notes: '', date: '', price: '' })
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Load chart data
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/stocks/${encodeURIComponent(symbol)}/chart?range=${timeRange}`
        )
        if (response.ok) {
          const data = await response.json()
          setChartData(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching chart:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [symbol, timeRange])

  // Load pins from trades
  useEffect(() => {
    const loadPins = async () => {
      try {
        const storage = getStorageAdapter()
        const trades = await storage.getTrades()
        const symbolTrades = trades.filter(t => t.symbol === symbol && t.status === 'FILLED' && t.filledAt)
        
        const chartPins: ChartPin[] = symbolTrades.map(trade => ({
          id: trade.id,
          date: trade.filledAt || trade.createdAt,
          price: trade.averageFillPrice || trade.price || 0,
          side: trade.side,
          quantity: trade.filledQuantity || trade.quantity,
          notes: trade.notes,
          createdAt: trade.createdAt,
        }))
        
        setPins(chartPins)
      } catch (error) {
        console.error('Error loading pins:', error)
      }
    }

    if (symbol) {
      loadPins()
    }
  }, [symbol])

  const timeRanges = [
    { value: '1d', label: '1日' },
    { value: '5d', label: '5日' },
    { value: '1mo', label: '1ヶ月' },
    { value: '3mo', label: '3ヶ月' },
    { value: '1y', label: '1年' },
    { value: '5y', label: '5年' },
  ]

  // Calculate moving average if enabled
  const dataWithMA = showMA && chartData.length > 0
    ? chartData.map((point, index) => {
        const window = 5
        const start = Math.max(0, index - window + 1)
        const slice = chartData.slice(start, index + 1)
        const ma = slice.reduce((sum, p) => sum + p.close, 0) / slice.length
        return { ...point, ma }
      })
    : chartData

  const currentPrice = chartData.length > 0 ? (chartData[chartData.length - 1]?.close || 0) : 0
  const previousPrice = chartData.length > 0 ? (chartData[0]?.close || 0) : 0
  const change = currentPrice - previousPrice
  const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0

  // Handle chart click to add pin (moved before early returns to follow React Hooks rules)
  const handleChartClick = useCallback((e: any) => {
    if (!e || !chartData.length) return
    
    // Get the closest data point
    const chartArea = e.currentTarget?.closest('.recharts-wrapper')
    if (!chartArea) return

    // For simplicity, we'll add pin at the clicked position
    // In a real implementation, you'd calculate the exact date/price from mouse coordinates
    const lastDataPoint = chartData[chartData.length - 1]
    const clickedDate = lastDataPoint?.date || new Date().toISOString()
    const clickedPrice = lastDataPoint?.close || currentPrice

    setPinForm({
      side: 'BUY',
      quantity: '',
      notes: '',
      date: clickedDate,
      price: clickedPrice.toFixed(2),
    })
    setSelectedPin(null)
    setShowPinModal(true)
  }, [chartData, currentPrice])

  // Get pin coordinates for rendering
  const getPinCoordinates = (pin: ChartPin) => {
    if (!chartData.length) return null

    // Find the closest data point to the pin date
    const pinDate = new Date(pin.date).getTime()
    let closestIndex = 0
    let minDiff = Infinity

    chartData.forEach((point, index) => {
      const pointDate = new Date(point.date).getTime()
      const diff = Math.abs(pointDate - pinDate)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = index
      }
    })

    return {
      index: closestIndex,
      dataPoint: chartData[closestIndex],
      price: pin.price,
    }
  }

  // Merge pins with chart data for rendering
  const dataWithPins = dataWithMA.map((point, index) => {
    const pointPins = pins.filter(pin => {
      const coords = getPinCoordinates(pin)
      return coords?.index === index
    })
    return { ...point, pins: pointPins }
  })

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">チャートデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-gray-400">チャートデータがありません</p>
      </div>
    )
  }

  // Save pin as trade
  const handleSavePin = async () => {
    try {
      if (!pinForm.date || !pinForm.price) {
        alert('日時と価格を入力してください')
        return
      }

      const storage = getStorageAdapter()
      const trade: Partial<Trade> = {
        symbol,
        side: pinForm.side,
        type: 'MARKET',
        status: 'FILLED',
        quantity: pinForm.quantity ? parseFloat(pinForm.quantity) : 0,
        price: parseFloat(pinForm.price),
        averageFillPrice: parseFloat(pinForm.price),
        filledQuantity: pinForm.quantity ? parseFloat(pinForm.quantity) : 0,
        timeInForce: 'DAY',
        filledAt: pinForm.date,
        notes: pinForm.notes,
        tags: ['チャートピン'],
      }

      if (selectedPin) {
        // Update existing trade
        await storage.updateTrade(selectedPin.id, trade)
      } else {
        // Create new trade
        await storage.saveTrade(trade as Trade)
      }

      // Reload pins
      const trades = await storage.getTrades()
      const symbolTrades = trades.filter(t => t.symbol === symbol && t.status === 'FILLED' && t.filledAt)
      const chartPins: ChartPin[] = symbolTrades.map(trade => ({
        id: trade.id,
        date: trade.filledAt || trade.createdAt,
        price: trade.averageFillPrice || trade.price || 0,
        side: trade.side,
        quantity: trade.filledQuantity || trade.quantity,
        notes: trade.notes,
        createdAt: trade.createdAt,
      }))
      setPins(chartPins)

      setShowPinModal(false)
      setPinForm({ side: 'BUY', quantity: '', notes: '', date: '', price: '' })
      setSelectedPin(null)
    } catch (error) {
      console.error('Error saving pin:', error)
      alert('ピンの保存に失敗しました')
    }
  }

  // Delete pin
  const handleDeletePin = async (pinId: string) => {
    if (!confirm('このピンを削除しますか？')) return

    try {
      const storage = getStorageAdapter()
      await storage.deleteTrade(pinId)
      setPins(pins.filter(p => p.id !== pinId))
    } catch (error) {
      console.error('Error deleting pin:', error)
      alert('ピンの削除に失敗しました')
    }
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 bg-gray-700 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={(e) => setShowVolume(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-gray-400 text-sm">出来高</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMA}
              onChange={(e) => setShowMA(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-gray-400 text-sm">移動平均線</span>
          </label>
        </div>
      </div>

      {/* Price Info */}
      <div className="flex items-baseline gap-3">
        <p className="text-white text-2xl font-bold">${currentPrice.toFixed(2)}</p>
        <p className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)} ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
        </p>
      </div>

      {/* Chart Controls - Add Pin Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              const lastDataPoint = chartData[chartData.length - 1]
              setPinForm({
                side: 'BUY',
                quantity: '',
                notes: '',
                date: lastDataPoint?.date || new Date().toISOString(),
                price: (lastDataPoint?.close || currentPrice).toFixed(2),
              })
              setSelectedPin(null)
              setShowPinModal(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span>📌</span>
            ピンを追加
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 bg-gray-700/30 rounded-lg p-4 relative" ref={chartContainerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataWithPins}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                const date = new Date(value)
                if (timeRange === '1d') {
                  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                }
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9CA3AF' }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null
                const data = payload[0].payload
                const pointPins = data.pins || []
                
                return (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-2">{label}</p>
                    <p className="text-white font-semibold">
                      {payload[0].name}: {payload[0].value?.toFixed(2)}
                    </p>
                    {pointPins.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        {pointPins.map((pin: ChartPin) => (
                          <div key={pin.id} className="text-xs mt-1">
                            <span className={pin.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                              {pin.side === 'BUY' ? '▲ 買い' : '▼ 売り'}
                            </span>
                            {' '}
                            <span className="text-gray-300">{pin.price.toFixed(2)}</span>
                            {pin.quantity && (
                              <span className="text-gray-400"> ({pin.quantity}株)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={change >= 0 ? '#34D399' : '#F87171'}
              strokeWidth={2}
              dot={false}
              name="価格"
            />
            {showMA && (
              <Line
                type="monotone"
                dataKey="ma"
                stroke="#60A5FA"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="移動平均"
              />
            )}
            {/* Render pins */}
            {pins.map((pin) => {
              const coords = getPinCoordinates(pin)
              if (!coords) return null
              
              // Calculate Y position based on price
              const minPrice = Math.min(...chartData.map(d => d.close))
              const maxPrice = Math.max(...chartData.map(d => d.close))
              const priceRange = maxPrice - minPrice
              const yPercent = priceRange > 0 ? ((pin.price - minPrice) / priceRange) : 0.5
              
              // Approximate Y position (chart height is ~350px, accounting for padding)
              const yPos = 350 * (1 - yPercent) + 20
              
              return (
                <ReferenceLine
                  key={pin.id}
                  x={coords.dataPoint.date}
                  stroke={pin.side === 'BUY' ? '#34D399' : '#F87171'}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: pin.side === 'BUY' ? '▲ 買い' : '▼ 売り',
                    position: 'top',
                    fill: pin.side === 'BUY' ? '#34D399' : '#F87171',
                    fontSize: 12,
                  }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Overlay pins (absolute positioned) */}
        <div className="absolute inset-0 pointer-events-none" style={{ padding: '16px' }}>
          {pins.map((pin) => {
            const coords = getPinCoordinates(pin)
            if (!coords) return null
            
            const minPrice = Math.min(...chartData.map(d => d.close))
            const maxPrice = Math.max(...chartData.map(d => d.close))
            const priceRange = maxPrice - minPrice
            const yPercent = priceRange > 0 ? ((pin.price - minPrice) / priceRange) : 0.5
            
            // Calculate positions (accounting for chart padding)
            const chartWidth = chartContainerRef.current?.clientWidth || 800
            const chartHeight = 350
            const xPos = (coords.index / (chartData.length - 1)) * (chartWidth - 100) + 50
            const yPos = chartHeight * (1 - yPercent) + 20
            
            return (
              <div
                key={pin.id}
                className="absolute pointer-events-auto cursor-pointer group"
                style={{
                  left: `${xPos}px`,
                  top: `${yPos}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => {
                  setSelectedPin(pin)
                  setPinForm({
                    side: pin.side,
                    quantity: pin.quantity?.toString() || '',
                    notes: pin.notes || '',
                    date: pin.date,
                    price: pin.price.toFixed(2),
                  })
                  setShowPinModal(true)
                }}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  pin.side === 'BUY' 
                    ? 'bg-green-400 border-green-500' 
                    : 'bg-red-400 border-red-500'
                } flex items-center justify-center text-white text-xs font-bold`}>
                  {pin.side === 'BUY' ? '▲' : '▼'}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap">
                    <div className={pin.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                      {pin.side === 'BUY' ? '買い' : '売り'} {pin.price.toFixed(2)}
                    </div>
                    {pin.quantity && <div className="text-gray-400">{pin.quantity}株</div>}
                    {pin.notes && <div className="text-gray-500 mt-1">{pin.notes}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pin Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPinModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-xl font-bold mb-4">
              {selectedPin ? 'ピンを編集' : 'ピンを追加'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">売買区分</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPinForm({ ...pinForm, side: 'BUY' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      pinForm.side === 'BUY'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    買い
                  </button>
                  <button
                    onClick={() => setPinForm({ ...pinForm, side: 'SELL' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      pinForm.side === 'SELL'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    売り
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">日時</label>
                <input
                  type="datetime-local"
                  value={pinForm.date ? new Date(pinForm.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setPinForm({ ...pinForm, date: new Date(e.target.value).toISOString() })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">価格</label>
                <input
                  type="number"
                  step="0.01"
                  value={pinForm.price}
                  onChange={(e) => setPinForm({ ...pinForm, price: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">数量（任意）</label>
                <input
                  type="number"
                  step="1"
                  value={pinForm.quantity}
                  onChange={(e) => setPinForm({ ...pinForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">メモ（任意）</label>
                <textarea
                  value={pinForm.notes}
                  onChange={(e) => setPinForm({ ...pinForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="メモを記入..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {selectedPin && (
                <button
                  onClick={async () => {
                    await handleDeletePin(selectedPin.id)
                    setShowPinModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  削除
                </button>
              )}
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSavePin}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

