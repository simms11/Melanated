import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config'

type Rule = { source: string; headers: Array<{ key: string; value: string }> }

describe('next.config headers', () => {
  // Payload adds colour-scheme client hints to every path. Critical-CH makes Chrome retry the
  // first request to a page; only the admin (theme without a flash) has any use for them.
  it('limits Payload colour-scheme hints to the admin', async () => {
    const rules = ((await nextConfig.headers?.()) ?? []) as Rule[]
    const withHints = rules.filter((r) => r.headers.some((h) => h.key === 'Critical-CH'))
    expect(withHints.length).toBeGreaterThan(0)
    for (const rule of withHints) expect(rule.source).toBe('/admin/:path*')
  })

  it('still sends the security headers everywhere', async () => {
    const rules = ((await nextConfig.headers?.()) ?? []) as Rule[]
    const all = rules.find((r) => r.source === '/(.*)')
    expect(all?.headers.map((h) => h.key)).toContain('Content-Security-Policy')
  })
})
