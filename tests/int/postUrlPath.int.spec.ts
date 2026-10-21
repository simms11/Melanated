import { describe, expect, it } from 'vitest'

import { asCategory, postUrlPath } from '@/lib/utils'

describe('postUrlPath', () => {
  it('builds /<category>/<slug> from a populated category', () => {
    expect(postUrlPath({ slug: 'my-post', category: { id: 1, slug: 'beauty' } })).toBe(
      '/beauty/my-post',
    )
  })

  // typeof null === 'object': a deleted category used to crash the home page here.
  it('returns null instead of throwing when the category is missing or unpopulated', () => {
    expect(postUrlPath({ slug: 'my-post', category: null })).toBeNull()
    expect(postUrlPath({ slug: 'my-post', category: undefined })).toBeNull()
    expect(postUrlPath({ slug: 'my-post', category: 7 })).toBeNull()
    expect(asCategory(null)).toBeNull()
  })
})
