import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostCard } from '@/components/PostCard'
import { SectionHeading } from '@/components/SectionHeading'
import { getAllPostSlugs, getPostBySlug, getPosts } from '@/lib/queries'
import { absoluteUrl, asMedia, formatDate, mediaSrc } from '@/lib/utils'
import type { Post, User } from '@/payload-types'

type Props = { params: Promise<{ category: string; slug: string }> }

export async function generateStaticParams() {
  const posts = await getAllPostSlugs()
  return posts.map((p) => ({
    category: typeof p.category === 'object' ? p.category.slug : 'posts',
    slug: p.slug,
  }))
}

const categoryOf = (post: Post) => (typeof post.category === 'object' ? post.category : null)
const authorsOf = (post: Post): User[] =>
  (post.authors ?? []).filter((a): a is User => typeof a === 'object')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const category = categoryOf(post)
  const ogImage = asMedia(post.meta?.image) ?? asMedia(post.heroImage)
  const url = `/${category?.slug ?? 'posts'}/${post.slug}`
  return {
    title: post.meta?.title ?? post.title,
    description: post.meta?.description ?? post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: authorsOf(post).map((a) => a.name),
      section: category?.title,
      tags: post.tags ?? undefined,
      images: ogImage
        ? [{ url: mediaSrc(ogImage, 'og'), width: 1200, height: 630, alt: ogImage.alt }]
        : undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { category: categorySlug, slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const post = await getPostBySlug(slug, isDraft)
  if (!post) notFound()

  const category = categoryOf(post)
  // Canonical URL lives under the post's category; 404 anything else so there's one URL per post.
  if (category && category.slug !== categorySlug) notFound()

  const hero = asMedia(post.heroImage)
  const authors = authorsOf(post)
  const curated = (post.relatedPosts ?? []).filter((p): p is Post => typeof p === 'object')
  const related =
    curated.length > 0
      ? curated.slice(0, 3)
      : (await getPosts({ categorySlug: category?.slug, limit: 3, excludeIds: [post.id] })).docs

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: hero ? absoluteUrl(mediaSrc(hero, 'og')) : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: authors.map((a) => ({ '@type': 'Person', name: a.name })),
    articleSection: category?.title,
    mainEntityOfPage: absoluteUrl(`/${category?.slug ?? 'posts'}/${post.slug}`),
  }

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="container-site pt-10 lg:pt-16">
        {isDraft && (
          <p className="bg-butter text-espresso mb-6 inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            Draft preview
          </p>
        )}
        <nav aria-label="Breadcrumb" className="eyebrow text-caramel-600">
          <ol className="flex gap-2">
            <li>
              <Link href="/" className="no-underline hover:underline">
                Home
              </Link>
            </li>
            {category && (
              <li className="before:mr-2 before:content-['/']">
                <Link href={`/${category.slug}`} className="no-underline hover:underline">
                  {category.title}
                </Link>
              </li>
            )}
          </ol>
        </nav>
        <h1 className="text-display-xl mt-5 max-w-4xl">{post.title}</h1>
        <p className="text-fg-muted mt-6 max-w-2xl text-lg">{post.excerpt}</p>
        <div className="text-fg-muted mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {authors.length > 0 && (
            <span>
              By{' '}
              {authors.map((a, i) => (
                <span key={a.id} className="text-fg font-semibold">
                  {a.name}
                  {i < authors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          )}
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
          {post.readTime && <span>{post.readTime} min read</span>}
        </div>
      </header>

      {hero && (
        <figure className="container-site mt-10">
          <div className="rounded-card bg-cream relative aspect-[16/10] overflow-hidden sm:aspect-[21/9]">
            <Image
              src={mediaSrc(hero, 'hero')}
              alt={hero.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          {(hero.caption || hero.credit) && (
            <figcaption className="text-fg-muted mt-3 text-xs">
              {hero.caption}
              {hero.credit && <span className="ml-2 opacity-70">— {hero.credit}</span>}
            </figcaption>
          )}
        </figure>
      )}

      <div className="container-site mt-12 lg:mt-16">
        <div className="prose-editorial mx-auto">
          <RichText data={post.content} />
        </div>

        {post.tags && post.tags.length > 0 && (
          <ul className="mx-auto mt-12 flex max-w-prose flex-wrap gap-2" aria-label="Tags">
            {post.tags.map((t) => (
              <li
                key={t}
                className="border-line text-fg-muted rounded-full border px-3 py-1 text-xs"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {authors.length > 0 && (
          <aside className="border-line mx-auto mt-14 max-w-prose border-t pt-8">
            {authors.map((a) => {
              const avatar = asMedia(a.avatar)
              return (
                <div key={a.id} className="flex gap-4">
                  {avatar && (
                    <Image
                      src={mediaSrc(avatar, 'thumbnail')}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="eyebrow text-caramel-600">Written by</p>
                    <p className="font-display mt-1 text-lg">{a.name}</p>
                    {a.bio && <p className="text-fg-muted mt-1 text-sm">{a.bio}</p>}
                  </div>
                </div>
              )
            })}
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="container-site mt-20">
          <SectionHeading
            eyebrow="Keep reading"
            title="You might also like"
            href={category ? `/${category.slug}` : '/'}
            linkLabel={category ? `More ${category.title}` : 'Home'}
          />
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
