/**
 * Heart abuse (principal review S1): counts could be inflated without limit, and anyone
 * could remove hearts because the server couldn't tell whose heart was whose.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { HEART_RATE_LIMIT, addHeart, getHearts, removeHeart, takeHeartAction } from '@/lib/hearts'
import config from '@/payload.config'

const P = `itest-hearts-${Date.now()}`
const ctx = { disableRevalidate: true }
let payload: Payload
let postId: number

beforeAll(async () => {
  payload = await getPayload({ config })
  const user = await payload.create({
    collection: 'users',
    data: { email: `${P}@example.test`, password: 'x'.repeat(16), name: 'W', role: 'admin' },
    context: ctx,
  })
  const category = await payload.create({
    collection: 'categories',
    data: { title: P, slug: P },
    context: ctx,
  })
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#d4a017' } })
    .png()
    .toBuffer()
  const image = await payload.create({
    collection: 'media',
    data: { alt: 'Swatch' },
    file: { data: png, mimetype: 'image/png', name: `${P}.png`, size: png.length },
    context: ctx,
  })
  const post = await payload.create({
    collection: 'posts',
    data: {
      title: P,
      slug: P,
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
      },
      category: category.id,
      authors: [user.id],
      disclosure: 'none',
      _status: 'published',
    },
    context: ctx,
  })
  postId = post.id
}, 60_000)

afterAll(async () => {
  if (!payload) return
  const like = { like: P }
  await payload.delete({ collection: 'posts', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'media', where: { filename: like }, context: ctx })
  await payload.delete({ collection: 'categories', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
})

describe('hearts', () => {
  it('counts one heart per visitor, however often they click', async () => {
    expect(await addHeart(postId, `${P}-alice`)).toBe(1)
    expect(await addHeart(postId, `${P}-alice`)).toBe(1)
    expect(await addHeart(postId, `${P}-bob`)).toBe(2)
    expect(await getHearts(postId, `${P}-alice`)).toEqual({ hearts: 2, hearted: true })
    expect(await getHearts(postId, `${P}-carol`)).toEqual({ hearts: 2, hearted: false })
  })

  it("doesn't let anyone remove a heart they didn't give", async () => {
    expect(await removeHeart(postId, `${P}-mallory`)).toBe(2)
    expect(await removeHeart(postId, `${P}-alice`)).toBe(1)
    expect(await removeHeart(postId, `${P}-alice`)).toBe(1)
  })

  it('caps heart actions per network per hour', async () => {
    const network = `${P}-198.51.100.7`
    for (let i = 0; i < HEART_RATE_LIMIT; i++) expect(await takeHeartAction(network)).toBe(true)
    expect(await takeHeartAction(network)).toBe(false)
    expect(await takeHeartAction(`${P}-203.0.113.9`)).toBe(true)
  })

  it('never stores a network address in readable form', async () => {
    const { docs } = await payload.find({ collection: 'heart-limits', limit: 100, depth: 0 })
    expect(docs.length).toBeGreaterThan(0)
    for (const row of docs) {
      expect(String(row.bucket)).not.toContain('198.51.100.7')
      expect(String(row.bucket)).not.toContain(P)
    }
  })

  it('still lets a hearted post be deleted', async () => {
    await payload.delete({ collection: 'posts', id: postId, context: ctx })
    const { totalDocs } = await payload.count({
      collection: 'heart-votes',
      where: { post: { equals: postId } },
    })
    expect(totalDocs).toBe(0)
  })
})
