/**
 * Runs against the real database in DATABASE_URL (schema is pushed on init outside production).
 * Everything created here is prefixed and removed afterwards.
 */
import 'dotenv/config'
import { createLocalReq, getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { Category, Media, User } from '@/payload-types'

const P = `itest-${Date.now()}`
// Scripts run outside Next, where revalidatePath/Tag would throw.
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

const createPost = (slug: string, by: User, status: 'draft' | 'published') =>
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
      _status: status,
    },
    draft: status === 'draft',
    context: ctx,
  })

const redirectFrom = async (from: string) =>
  (
    await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      depth: 0,
      limit: 1,
    })
  ).docs[0]

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
  const png = await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#c4813c' },
  })
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
  // Jobs queued for this run's posts, so a finished test leaves nothing for the next cron run.
  const { docs: testPosts } = await payload.find({
    collection: 'posts',
    where: { slug: like },
    limit: 200,
    depth: 0,
    draft: true,
  })
  if (testPosts.length) {
    await payload.delete({
      collection: 'payload-jobs',
      where: { 'input.doc.value': { in: testPosts.map((p) => p.id) } },
    })
  }
  await payload.delete({ collection: 'redirects', where: { from: like }, context: ctx })
  await payload.delete({ collection: 'posts', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'media', where: { id: { equals: image?.id } }, context: ctx })
  // By slug prefix, so categories from a test that failed midway are removed too.
  await payload.delete({ collection: 'categories', where: { slug: { like: P } }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
})

const setAuthorsCanPublish = (on: boolean) =>
  payload.updateGlobal({
    slug: 'site-settings',
    data: { editorial: { authorsCanPublish: on } },
    context: ctx,
  })

const schedulePublish = (postId: number, by: User) =>
  payload.jobs.queue({
    task: 'schedulePublish',
    input: {
      type: 'publish',
      doc: { relationTo: 'posts', value: postId },
      user: { relationTo: 'users', value: by.id },
    },
    waitUntil: new Date(Date.now() - 1000),
  })

const runDueJobs = async () =>
  payload.jobs.run({ queue: 'default', req: await createLocalReq({ context: ctx }, payload) })

describe('scheduled publishing', () => {
  // ADR 0003: authors can't publish unless Site Settings allows it. The job runs as the
  // user who scheduled it, so the gate still applies at 6am and the post stays a draft.
  it("does not publish an author's scheduled post while authors can't publish", async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    expect(settings.editorial?.authorsCanPublish).toBeFalsy()

    const post = await createPost(`${P}-gate`, author, 'draft')
    await schedulePublish(post.id, author)
    await runDueJobs()
    const after = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(after._status).toBe('draft')
  })

  it("publishes an author's scheduled post when authors are allowed to publish", async () => {
    const post = await createPost(`${P}-gate-open`, author, 'draft')
    await setAuthorsCanPublish(true)
    try {
      await schedulePublish(post.id, author)
      await runDueJobs()
    } finally {
      await setAuthorsCanPublish(false)
    }
    const after = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(after._status).toBe('published')
  })

  // The job runs as the user who scheduled it, so closing the gate after scheduling still
  // stops it. This is the run-time check behind the schedule-time one.
  it('does not publish an author job if the gate closed after it was scheduled', async () => {
    const post = await createPost(`${P}-gate-closed-later`, author, 'draft')
    await setAuthorsCanPublish(true)
    try {
      await schedulePublish(post.id, author)
    } finally {
      await setAuthorsCanPublish(false)
    }
    await runDueJobs()
    const after = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(after._status).toBe('draft')
  })

  it('runs a due job queued by an admin', async () => {
    const post = await createPost(`${P}-admin-sched`, admin, 'draft')
    await schedulePublish(post.id, admin)
    await runDueJobs()
    const after = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(after._status).toBe('published')
  })
})

describe('redirects on URL changes', () => {
  it('keeps the old URL of a published post after a slug change', async () => {
    const post = await createPost(`${P}-old`, admin, 'published')
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { slug: `${P}-new`, _status: 'published' },
      context: ctx,
    })

    const redirect = await redirectFrom(`/${P}/${P}-old`)
    expect(redirect?.to?.reference).toMatchObject({ relationTo: 'posts', value: post.id })
  })

  // The editor's real flow: the slug is changed in a draft, then published later.
  it('records the redirect when a slug change is saved as a draft first', async () => {
    const post = await createPost(`${P}-d-old`, admin, 'published')
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { slug: `${P}-d-new`, _status: 'draft' },
      draft: true,
      context: ctx,
    })
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { _status: 'published' },
      context: ctx,
    })

    const redirect = await redirectFrom(`/${P}/${P}-d-old`)
    expect(redirect?.to?.reference).toMatchObject({ relationTo: 'posts', value: post.id })
  })

  it('does not create redirects for posts that were never published', async () => {
    const post = await createPost(`${P}-never`, admin, 'draft')
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { slug: `${P}-never-2` },
      draft: true,
      context: ctx,
    })
    expect(await redirectFrom(`/${P}/${P}-never`)).toBeUndefined()
  })

  it('keeps /<old-category> working after a category slug change', async () => {
    const cat = await payload.create({
      collection: 'categories',
      data: { title: `${P}-cat`, slug: `${P}-cat-old` },
      context: ctx,
    })
    await payload.update({
      collection: 'categories',
      id: cat.id,
      data: { slug: `${P}-cat-new` },
      context: ctx,
    })

    const redirect = await redirectFrom(`/${P}-cat-old`)
    expect(redirect?.to?.reference).toMatchObject({ relationTo: 'categories', value: cat.id })
    await payload.delete({ collection: 'categories', id: cat.id, context: ctx })
  })
})

describe('category addresses', () => {
  it('locks the slug once the category has published posts, but allows renaming', async () => {
    const cat = await payload.create({
      collection: 'categories',
      data: { title: `${P}-locked`, slug: `${P}-locked` },
      context: ctx,
    })
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: `${P}-in-locked`,
        slug: `${P}-in-locked`,
        excerpt: 'Excerpt',
        heroImage: image.id,
        content: richText,
        category: cat.id,
        authors: [admin.id],
        disclosure: 'none',
        _status: 'published',
      },
      context: ctx,
    })

    await expect(
      payload.update({
        collection: 'categories',
        id: cat.id,
        data: { slug: `${P}-moved` },
        context: ctx,
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ path: 'slug', message: expect.stringMatching(/can't change/) }] },
    })

    const renamed = await payload.update({
      collection: 'categories',
      id: cat.id,
      data: { title: `${P}-renamed` },
      context: ctx,
    })
    expect(renamed.slug).toBe(`${P}-locked`)

    await payload.delete({ collection: 'posts', id: post.id, context: ctx })
    await payload.delete({ collection: 'categories', id: cat.id, context: ctx })
  })
})

describe('deleting categories', () => {
  // posts.category is nullable with ON DELETE SET NULL, so deleting a section used to
  // orphan its posts silently (they fell back to /posts/<slug>, which 404s).
  it('refuses to delete a category that still has posts, even drafts', async () => {
    const cat = await payload.create({
      collection: 'categories',
      data: { title: `${P}-busy`, slug: `${P}-busy` },
      context: ctx,
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: `${P}-in-busy`,
        slug: `${P}-in-busy`,
        excerpt: 'Excerpt',
        heroImage: image.id,
        content: richText,
        category: cat.id,
        authors: [admin.id],
        disclosure: 'none',
        _status: 'draft',
      },
      draft: true,
      context: ctx,
    })

    await expect(
      payload.delete({ collection: 'categories', id: cat.id, context: ctx }),
    ).rejects.toThrow(/still has 1 post/)
    const still = await payload.findByID({ collection: 'categories', id: cat.id, depth: 0 })
    expect(still.slug).toBe(`${P}-busy`)
  })
})
