import { revalidatePath, revalidateTag } from 'next/cache'

import { CACHE_TAGS } from '@/hooks/revalidate'

/**
 * Manual cache bust for ops use: POST /api/revalidate with x-revalidation-secret header.
 * The CMS hooks already revalidate on publish; this is a safety valve.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATION_SECRET
  if (!secret || req.headers.get('x-revalidation-secret') !== secret) {
    return Response.json({ ok: false }, { status: 401 })
  }
  for (const tag of Object.values(CACHE_TAGS)) revalidateTag(tag, 'max')
  revalidatePath('/', 'layout')
  return Response.json({ ok: true, revalidated: Object.values(CACHE_TAGS) })
}
