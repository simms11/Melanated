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
  await payload.delete({ collection: 'redirects', where: { from: like }, context: ctx })
  await payload.delete({ collection: 'posts', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'media', where: { id: { equals: image?.id } }, context: ctx })
  await payload.delete({ collection: 'categories', where: { title: { equals: P } }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
})

describe('scheduled publishing', () => {
  // ADR 0003: authors can't publish unless Site Settings allows it. A scheduled publish
  // runs later with no request — it must still be checked against the scheduling user.
  it('does not let an author publish by scheduling it', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    expect(settings.editorial?.authorsCanPublish).toBeFalsy()

    const post = await createPost(`${P}-gate`, author, 'draft')
    await payload.jobs.queue({
      task: 'schedulePublish',
      input: {
        type: 'publish',
        doc: { relationTo: 'posts', value: post.id },
        user: { relationTo: 'users', value: author.id },
      },
      waitUntil: new Date(Date.now() - 1000),
    })
    await payload.jobs.run({ queue: 'default' })

    const after = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(after._status).toBe('draft')
  })

  // Proves it was the publish gate (not some other access rule) that stopped the job above.
  it('lets the same author job through once authors are allowed to publish', async () => {
    const post = await createPost(`${P}-gate-open`, author, 'draft')
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { editorial: { authorsCanPublish: true } },
      context: ctx,
    })
    try {
      await payload.jobs.queue({
        task: 'schedulePublish',
        input: {
          type: 'publish',
          doc: { relationTo: 'posts', value: post.id },
          user: { relationTo: 'users', value: author.id },
        },
        waitUntil: new Date(Date.now() - 1000),
      })
      await payload.jobs.run({
        queue: 'default',
        req: await createLocalReq({ context: ctx }, payload),
      })
    } finally {
      await payload.updateGlobal({
        slug: 'site-settings',
        data: { editorial: { authorsCanPublish: false } },
        context: ctx,
      })
    }

    const after = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
    expect(after._status).toBe('published')
  })

  it('runs a due job queued by an admin', async () => {
    const post = await createPost(`${P}-admin-sched`, admin, 'draft')
    await payload.jobs.queue({
      task: 'schedulePublish',
      input: {
        type: 'publish',
        doc: { relationTo: 'posts', value: post.id },
        user: { relationTo: 'users', value: admin.id },
      },
      waitUntil: new Date(Date.now() - 1000),
    })
    await payload.jobs.run({
      queue: 'default',
      req: await createLocalReq({ context: ctx }, payload),
    })

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
