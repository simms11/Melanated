import type { CollectionBeforeValidateHook, CollectionSlug } from 'payload'
import { ValidationError } from 'payload'

/**
 * Categories (/<slug>) and pages (/<slug>) share the top-level URL space, alongside the
 * site's own routes. An address may belong to only one of them.
 */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'community',
  'styleguide',
  'posts',
  'page',
  'feed',
  'sitemap',
  'robots',
])

export const uniqueTopLevelSlug =
  (own: 'categories' | 'pages'): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req }) => {
    const slug = data?.slug ?? originalDoc?.slug
    if (!slug || slug === originalDoc?.slug) return data

    const fail = (message: string) => {
      throw new ValidationError({ collection: own, errors: [{ path: 'slug', message }], req })
    }
    if (RESERVED_SLUGS.has(slug))
      fail(`"/${slug}" is used by the site itself. Choose another address.`)

    const other: CollectionSlug = own === 'pages' ? 'categories' : 'pages'
    const { totalDocs } = await req.payload.count({
      collection: other,
      where: { slug: { equals: slug } },
      req,
    })
    if (totalDocs > 0) {
      fail(
        `"/${slug}" is already used by a ${other === 'pages' ? 'page' : 'section'}. Choose another address.`,
      )
    }
    return data
  }
