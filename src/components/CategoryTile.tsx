import Image from 'next/image'
import Link from 'next/link'

import type { Category } from '@/payload-types'
import { asMedia, mediaSrc } from '@/lib/utils'

export function CategoryTile({ category }: { category: Category }) {
  const media = asMedia(category.image)
  return (
    <Link
      href={`/${category.slug}`}
      className="group rounded-card bg-cocoa relative block aspect-[3/4] overflow-hidden no-underline"
    >
      {media && (
        <Image
          src={mediaSrc(media, 'card')}
          alt=""
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="ease-out-soft object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      )}
      <div className="from-espresso-900/90 via-espresso-900/30 absolute inset-0 bg-gradient-to-t to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5">
        <p className="eyebrow text-butter">{category.title}</p>
        {category.tagline && <p className="text-ivory/90 mt-1 text-sm">{category.tagline}</p>}
      </div>
    </Link>
  )
}
