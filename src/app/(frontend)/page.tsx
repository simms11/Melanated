import Image from 'next/image'
import Link from 'next/link'

import { CategoryTile } from '@/components/CategoryTile'
import { PostCard } from '@/components/PostCard'
import { SectionHeading } from '@/components/SectionHeading'
import { getCategories, getPageContent, getPosts, getSiteSettings } from '@/lib/queries'
import { asMedia, mediaSrc } from '@/lib/utils'

export default async function HomePage() {
  const [settings, content, categories, featuredRes, trendingRes] = await Promise.all([
    getSiteSettings(),
    getPageContent(),
    getCategories(),
    getPosts({ featured: true, limit: 1 }),
    getPosts({ trending: true, limit: 4 }),
  ])
  const featured = featuredRes.docs[0]
  const latestRes = await getPosts({ limit: 6, excludeIds: featured ? [featured.id] : [] })
  const latest = latestRes.docs
  const trending = trendingRes.docs.filter((p) => p.id !== featured?.id)
  const heroMedia = featured ? asMedia(featured.heroImage) : null
  const home = content.home

  return (
    <>
      {/* Hero */}
      <section className="dark-section relative overflow-hidden">
        <div className="container-site grid min-h-[70svh] items-center gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="relative z-10">
            <p className="eyebrow text-kicker">{categories.map((c) => c.title).join(' / ')}</p>
            <h1 className="text-display-xl text-ivory mt-5">
              {settings.tagline ?? 'The Modern Black Woman Builds'}
            </h1>
            <p className="text-nude mt-6 max-w-lg text-base leading-relaxed lg:text-lg">
              {settings.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={home.heroButtonLink} className="btn-primary">
                {home.heroButtonLabel}
              </Link>
            </div>
          </div>
          <div className="rounded-card bg-cocoa relative aspect-[4/5] overflow-hidden lg:aspect-[5/6]">
            {heroMedia ? (
              <Image
                src={mediaSrc(heroMedia, 'hero')}
                alt={heroMedia.alt}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <p className="font-script text-flourish text-4xl">
                  Style · Strategy · Self-care · Success
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category tiles */}
      {categories.length > 0 && (
        <section aria-labelledby="sections" className="container-site py-14 lg:py-20">
          <h2 id="sections" className="sr-only">
            Sections
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {categories.map((c) => (
              <CategoryTile key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      {/* Featured + trending */}
      {(featured || trending.length > 0) && (
        <section className="container-site grid gap-12 py-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {featured && (
            <div>
              <p className="eyebrow text-kicker mb-6">{home.featuredLabel}</p>
              <PostCard post={featured} variant="feature" />
            </div>
          )}
          {trending.length > 0 && (
            <aside aria-labelledby="trending">
              <h2
                id="trending"
                className="border-line font-display text-display-sm border-b pb-3 italic"
              >
                {home.trendingTitle}
              </h2>
              <div>
                {trending.map((p) => (
                  <PostCard key={p.id} post={p} variant="compact" />
                ))}
              </div>
            </aside>
          )}
        </section>
      )}

      {/* Latest */}
      {latest.length > 0 && (
        <section id="latest" className="container-site scroll-mt-32 py-14 lg:py-20">
          <SectionHeading eyebrow={home.latestEyebrow} title={home.latestTitle} />
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {latest.length === 0 && !featured && (
        <section className="container-site py-20 text-center">
          <p className="font-script text-flourish text-4xl">{home.emptyTitle}</p>
          <p className="text-fg-muted mt-3">{home.emptyBody}</p>
        </section>
      )}

      {/* Community */}
      <section className="border-line border-y">
        <div className="container-site grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="eyebrow text-kicker">{home.communityEyebrow}</p>
            <h2 className="text-display-lg text-fg mt-4">
              {home.communityHeading}{' '}
              <em className="font-script text-flourish not-italic">{home.communityHighlight}</em>
            </h2>
            <p className="text-fg-muted mt-5 max-w-md">{home.communityIntro}</p>
            <Link href={home.communityButtonLink} className="btn-primary mt-8">
              {home.communityButtonLabel}
            </Link>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {(home.communityFeatures ?? []).map((f) => (
              <li key={f.id ?? f.title} className="border-line border-l pl-4">
                <h3 className="text-fg font-sans text-sm font-semibold tracking-wide uppercase">
                  {f.title}
                </h3>
                <p className="text-fg-muted mt-1 text-sm">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
