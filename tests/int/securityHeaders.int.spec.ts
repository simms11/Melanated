import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy, securityHeaders } from '@/lib/securityHeaders'

const headers = Object.fromEntries(securityHeaders.map((h) => [h.key.toLowerCase(), h.value]))
const csp = Object.fromEntries(
  contentSecurityPolicy.split('; ').map((d) => {
    const [name, ...values] = d.split(' ')
    return [name, values]
  }),
)

describe('security headers', () => {
  it('sends the baseline headers', () => {
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  // HSTS for this host only. includeSubDomains would force HTTPS on every subdomain of the
  // client's domain (mail, shop...) for two years, and preload asks browsers to hard-code it.
  it('forces HTTPS on this host without committing the whole domain', () => {
    const hsts = headers['strict-transport-security']
    expect(hsts).toMatch(/max-age=\d+/)
    expect(hsts).not.toMatch(/includeSubDomains/i)
    expect(hsts).not.toMatch(/preload/i)
  })

  it('only lets this site load scripts, and blocks plugins, framing and foreign forms', () => {
    expect(csp['default-src']).toEqual(["'self'"])
    expect(csp['script-src']).not.toContain('*')
    expect(csp['script-src'].filter((s: string) => s.startsWith('http'))).toEqual([])
    expect(csp['object-src']).toEqual(["'none'"])
    expect(csp['frame-ancestors']).toEqual(["'self'"])
    expect(csp['form-action']).toEqual(["'self'"])
    expect(csp['base-uri']).toEqual(["'self'"])
  })
})
