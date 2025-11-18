'use client'

import { useEffect, useState, useCallback } from 'react'
import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position } from '../../lib/schema'
import { getRealtimePriceClient, PriceUpdate } from '../../lib/realtimePriceClient'

interface RealtimePriceUpdaterProps {
  onPriceUpdate?: (symbol: string, price: number, change: number, changePercent: number) => void
}

/**
 * Component that automatically updates stock prices in real-time
 * Updates positions in localStorage when prices change
 */
export default function RealtimePriceUpdater({ onPriceUpdate }: RealtimePriceUpdaterProps) {
  const [isActive, setIsActive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const updatePrices = async () => {
      try {
        const storage = getStorageAdapter()
        const positions = await storage.getPositions()
        
        if (positions.length === 0) {
          setIsActive(false)
          return
        }

        setIsActive(true)
        const client = getRealtimePriceClient()
        const symbols = positions.map(p => p.symbol)

        // Subscribe to price updates for all positions
        const unsubscribes: (() => void)[] = []

        symbols.forEach(symbol => {
          const unsubscribe = client.subscribe(symbol, async (update: PriceUpdate) => {
            // Update position in storage
            const position = positions.find(p => p.symbol === symbol)
            if (position) {
              const updatedPosition: Position = {
                ...position,
                currentPrice: update.price,
                lastUpdated: update.timestamp,
                marketValue: position.quantity * update.price,
                unrealizedPnL: (update.price - position.averageCost) * position.quantity,
                unrealizedPnLPercent: position.averageCost > 0
                  ? ((update.price - position.averageCost) / position.averageCost) * 100
                  : 0,
              }

              await storage.updatePosition(position.id, updatedPosition)
              
              // Notify parent component
              if (onPriceUpdate) {
                onPriceUpdate(
                  update.symbol,
                  update.price,
                  update.change,
                  update.changePercent
                )
              }

              setLastUpdate(new Date())
            }
          })
          unsubscribes.push(unsubscribe)
        })

        // Cleanup on unmount
        return () => {
          unsubscribes.forEach(unsub => unsub())
          client.disconnect()
        }
      } catch (error) {
        console.error('Error setting up real-time price updates:', error)
        setIsActive(false)
      }
    }

    updatePrices()
  }, [onPriceUpdate])

  // Background job: Update prices every 5 minutes
  useEffect(() => {
    const updateAllPrices = async () => {
      try {
        const storage = getStorageAdapter()
        const positions = await storage.getPositions()
        
        if (positions.length === 0) return

        const symbols = positions.map(p => p.symbol)
        const response = await fetch(`/api/realtime/prices?symbols=${symbols.join(',')}`)
        
        if (response.ok) {
          const updates: PriceUpdate[] = await response.json()
          
          for (const update of updates) {
            const position = positions.find(p => p.symbol === update.symbol)
            if (position) {
              const updatedPosition: Position = {
                ...position,
                currentPrice: update.price,
                lastUpdated: update.timestamp,
                marketValue: position.quantity * update.price,
                unrealizedPnL: (update.price - position.averageCost) * position.quantity,
                unrealizedPnLPercent: position.averageCost > 0
                  ? ((update.price - position.averageCost) / position.averageCost) * 100
                  : 0,
              }

              await storage.updatePosition(position.id, updatedPosition)
            }
          }

          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error('Error in background price update:', error)
      }
    }

    // Initial update
    updateAllPrices()

    // Update every 5 minutes
    const interval = setInterval(updateAllPrices, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Don't render anything, this is a background component
  return null
}

