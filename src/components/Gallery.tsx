import { asMedia, mediaSrc } from '@/lib/utils'
import type { GalleryBlock } from '@/payload-types'

import { GalleryGrid } from './GalleryGrid'

/**
 * Photos shown together inside an article, with a full-screen viewer. Each image keeps its
 * own alt text; any credits are listed once underneath.
 */
export function Gallery({ images, caption, columns }: GalleryBlock) {
  const media = (images ?? []).map(asMedia).filter((m) => m !== null)
  if (media.length === 0) return null
  const credits = [...new Set(media.map((m) => m.credit?.trim()).filter(Boolean))]
  const items = media.map((m) => ({
    id: m.id,
    thumb: mediaSrc(m, 'card'),
    full: mediaSrc(m),
    alt: m.alt,
    width: m.width,
    height: m.height,
  }))

  return (
    <figure className="not-prose my-10">
      <GalleryGrid items={items} three={columns === '3'} />
      {(caption || credits.length > 0) && (
        <figcaption className="text-fg-muted mt-3 text-sm">
          {caption}
          {credits.length > 0 && (
            <span className="block text-xs opacity-80">Photos: {credits.join(', ')}</span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
