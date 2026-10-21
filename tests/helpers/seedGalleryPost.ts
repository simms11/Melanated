import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../../src/payload.config.js'

const SLUG = 'e2e-gallery-post'
const AUTHOR_EMAIL = 'e2e-gallery@example.test'
const ctx = { disableRevalidate: true }

/** A published post with a three-photo gallery. Returns its public path. */
export async function seedGalleryPost(): Promise<string> {
  await cleanupGalleryPost()
  const payload = await getPayload({ config })
  // Its own author, so other test files recreating their users can't pull this one away.
  const author = await payload.create({
    collection: 'users',
    data: {
      email: AUTHOR_EMAIL,
      password: 'e2e-gallery-password',
      name: 'E2E Gallery',
      role: 'admin',
    },
    context: ctx,
  })
  const { docs: cats } = await payload.find({ collection: 'categories', limit: 1, depth: 0 })
  const ids: number[] = []
  for (const [i, colour] of ['#5c3a21', '#d4a017', '#2a1a12'].entries()) {
    const png = await sharp({ create: { width: 40, height: 50, channels: 3, background: colour } })
      .png()
      .toBuffer()
    const m = await payload.create({
      collection: 'media',
      data: { alt: `Gallery look ${i + 1}` },
      file: { data: png, mimetype: 'image/png', name: `${SLUG}-${i}.png`, size: png.length },
      context: ctx,
    })
    ids.push(m.id)
  }
  const paragraph = (text: string) => ({
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    textFormat: 0,
    children: [{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }],
  })
  await payload.create({
    collection: 'posts',
    data: {
      title: 'E2E gallery post',
      slug: SLUG,
      excerpt: 'Excerpt',
      heroImage: ids[0],
      content: {
        root: {
          type: 'root',
          version: 1,
          format: '',
          indent: 0,
          direction: 'ltr',
          // Long enough to scroll, so the reading-progress bar has somewhere to go.
          children: [
            ...Array.from({ length: 12 }, () => paragraph('A long paragraph of text. '.repeat(30))),
            {
              type: 'block',
              version: 2,
              format: '',
              fields: { id: SLUG, blockType: 'gallery', blockName: '', images: ids, columns: '3' },
            },
            ...Array.from({ length: 6 }, () =>
              paragraph('More text after the gallery. '.repeat(30)),
            ),
          ],
        },
      } as never,
      category: cats[0].id,
      authors: [author.id],
      disclosure: 'none',
      _status: 'published',
    },
    context: ctx,
  })
  return `/${cats[0].slug}/${SLUG}`
}

export async function cleanupGalleryPost(): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'posts', where: { slug: { equals: SLUG } }, context: ctx })
  await payload.delete({ collection: 'media', where: { filename: { like: SLUG } }, context: ctx })
  await payload.delete({
    collection: 'users',
    where: { email: { equals: AUTHOR_EMAIL } },
    context: ctx,
  })
}
