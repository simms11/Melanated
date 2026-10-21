/**
 * GET /api/health: is the site up? For an uptime monitor polling every few minutes.
 * Deliberately doesn't touch the database (see /api/health/database for that), so frequent
 * checks never keep a sleeping database awake. Public pages are static, so this is what
 * readers actually depend on.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
