import { describe, expect, it } from 'vitest'

import { serializeJsonLd } from '@/lib/utils'

describe('serializeJsonLd', () => {
  // A post title is author-controlled. Inside <script type="application/ld+json">,
  // a literal "</script>" would end the block and let the rest run as HTML/JS.
  it('cannot be broken out of with a closing script tag', () => {
    const headline = '</script><script>alert(document.cookie)</script>'
    const out = serializeJsonLd({ headline })
    expect(out).not.toMatch(/<\/script/i)
    expect(out).not.toContain('<')
    expect(JSON.parse(out)).toEqual({ headline })
  })

  it('escapes the other characters that can end or confuse an inline script', () => {
    const value = '<!-- a & b > c \u2028 d \u2029'
    const out = serializeJsonLd({ value })
    expect(out).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(out)).toEqual({ value })
  })
})
