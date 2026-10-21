import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
} from 'payload'

import {
  revalidatePath as nextRevalidatePath,
  revalidateTag as nextRevalidateTag,
} from 'next/cache'

import { postPath } from '@/collections/Posts/postPath'
import type { Category, Page, Post } from '@/payload-types'

/**
 * Pages are statically generated and revalidated on publish, so the client never
 * needs a redeploy to see changes. Cache tags:
 *  - posts      — every list of posts (home, category pages, feed, sitemap)
 *  - categories — navigation and category pages
 *  - settings   — site-wide settings (header/footer/contact)
 *  - redirects  — old URLs kept alive after a slug or category change
 *  - pages      — standalone pages (privacy, terms...) and the footer links to them
 */
export const CACHE_TAGS = {
  posts: 'posts',
  categories: 'categories',
  settings: 'settings',
  redirects: 'redirects',
  pages: 'pages',
} as const

/**
 * Outside a Next request (CLI scripts, tests, a job run in-process) there is no cache to
 * clear and Next throws. A failed cache refresh must never roll back the content write it
 * follows — e.g. a scheduled publish — so log it; the 1-hour cache TTL is the backstop.
 */
const safely = (payload: Payload, what: string, fn: () => void) => {
  try {
    fn()
  } catch (err) {
    payload.logger.warn(`Skipped revalidating ${what}: ${(err as Error).message}`)
  }
}

export const revalidatePath = (payload: Payload, path: string, type?: 'layout' | 'page') =>
  safely(payload, path, () => nextRevalidatePath(path, type))

export const revalidateTag = (payload: Payload, tag: string) =>
  safely(payload, `tag ${tag}`, () => nextRevalidateTag(tag, 'max'))

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  const { payload, context } = req
  if (context.disableRevalidate) return doc
  // Nothing public changed: an autosave (every 2 seconds while writing), or a save of a post
  // that wasn't live before and still isn't. Publishing, live edits and unpublishing refresh.
  const isAutosave = String(req.query?.autosave) === 'true'
  if (isAutosave || (doc._status !== 'published' && previousDoc?._status !== 'published')) {
    return doc
  }

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
    revalidatePath(payload, path)
  }
  revalidateTag(payload, CACHE_TAGS.posts)
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc
  const path = await postPath(req.payload, doc, req)
  if (path) revalidatePath(req.payload, path)
  revalidateTag(req.payload, CACHE_TAGS.posts)
  return doc
}

export const revalidateAll: CollectionAfterChangeHook<Category> &
  CollectionAfterDeleteHook<Category> = ({ doc, req: { context, payload } }) => {
  if (context.disableRevalidate) return doc
  revalidateTag(payload, CACHE_TAGS.categories)
  revalidateTag(payload, CACHE_TAGS.posts)
  revalidatePath(payload, '/', 'layout')
  return doc
}

export const revalidateSettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (context.disableRevalidate) return doc
  revalidateTag(payload, CACHE_TAGS.settings)
  revalidatePath(payload, '/', 'layout')
  return doc
}

export const revalidatePage: CollectionAfterChangeHook<Page> & CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { context, payload },
}) => {
  if (context.disableRevalidate) return doc
  if (doc?.slug) revalidatePath(payload, `/${doc.slug}`)
  revalidateTag(payload, CACHE_TAGS.pages)
  // Footer links to pages appear on every page.
  revalidatePath(payload, '/', 'layout')
  return doc
}
