import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'
import { getPayload } from 'payload'

import config from '@payload-config'
import { CACHE_TAGS } from '@/hooks/revalidate'
import type { Category, Post, SiteSetting } from '@/payload-types'

/**
 * All frontend reads go through this module so caching is in one place.
 * Each query is tagged; the CMS hooks revalidate the matching tag on publish,
 * so pages are static but never stale.
 */

const payloadClient = () => getPayload({ config })

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSetting> => {
    const payload = await payloadClient()
    return payload.findGlobal({ slug: 'site-settings', depth: 1 })
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: 3600 },
)

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      sort: 'order',
      limit: 20,
      depth: 1,
    })
    return docs
  },
  ['categories'],
  { tags: [CACHE_TAGS.categories], revalidate: 3600 },
)

export const getCategoryBySlug = async (slug: string): Promise<Category | null> =>
  (await getCategories()).find((c) => c.slug === slug) ?? null

type PostListArgs = {
  categorySlug?: string
  page?: number
  limit?: number
  featured?: boolean
  trending?: boolean
  excludeIds?: Array<number | string>
}

export const getPosts = unstable_cache(
  async ({
    categorySlug,
    page = 1,
    limit = 12,
    featured,
    trending,
    excludeIds = [],
  }: PostListArgs = {}) => {
    const payload = await payloadClient()
    const and: Where[] = [{ _status: { equals: 'published' } }]
    if (categorySlug) and.push({ 'category.slug': { equals: categorySlug } })
    if (featured !== undefined) and.push({ featured: { equals: featured } })
    if (trending !== undefined) and.push({ trending: { equals: trending } })
    if (excludeIds.length) and.push({ id: { not_in: excludeIds } })

    return payload.find({
      collection: 'posts',
      where: { and },
      sort: '-publishedAt',
      page,
      limit,
      depth: 2,
      overrideAccess: false,
    })
  },
  ['posts'],
  { tags: [CACHE_TAGS.posts], revalidate: 3600 },
)

const findPostBySlug = async (slug: string, draft: boolean): Promise<Post | null> => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft,
    overrideAccess: draft,
  })
  return docs[0] ?? null
}

const getPublishedPostBySlug = unstable_cache(
  (slug: string) => findPostBySlug(slug, false),
  ['post'],
  { tags: [CACHE_TAGS.posts], revalidate: 3600 },
)

/** Draft reads (preview mode) bypass the cache so editors always see their latest save. */
export const getPostBySlug = (slug: string, draft = false): Promise<Post | null> =>
  draft ? findPostBySlug(slug, true) : getPublishedPostBySlug(slug)

/** Lightweight list of every published post, for the sitemap and RSS feed. */
export const getAllPostSlugs = unstable_cache(
  async () => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      select: {
        slug: true,
        category: true,
        updatedAt: true,
        publishedAt: true,
        title: true,
        excerpt: true,
      },
      depth: 1,
      limit: 1000,
      pagination: false,
      sort: '-publishedAt',
    })
    return docs
  },
  ['post-slugs'],
  { tags: [CACHE_TAGS.posts], revalidate: 3600 },
)
