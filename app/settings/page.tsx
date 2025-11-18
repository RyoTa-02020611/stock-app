'use client'

import { useState } from 'react'
import SettingsPage from '../components/dashboard/SettingsPage'

export default function Settings() {
  const [tradingMode, setTradingMode] = useState<'paper' | 'live'>('paper')

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <SettingsPage
          tradingMode={tradingMode}
          onTradingModeChange={setTradingMode}
        />
      </div>
    </div>
  )
}

