import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { postPath } from '@/collections/Posts/postPath'
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

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  const { payload, context } = req
  if (context.disableRevalidate) return doc

  const paths = new Set<string>()
  if (doc._status === 'published') {
    const path = await postPath(payload, doc, req)
    if (path) paths.add(path)
  }
  if (previousDoc?._status === 'published') {
    const path = await postPath(payload, previousDoc, req)
    if (path) paths.add(path)
  }

  for (const path of paths) {
    payload.logger.info(`Revalidating ${path}`)
    revalidatePath(path)
  }
  revalidateTag(CACHE_TAGS.posts, 'max')
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc
  const path = await postPath(req.payload, doc, req)
  if (path) revalidatePath(path)
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
