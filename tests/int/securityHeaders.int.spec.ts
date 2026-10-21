import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

type Header = { key: string; value: string }
const vercel = JSON.parse(readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8')) as {
  headers: Array<{ source: string; headers: Header[] }>
}
const headers = Object.fromEntries(
  vercel.headers.flatMap((h) => h.headers).map((h) => [h.key.toLowerCase(), h.value]),
)

describe('security headers (vercel.json)', () => {
  it('sends the baseline headers', () => {
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  // HSTS for this host only. includeSubDomains would force HTTPS on every subdomain of the
  // client's domain (mail, shop...) for two years, and preload asks browsers to hard-code it.
  // Both are near-impossible to undo, so they wait until the domain's subdomains are known.
  it('forces HTTPS on this host without committing the whole domain', () => {
    const hsts = headers['strict-transport-security']
    expect(hsts).toMatch(/max-age=\d+/)
    expect(hsts).not.toMatch(/includeSubDomains/i)
    expect(hsts).not.toMatch(/preload/i)
  })
})
