/**
 * Security headers for every response, set from next.config.ts so they apply wherever the
 * app runs (and can be tested locally), not only on Vercel.
 *
 * CSP: Next's statically generated pages need inline scripts, so script-src keeps
 * 'unsafe-inline'. A nonce-based policy would force every page to render on demand and lose
 * static speed, a poor trade for a magazine. Everything else is locked to this site, plus
 * Vercel Blob for images. Dev mode adds what Next's hot reload needs.
 *
 * Framing: only this site may frame its pages, except that FRAME_ANCESTORS can name extra
 * https origins (such as a portfolio's live-demo window) allowed to frame the public pages.
 * /admin and /api always stay locked to this site, so the login can't be clickjacked.
 */
const isDev = process.env.NODE_ENV !== 'production'

/** The https origins in FRAME_ANCESTORS (space or comma separated); anything else is ignored. */
export const parseFrameAncestors = (value = ''): string[] =>
  value
    .split(/[\s,]+/)
    .filter((origin) => /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(origin))

export const contentSecurityPolicy = (frameAncestors: string[] = []) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "font-src 'self' data:",
    // Admin image uploads go straight from the browser to Vercel Blob's upload API (clientUploads).
    `connect-src 'self' https://vercel.com/api/blob/${isDev ? ' ws: wss:' : ''}`,
    "media-src 'self' https://*.public.blob.vercel-storage.com",
    ["frame-ancestors 'self'", ...frameAncestors].join(' '),
    "base-uri 'self'",
    // Add the newsletter provider's form address here when the Community page signup is built.
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')

/**
 * Headers for one route group. X-Frame-Options can't name another site, so it is only sent
 * when nothing else may frame the page; CSP frame-ancestors does the job in modern browsers.
 */
export const securityHeaders = (frameAncestors: string[] = []) => [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy(frameAncestors) },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  ...(frameAncestors.length === 0 ? [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] : []),
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // This host only: includeSubDomains/preload wait until the client's domain is known.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
]

/** Locked to this site whatever FRAME_ANCESTORS says. */
export const LOCKED_ROUTES = ['/admin/:path*', '/api/:path*']

/**
 * The rules for next.config.ts headers(). When two rules set the same header on a path, Next
 * uses the later one, so the locked routes override the public rule.
 */
export const securityHeaderRules = (frameAncestorsEnv?: string) => [
  { source: '/(.*)', headers: securityHeaders(parseFrameAncestors(frameAncestorsEnv)) },
  ...LOCKED_ROUTES.map((source) => ({ source, headers: securityHeaders() })),
]
