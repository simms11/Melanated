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
  return sized?.url || media.url || ''
}

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')
