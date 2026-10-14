import { describe, expect, it } from 'vitest'

import { computeReadTime } from '@/collections/Posts/hooks/computeReadTime'

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ')
const doc = (text: string) => ({
  content: { root: { children: [{ children: [{ text }] }] } },
})

describe('computeReadTime', () => {
  it('rounds to the nearest minute at 220 wpm with a 1 minute floor', async () => {
    const short = await computeReadTime({ data: doc(words(50)) } as never)
    const long = await computeReadTime({ data: doc(words(880)) } as never)
    expect((short as { readTime: number }).readTime).toBe(1)
    expect((long as { readTime: number }).readTime).toBe(4)
  })
})
