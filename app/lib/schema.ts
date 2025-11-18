/**
 * Data Schema for Stock Library Application
 * 
 * This file defines the data structures for:
 * - Trades (取引履歴)
 * - Positions (保有ポジション)
 * - Notes (メモ・ノート)
 * - Attachments (添付ファイル)
 * - Alerts (アラート設定)
 * - CustomMetrics (カスタム指標ビュー)
 * 
 * Designed to work with localStorage initially, but structured for easy migration to a database.
 */

// ============================================================================
// TRADES (取引履歴)
// ============================================================================

export type TradeSide = 'BUY' | 'SELL'
export type TradeType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
export type TradeStatus = 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED'
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK'

export interface Trade {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol (e.g., "AAPL", "7203.T")
  side: TradeSide // BUY or SELL
  type: TradeType // MARKET, LIMIT, etc.
  status: TradeStatus // PENDING, FILLED, etc.
  quantity: number // Number of shares
  price?: number // Limit price (for LIMIT orders)
  stopPrice?: number // Stop price (for STOP orders)
  timeInForce: TimeInForce // DAY, GTC, etc.
  
  // Execution details
  filledQuantity?: number // For partially filled orders
  averageFillPrice?: number // Average execution price
  commission?: number // Trading commission/fee
  totalAmount?: number // Total value (quantity * price + commission)
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
  filledAt?: string // ISO 8601 timestamp when order was filled
  
  // Metadata
  notes?: string // User notes about this trade
  tags?: string[] // Tags for categorization
  strategy?: string // Trading strategy name
  accountId?: string // For multi-account support (future)
  
  // Order reference (for broker integration)
  brokerOrderId?: string // External broker order ID
  brokerAccountId?: string // External broker account ID
}

// ============================================================================
// POSITIONS (保有ポジション)
// ============================================================================

export interface Position {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol
  quantity: number // Current holding quantity (can be negative for short positions)
  averageCost: number // Average purchase price
  currentPrice: number // Latest market price
  lastUpdated: string // ISO 8601 timestamp of last price update
  
  // Calculated fields (can be computed on the fly)
  totalCost: number // quantity * averageCost
  marketValue: number // quantity * currentPrice
  unrealizedPnL: number // marketValue - totalCost
  unrealizedPnLPercent: number // (unrealizedPnL / totalCost) * 100
  
  // Position details
  firstPurchaseDate: string // ISO 8601 timestamp of first purchase
  lastPurchaseDate?: string // ISO 8601 timestamp of last purchase
  lastSaleDate?: string // ISO 8601 timestamp of last sale
  
  // Realized P&L (from closed positions)
  realizedPnL?: number // Total realized profit/loss from closed portions
  totalRealizedPnL?: number // Cumulative realized P&L for this symbol
  
  // Metadata
  notes?: string // User notes about this position
  tags?: string[] // Tags for categorization
  targetPrice?: number // Target sell price
  stopLossPrice?: number // Stop loss price
  accountId?: string // For multi-account support (future)
  
  // Trade history reference
  tradeIds?: string[] // Array of trade IDs that contributed to this position
}

// ============================================================================
// NOTES (メモ・ノート)
// ============================================================================

export type NoteType = 'GENERAL' | 'ANALYSIS' | 'NEWS' | 'EARNINGS' | 'EVENT' | 'STRATEGY' | 'REVIEW'

export interface Note {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol (empty string for general notes)
  type: NoteType // Type of note
  title: string // Note title
  content: string // Note content (markdown supported)
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
  
  // Metadata
  tags?: string[] // Tags for categorization
  attachments?: string[] // Array of attachment IDs
  relatedTrades?: string[] // Array of related trade IDs
  relatedPositions?: string[] // Array of related position IDs
}

// ============================================================================
// ATTACHMENTS (添付ファイル・リンク)
// ============================================================================

export type AttachmentType = 'PDF' | 'EXCEL' | 'IMAGE' | 'LINK' | 'SCREENSHOT' | 'OTHER'
export type AttachmentStorage = 'LOCAL' | 'CLOUD' | 'URL' // LOCAL = localStorage base64, CLOUD = cloud storage, URL = external link

export interface Attachment {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol (empty string for general attachments)
  type: AttachmentType // Type of attachment
  storage: AttachmentStorage // Storage location
  
  // File/Link information
  name: string // File name or link title
  description?: string // Description/memo
  url?: string // URL for links or cloud storage
  filePath?: string // Local file path (for LOCAL storage)
  fileData?: string // Base64 encoded file data (for LOCAL storage, small files only)
  fileSize?: number // File size in bytes
  mimeType?: string // MIME type (e.g., "application/pdf", "image/png")
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
  
  // Metadata
  tags?: string[] // Tags for categorization
  category?: string // Category: '決算短信', '決算説明資料', 'IRページ', 'エクセル', 'スクショ', etc.
  relatedNotes?: string[] // Array of related note IDs
  relatedTrades?: string[] // Array of related trade IDs
}

// ============================================================================
// ALERTS (アラート設定)
// ============================================================================

export type AlertType = 'PRICE' | 'DIVIDEND' | 'NEWS' | 'VOLUME' | 'CHANGE_PERCENT' | 'CUSTOM'
export type AlertCondition = 'ABOVE' | 'BELOW' | 'EQUALS' | 'CHANGE' | 'NEWS_KEYWORD'
export type AlertStatus = 'ACTIVE' | 'PAUSED' | 'TRIGGERED' | 'EXPIRED'

export interface Alert {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol (empty string for market-wide alerts)
  type: AlertType // Type of alert
  condition: AlertCondition // Condition type
  status: AlertStatus // Alert status
  
  // Alert conditions
  targetValue?: number // Target price, dividend yield, etc.
  threshold?: number // Threshold value
  keywords?: string[] // Keywords for news alerts
  timeFrame?: string // Time frame (e.g., "1d", "1w", "1mo")
  
  // Notification settings
  notifyOnTrigger: boolean // Send notification when triggered
  emailNotification?: boolean // Send email notification
  pushNotification?: boolean // Send push notification
  
  // Metadata
  reason?: string // Why this alert was set (memo)
  notes?: string // Additional notes
  tags?: string[] // Tags for categorization
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
  triggeredAt?: string // ISO 8601 timestamp when alert was triggered
  expiresAt?: string // ISO 8601 timestamp when alert expires
}

// ============================================================================
// CUSTOM METRICS (カスタム指標ビュー)
// ============================================================================

export type MetricType = 
  | 'PRICE' | 'CHANGE' | 'CHANGE_PERCENT' | 'VOLUME' | 'MARKET_CAP'
  | 'PE_RATIO' | 'PB_RATIO' | 'DIVIDEND_YIELD' | 'DIVIDEND_PAYOUT_RATIO'
  | 'CONSECUTIVE_DIVIDEND_YEARS' | 'EPS' | 'ROE' | 'ROA' | 'DEBT_TO_EQUITY'
  | 'CURRENT_RATIO' | 'PROFIT_MARGIN' | 'REVENUE_GROWTH' | 'EARNINGS_GROWTH'
  | 'CUSTOM'

export interface CustomMetric {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol (empty string for global view)
  metricType: MetricType // Type of metric
  displayName: string // Custom display name
  order: number // Display order (lower = higher priority)
  visible: boolean // Whether to show this metric
  
  // Custom calculation (for CUSTOM type)
  formula?: string // Custom formula/calculation
  dataSource?: string // Data source for this metric
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

export interface CustomMetricView {
  id: string // UUID or unique identifier
  name: string // View name (e.g., "配当重視", "成長株", "バリュー株")
  symbol?: string // Stock symbol (if view is symbol-specific)
  description?: string // View description
  metrics: string[] // Array of CustomMetric IDs
  isDefault: boolean // Whether this is the default view
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

// ============================================================================
// INVESTMENT JOURNAL (投資日記)
// ============================================================================

export interface InvestmentJournalEntry {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol
  date: string // ISO 8601 date (YYYY-MM-DD)
  content: string // Journal entry content
  title?: string // Optional title
  
  // Price data at the time of entry
  priceAtDate?: number // Stock price on this date
  changeAtDate?: number // Price change on this date
  changePercentAtDate?: number // Price change percent on this date
  volumeAtDate?: number // Volume on this date
  
  // Chart data snapshot (optional, for historical reference)
  chartDataSnapshot?: Array<{ date: string; price: number }> // Historical chart data up to this date
  
  // Metadata
  tags?: string[] // Tags for categorization
  relatedTrades?: string[] // Related trade IDs
  relatedNotes?: string[] // Related note IDs
  attachments?: string[] // Related attachment IDs
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

// ============================================================================
// INVESTMENT HYPOTHESIS (投資仮説)
// ============================================================================

export interface InvestmentHypothesis {
  id: string // UUID or unique identifier
  symbol: string // Stock symbol
  hypothesis: string // Hypothesis text (e.g., "iPhone売上が伸び続ける限り、EPSは平均○%成長")
  status: 'ACTIVE' | 'VALIDATED' | 'INVALIDATED' | 'ARCHIVED' // Current status
  
  // Validation history
  validations: Array<{
    date: string // ISO 8601 date
    result: 'VALID' | 'INVALID' // Was hypothesis still valid?
    notes?: string // Notes about this validation
    earningsDate?: string // Earnings date if validated during earnings
    data?: any // Additional validation data
  }>
  
  // Statistics
  consecutiveValid: number // Number of consecutive valid validations
  consecutiveInvalid: number // Number of consecutive invalid validations
  totalValid: number // Total valid count
  totalInvalid: number // Total invalid count
  
  // Metadata
  tags?: string[] // Tags for categorization
  relatedNotes?: string[] // Related note IDs
  relatedTrades?: string[] // Related trade IDs
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
  lastValidatedAt?: string // ISO 8601 timestamp of last validation
}

// ============================================================================
// PORTFOLIO PURPOSE (目的別ポートフォリオ)
// ============================================================================

export type PortfolioPurpose = '留学資金' | '老後' | '趣味' | '住宅購入' | '教育資金' | 'その他'

export interface PortfolioPurposeTag {
  id: string // UUID or unique identifier
  purpose: PortfolioPurpose // Purpose type
  customPurpose?: string // Custom purpose name if "その他"
  targetAmount: number // Target amount in JPY
  currentAmount: number // Current amount in JPY
  targetDate?: string // ISO 8601 date (optional target date)
  
  // Associated positions/trades
  positionIds?: string[] // Position IDs
  tradeIds?: string[] // Trade IDs
  
  // Metadata
  description?: string // Description of this purpose
  priority?: number // Priority level (1-10)
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

// ============================================================================
// TRADE MISTAKE ANALYSIS (取引ミス分析)
// ============================================================================

export type MistakeCategory = 
  | '早売り' 
  | 'ナンピン失敗' 
  | '握力不足' 
  | 'FOMO買い' 
  | '損切り遅れ' 
  | '利確遅れ'
  | '感情的な取引'
  | 'リサーチ不足'
  | 'その他'

export interface TradeMistake {
  id: string // UUID or unique identifier
  tradeId: string // Related trade ID
  symbol: string // Stock symbol
  category: MistakeCategory // Mistake category
  description: string // Description of the mistake
  impact: number // Estimated impact in JPY (negative for losses)
  learned: string // What was learned from this mistake
  
  // AI analysis
  aiAnalysis?: {
    category: MistakeCategory // AI-suggested category
    confidence: number // Confidence score (0-100)
    suggestions: string[] // Suggestions for improvement
  }
  
  // Timestamps
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

// ============================================================================
// STORAGE ADAPTER INTERFACE
// ============================================================================

export interface SearchFilters {
  symbol?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  status?: string
  type?: string
}

export interface PaginationOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface StorageAdapter {
  // Trades
  saveTrade(trade: Partial<Trade> & { symbol: string; side: TradeSide; type: TradeType; status: TradeStatus; quantity: number; timeInForce: TimeInForce }): Promise<Trade>
  getTrade(id: string): Promise<Trade | null>
  getTrades(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Trade[]>
  updateTrade(id: string, updates: Partial<Trade>): Promise<Trade>
  deleteTrade(id: string): Promise<boolean>
  
  // Positions
  savePosition(position: Partial<Position> & { symbol: string; quantity: number; averageCost: number; currentPrice: number; firstPurchaseDate: string }): Promise<Position>
  getPosition(id: string): Promise<Position | null>
  getPositions(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Position[]>
  updatePosition(id: string, updates: Partial<Position>): Promise<Position>
  deletePosition(id: string): Promise<boolean>
  
  // Notes
  saveNote(note: Partial<Note> & { symbol: string; type: NoteType; title: string; content: string }): Promise<Note>
  getNote(id: string): Promise<Note | null>
  getNotes(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Note[]>
  updateNote(id: string, updates: Partial<Note>): Promise<Note>
  deleteNote(id: string): Promise<boolean>
  
  // Attachments
  saveAttachment(attachment: Partial<Attachment> & { symbol: string; type: AttachmentType; storage: AttachmentStorage; name: string }): Promise<Attachment>
  getAttachment(id: string): Promise<Attachment | null>
  getAttachments(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Attachment[]>
  updateAttachment(id: string, updates: Partial<Attachment>): Promise<Attachment>
  deleteAttachment(id: string): Promise<boolean>
  
  // Alerts
  saveAlert(alert: Partial<Alert> & { symbol: string; type: AlertType; condition: AlertCondition; status: AlertStatus; notifyOnTrigger: boolean }): Promise<Alert>
  getAlert(id: string): Promise<Alert | null>
  getAlerts(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Alert[]>
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert>
  deleteAlert(id: string): Promise<boolean>
  
  // Custom Metrics
  saveCustomMetric(metric: Partial<CustomMetric> & { symbol: string; metricType: MetricType; displayName: string; order: number; visible: boolean }): Promise<CustomMetric>
  getCustomMetric(id: string): Promise<CustomMetric | null>
  getCustomMetrics(filters?: SearchFilters, pagination?: PaginationOptions): Promise<CustomMetric[]>
  updateCustomMetric(id: string, updates: Partial<CustomMetric>): Promise<CustomMetric>
  deleteCustomMetric(id: string): Promise<boolean>
  
  // Custom Metric Views
  saveCustomMetricView(view: Partial<CustomMetricView> & { name: string; metrics: string[]; isDefault: boolean }): Promise<CustomMetricView>
  getCustomMetricView(id: string): Promise<CustomMetricView | null>
  getCustomMetricViews(filters?: SearchFilters, pagination?: PaginationOptions): Promise<CustomMetricView[]>
  updateCustomMetricView(id: string, updates: Partial<CustomMetricView>): Promise<CustomMetricView>
  deleteCustomMetricView(id: string): Promise<boolean>
  
  // Investment Journal
  saveJournalEntry(entry: Partial<InvestmentJournalEntry> & { symbol: string; date: string; content: string }): Promise<InvestmentJournalEntry>
  getJournalEntry(id: string): Promise<InvestmentJournalEntry | null>
  getJournalEntries(filters?: SearchFilters, pagination?: PaginationOptions): Promise<InvestmentJournalEntry[]>
  updateJournalEntry(id: string, updates: Partial<InvestmentJournalEntry>): Promise<InvestmentJournalEntry>
  deleteJournalEntry(id: string): Promise<boolean>
  
  // Investment Hypothesis
  saveHypothesis(hypothesis: Partial<InvestmentHypothesis> & { symbol: string; hypothesis: string; status: 'ACTIVE' | 'VALIDATED' | 'INVALIDATED' | 'ARCHIVED' }): Promise<InvestmentHypothesis>
  getHypothesis(id: string): Promise<InvestmentHypothesis | null>
  getHypotheses(filters?: SearchFilters, pagination?: PaginationOptions): Promise<InvestmentHypothesis[]>
  updateHypothesis(id: string, updates: Partial<InvestmentHypothesis>): Promise<InvestmentHypothesis>
  deleteHypothesis(id: string): Promise<boolean>
  
  // Portfolio Purpose
  savePortfolioPurpose(purpose: Partial<PortfolioPurposeTag> & { purpose: PortfolioPurpose; targetAmount: number; currentAmount: number }): Promise<PortfolioPurposeTag>
  getPortfolioPurpose(id: string): Promise<PortfolioPurposeTag | null>
  getPortfolioPurposes(filters?: SearchFilters, pagination?: PaginationOptions): Promise<PortfolioPurposeTag[]>
  updatePortfolioPurpose(id: string, updates: Partial<PortfolioPurposeTag>): Promise<PortfolioPurposeTag>
  deletePortfolioPurpose(id: string): Promise<boolean>
  
  // Trade Mistakes
  saveTradeMistake(mistake: Partial<TradeMistake> & { tradeId: string; symbol: string; category: MistakeCategory; description: string; impact: number; learned: string }): Promise<TradeMistake>
  getTradeMistake(id: string): Promise<TradeMistake | null>
  getTradeMistakes(filters?: SearchFilters, pagination?: PaginationOptions): Promise<TradeMistake[]>
  updateTradeMistake(id: string, updates: Partial<TradeMistake>): Promise<TradeMistake>
  deleteTradeMistake(id: string): Promise<boolean>
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

// ============================================================================
// LOGGING (ロギング)
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string // Unique identifier
  level: LogLevel
  message: string
  timestamp: string // ISO 8601 timestamp
  context?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
  }
  
  // Metadata
  userId?: string // User ID (for multi-user support in future)
  sessionId?: string // Session ID
  requestId?: string // Request ID for tracing
  endpoint?: string // API endpoint (for API logs)
  method?: string // HTTP method (for API logs)
  statusCode?: number // HTTP status code (for API logs)
  responseTime?: number // Response time in milliseconds (for API logs)
  userAgent?: string // User agent string
  ipAddress?: string // IP address (server-side only)
  
  // Performance metrics
  performance?: {
    duration?: number // Operation duration in milliseconds
    memoryUsage?: number // Memory usage in bytes (if available)
    cpuUsage?: number // CPU usage percentage (if available)
  }
  
  // Source information
  source?: string // Source of the log (e.g., 'Alpha Vantage', 'Finnhub', 'Client')
  component?: string // Component name (e.g., 'EarningsClient', 'MarketTrendsClient')
  action?: string // Action name (e.g., 'fetchEarnings', 'getExchangeRates')
}

export interface LogFilter {
  level?: LogLevel | LogLevel[]
  startDate?: string // ISO 8601 timestamp
  endDate?: string // ISO 8601 timestamp
  search?: string // Search in message and context
  source?: string
  component?: string
  endpoint?: string
  statusCode?: number
  minResponseTime?: number
  maxResponseTime?: number
}

export interface LogStatistics {
  total: number
  byLevel: Record<LogLevel, number>
  bySource: Record<string, number>
  byComponent: Record<string, number>
  byEndpoint: Record<string, number>
  errorRate: number // Percentage of errors
  averageResponseTime: number // Average response time in milliseconds
  slowestEndpoints: Array<{ endpoint: string; averageTime: number; count: number }>
  mostFrequentErrors: Array<{ message: string; count: number; lastOccurred: string }>
}

export const STORAGE_KEYS = {
  TRADES: 'stock_library_trades',
  POSITIONS: 'stock_library_positions',
  NOTES: 'stock_library_notes',
  ATTACHMENTS: 'stock_library_attachments',
  ALERTS: 'stock_library_alerts',
  CUSTOM_METRICS: 'stock_library_custom_metrics',
  CUSTOM_METRIC_VIEWS: 'stock_library_custom_metric_views',
  INVESTMENT_JOURNAL: 'stock_library_investment_journal',
  INVESTMENT_HYPOTHESIS: 'stock_library_investment_hypothesis',
  PORTFOLIO_PURPOSES: 'stock_library_portfolio_purposes',
  TRADE_MISTAKES: 'stock_library_trade_mistakes',
  LOGS: 'stock_library_logs',
  LOG_SETTINGS: 'stock_library_log_settings',
} as const
