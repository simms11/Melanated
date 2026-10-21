import type { Media } from '@/payload-types'

export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const absoluteUrl = (path: string): string => new URL(path, SITE_URL).toString()

export const formatDate = (iso?: string | null): string =>
  iso
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(iso),
      )
    : ''

/** Resolve an upload relationship (id or populated doc) to a Media doc. */
export const asMedia = (value: unknown): Media | null =>
  value && typeof value === 'object' && 'url' in (value as object) ? (value as Media) : null

/** Pick the best size for a given slot, falling back to the original. */
export const mediaSrc = (media: Media | null, size?: keyof NonNullable<Media['sizes']>): string => {
  if (!media) return ''
  const sized = size ? media.sizes?.[size] : undefined
  const url = sized?.url || media.url || ''
  // Payload prefixes local uploads with serverURL; make them relative so they match
  // images.localPatterns in next.config. Blob storage URLs (other hosts) pass through.
  const origin = process.env.NEXT_PUBLIC_SERVER_URL
  return origin && url.startsWith(`${origin}/`) ? url.slice(origin.length) : url
}

/**
 * JSON for an inline <script type="application/ld+json">. JSON.stringify leaves "<" alone, so
 * an author-controlled string like "</script><script>…" would end the block and run as code.
 * Escaping these characters keeps the JSON identical once parsed.
 */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')
