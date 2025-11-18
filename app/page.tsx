'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/dashboard')
  }, [router])
  
  return null
}

// Export types for backward compatibility
export type ActivePage = 'dashboard' | 'watchlist' | 'orders' | 'settings'
export type OrderSide = 'BUY' | 'SELL'

export type Order = {
  id: string
  symbol: string
  side: OrderSide
  quantity: number
  price: number
  createdAt: string // ISO string
}
