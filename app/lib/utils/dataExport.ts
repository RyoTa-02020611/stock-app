/**
 * Data Export/Import Utility
 * 
 * Provides functionality to export and import application data
 * for backup and migration purposes.
 */

import { getStorageAdapter } from '../storage/localStorageAdapter'
import { Trade, Position, Note, Attachment, Alert, CustomMetric, CustomMetricView, InvestmentJournalEntry, InvestmentHypothesis, PortfolioPurposeTag, TradeMistake } from '../schema'

export interface ExportedData {
  version: string
  exportedAt: string
  data: {
    trades: Trade[]
    positions: Position[]
    notes: Note[]
    attachments: Attachment[]
    alerts: Alert[]
    customMetrics: CustomMetric[]
    customMetricViews: CustomMetricView[]
    journalEntries: InvestmentJournalEntry[]
    hypotheses: InvestmentHypothesis[]
    purposes: PortfolioPurposeTag[]
    mistakes: TradeMistake[]
  }
}

/**
 * Export all application data to JSON
 */
export async function exportData(): Promise<string> {
  const storage = getStorageAdapter()
  
  const [
    trades,
    positions,
    notes,
    attachments,
    alerts,
    customMetrics,
    customMetricViews,
    journalEntries,
    hypotheses,
    purposes,
    mistakes,
  ] = await Promise.all([
    storage.getTrades(),
    storage.getPositions(),
    storage.getNotes(),
    storage.getAttachments(),
    storage.getAlerts(),
    storage.getCustomMetrics(),
    storage.getCustomMetricViews(),
    storage.getJournalEntries(),
    storage.getHypotheses(),
    storage.getPortfolioPurposes(),
    storage.getTradeMistakes(),
  ])

  const exportedData: ExportedData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      trades,
      positions,
      notes,
      attachments,
      alerts,
      customMetrics,
      customMetricViews,
      journalEntries,
      hypotheses,
      purposes,
      mistakes,
    },
  }

  return JSON.stringify(exportedData, null, 2)
}

/**
 * Import data from JSON string
 */
export async function importData(jsonString: string): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  
  try {
    const importedData: ExportedData = JSON.parse(jsonString)
    
    if (!importedData.data) {
      throw new Error('Invalid data format')
    }

    const storage = getStorageAdapter()

    // Import all data types
    const importPromises = [
      ...importedData.data.trades.map(trade => storage.saveTrade(trade).catch(err => {
        errors.push(`Failed to import trade ${trade.id}: ${err.message}`)
      })),
      ...importedData.data.positions.map(position => storage.savePosition(position).catch(err => {
        errors.push(`Failed to import position ${position.id}: ${err.message}`)
      })),
      ...importedData.data.notes.map(note => storage.saveNote(note).catch(err => {
        errors.push(`Failed to import note ${note.id}: ${err.message}`)
      })),
      ...importedData.data.attachments.map(attachment => storage.saveAttachment(attachment).catch(err => {
        errors.push(`Failed to import attachment ${attachment.id}: ${err.message}`)
      })),
      ...importedData.data.alerts.map(alert => storage.saveAlert(alert).catch(err => {
        errors.push(`Failed to import alert ${alert.id}: ${err.message}`)
      })),
      ...importedData.data.customMetrics.map(metric => storage.saveCustomMetric(metric).catch(err => {
        errors.push(`Failed to import custom metric ${metric.id}: ${err.message}`)
      })),
      ...importedData.data.customMetricViews.map(view => storage.saveCustomMetricView(view).catch(err => {
        errors.push(`Failed to import custom metric view ${view.id}: ${err.message}`)
      })),
      ...importedData.data.journalEntries.map(entry => storage.saveJournalEntry(entry).catch(err => {
        errors.push(`Failed to import journal entry ${entry.id}: ${err.message}`)
      })),
      ...importedData.data.hypotheses.map(hypothesis => storage.saveHypothesis(hypothesis).catch(err => {
        errors.push(`Failed to import hypothesis ${hypothesis.id}: ${err.message}`)
      })),
      ...importedData.data.purposes.map(purpose => storage.savePortfolioPurpose(purpose).catch(err => {
        errors.push(`Failed to import purpose ${purpose.id}: ${err.message}`)
      })),
      ...importedData.data.mistakes.map(mistake => storage.saveTradeMistake(mistake).catch(err => {
        errors.push(`Failed to import mistake ${mistake.id}: ${err.message}`)
      })),
    ]

    await Promise.allSettled(importPromises)

    return {
      success: errors.length === 0,
      errors,
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error during import'],
    }
  }
}

/**
 * Download data as JSON file
 */
export function downloadDataAsFile(data: string, filename: string = 'portfolio-backup.json') {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

