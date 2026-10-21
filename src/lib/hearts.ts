import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * Heart counts are written with single SQL statements so concurrent clicks can't lose an
 * update (a Payload find-then-update would). Readers aren't signed in, so a count is a
 * rough signal of interest: the browser remembers its own heart, nothing more.
 */

const db = async () => {
  const payload = await getPayload({ config })
  return { payload, drizzle: (payload.db as unknown as PostgresAdapter).drizzle }
}

/** The post's id if it exists and is published, so hearts can't be added to drafts. */
export const publishedPostId = async (id: number): Promise<number | null> => {
  const { payload } = await db()
  const { totalDocs } = await payload.count({
    collection: 'posts',
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
  })
  return totalDocs > 0 ? id : null
}

const firstCount = (result: unknown): number => {
  const rows = (result as { rows?: Array<{ hearts: number | string }> }).rows ?? []
  return rows[0] ? Number(rows[0].hearts) : 0
}

export const getHearts = async (postId: number): Promise<number> => {
  const { drizzle } = await db()
  return firstCount(
    await drizzle.execute(sql`SELECT hearts FROM reactions WHERE post_id = ${postId}`),
  )
}

export const addHeart = async (postId: number): Promise<number> => {
  const { drizzle } = await db()
  return firstCount(
    await drizzle.execute(sql`
      INSERT INTO reactions (post_id, hearts, updated_at, created_at)
      VALUES (${postId}, 1, now(), now())
      ON CONFLICT (post_id) DO UPDATE SET hearts = reactions.hearts + 1, updated_at = now()
      RETURNING hearts`),
  )
}

export const removeHeart = async (postId: number): Promise<number> => {
  const { drizzle } = await db()
  return firstCount(
    await drizzle.execute(sql`
      UPDATE reactions SET hearts = GREATEST(hearts - 1, 0), updated_at = now()
      WHERE post_id = ${postId}
      RETURNING hearts`),
  )
}
