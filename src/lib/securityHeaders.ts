/**
 * Security headers for every response, set from next.config.ts so they apply wherever the
 * app runs (and can be tested locally), not only on Vercel.
 *
 * CSP: Next's statically generated pages need inline scripts, so script-src keeps
 * 'unsafe-inline'. A nonce-based policy would force every page to render on demand and lose
 * static speed, a poor trade for a magazine. Everything else is locked to this site, plus
 * Vercel Blob for images. Dev mode adds what Next's hot reload needs.
 */
const isDev = process.env.NODE_ENV !== 'production'

export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  // Admin image uploads go straight from the browser to Vercel Blob's upload API (clientUploads).
  `connect-src 'self' https://vercel.com/api/blob/${isDev ? ' ws: wss:' : ''}`,
  "media-src 'self' https://*.public.blob.vercel-storage.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  // Add the newsletter provider's form address here when the Community page signup is built.
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

export const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // This host only: includeSubDomains/preload wait until the client's domain is known.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
]
