import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { postPath } from '@/collections/Posts/postPath'

const payloadWith = (slug: string | null) =>
  ({
    findByID: vi.fn(async () => (slug ? { slug } : null)),
  }) as unknown as Payload

describe('postPath', () => {
  it('uses a populated category without a lookup', async () => {
    const payload = payloadWith(null)
    const path = await postPath(payload, {
      slug: 'my-post',
      category: { id: 1, slug: 'beauty' } as never,
    })
    expect(path).toBe('/beauty/my-post')
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  // Hooks receive relationships as IDs — this is what used to produce /posts/<slug>.
  it('looks up the category slug when given an ID', async () => {
    expect(await postPath(payloadWith('fashion'), { slug: 'my-post', category: 7 })).toBe(
      '/fashion/my-post',
    )
  })

  it('returns null rather than a guessed path when the post has no URL yet', async () => {
    expect(await postPath(payloadWith('fashion'), { slug: '', category: 7 })).toBeNull()
    expect(await postPath(payloadWith(null), { slug: 'my-post', category: 7 })).toBeNull()
  })
})
