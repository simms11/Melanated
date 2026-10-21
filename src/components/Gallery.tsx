import Image from 'next/image'

import { asMedia, cn, mediaSrc } from '@/lib/utils'
import type { GalleryBlock } from '@/payload-types'

/**
 * Photos shown together inside an article. Each image keeps its own alt text; credits are
 * listed once underneath so photographers are named without cluttering the grid.
 */
export function Gallery({ images, caption, columns }: GalleryBlock) {
  const media = (images ?? []).map(asMedia).filter((m) => m !== null)
  if (media.length === 0) return null
  const credits = [...new Set(media.map((m) => m.credit?.trim()).filter(Boolean))]
  const three = columns === '3'

  return (
    <figure className="not-prose my-10">
      <ul className={cn('grid grid-cols-2 gap-2 sm:gap-3', three && 'md:grid-cols-3')}>
        {media.map((m) => (
          <li key={m.id} className="rounded-card bg-cocoa relative aspect-[4/5] overflow-hidden">
            <Image
              src={mediaSrc(m, 'card')}
              alt={m.alt}
              fill
              sizes={three ? '(min-width: 768px) 14rem, 50vw' : '(min-width: 768px) 21rem, 50vw'}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
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
