import type { CollectionBeforeChangeHook } from 'payload'

/** Stamp publishedAt the first time a post is published. */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data?._status === 'published' && !data.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}
