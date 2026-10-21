import { randomUUID } from 'node:crypto'

import { cookies } from 'next/headers'

import { addHeart, getHearts, publishedPostId, removeHeart, takeHeartAction } from '@/lib/hearts'

/**
 * GET    /api/posts/:id/heart  → { hearts, hearted }
 * POST   /api/posts/:id/heart  → add this reader's heart
 * DELETE /api/posts/:id/heart  → remove this reader's own heart
 *
 * Article pages are static, so the button reads and writes here. Protections:
 * - Same-origin writes only, so other sites can't post hearts through a reader's browser.
 * - VOTER_COOKIE: an anonymous random id, httpOnly, scoped to this API. It is what makes a
 *   heart "yours", so it can't be added twice or removed by anyone else. Strictly necessary
 *   for the heart feature the reader is using; it identifies no one.
 * - takeHeartAction: at most HEART_RATE_LIMIT writes per network per hour.
 */

const VOTER_COOKIE = 'mo_voter'
const YEAR = 60 * 60 * 24 * 365

type Ctx = { params: Promise<{ id: string }> }

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const resolvePost = async ({ params }: Ctx): Promise<number | null> => {
  const id = Number((await params).id)
  return Number.isInteger(id) && id > 0 ? publishedPostId(id) : null
}

const sameOrigin = (req: Request): boolean => {
  const origin = req.headers.get('origin')
  return origin !== null && origin === new URL(req.url).origin
}

/** Vercel sets x-forwarded-for to the client address first; locally there's none. */
const network = (req: Request): string =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip') ||
  'local'

const voterId = async (create: boolean): Promise<string | null> => {
  const jar = await cookies()
  const existing = jar.get(VOTER_COOKIE)?.value
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing
  if (!create) return null
  const id = randomUUID()
  jar.set(VOTER_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/posts',
    maxAge: YEAR,
  })
  return id
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = await resolvePost(ctx)
  if (!id) return json({ error: 'Not found' }, 404)
  return json(await getHearts(id, (await voterId(false)) ?? undefined))
}

export async function POST(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Forbidden' }, 403)
  const id = await resolvePost(ctx)
  if (!id) return json({ error: 'Not found' }, 404)
  if (!(await takeHeartAction(network(req)))) return json({ error: 'Too many requests' }, 429)
  const voter = (await voterId(true)) as string
  return json({ hearts: await addHeart(id, voter), hearted: true })
}

export async function DELETE(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Forbidden' }, 403)
  const id = await resolvePost(ctx)
  if (!id) return json({ error: 'Not found' }, 404)
  if (!(await takeHeartAction(network(req)))) return json({ error: 'Too many requests' }, 429)
  const voter = await voterId(false)
  if (!voter) return json(await getHearts(id))
  return json({ hearts: await removeHeart(id, voter), hearted: false })
}
