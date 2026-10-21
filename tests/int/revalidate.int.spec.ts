import { beforeEach, describe, expect, it, vi } from 'vitest'

const nextCache = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('next/cache', () => nextCache)

import { revalidatePost } from '@/hooks/revalidate'
import type { Post } from '@/payload-types'

const category = { id: 1, slug: 'beauty' }
const post = (status: 'draft' | 'published') =>
  ({ id: 7, slug: 'my-post', category, _status: status }) as unknown as Post
const req = (query: Record<string, string> = {}) =>
  ({
    context: {},
    query,
    payload: { logger: { info: vi.fn(), warn: vi.fn() } },
  }) as never

const run = (doc: Post, previousDoc: Post | undefined, query?: Record<string, string>) =>
  revalidatePost({ doc, previousDoc, req: req(query), operation: 'update' } as never)

describe('revalidatePost', () => {
  beforeEach(() => {
    nextCache.revalidatePath.mockClear()
    nextCache.revalidateTag.mockClear()
  })

  // Autosave fires every 2 seconds while someone writes. Refreshing the whole site's cache
  // each time churned every list page for changes no reader could see (review S2).
  it('does nothing for an autosave, even on a live post', async () => {
    await run(post('draft'), post('published'), { autosave: 'true' })
    expect(nextCache.revalidateTag).not.toHaveBeenCalled()
    expect(nextCache.revalidatePath).not.toHaveBeenCalled()
  })

  it('does nothing when a never-published draft is saved', async () => {
    await run(post('draft'), post('draft'))
    expect(nextCache.revalidateTag).not.toHaveBeenCalled()
  })

  it('refreshes the article and lists when a post is published or unpublished', async () => {
    await run(post('published'), post('draft'))
    expect(nextCache.revalidatePath).toHaveBeenCalledWith('/beauty/my-post', undefined)
    expect(nextCache.revalidateTag).toHaveBeenCalledWith('posts', 'max')

    nextCache.revalidateTag.mockClear()
    await run(post('draft'), post('published'))
    expect(nextCache.revalidateTag).toHaveBeenCalledWith('posts', 'max')
  })
})
