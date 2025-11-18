'use client'

import { useState } from 'react'
import OrderPanel from '../dashboard/OrderPanel'

interface StockOrderSectionProps {
  symbol: string
}

export default function StockOrderSection({ symbol }: StockOrderSectionProps) {
  const [tradingMode] = useState<'paper' | 'live'>('paper')

  return (
    <div>
      <OrderPanel
        symbol={symbol}
        tradingMode={tradingMode}
        onOrderPlaced={(order) => {
          console.log('Order placed:', order)
          // In a real app, you might show a toast notification here
        }}
      />
    </div>
  )
}

