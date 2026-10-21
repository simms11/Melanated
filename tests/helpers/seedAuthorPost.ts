import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../../src/payload.config.js'

/** Test-only writer account for e2e checks of what authors see in the admin. */
export const testAuthor = {
  email: 'e2e-author@example.test',
  password: 'e2e-author-password',
  name: 'E2E Writer',
  role: 'author' as const,
}

const SLUG = 'e2e-author-draft'
const ctx = { disableRevalidate: true }

/** A draft post owned by the test author. Returns its id. */
export async function seedAuthorDraft(): Promise<number> {
  await cleanupAuthorDraft()
  const payload = await getPayload({ config })
  const author = await payload.create({ collection: 'users', data: testAuthor, context: ctx })
  const { docs } = await payload.find({ collection: 'categories', limit: 1, depth: 0 })
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#5c3a21' } })
    .png()
    .toBuffer()
  const image = await payload.create({
    collection: 'media',
    data: { alt: 'E2E swatch' },
    file: { data: png, mimetype: 'image/png', name: `${SLUG}.png`, size: png.length },
    context: ctx,
  })
  const post = await payload.create({
    collection: 'posts',
    data: {
      title: 'E2E author draft',
      slug: SLUG,
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
      category: docs[0].id,
      authors: [author.id],
      disclosure: 'none',
      _status: 'draft',
    },
    draft: true,
    context: ctx,
  })
  return post.id
}

export async function cleanupAuthorDraft(): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'posts', where: { slug: { equals: SLUG } }, context: ctx })
  await payload.delete({ collection: 'media', where: { filename: { like: SLUG } }, context: ctx })
  await payload.delete({
    collection: 'users',
    where: { email: { equals: testAuthor.email } },
    context: ctx,
  })
}
