/**
 * List pages cache their post lists. Loading whole articles (body, SEO, versions of
 * relationships) bloated every cache entry, so lists select only what a card renders.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { findCardPosts } from '@/lib/queries'
import config from '@/payload.config'

const P = `itest-cards-${Date.now()}`
const ctx = { disableRevalidate: true }
let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
  const user = await payload.create({
    collection: 'users',
    data: { email: `${P}@example.test`, password: 'x'.repeat(16), name: 'Writer', role: 'admin' },
    context: ctx,
  })
  const category = await payload.create({
    collection: 'categories',
    data: { title: P, slug: P },
    context: ctx,
  })
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#5c3a21' } })
    .png()
    .toBuffer()
  const image = await payload.create({
    collection: 'media',
    data: { alt: 'Swatch' },
    file: { data: png, mimetype: 'image/png', name: `${P}.png`, size: png.length },
    context: ctx,
  })
  await payload.create({
    collection: 'posts',
    data: {
      title: `${P}-post`,
      slug: `${P}-post`,
      excerpt: 'Excerpt',
      heroImage: image.id,
      content: {
        root: {
          type: 'root',
          version: 1,
          format: '',
          indent: 0,
          direction: 'ltr',
          children: [
            {
              type: 'paragraph',
              version: 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              textFormat: 0,
              children: [
                {
                  type: 'text',
                  version: 1,
                  text: 'A long article body. '.repeat(500),
                  format: 0,
                  style: '',
                  mode: 'normal',
                  detail: 0,
                },
              ],
            },
          ],
        },
      },
      category: category.id,
      authors: [user.id],
      disclosure: 'gifted',
      _status: 'published',
    },
    context: ctx,
  })
}, 60_000)

afterAll(async () => {
  if (!payload) return
  const like = { like: P }
  await payload.delete({ collection: 'posts', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'media', where: { filename: like }, context: ctx })
  await payload.delete({ collection: 'categories', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
})

describe('findCardPosts', () => {
  it('returns what a card renders and nothing else', async () => {
    const { docs } = await findCardPosts(payload, { categorySlug: P })
    expect(docs).toHaveLength(1)
    const card = docs[0] as Record<string, unknown>

    expect(card).toMatchObject({ title: `${P}-post`, slug: `${P}-post`, disclosure: 'gifted' })
    expect(card.category).toMatchObject({ slug: P, title: P })
    expect(card.heroImage).toMatchObject({ alt: 'Swatch' })

    for (const heavy of ['content', 'meta', 'relatedPosts', 'authors', 'tags']) {
      expect(card, heavy).not.toHaveProperty(heavy)
    }
  })
})
