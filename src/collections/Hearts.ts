import type { CollectionConfig } from 'payload'

/**
 * Internal tables behind the heart button; never edited by people, so hidden from the admin
 * and closed to the REST/GraphQL API. Written only by src/lib/hearts.ts with SQL.
 */
const internal = {
  read: () => false,
  create: () => false,
  update: () => false,
  delete: () => false,
}

/**
 * One row per heart: which post, and which anonymous voter (a random id from the reader's
 * cookie, not linked to anything personal). The unique pair makes a repeat click a no-op
 * and means only the voter who gave a heart can take it back.
 */
export const HeartVotes: CollectionConfig = {
  slug: 'heart-votes',
  admin: { hidden: true },
  access: internal,
  indexes: [{ fields: ['post', 'voter'], unique: true }],
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'posts', required: true, index: true },
    { name: 'voter', type: 'text', required: true },
  ],
}

/**
 * Rate-limit buckets: a salted hash of the reader's network (rotated daily, never the raw
 * address) plus the hour, and how many heart actions it has made. Rows older than 24 hours
 * are deleted as new ones are written.
 */
export const HeartLimits: CollectionConfig = {
  slug: 'heart-limits',
  admin: { hidden: true },
  access: internal,
  fields: [
    { name: 'bucket', type: 'text', required: true, unique: true },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
  ],
}
