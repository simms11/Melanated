import { createHmac } from 'node:crypto'

import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * Hearts. Readers aren't signed in, so each browser gets an anonymous random voter id
 * (cookie, set by the API route). One heart per voter per post; only that voter can take it
 * back. Each change is one SQL statement, so a vote and its count can't drift apart, and
 * concurrent clicks can't lose an update.
 */

/** Heart actions allowed per network per hour: plenty for a person, a ceiling for a script. */
export const HEART_RATE_LIMIT = 30

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

const rows = <T>(result: unknown): T[] => (result as { rows?: T[] }).rows ?? []

export const getHearts = async (
  postId: number,
  voter?: string,
): Promise<{ hearts: number; hearted: boolean }> => {
  const { drizzle } = await db()
  const [row] = rows<{ hearts: number | string | null; hearted: boolean }>(
    await drizzle.execute(sql`
      SELECT
        (SELECT hearts FROM reactions WHERE post_id = ${postId}) AS hearts,
        EXISTS (SELECT 1 FROM heart_votes WHERE post_id = ${postId} AND voter = ${voter ?? ''}) AS hearted`),
  )
  return { hearts: Number(row?.hearts ?? 0), hearted: Boolean(voter && row?.hearted) }
}

/** Records this voter's heart (once) and returns the post's count. */
export const addHeart = async (postId: number, voter: string): Promise<number> => {
  const { drizzle } = await db()
  const [row] = rows<{ hearts: number | string }>(
    await drizzle.execute(sql`
      WITH vote AS (
        INSERT INTO heart_votes (post_id, voter, updated_at, created_at)
        VALUES (${postId}, ${voter}, now(), now())
        ON CONFLICT (post_id, voter) DO NOTHING
        RETURNING 1
      ), counted AS (
        INSERT INTO reactions (post_id, hearts, updated_at, created_at)
        SELECT ${postId}, 1, now(), now() FROM vote
        ON CONFLICT (post_id) DO UPDATE SET hearts = reactions.hearts + 1, updated_at = now()
        RETURNING hearts
      )
      SELECT COALESCE(
        (SELECT hearts FROM counted),
        (SELECT hearts FROM reactions WHERE post_id = ${postId}),
        0
      ) AS hearts`),
  )
  return Number(row?.hearts ?? 0)
}

/** Removes this voter's own heart, if they gave one, and returns the post's count. */
export const removeHeart = async (postId: number, voter: string): Promise<number> => {
  const { drizzle } = await db()
  const [row] = rows<{ hearts: number | string }>(
    await drizzle.execute(sql`
      WITH vote AS (
        DELETE FROM heart_votes WHERE post_id = ${postId} AND voter = ${voter}
        RETURNING 1
      ), counted AS (
        UPDATE reactions SET hearts = GREATEST(hearts - 1, 0), updated_at = now()
        WHERE post_id = ${postId} AND EXISTS (SELECT 1 FROM vote)
        RETURNING hearts
      )
      SELECT COALESCE(
        (SELECT hearts FROM counted),
        (SELECT hearts FROM reactions WHERE post_id = ${postId}),
        0
      ) AS hearts`),
  )
  return Number(row?.hearts ?? 0)
}

/**
 * Counts one heart action against the reader's network and says whether it's allowed.
 * The network is stored only as an HMAC salted with the server secret and today's date, so
 * it can't be reversed or linked across days; rows older than 24 hours are deleted here.
 */
export const takeHeartAction = async (network: string): Promise<boolean> => {
  const { drizzle } = await db()
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const hash = createHmac('sha256', `${process.env.PAYLOAD_SECRET ?? ''}:${day}`)
    .update(network)
    .digest('hex')
    .slice(0, 32)
  const bucket = `${hash}:${now.getUTCHours()}`

  await drizzle.execute(
    sql`DELETE FROM heart_limits WHERE created_at < now() - interval '24 hours'`,
  )
  const [row] = rows<{ count: number | string }>(
    await drizzle.execute(sql`
      INSERT INTO heart_limits (bucket, count, updated_at, created_at)
      VALUES (${bucket}, 1, now(), now())
      ON CONFLICT (bucket) DO UPDATE SET count = heart_limits.count + 1, updated_at = now()
      RETURNING count`),
  )
  return Number(row?.count ?? 0) <= HEART_RATE_LIMIT
}
