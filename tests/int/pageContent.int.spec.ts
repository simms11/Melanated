/**
 * Copy on the home and Community pages is editable by admins (the layout stays in code).
 * Defaults are the original wording, so nothing changes until someone edits it.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { User } from '@/payload-types'

const P = `itest-content-${Date.now()}`
const ctx = { disableRevalidate: true }
let payload: Payload
let author: User

beforeAll(async () => {
  payload = await getPayload({ config })
  author = await payload.create({
    collection: 'users',
    data: { email: `${P}@example.test`, password: 'x'.repeat(16), name: 'W', role: 'author' },
    context: ctx,
  })
}, 60_000)

afterAll(async () => {
  if (!payload) return
  await payload.delete({ collection: 'users', where: { email: { like: P } }, context: ctx })
})

describe('page content', () => {
  it('starts with the original home and Community copy', async () => {
    const content = await payload.findGlobal({ slug: 'page-content' })
    expect(content.home).toMatchObject({
      heroButtonLabel: 'Explore the latest',
      heroButtonLink: '#latest',
      trendingTitle: 'Trending now',
      latestTitle: 'The latest',
      communityHeading: 'A community of',
      communityHighlight: 'go-getters',
      communityButtonLink: '/community',
    })
    expect(content.home?.communityFeatures).toHaveLength(4)
    expect(content.community?.pillars).toHaveLength(4)
  })

  it('only accepts links within the site', async () => {
    for (const bad of [
      'javascript:alert(1)',
      'https://example.com',
      '//example.com',
      'mailto:x@y.z',
    ]) {
      await expect(
        payload.updateGlobal({
          slug: 'page-content',
          data: { home: { heroButtonLink: bad } },
          context: ctx,
        }),
        bad,
      ).rejects.toThrow()
    }
    const ok = await payload.updateGlobal({
      slug: 'page-content',
      data: { home: { heroButtonLink: '/community' } },
      context: ctx,
    })
    expect(ok.home?.heroButtonLink).toBe('/community')
    await payload.updateGlobal({
      slug: 'page-content',
      data: { home: { heroButtonLink: '#latest' } },
      context: ctx,
    })
  })

  it('does not let authors change site copy', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'page-content',
        data: { home: { latestTitle: 'Hijacked' } },
        user: author,
        overrideAccess: false,
        context: ctx,
      }),
    ).rejects.toThrow()
  })

  // A bare "@handle" became a broken relative link in the footer (review S10).
  it('only accepts full https:// addresses for social links', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        data: { social: { instagram: '@melanatedmaguk' } },
        context: ctx,
      }),
    ).rejects.toThrow()
    const ok = await payload.updateGlobal({
      slug: 'site-settings',
      data: { social: { instagram: 'https://instagram.com/melanatedmaguk' } },
      context: ctx,
    })
    expect(ok.social?.instagram).toBe('https://instagram.com/melanatedmaguk')
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { social: { instagram: null } },
      context: ctx,
    })
  })
})
