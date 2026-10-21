import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * GET /api/health: for an uptime monitor (e.g. Better Stack or UptimeRobot, every minute).
 * 200 means the app and its database both answer; 503 means page someone. Never cached, and
 * reveals nothing beyond up or down.
 */
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 3000

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const payload = await getPayload({ config })
    const drizzle = (payload.db as unknown as PostgresAdapter).drizzle
    await Promise.race([
      drizzle.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
    ])
    return Response.json({ status: 'ok', database: 'ok' }, { headers })
  } catch {
    return Response.json({ status: 'error', database: 'unreachable' }, { status: 503, headers })
  }
}
