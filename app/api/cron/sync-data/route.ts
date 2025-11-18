import { NextRequest, NextResponse } from 'next/server'
import { getDataSyncJob } from '../../../lib/jobs/dataSyncJob'

/**
 * GET /api/cron/sync-data
 * 
 * Background job endpoint for syncing data
 * Can be called by Vercel Cron Jobs or external cron services
 */
export async function GET(request: NextRequest) {
  try {
    // Verify request is from cron job (optional security check)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const job = getDataSyncJob()
    const result = await job.runFullSync()

    return NextResponse.json({
      success: result.success,
      itemsSynced: result.itemsSynced,
      errors: result.errors,
      timestamp: result.timestamp,
    })
  } catch (error: any) {
    console.error('Data sync job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run sync job' },
      { status: 500 }
    )
  }
}

