/**
 * LocalStorage Adapter Implementation
 * 
 * Provides a StorageAdapter implementation using browser localStorage.
 * This can be easily swapped with a database adapter in the future.
 */

import {
  StorageAdapter,
  Trade,
  Position,
  Note,
  Attachment,
  Alert,
  CustomMetric,
  CustomMetricView,
  InvestmentJournalEntry,
  InvestmentHypothesis,
  PortfolioPurposeTag,
  TradeMistake,
  STORAGE_KEYS,
  SearchFilters,
  PaginationOptions,
  PaginatedResult,
  TradeSide,
  TradeType,
  TradeStatus,
  TimeInForce,
  NoteType,
  AttachmentType,
  AttachmentStorage,
  AlertType,
  AlertCondition,
  AlertStatus,
  MetricType,
  PortfolioPurpose,
  MistakeCategory,
} from '../schema'

/**
 * Generate a unique ID (simple UUID v4-like implementation)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get data from localStorage with error handling
 */
function getFromStorage<T>(key: string, defaultValue: T[]): T[] {
  try {
    if (typeof window === 'undefined') return defaultValue
    const data = localStorage.getItem(key)
    if (!data) return defaultValue
    return JSON.parse(data) as T[]
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}

/**
 * Save data to localStorage with error handling
 */
function saveToStorage<T>(key: string, data: T[]): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('ストレージの容量が不足しています。古いデータを削除してください。')
    }
    throw error
  }
}

/**
 * LocalStorage Storage Adapter Implementation
 */
export class LocalStorageAdapter implements StorageAdapter {
  // ============================================================================
  // TRADES
  // ============================================================================
  
  async getTrades(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Trade[]> {
    let trades = getFromStorage<Trade>(STORAGE_KEYS.TRADES, [])
    if (filters?.symbol) {
      trades = trades.filter(t => t.symbol === filters.symbol)
    }
    if (filters?.tags && filters.tags.length > 0) {
      trades = trades.filter(t => t.tags && filters.tags!.some(tag => t.tags!.includes(tag)))
    }
    if (filters?.status) {
      trades = trades.filter(t => t.status === filters.status as any)
    }
    // Simple pagination
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || trades.length)
      trades = trades.slice(start, end)
    }
    return trades
  }
  
  async getTrade(id: string): Promise<Trade | null> {
    const trades = await this.getTrades()
    return trades.find(t => t.id === id) || null
  }
  
  async saveTrade(trade: Partial<Trade> & { symbol: string; side: TradeSide; type: TradeType; status: TradeStatus; quantity: number; timeInForce: TimeInForce }): Promise<Trade> {
    const trades = await this.getTrades()
    const newTrade: Trade = {
      ...trade,
      id: trade.id || generateId(),
      createdAt: trade.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Trade
    trades.push(newTrade)
    saveToStorage(STORAGE_KEYS.TRADES, trades)
    return newTrade
  }
  
  async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade> {
    const trades = await this.getTrades()
    const index = trades.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Trade with id ${id} not found`)
    }
    trades[index] = {
      ...trades[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.TRADES, trades)
    return trades[index]
  }
  
  async deleteTrade(id: string): Promise<boolean> {
    const trades = await this.getTrades()
    const filtered = trades.filter(t => t.id !== id)
    saveToStorage(STORAGE_KEYS.TRADES, filtered)
    return true
  }
  
  // ============================================================================
  // POSITIONS
  // ============================================================================
  
  async getPositions(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Position[]> {
    let positions = getFromStorage<Position>(STORAGE_KEYS.POSITIONS, [])
    if (filters?.symbol) {
      positions = positions.filter(p => p.symbol === filters.symbol)
    }
    if (filters?.tags && filters.tags.length > 0) {
      positions = positions.filter(p => p.tags && filters.tags!.some(tag => p.tags!.includes(tag)))
    }
    // Simple pagination
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || positions.length)
      positions = positions.slice(start, end)
    }
    return positions
  }
  
  async getPosition(id: string): Promise<Position | null> {
    const positions = await this.getPositions()
    return positions.find(p => p.id === id) || null
  }
  
  async getPositionBySymbol(symbol: string): Promise<Position | null> {
    const positions = await this.getPositions()
    return positions.find(p => p.symbol === symbol) || null
  }
  
  async savePosition(position: Partial<Position> & { symbol: string; quantity: number; averageCost: number; currentPrice: number }): Promise<Position> {
    const positions = await this.getPositions()
    const newPosition: Position = {
      ...position,
      id: position.id || generateId(),
      lastUpdated: position.lastUpdated || new Date().toISOString(),
    } as Position
    positions.push(newPosition)
    saveToStorage(STORAGE_KEYS.POSITIONS, positions)
    return newPosition
  }
  
  async updatePosition(id: string, updates: Partial<Position>): Promise<Position> {
    const positions = await this.getPositions()
    const index = positions.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error(`Position with id ${id} not found`)
    }
    positions[index] = {
      ...positions[index],
      ...updates,
      id, // Ensure ID doesn't change
      lastUpdated: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.POSITIONS, positions)
    return positions[index]
  }
  
  async deletePosition(id: string): Promise<boolean> {
    const positions = await this.getPositions()
    const filtered = positions.filter(p => p.id !== id)
    saveToStorage(STORAGE_KEYS.POSITIONS, filtered)
    return true
  }
  
  // ============================================================================
  // NOTES
  // ============================================================================
  
  async getNotes(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Note[]> {
    let notes = getFromStorage<Note>(STORAGE_KEYS.NOTES, [])
    if (filters?.symbol) {
      notes = notes.filter(n => n.symbol === filters.symbol)
    }
    if (filters?.tags && filters.tags.length > 0) {
      notes = notes.filter(n => n.tags && filters.tags!.some(tag => n.tags!.includes(tag)))
    }
    // Simple pagination
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || notes.length)
      notes = notes.slice(start, end)
    }
    return notes
  }
  
  async getNote(id: string): Promise<Note | null> {
    const notes = await this.getNotes()
    return notes.find(n => n.id === id) || null
  }
  
  async saveNote(note: Partial<Note> & { symbol?: string; title: string; content: string; type: NoteType }): Promise<Note> {
    const notes = await this.getNotes()
    const newNote: Note = {
      ...note,
      id: note.id || generateId(),
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Note
    notes.push(newNote)
    saveToStorage(STORAGE_KEYS.NOTES, notes)
    return newNote
  }
  
  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const notes = await this.getNotes()
    const index = notes.findIndex(n => n.id === id)
    if (index === -1) {
      throw new Error(`Note with id ${id} not found`)
    }
    notes[index] = {
      ...notes[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.NOTES, notes)
    return notes[index]
  }
  
  async deleteNote(id: string): Promise<boolean> {
    const notes = await this.getNotes()
    const filtered = notes.filter(n => n.id !== id)
    saveToStorage(STORAGE_KEYS.NOTES, filtered)
    return true
  }
  
  // ============================================================================
  // ATTACHMENTS
  // ============================================================================
  
  async getAttachments(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Attachment[]> {
    let attachments = getFromStorage<Attachment>(STORAGE_KEYS.ATTACHMENTS, [])
    if (filters?.symbol) {
      attachments = attachments.filter(a => a.symbol === filters.symbol)
    }
    if (filters?.tags && filters.tags.length > 0) {
      attachments = attachments.filter(a => a.tags && filters.tags!.some(tag => a.tags!.includes(tag)))
    }
    // Simple pagination
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || attachments.length)
      attachments = attachments.slice(start, end)
    }
    return attachments
  }
  
  async getAttachment(id: string): Promise<Attachment | null> {
    const attachments = await this.getAttachments()
    return attachments.find(a => a.id === id) || null
  }
  
  async saveAttachment(attachment: Partial<Attachment> & { symbol: string; name: string; type: AttachmentType; storage: AttachmentStorage }): Promise<Attachment> {
    const attachments = await this.getAttachments()
    const newAttachment: Attachment = {
      ...attachment,
      id: attachment.id || generateId(),
      createdAt: attachment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Attachment
    attachments.push(newAttachment)
    saveToStorage(STORAGE_KEYS.ATTACHMENTS, attachments)
    return newAttachment
  }
  
  async updateAttachment(id: string, updates: Partial<Attachment>): Promise<Attachment> {
    const attachments = await this.getAttachments()
    const index = attachments.findIndex(a => a.id === id)
    if (index === -1) {
      throw new Error(`Attachment with id ${id} not found`)
    }
    attachments[index] = {
      ...attachments[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.ATTACHMENTS, attachments)
    return attachments[index]
  }
  
  async deleteAttachment(id: string): Promise<boolean> {
    const attachments = await this.getAttachments()
    const filtered = attachments.filter(a => a.id !== id)
    saveToStorage(STORAGE_KEYS.ATTACHMENTS, filtered)
    return true
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Search trades with filters
   */
  async searchTrades(filters: SearchFilters): Promise<Trade[]> {
    let trades = await this.getTrades()
    
    if (filters.symbol) {
      trades = trades.filter(t => t.symbol === filters.symbol)
    }
    
    if (filters.tags && filters.tags.length > 0) {
      trades = trades.filter(t => 
        t.tags && filters.tags!.some(tag => t.tags!.includes(tag))
      )
    }
    
    if (filters.dateFrom) {
      trades = trades.filter(t => t.createdAt >= filters.dateFrom!)
    }
    
    if (filters.dateTo) {
      trades = trades.filter(t => t.createdAt <= filters.dateTo!)
    }
    
    if (filters.status) {
      trades = trades.filter(t => t.status === filters.status as any)
    }
    
    return trades
  }
  
  /**
   * Get paginated results (legacy method for compatibility)
   */
  async getPaginatedTrades(
    options: { page: number; pageSize: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
    filters?: SearchFilters
  ): Promise<{ items: Trade[]; total: number; page: number; pageSize: number; totalPages: number }> {
    let trades = filters 
      ? await this.searchTrades(filters)
      : await this.getTrades()
    
    // Sort
    if (options.sortBy) {
      trades.sort((a, b) => {
        const aVal = (a as any)[options.sortBy!]
        const bVal = (b as any)[options.sortBy!]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return options.sortOrder === 'desc' ? -comparison : comparison
      })
    }
    
    // Paginate
    const start = (options.page - 1) * options.pageSize
    const end = start + options.pageSize
    const paginated = trades.slice(start, end)
    
    return {
      items: paginated,
      total: trades.length,
      page: options.page,
      pageSize: options.pageSize,
      totalPages: Math.ceil(trades.length / options.pageSize),
    }
  }
  
  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    if (typeof window === 'undefined') return
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }
  
  /**
   * Export all data as JSON
   */
  async exportData(): Promise<string> {
    const data = {
      trades: await this.getTrades(),
      positions: await this.getPositions(),
      notes: await this.getNotes(),
      attachments: await this.getAttachments(),
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * Import data from JSON
   */
  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)
    
    if (data.trades && Array.isArray(data.trades)) {
      saveToStorage(STORAGE_KEYS.TRADES, data.trades)
    }
    
    if (data.positions && Array.isArray(data.positions)) {
      saveToStorage(STORAGE_KEYS.POSITIONS, data.positions)
    }
    
    if (data.notes && Array.isArray(data.notes)) {
      saveToStorage(STORAGE_KEYS.NOTES, data.notes)
    }
    
    if (data.attachments && Array.isArray(data.attachments)) {
      saveToStorage(STORAGE_KEYS.ATTACHMENTS, data.attachments)
    }
  }

  // ============================================================================
  // ALERTS
  // ============================================================================
  
  async saveAlert(alert: Partial<Alert> & { symbol: string; type: AlertType; condition: AlertCondition; status: AlertStatus; notifyOnTrigger: boolean }): Promise<Alert> {
    const alerts = await this.getAlerts()
    const newAlert: Alert = {
      ...alert,
      id: alert.id || generateId(),
      createdAt: alert.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Alert
    alerts.push(newAlert)
    saveToStorage(STORAGE_KEYS.ALERTS, alerts)
    return newAlert
  }
  
  async getAlert(id: string): Promise<Alert | null> {
    const alerts = await this.getAlerts()
    return alerts.find(a => a.id === id) || null
  }
  
  async getAlerts(filters?: SearchFilters, pagination?: PaginationOptions): Promise<Alert[]> {
    let alerts = getFromStorage<Alert>(STORAGE_KEYS.ALERTS, [])
    if (filters?.symbol) {
      alerts = alerts.filter(a => a.symbol === filters.symbol)
    }
    if (filters?.status) {
      alerts = alerts.filter(a => a.status === filters.status as any)
    }
    if (filters?.type) {
      alerts = alerts.filter(a => a.type === filters.type as any)
    }
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || alerts.length)
      alerts = alerts.slice(start, end)
    }
    return alerts
  }
  
  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    const alerts = await this.getAlerts()
    const index = alerts.findIndex(a => a.id === id)
    if (index === -1) {
      throw new Error(`Alert with id ${id} not found`)
    }
    alerts[index] = {
      ...alerts[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.ALERTS, alerts)
    return alerts[index]
  }
  
  async deleteAlert(id: string): Promise<boolean> {
    const alerts = await this.getAlerts()
    const filtered = alerts.filter(a => a.id !== id)
    saveToStorage(STORAGE_KEYS.ALERTS, filtered)
    return true
  }

  // ============================================================================
  // CUSTOM METRICS
  // ============================================================================
  
  async saveCustomMetric(metric: Partial<CustomMetric> & { symbol: string; metricType: MetricType; displayName: string; order: number; visible: boolean }): Promise<CustomMetric> {
    const metrics = await this.getCustomMetrics()
    const newMetric: CustomMetric = {
      ...metric,
      id: metric.id || generateId(),
      createdAt: metric.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CustomMetric
    metrics.push(newMetric)
    saveToStorage(STORAGE_KEYS.CUSTOM_METRICS, metrics)
    return newMetric
  }
  
  async getCustomMetric(id: string): Promise<CustomMetric | null> {
    const metrics = await this.getCustomMetrics()
    return metrics.find(m => m.id === id) || null
  }
  
  async getCustomMetrics(filters?: SearchFilters, pagination?: PaginationOptions): Promise<CustomMetric[]> {
    let metrics = getFromStorage<CustomMetric>(STORAGE_KEYS.CUSTOM_METRICS, [])
    if (filters?.symbol) {
      metrics = metrics.filter(m => m.symbol === filters.symbol)
    }
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || metrics.length)
      metrics = metrics.slice(start, end)
    }
    return metrics
  }
  
  async updateCustomMetric(id: string, updates: Partial<CustomMetric>): Promise<CustomMetric> {
    const metrics = await this.getCustomMetrics()
    const index = metrics.findIndex(m => m.id === id)
    if (index === -1) {
      throw new Error(`CustomMetric with id ${id} not found`)
    }
    metrics[index] = {
      ...metrics[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.CUSTOM_METRICS, metrics)
    return metrics[index]
  }
  
  async deleteCustomMetric(id: string): Promise<boolean> {
    const metrics = await this.getCustomMetrics()
    const filtered = metrics.filter(m => m.id !== id)
    saveToStorage(STORAGE_KEYS.CUSTOM_METRICS, filtered)
    return true
  }

  // ============================================================================
  // CUSTOM METRIC VIEWS
  // ============================================================================
  
  async saveCustomMetricView(view: Partial<CustomMetricView> & { name: string; metrics: string[]; isDefault: boolean }): Promise<CustomMetricView> {
    const views = await this.getCustomMetricViews()
    // If this is default, unset other defaults
    if (view.isDefault) {
      views.forEach(v => { v.isDefault = false })
    }
    const newView: CustomMetricView = {
      ...view,
      id: view.id || generateId(),
      createdAt: view.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CustomMetricView
    views.push(newView)
    saveToStorage(STORAGE_KEYS.CUSTOM_METRIC_VIEWS, views)
    return newView
  }
  
  async getCustomMetricView(id: string): Promise<CustomMetricView | null> {
    const views = await this.getCustomMetricViews()
    return views.find(v => v.id === id) || null
  }
  
  async getCustomMetricViews(filters?: SearchFilters, pagination?: PaginationOptions): Promise<CustomMetricView[]> {
    let views = getFromStorage<CustomMetricView>(STORAGE_KEYS.CUSTOM_METRIC_VIEWS, [])
    if (filters?.symbol) {
      views = views.filter(v => v.symbol === filters.symbol)
    }
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || views.length)
      views = views.slice(start, end)
    }
    return views
  }
  
  async updateCustomMetricView(id: string, updates: Partial<CustomMetricView>): Promise<CustomMetricView> {
    const views = await this.getCustomMetricViews()
    const index = views.findIndex(v => v.id === id)
    if (index === -1) {
      throw new Error(`CustomMetricView with id ${id} not found`)
    }
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      views.forEach(v => { if (v.id !== id) v.isDefault = false })
    }
    views[index] = {
      ...views[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.CUSTOM_METRIC_VIEWS, views)
    return views[index]
  }
  
  async deleteCustomMetricView(id: string): Promise<boolean> {
    const views = await this.getCustomMetricViews()
    const filtered = views.filter(v => v.id !== id)
    saveToStorage(STORAGE_KEYS.CUSTOM_METRIC_VIEWS, filtered)
    return true
  }

  // ============================================================================
  // INVESTMENT JOURNAL
  // ============================================================================
  
  async saveJournalEntry(entry: Partial<InvestmentJournalEntry> & { symbol: string; date: string; content: string }): Promise<InvestmentJournalEntry> {
    const entries = await this.getJournalEntries()
    const newEntry: InvestmentJournalEntry = {
      ...entry,
      id: entry.id || generateId(),
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as InvestmentJournalEntry
    entries.push(newEntry)
    saveToStorage(STORAGE_KEYS.INVESTMENT_JOURNAL, entries)
    return newEntry
  }
  
  async getJournalEntry(id: string): Promise<InvestmentJournalEntry | null> {
    const entries = await this.getJournalEntries()
    return entries.find(e => e.id === id) || null
  }
  
  async getJournalEntries(filters?: SearchFilters, pagination?: PaginationOptions): Promise<InvestmentJournalEntry[]> {
    let entries = getFromStorage<InvestmentJournalEntry>(STORAGE_KEYS.INVESTMENT_JOURNAL, [])
    if (filters?.symbol) {
      entries = entries.filter(e => e.symbol === filters.symbol)
    }
    if (filters?.tags && filters.tags.length > 0) {
      entries = entries.filter(e => e.tags && filters.tags!.some(tag => e.tags!.includes(tag)))
    }
    if (filters?.dateFrom) {
      entries = entries.filter(e => e.date >= filters.dateFrom!)
    }
    if (filters?.dateTo) {
      entries = entries.filter(e => e.date <= filters.dateTo!)
    }
    // Sort by date descending (newest first)
    entries.sort((a, b) => b.date.localeCompare(a.date))
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || entries.length)
      entries = entries.slice(start, end)
    }
    return entries
  }
  
  async updateJournalEntry(id: string, updates: Partial<InvestmentJournalEntry>): Promise<InvestmentJournalEntry> {
    const entries = await this.getJournalEntries()
    const index = entries.findIndex(e => e.id === id)
    if (index === -1) {
      throw new Error(`JournalEntry with id ${id} not found`)
    }
    entries[index] = {
      ...entries[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.INVESTMENT_JOURNAL, entries)
    return entries[index]
  }
  
  async deleteJournalEntry(id: string): Promise<boolean> {
    const entries = await this.getJournalEntries()
    const filtered = entries.filter(e => e.id !== id)
    saveToStorage(STORAGE_KEYS.INVESTMENT_JOURNAL, filtered)
    return true
  }

  // ============================================================================
  // INVESTMENT HYPOTHESIS
  // ============================================================================
  
  async saveHypothesis(hypothesis: Partial<InvestmentHypothesis> & { symbol: string; hypothesis: string; status: 'ACTIVE' | 'VALIDATED' | 'INVALIDATED' | 'ARCHIVED' }): Promise<InvestmentHypothesis> {
    const hypotheses = await this.getHypotheses()
    const newHypothesis: InvestmentHypothesis = {
      ...hypothesis,
      id: hypothesis.id || generateId(),
      validations: hypothesis.validations || [],
      consecutiveValid: hypothesis.consecutiveValid || 0,
      consecutiveInvalid: hypothesis.consecutiveInvalid || 0,
      totalValid: hypothesis.totalValid || 0,
      totalInvalid: hypothesis.totalInvalid || 0,
      createdAt: hypothesis.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as InvestmentHypothesis
    hypotheses.push(newHypothesis)
    saveToStorage(STORAGE_KEYS.INVESTMENT_HYPOTHESIS, hypotheses)
    return newHypothesis
  }
  
  async getHypothesis(id: string): Promise<InvestmentHypothesis | null> {
    const hypotheses = await this.getHypotheses()
    return hypotheses.find(h => h.id === id) || null
  }
  
  async getHypotheses(filters?: SearchFilters, pagination?: PaginationOptions): Promise<InvestmentHypothesis[]> {
    let hypotheses = getFromStorage<InvestmentHypothesis>(STORAGE_KEYS.INVESTMENT_HYPOTHESIS, [])
    if (filters?.symbol) {
      hypotheses = hypotheses.filter(h => h.symbol === filters.symbol)
    }
    if (filters?.status) {
      hypotheses = hypotheses.filter(h => h.status === filters.status as any)
    }
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || hypotheses.length)
      hypotheses = hypotheses.slice(start, end)
    }
    return hypotheses
  }
  
  async updateHypothesis(id: string, updates: Partial<InvestmentHypothesis>): Promise<InvestmentHypothesis> {
    const hypotheses = await this.getHypotheses()
    const index = hypotheses.findIndex(h => h.id === id)
    if (index === -1) {
      throw new Error(`Hypothesis with id ${id} not found`)
    }
    hypotheses[index] = {
      ...hypotheses[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.INVESTMENT_HYPOTHESIS, hypotheses)
    return hypotheses[index]
  }
  
  async deleteHypothesis(id: string): Promise<boolean> {
    const hypotheses = await this.getHypotheses()
    const filtered = hypotheses.filter(h => h.id !== id)
    saveToStorage(STORAGE_KEYS.INVESTMENT_HYPOTHESIS, filtered)
    return true
  }

  // ============================================================================
  // PORTFOLIO PURPOSE (stub implementations)
  // ============================================================================
  
  async savePortfolioPurpose(purpose: Partial<PortfolioPurposeTag> & { purpose: PortfolioPurpose; targetAmount: number; currentAmount: number }): Promise<PortfolioPurposeTag> {
    const purposes = await this.getPortfolioPurposes()
    const newPurpose: PortfolioPurposeTag = {
      ...purpose,
      id: purpose.id || generateId(),
      createdAt: purpose.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as PortfolioPurposeTag
    purposes.push(newPurpose)
    saveToStorage(STORAGE_KEYS.PORTFOLIO_PURPOSES, purposes)
    return newPurpose
  }
  
  async getPortfolioPurpose(id: string): Promise<PortfolioPurposeTag | null> {
    const purposes = await this.getPortfolioPurposes()
    return purposes.find(p => p.id === id) || null
  }
  
  async getPortfolioPurposes(filters?: SearchFilters, pagination?: PaginationOptions): Promise<PortfolioPurposeTag[]> {
    let purposes = getFromStorage<PortfolioPurposeTag>(STORAGE_KEYS.PORTFOLIO_PURPOSES, [])
    if (filters?.symbol) {
      // Filter by associated positions/trades
      purposes = purposes.filter(p => 
        p.positionIds?.some(posId => posId === filters.symbol) ||
        p.tradeIds?.some(tradeId => tradeId === filters.symbol)
      )
    }
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || purposes.length)
      purposes = purposes.slice(start, end)
    }
    return purposes
  }
  
  async updatePortfolioPurpose(id: string, updates: Partial<PortfolioPurposeTag>): Promise<PortfolioPurposeTag> {
    const purposes = await this.getPortfolioPurposes()
    const index = purposes.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error(`PortfolioPurpose with id ${id} not found`)
    }
    purposes[index] = {
      ...purposes[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.PORTFOLIO_PURPOSES, purposes)
    return purposes[index]
  }
  
  async deletePortfolioPurpose(id: string): Promise<boolean> {
    const purposes = await this.getPortfolioPurposes()
    const filtered = purposes.filter(p => p.id !== id)
    saveToStorage(STORAGE_KEYS.PORTFOLIO_PURPOSES, filtered)
    return true
  }

  // ============================================================================
  // TRADE MISTAKES (stub implementations)
  // ============================================================================
  
  async saveTradeMistake(mistake: Partial<TradeMistake> & { tradeId: string; symbol: string; category: MistakeCategory; description: string; impact: number; learned: string }): Promise<TradeMistake> {
    const mistakes = await this.getTradeMistakes()
    const newMistake: TradeMistake = {
      ...mistake,
      id: mistake.id || generateId(),
      createdAt: mistake.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TradeMistake
    mistakes.push(newMistake)
    saveToStorage(STORAGE_KEYS.TRADE_MISTAKES, mistakes)
    return newMistake
  }
  
  async getTradeMistake(id: string): Promise<TradeMistake | null> {
    const mistakes = await this.getTradeMistakes()
    return mistakes.find(m => m.id === id) || null
  }
  
  async getTradeMistakes(filters?: SearchFilters, pagination?: PaginationOptions): Promise<TradeMistake[]> {
    let mistakes = getFromStorage<TradeMistake>(STORAGE_KEYS.TRADE_MISTAKES, [])
    if (filters?.symbol) {
      mistakes = mistakes.filter(m => m.symbol === filters.symbol)
    }
    if (filters?.type) {
      mistakes = mistakes.filter(m => m.category === filters.type as any)
    }
    if (pagination) {
      const start = pagination.offset || 0
      const end = start + (pagination.limit || mistakes.length)
      mistakes = mistakes.slice(start, end)
    }
    return mistakes
  }
  
  async updateTradeMistake(id: string, updates: Partial<TradeMistake>): Promise<TradeMistake> {
    const mistakes = await this.getTradeMistakes()
    const index = mistakes.findIndex(m => m.id === id)
    if (index === -1) {
      throw new Error(`TradeMistake with id ${id} not found`)
    }
    mistakes[index] = {
      ...mistakes[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.TRADE_MISTAKES, mistakes)
    return mistakes[index]
  }
  
  async deleteTradeMistake(id: string): Promise<boolean> {
    const mistakes = await this.getTradeMistakes()
    const filtered = mistakes.filter(m => m.id !== id)
    saveToStorage(STORAGE_KEYS.TRADE_MISTAKES, filtered)
    return true
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let storageAdapterInstance: LocalStorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (!storageAdapterInstance) {
    storageAdapterInstance = new LocalStorageAdapter()
  }
  return storageAdapterInstance
}

