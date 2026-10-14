import Image from 'next/image'
import { notFound } from 'next/navigation'

import { Pagination } from '@/components/Pagination'
import { PostCard } from '@/components/PostCard'
import { getCategoryBySlug, getPosts, getSiteSettings } from '@/lib/queries'
import { asMedia, mediaSrc } from '@/lib/utils'

/**
 * Category landing page body, shared by /[category] (page 1) and /[category]/page/[n].
 * Pagination lives in the path rather than ?page= so every page is statically generated.
 */
export async function CategoryListing({ slug, page }: { slug: string; page: number }) {
  const [category, settings] = await Promise.all([getCategoryBySlug(slug), getSiteSettings()])
  if (!category) notFound()

  const limit = settings.editorial?.postsPerPage ?? 12
  const result = await getPosts({ categorySlug: slug, page, limit })
  if (page > 1 && result.docs.length === 0) notFound()

  const image = asMedia(category.image)

  return (
    <>
      <section className="dark-section">
        <div className="container-site grid gap-8 py-14 lg:grid-cols-[1fr_1fr] lg:items-end lg:py-20">
          <div>
            <p className="eyebrow text-butter">Section</p>
            <h1 className="text-display-xl text-ivory mt-4">{category.title}</h1>
            {category.description && (
              <p className="text-nude mt-5 max-w-lg lg:text-lg">{category.description}</p>
            )}
          </div>
          {image && (
            <div className="rounded-card relative aspect-[16/9] overflow-hidden lg:aspect-[3/2]">
              <Image
                src={mediaSrc(image, 'feature')}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="container-site py-14 lg:py-20">
        {result.docs.length === 0 ? (
          <p className="text-fg-muted py-20 text-center">
            No stories in {category.title} yet — check back soon.
          </p>
        ) : (
          <>
            <p className="eyebrow text-fg-muted">
              {result.totalDocs} {result.totalDocs === 1 ? 'story' : 'stories'}
            </p>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {result.docs.map((p, i) => (
                <PostCard key={p.id} post={p} priority={i < 3} />
              ))}
            </div>
            <Pagination page={page} totalPages={result.totalPages} basePath={`/${category.slug}`} />
          </>
        )}
      </section>
    </>
  )
}
