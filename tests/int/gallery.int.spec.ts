/** Gallery blocks inside post bodies: stored, populated for the page, and validated. */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

const P = `itest-gallery-${Date.now()}`
const ctx = { disableRevalidate: true }
let payload: Payload
let ids: number[] = []
let userId: number
let categoryId: number

const body = (images: number[]) => ({
  root: {
    type: 'root',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [
      {
        type: 'block',
        version: 2,
        format: '',
        fields: {
          id: `${P}-block`,
          blockType: 'gallery',
          blockName: '',
          images,
          caption: 'Looks',
          columns: '3',
        },
      },
    ],
  },
})

const post = (slug: string, images: number[]) =>
  payload.create({
    collection: 'posts',
    data: {
      title: slug,
      slug,
      excerpt: 'Excerpt',
      heroImage: ids[0],
      content: body(images) as never,
      category: categoryId,
      authors: [userId],
      disclosure: 'none',
      _status: 'published',
    },
    context: ctx,
  })

beforeAll(async () => {
  payload = await getPayload({ config })
  userId = (
    await payload.create({
      collection: 'users',
      data: { email: `${P}@example.test`, password: 'x'.repeat(16), name: 'W', role: 'admin' },
      context: ctx,
    })
  ).id
  categoryId = (
    await payload.create({ collection: 'categories', data: { title: P, slug: P }, context: ctx })
  ).id
  for (const [i, colour] of ['#5c3a21', '#d4a017', '#2a1a12'].entries()) {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: colour } })
      .png()
      .toBuffer()
    const m = await payload.create({
      collection: 'media',
      data: { alt: `Look ${i + 1}`, credit: i < 2 ? 'Ama Photo' : 'Studio K' },
      file: { data: png, mimetype: 'image/png', name: `${P}-${i}.png`, size: png.length },
      context: ctx,
    })
    ids.push(m.id)
  }
}, 60_000)

afterAll(async () => {
  if (!payload) return
  const like = { like: P }
  await payload.delete({ collection: 'posts', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'media', where: { filename: like }, context: ctx })
  await payload.delete({ collection: 'categories', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
  ids = []
})

describe('gallery block', () => {
  it('stores the photos and returns them populated for the page', async () => {
    const created = await post(`${P}-ok`, ids)
    const read = await payload.findByID({ collection: 'posts', id: created.id, depth: 2 })
    const block = (read.content.root.children[0] as unknown as { fields: Record<string, unknown> })
      .fields
    expect(block).toMatchObject({ blockType: 'gallery', caption: 'Looks', columns: '3' })
    const images = block.images as Array<{ alt: string; credit: string }>
    expect(images.map((m) => m.alt)).toEqual(['Look 1', 'Look 2', 'Look 3'])
  })

  it('needs at least two photos', async () => {
    await expect(post(`${P}-one`, [ids[0]])).rejects.toThrow()
  })
})
