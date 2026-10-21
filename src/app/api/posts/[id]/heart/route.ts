import { addHeart, getHearts, publishedPostId, removeHeart } from '@/lib/hearts'

/**
 * GET    /api/posts/:id/heart  → { hearts }
 * POST   /api/posts/:id/heart  → add a heart
 * DELETE /api/posts/:id/heart  → remove it again
 *
 * Article pages are static, so the button reads and writes the count here. Writes must come
 * from this site (Origin check), which stops other sites inflating counts via hidden forms.
 */

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

export async function GET(_req: Request, ctx: Ctx) {
  const id = await resolvePost(ctx)
  if (!id) return json({ error: 'Not found' }, 404)
  return json({ hearts: await getHearts(id) })
}

export async function POST(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Forbidden' }, 403)
  const id = await resolvePost(ctx)
  if (!id) return json({ error: 'Not found' }, 404)
  return json({ hearts: await addHeart(id) })
}

export async function DELETE(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Forbidden' }, 403)
  const id = await resolvePost(ctx)
  if (!id) return json({ error: 'Not found' }, 404)
  return json({ hearts: await removeHeart(id) })
}
