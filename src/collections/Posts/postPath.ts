import type { Payload, PayloadRequest } from 'payload'

import type { Post } from '@/payload-types'

/**
 * Hooks and admin callbacks usually receive `category` as a bare ID, not the populated
 * doc, so the slug has to be looked up. Pass `req` from hooks to stay in their transaction.
 */
export const categorySlugOf = async (
  payload: Payload,
  category: Post['category'] | null | undefined,
  req?: PayloadRequest,
): Promise<string | null> => {
  if (category == null) return null
  if (typeof category === 'object') return category.slug ?? null
  const found = await payload
    .findByID({ collection: 'categories', id: category, depth: 0, select: { slug: true }, req })
    .catch(() => null)
  return found?.slug ?? null
}

/** Canonical path of a post — `/<category>/<slug>` — or null if it doesn't have one yet. */
export const postPath = async (
  payload: Payload,
  doc: Pick<Post, 'slug' | 'category'> | null | undefined,
  req?: PayloadRequest,
): Promise<string | null> => {
  if (!doc?.slug) return null
  const category = await categorySlugOf(payload, doc.category, req)
  return category ? `/${category}/${doc.slug}` : null
}
