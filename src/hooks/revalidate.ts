import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Category, Post } from '@/payload-types'

/**
 * Pages are statically generated and revalidated on publish, so the client never
 * needs a redeploy to see changes. Cache tags:
 *  - posts      — every list of posts (home, category pages, feed, sitemap)
 *  - categories — navigation and category pages
 *  - settings   — site-wide settings (header/footer/contact)
 */
export const CACHE_TAGS = {
  posts: 'posts',
  categories: 'categories',
  settings: 'settings',
} as const

const categorySlug = (cat: Post['category']): string | undefined =>
  typeof cat === 'object' && cat !== null ? (cat.slug ?? undefined) : undefined

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  const paths = new Set<string>()
  if (doc._status === 'published') {
    paths.add(`/${categorySlug(doc.category) ?? 'posts'}/${doc.slug}`)
  }
  if (previousDoc?._status === 'published' && previousDoc.slug) {
    paths.add(`/${categorySlug(previousDoc.category) ?? 'posts'}/${previousDoc.slug}`)
  }

  for (const path of paths) {
    payload.logger.info(`Revalidating ${path}`)
    revalidatePath(path)
  }
  revalidateTag(CACHE_TAGS.posts, 'max')
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return doc
  if (doc?.slug) revalidatePath(`/${categorySlug(doc.category) ?? 'posts'}/${doc.slug}`)
  revalidateTag(CACHE_TAGS.posts, 'max')
  return doc
}

export const revalidateAll: CollectionAfterChangeHook<Category> &
  CollectionAfterDeleteHook<Category> = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidateTag(CACHE_TAGS.categories, 'max')
  revalidateTag(CACHE_TAGS.posts, 'max')
  revalidatePath('/', 'layout')
  return doc
}

export const revalidateSettings: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidateTag(CACHE_TAGS.settings, 'max')
  revalidatePath('/', 'layout')
  return doc
}
