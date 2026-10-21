/**
 * Standalone pages (privacy, terms, about...) editable by admins. They share the top-level
 * URL space with categories, so neither may take the other's address.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { User } from '@/payload-types'

const P = `itest-pages-${Date.now()}`
const ctx = { disableRevalidate: true }
let payload: Payload
let admin: User
let author: User

const body = {
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

const page = (slug: string, status: 'draft' | 'published', user?: User) =>
  payload.create({
    collection: 'pages',
    data: { title: slug, slug, content: body, _status: status },
    draft: status === 'draft',
    ...(user ? { user, overrideAccess: false } : {}),
    context: ctx,
  })

beforeAll(async () => {
  payload = await getPayload({ config })
  admin = await payload.create({
    collection: 'users',
    data: { email: `${P}-a@example.test`, password: 'x'.repeat(16), name: 'A', role: 'admin' },
    context: ctx,
  })
  author = await payload.create({
    collection: 'users',
    data: { email: `${P}-w@example.test`, password: 'x'.repeat(16), name: 'W', role: 'author' },
    context: ctx,
  })
}, 60_000)

afterAll(async () => {
  if (!payload) return
  const like = { like: P }
  await payload.delete({ collection: 'pages', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'categories', where: { slug: like }, context: ctx })
  await payload.delete({ collection: 'users', where: { email: like }, context: ctx })
})

describe('pages', () => {
  it('lets an admin create a page, and hides drafts from the public', async () => {
    const draft = await page(`${P}-draft`, 'draft', admin)
    const live = await page(`${P}-live`, 'published', admin)
    const seen = await payload.find({
      collection: 'pages',
      where: { id: { in: [draft.id, live.id] } },
      overrideAccess: false,
    })
    expect(seen.docs.map((d) => d.slug)).toEqual([`${P}-live`])
  })

  it('does not let authors create pages', async () => {
    await expect(page(`${P}-by-author`, 'draft', author)).rejects.toThrow()
  })

  it('refuses a page address that a category already uses', async () => {
    await payload.create({
      collection: 'categories',
      data: { title: `${P}-shared`, slug: `${P}-shared` },
      context: ctx,
    })
    await expect(page(`${P}-shared`, 'draft', admin)).rejects.toMatchObject({
      data: { errors: [{ path: 'slug' }] },
    })
  })

  it('refuses a category address that a page already uses', async () => {
    await page(`${P}-taken`, 'draft', admin)
    await expect(
      payload.create({
        collection: 'categories',
        data: { title: `${P}-taken`, slug: `${P}-taken` },
        context: ctx,
      }),
    ).rejects.toMatchObject({ data: { errors: [{ path: 'slug' }] } })
  })

  it('refuses reserved addresses used by the site itself', async () => {
    for (const slug of ['community', 'admin', 'api', 'styleguide']) {
      await expect(
        payload.create({
          collection: 'pages',
          data: { title: slug, slug, content: body },
          draft: true,
          context: ctx,
        }),
        slug,
      ).rejects.toMatchObject({ data: { errors: [{ path: 'slug' }] } })
    }
  })
})
