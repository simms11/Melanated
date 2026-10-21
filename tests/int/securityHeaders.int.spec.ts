import { describe, expect, it } from 'vitest'

import {
  contentSecurityPolicy,
  parseFrameAncestors,
  securityHeaderRules,
  securityHeaders,
} from '@/lib/securityHeaders'

type Header = { key: string; value: string }
const toMap = (list: Header[]) =>
  Object.fromEntries(list.map((h) => [h.key.toLowerCase(), h.value]))
const parseCsp = (policy: string): Record<string, string[]> =>
  Object.fromEntries(
    policy.split('; ').map((d) => {
      const [name, ...values] = d.split(' ')
      return [name, values]
    }),
  )

const headers = toMap(securityHeaders())
const csp = parseCsp(contentSecurityPolicy())

/** The headers Next sends for a path: every matching rule applies, later rules win per key. */
const headersFor = (path: string, frameAncestorsEnv?: string) => {
  const matches = (source: string) =>
    source === '/(.*)' ||
    path === source.replace('/:path*', '') ||
    path.startsWith(source.replace(':path*', ''))
  return securityHeaderRules(frameAncestorsEnv)
    .filter((rule) => matches(rule.source))
    .reduce<Record<string, string>>((acc, rule) => ({ ...acc, ...toMap(rule.headers) }), {})
}

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

  // Direct-to-Blob uploads need the browser to reach Vercel's upload API, and nothing else there.
  it('allows uploads to the Blob API without opening up all of vercel.com', () => {
    expect(csp['connect-src']).toContain('https://vercel.com/api/blob/')
    expect(csp['connect-src']).not.toContain('https://vercel.com')
    expect(csp['connect-src']).not.toContain('*')
  })

  // A portfolio's live-demo window may frame the public pages, never the admin or the API.
  describe('FRAME_ANCESTORS', () => {
    const portfolio = 'https://portfolio.example.com'

    it('accepts only https origins, so nothing else can be injected into the header', () => {
      expect(
        parseFrameAncestors(`${portfolio}, http://plain.example.com https://x.example.com/path *`),
      ).toEqual([portfolio])
      expect(parseFrameAncestors("https://a.example.com; script-src 'unsafe-eval'")).toEqual([])
      expect(parseFrameAncestors(undefined)).toEqual([])
    })

    it('lets the named site frame public pages', () => {
      for (const path of ['/', '/fashion', '/fashion/some-post', '/community']) {
        const sent = headersFor(path, portfolio)
        expect(parseCsp(sent['content-security-policy'])['frame-ancestors']).toEqual([
          "'self'",
          portfolio,
        ])
        expect(sent['x-frame-options']).toBeUndefined()
      }
    })

    it('keeps the admin and the API locked to this site', () => {
      for (const path of [
        '/admin',
        '/admin/login',
        '/admin/collections/users',
        '/api/users/login',
      ]) {
        const sent = headersFor(path, portfolio)
        expect(parseCsp(sent['content-security-policy'])['frame-ancestors']).toEqual(["'self'"])
        expect(sent['x-frame-options']).toBe('SAMEORIGIN')
      }
    })

    it('locks every page when it is not set', () => {
      for (const path of ['/', '/fashion/some-post', '/admin']) {
        expect(headersFor(path)['x-frame-options']).toBe('SAMEORIGIN')
      }
    })
  })
})
