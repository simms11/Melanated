import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * GET /api/health/database: is the database reachable? 200, or 503 if it doesn't answer
 * within 3 seconds. Check this rarely (every 30 to 60 minutes): on Neon's free plan the
 * database sleeps after 5 idle minutes, and pinging it more often keeps it awake all month,
 * using up the compute allowance. The frequent uptime check is /api/health.
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
