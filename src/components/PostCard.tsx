import Image from 'next/image'
import Link from 'next/link'

import type { Post } from '@/payload-types'
import { disclosureLabel } from '@/lib/disclosure'
import { asCategory, asMedia, cn, formatDate, mediaSrc, postUrlPath } from '@/lib/utils'

type Props = {
  post: Post
  variant?: 'standard' | 'compact' | 'feature'
  priority?: boolean
}

export function PostCard({ post, variant = 'standard', priority = false }: Props) {
  const media = asMedia(post.heroImage)
  const category = asCategory(post.category)
  const href = postUrlPath(post)
  // No category means no public URL; skip the card rather than link to a 404.
  if (!href) return null
  const label = disclosureLabel(post)

  if (variant === 'compact') {
    return (
      <article className="border-line flex gap-4 border-b py-4 last:border-0">
        {/* Duplicate of the title link beside it: hide it from screen readers and Tab. */}
        <Link
          href={href}
          aria-hidden="true"
          tabIndex={-1}
          className="rounded-card bg-cocoa relative block aspect-square w-20 shrink-0 overflow-hidden"
        >
          {media && (
            <Image
              src={mediaSrc(media, 'thumbnail')}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
        </Link>
        <div className="min-w-0">
          {(category || label) && (
            <p className="eyebrow text-kicker">
              {category?.title}
              {label && (
                <span className="text-fg">
                  {category ? ' · ' : ''}
                  {label}
                </span>
              )}
            </p>
          )}
          <h3 className="font-display mt-1 text-base leading-snug">
            <Link href={href} className="no-underline hover:underline">
              {post.title}
            </Link>
          </h3>
        </div>
      </article>
    )
  }

  const isFeature = variant === 'feature'

  return (
    <article className={cn('group', isFeature && 'grid gap-6 md:grid-cols-2 md:items-center')}>
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        className={cn(
          'rounded-card bg-cocoa relative block overflow-hidden',
          isFeature ? 'aspect-[4/5] md:aspect-[3/4]' : 'aspect-[4/5]',
        )}
      >
        {media && (
          <Image
            src={mediaSrc(media, isFeature ? 'feature' : 'card')}
            alt=""
            fill
            priority={priority}
            sizes={
              isFeature
                ? '(min-width: 768px) 50vw, 100vw'
                : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'
            }
            className="ease-out-soft object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
      </Link>
      <div className={cn(isFeature ? 'md:pr-8' : 'mt-4')}>
        {(category || label) && (
          <p className="eyebrow text-kicker">
            {category?.title}
            {label && (
              <span className="text-fg">
                {category ? ' · ' : ''}
                {label}
              </span>
            )}
          </p>
        )}
        <h3 className={cn('mt-2', isFeature ? 'text-display-lg' : 'text-display-sm')}>
          <Link href={href} className="no-underline hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className={cn('text-fg-muted mt-3', isFeature ? 'text-base' : 'text-sm')}>
          {post.excerpt}
        </p>
        <p className="text-fg-muted mt-3 text-xs">
          {formatDate(post.publishedAt)}
          {post.readTime ? ` · ${post.readTime} min read` : ''}
        </p>
      </div>
    </article>
  )
}
