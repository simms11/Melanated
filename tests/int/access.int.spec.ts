/**
 * Access and integrity rules found in the principal review. Runs against DATABASE_URL;
 * everything created is prefixed and removed afterwards.
 */
import 'dotenv/config'
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { Category, Media, User } from '@/payload-types'

const P = `itest-acc-${Date.now()}`
const ctx = { disableRevalidate: true }

let payload: Payload
let admin: User
let author: User
let category: Category
let image: Media

const richText = {
  root: {
    type: 'root',
    version: 1,
    format: '' as const,
    indent: 0,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text: 'Body',
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
          },
        ],
      },
    ],
  },
}

const publishedPost = (slug: string, by: User) =>
  payload.create({
    collection: 'posts',
    data: {
      title: slug,
      slug,
      excerpt: 'Excerpt',
      heroImage: image.id,
      content: richText,
      category: category.id,
      authors: [by.id],
      disclosure: 'none',
      _status: 'published',
    },
    context: ctx,
  })

beforeAll(async () => {
  payload = await getPayload({ config })
  admin = await payload.create({
    collection: 'users',
    data: {
      email: `${P}-admin@example.test`,
      password: 'x'.repeat(16),
      name: 'Admin',
      role: 'admin',
    },
    context: ctx,
  })
  author = await payload.create({
    collection: 'users',
    data: {
      email: `${P}-author@example.test`,
      password: 'x'.repeat(16),
      name: 'Writer',
      role: 'author',
    },
    context: ctx,
  })
  category = await payload.create({
    collection: 'categories',
    data: { title: P, slug: P },
    context: ctx,
  })
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#2a1a12' } })
    .png()
    .toBuffer()
  image = await payload.create({
    collection: 'media',
    data: { alt: 'Test swatch' },
    file: { data: png, mimetype: 'image/png', name: `${P}.png`, size: png.length },
    context: ctx,
  })
}, 60_000)

afterAll(async () => {
  if (!payload) return
  const like = { like: P }
  await payload.delete({ collection: 'posts', where: { slug: like }, context: ctx })
  // By filename prefix, so images from a test that failed midway are removed too.
  await payload.delete({ collection: 'media', where: { filename: like }, context: ctx })
  await payload.delete({ collection: 'categories', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
})

describe('user privacy', () => {
  // Field-level read access hid the email in responses, but it could still be used as a
  // filter, so anyone could confirm an admin's address one guess at a time.
  it('does not let an anonymous visitor find users by email', async () => {
    const attempt = payload
      .find({
        collection: 'users',
        where: { email: { like: `${P}-admin` } },
        overrideAccess: false,
      })
      .then((r) => r.totalDocs)
      .catch(() => 0)
    expect(await attempt).toBe(0)
  })

  it('still shows bylines on published posts without exposing email', async () => {
    const post = await publishedPost(`${P}-byline`, author)
    const { docs } = await payload.find({
      collection: 'posts',
      where: { and: [{ id: { equals: post.id } }, { _status: { equals: 'published' } }] },
      depth: 2,
      overrideAccess: true,
    })
    const byline = docs[0]?.authors?.[0]
    expect(typeof byline).toBe('object')
    expect(byline).toMatchObject({ name: 'Writer' })
    expect(byline).not.toHaveProperty('email')
  })
})

describe('reactions', () => {
  it('lets a post that has hearts be deleted, and removes its hearts', async () => {
    const post = await publishedPost(`${P}-hearted`, admin)
    const db = (payload.db as unknown as PostgresAdapter).drizzle
    await db.execute(
      sql`INSERT INTO reactions (post_id, hearts, updated_at, created_at) VALUES (${post.id}, 3, now(), now())`,
    )

    await payload.delete({ collection: 'posts', id: post.id, context: ctx })

    const left = await db.execute(
      sql`SELECT count(*)::int AS n FROM reactions WHERE post_id = ${post.id}`,
    )
    expect((left as unknown as { rows: Array<{ n: number }> }).rows[0].n).toBe(0)
  })
})

describe('author edits to live posts', () => {
  // ADR 0003: with "Authors can publish without review" off, an author's change must not
  // reach the live page. Saving without draft mode used to write straight to it.
  it('rejects an author saving a published post without draft mode', async () => {
    const post = await publishedPost(`${P}-live`, author)
    const attempt = payload.update({
      collection: 'posts',
      id: post.id,
      data: { title: 'Changed without review' },
      user: author,
      overrideAccess: false,
      context: ctx,
    })
    await expect(attempt).rejects.toThrow()

    const live = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(live.title).toBe(`${P}-live`)
  })

  it('still lets the author save the change as a draft for review', async () => {
    const post = await publishedPost(`${P}-draft-edit`, author)
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { title: 'Proposed title' },
      draft: true,
      user: author,
      overrideAccess: false,
      context: ctx,
    })

    const live = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(live.title).toBe(`${P}-draft-edit`)
    const latest = await payload.findByID({
      collection: 'posts',
      id: post.id,
      depth: 0,
      draft: true,
    })
    expect(latest.title).toBe('Proposed title')
  })
})

describe('editorial placement', () => {
  // Featured and Trending decide what the home page shows: admin-only (ADR 0003).
  // Update was restricted, but an author could still set both when creating a post.
  it('ignores Featured and Trending when an author creates a post', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: `${P}-pushy`,
        slug: `${P}-pushy`,
        excerpt: 'Excerpt',
        heroImage: image.id,
        content: richText,
        category: category.id,
        authors: [author.id],
        disclosure: 'none',
        featured: true,
        trending: true,
        _status: 'draft',
      },
      draft: true,
      user: author,
      overrideAccess: false,
      context: ctx,
    })

    const saved = await payload.findByID({
      collection: 'posts',
      id: post.id,
      depth: 0,
      draft: true,
    })
    expect(saved.featured).toBe(false)
    expect(saved.trending).toBe(false)
  })
})

describe('authors see and change only their own work', () => {
  const swatch = () =>
    sharp({ create: { width: 8, height: 8, channels: 3, background: '#c4813c' } })
      .png()
      .toBuffer()

  it("hides another writer's unpublished draft from an author", async () => {
    const draft = await payload.create({
      collection: 'posts',
      data: {
        title: `${P}-admins-draft`,
        slug: `${P}-admins-draft`,
        excerpt: 'Excerpt',
        heroImage: image.id,
        content: richText,
        category: category.id,
        authors: [admin.id],
        disclosure: 'none',
        _status: 'draft',
      },
      draft: true,
      context: ctx,
    })
    const seen = await payload
      .find({
        collection: 'posts',
        where: { id: { equals: draft.id } },
        draft: true,
        user: author,
        overrideAccess: false,
      })
      .then((r) => r.totalDocs)
    expect(seen).toBe(0)
  })

  it('still lets an author read published posts and their own drafts', async () => {
    const live = await publishedPost(`${P}-others-live`, admin)
    const mine = await payload.create({
      collection: 'posts',
      data: {
        title: `${P}-my-draft`,
        slug: `${P}-my-draft`,
        excerpt: 'Excerpt',
        heroImage: image.id,
        content: richText,
        category: category.id,
        authors: [author.id],
        disclosure: 'none',
        _status: 'draft',
      },
      draft: true,
      context: ctx,
    })
    const ids = (
      await payload.find({
        collection: 'posts',
        where: { id: { in: [live.id, mine.id] } },
        draft: true,
        user: author,
        overrideAccess: false,
      })
    ).docs.map((d) => d.id)
    expect(ids.sort()).toEqual([live.id, mine.id].sort())
  })

  it('stops an author editing an image someone else uploaded, but not their own', async () => {
    const png = await swatch()
    const theirs = await payload.create({
      collection: 'media',
      data: { alt: 'Admin upload' },
      file: { data: png, mimetype: 'image/png', name: `${P}-theirs.png`, size: png.length },
      user: admin,
      overrideAccess: false,
      context: ctx,
    })
    const mine = await payload.create({
      collection: 'media',
      data: { alt: 'Author upload' },
      file: { data: png, mimetype: 'image/png', name: `${P}-mine.png`, size: png.length },
      user: author,
      overrideAccess: false,
      context: ctx,
    })

    await expect(
      payload.update({
        collection: 'media',
        id: theirs.id,
        data: { alt: 'Hijacked' },
        user: author,
        overrideAccess: false,
        context: ctx,
      }),
    ).rejects.toThrow()

    const edited = await payload.update({
      collection: 'media',
      id: mine.id,
      data: { alt: 'Author upload, edited' },
      user: author,
      overrideAccess: false,
      context: ctx,
    })
    expect(edited.alt).toBe('Author upload, edited')

    await payload.delete({
      collection: 'media',
      where: { id: { in: [theirs.id, mine.id] } },
      context: ctx,
    })
  })
})
