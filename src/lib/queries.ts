import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'
import { getPayload } from 'payload'

import config from '@payload-config'
import { postPath } from '@/collections/Posts/postPath'
import { CACHE_TAGS } from '@/hooks/revalidate'
import type { Category, Page, PageContent, Post, SiteSetting } from '@/payload-types'

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

/** Editable copy for the home and Community pages (Page content global). */
export const getPageContent = unstable_cache(
  async (): Promise<PageContent> => {
    const payload = await payloadClient()
    return payload.findGlobal({ slug: 'page-content', depth: 0 })
  },
  ['page-content'],
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
  /** Only these posts, returned in this order (e.g. an editor's hand-picked related posts). */
  ids?: Array<number | string>
}

/** The fields a post card renders. Lists select only these, so cached lists stay small. */
export type CardPost = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'heroImage'
  | 'category'
  | 'publishedAt'
  | 'readTime'
  | 'disclosure'
>

const CARD_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  heroImage: true,
  category: true,
  publishedAt: true,
  readTime: true,
  disclosure: true,
} as const

/**
 * Published posts for cards and listings. Uncached so it can be tested directly; pages use
 * getPosts. Selecting card fields keeps article bodies, SEO and relations out of each cached
 * list (whole articles could approach Vercel's per-entry cache limit).
 */
export const findCardPosts = async (
  payload: Awaited<ReturnType<typeof payloadClient>>,
  {
    categorySlug,
    page = 1,
    limit = 12,
    featured,
    trending,
    excludeIds = [],
    ids,
  }: PostListArgs = {},
) => {
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (categorySlug) and.push({ 'category.slug': { equals: categorySlug } })
  if (featured !== undefined) and.push({ featured: { equals: featured } })
  if (trending !== undefined) and.push({ trending: { equals: trending } })
  if (excludeIds.length) and.push({ id: { not_in: excludeIds } })
  if (ids) and.push({ id: { in: ids.length ? ids : [-1] } })

  const result = await payload.find({
    collection: 'posts',
    where: { and },
    sort: '-publishedAt',
    page,
    limit,
    depth: 1,
    select: CARD_SELECT,
    populate: { categories: { title: true, slug: true } },
    // Public data only: the where clause limits this to published posts.
    overrideAccess: true,
  })
  const docs = result.docs as CardPost[]
  if (ids) {
    const position = new Map(ids.map((id, i) => [String(id), i]))
    docs.sort((a, b) => (position.get(String(a.id)) ?? 0) - (position.get(String(b.id)) ?? 0))
  }
  return { ...result, docs }
}

export const getPosts = unstable_cache(
  async (args: PostListArgs = {}) => findCardPosts(await payloadClient(), args),
  ['posts'],
  { tags: [CACHE_TAGS.posts], revalidate: 3600 },
)

const findPostBySlug = async (slug: string, draft: boolean): Promise<Post | null> => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    // Outside preview, only a published post may be returned.
    where: draft
      ? { slug: { equals: slug } }
      : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
    draft,
    overrideAccess: true,
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

/**
 * Where an old URL now lives, or null. Targets are documents, so the answer is always the
 * document's *current* URL. Tagged with posts/categories too, since those changes move targets.
 */
export const getRedirect = unstable_cache(
  async (from: string): Promise<string | null> => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
      depth: 1,
    })
    const to = docs[0]?.to
    if (!to) return null
    if (to.type === 'custom') return to.url ?? null
    const ref = to.reference
    if (!ref || typeof ref.value !== 'object') return null
    if (ref.relationTo === 'categories') return `/${ref.value.slug}`
    // Populated relationships omit _status, so re-check the target is live.
    const { docs: live } = await payload.find({
      collection: 'posts',
      where: { and: [{ id: { equals: ref.value.id } }, { _status: { equals: 'published' } }] },
      select: { slug: true, category: true },
      limit: 1,
      depth: 0,
    })
    return live[0] ? postPath(payload, live[0]) : null
  },
  ['redirect'],
  { tags: [CACHE_TAGS.redirects, CACHE_TAGS.posts, CACHE_TAGS.categories], revalidate: 3600 },
)

const findPageBySlug = async (slug: string, draft: boolean): Promise<Page | null> => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: draft
      ? { slug: { equals: slug } }
      : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    draft,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

const getPublishedPageBySlug = unstable_cache(
  (slug: string) => findPageBySlug(slug, false),
  ['page'],
  { tags: [CACHE_TAGS.pages], revalidate: 3600 },
)

/** A standalone page; draft reads (preview mode) bypass the cache. */
export const getPageBySlug = (slug: string, draft = false): Promise<Page | null> =>
  draft ? findPageBySlug(slug, true) : getPublishedPageBySlug(slug)

/** Published pages: footer links (showInFooter) and the sitemap. */
export const getPublishedPages = unstable_cache(
  async () => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      select: { title: true, slug: true, showInFooter: true, updatedAt: true },
      sort: 'title',
      limit: 100,
      pagination: false,
      overrideAccess: true,
    })
    return docs as Array<Pick<Page, 'id' | 'title' | 'slug' | 'showInFooter' | 'updatedAt'>>
  },
  ['pages'],
  { tags: [CACHE_TAGS.pages], revalidate: 3600 },
)
