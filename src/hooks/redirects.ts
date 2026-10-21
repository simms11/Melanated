import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
  PayloadRequest,
} from 'payload'

import { postPath } from '@/collections/Posts/postPath'
import type { Category, Post } from '@/payload-types'

import { CACHE_TAGS, revalidateTag } from './revalidate'

type Target = { relationTo: 'posts'; value: number } | { relationTo: 'categories'; value: number }

/**
 * Point `from` at a document (not a URL), so a page that moves twice still resolves in
 * one hop. Any redirect *from* the document's new path is removed — it's live again.
 */
const upsertRedirect = async (
  payload: Payload,
  req: PayloadRequest,
  from: string,
  newPath: string,
  to: Target,
) => {
  await payload.delete({ collection: 'redirects', where: { from: { equals: newPath } }, req })
  const { docs } = await payload.find({
    collection: 'redirects',
    where: { from: { equals: from } },
    limit: 1,
    depth: 0,
    req,
  })
  const data = { from, to: { type: 'reference' as const, reference: to } }
  if (docs[0]) {
    await payload.update({ collection: 'redirects', id: docs[0].id, data, req })
  } else {
    await payload.create({ collection: 'redirects', data, req })
  }
  payload.logger.info(`Redirect ${from} → ${newPath}`)
}

/**
 * The URL readers last saw. `previousDoc` is only that when the post went straight from
 * published to published; editors usually change the slug in a draft and publish later,
 * so otherwise read it from the last published version before this one.
 */
const lastPublished = async (
  doc: Post,
  previousDoc: Post | undefined,
  req: PayloadRequest,
): Promise<Pick<Post, 'slug' | 'category'> | null> => {
  if (previousDoc?._status === 'published') return previousDoc
  const { docs } = await req.payload.findVersions({
    collection: 'posts',
    where: {
      and: [
        { parent: { equals: doc.id } },
        { 'version._status': { equals: 'published' } },
        { updatedAt: { less_than: doc.updatedAt } },
      ],
    },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    req,
  })
  return docs[0]?.version ?? null
}

/** A published post whose URL changed keeps its old URL working (slug or category edits). */
export const recordPostRedirect: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc._status !== 'published') return doc
  const previous = await lastPublished(doc, previousDoc, req)
  if (!previous) return doc
  const [before, after] = await Promise.all([
    postPath(req.payload, previous, req),
    postPath(req.payload, doc, req),
  ])
  if (before && after && before !== after) {
    await upsertRedirect(req.payload, req, before, after, { relationTo: 'posts', value: doc.id })
  }
  return doc
}

/** Renaming a category slug keeps /<old-slug> working. Posts under it are handled by the
 *  article page, which redirects any /<wrong-category>/<slug> to the canonical URL. */
export const recordCategoryRedirect: CollectionAfterChangeHook<Category> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (previousDoc?.slug && doc.slug && previousDoc.slug !== doc.slug) {
    await upsertRedirect(req.payload, req, `/${previousDoc.slug}`, `/${doc.slug}`, {
      relationTo: 'categories',
      value: doc.id,
    })
  }
  return doc
}

export const revalidateRedirects: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) revalidateTag(payload, CACHE_TAGS.redirects)
  return doc
}
