/**
 * Market Indices Type Definitions
 */

export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  region: string
  lastUpdate: string
  volume?: number
  marketStatus?: 'open' | 'closed' | 'pre-market' | 'after-hours'
}

export interface MarketIndicesResponse {
  success: boolean
  indices: MarketIndex[]
  timestamp: string
  error?: string
}

export const MAJOR_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', region: '🇺🇸 米国' },
  { symbol: '^IXIC', name: 'NASDAQ', region: '🇺🇸 米国' },
  { symbol: '^DJI', name: 'ダウ平均', region: '🇺🇸 米国' },
  { symbol: '^N225', name: '日経225', region: '🇯🇵 日本' },
  { symbol: '^FTSE', name: 'FTSE 100', region: '🇬🇧 英国' },
  { symbol: '^GDAXI', name: 'DAX', region: '🇩🇪 ドイツ' },
  { symbol: '000001.SS', name: '上海総合', region: '🇨🇳 中国' },
  { symbol: '^HSI', name: 'ハンセン指数', region: '🇭🇰 香港' },
  { symbol: '^KS11', name: 'KOSPI', region: '🇰🇷 韓国' },
  { symbol: '^AXJO', name: 'ASX 200', region: '🇦🇺 オーストラリア' },
  { symbol: '^BVSP', name: 'Bovespa', region: '🇧🇷 ブラジル' },
  { symbol: '^NSEI', name: 'Nifty 50', region: '🇮🇳 インド' },
] as const

