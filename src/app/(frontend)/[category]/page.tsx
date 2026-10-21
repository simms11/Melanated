import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { CategoryListing } from '@/components/CategoryListing'
import { PageView } from '@/components/PageView'
import { getCategories, getCategoryBySlug, getPageBySlug, getPublishedPages } from '@/lib/queries'
import { asMedia, mediaSrc } from '@/lib/utils'

/**
 * /<slug> is either a section (category listing) or a standalone page such as /privacy.
 * The two can't share an address (src/fields/topLevelSlug.ts), so sections are checked first.
 */
type Props = { params: Promise<{ category: string }> }

export async function generateStaticParams() {
  const [categories, pages] = await Promise.all([getCategories(), getPublishedPages()])
  return [...categories, ...pages].map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (category) {
    const image = asMedia(category.image)
    return {
      title: category.title,
      description: category.description ?? category.tagline ?? undefined,
      alternates: { canonical: `/${category.slug}` },
      openGraph: image ? { images: [{ url: mediaSrc(image, 'og'), alt: image.alt }] } : undefined,
    }
  }
  const page = await getPageBySlug(slug)
  if (!page) return {}
  return {
    title: page.meta?.title ?? page.title,
    description: page.meta?.description ?? page.intro ?? undefined,
    alternates: { canonical: `/${page.slug}` },
  }
}

export default async function TopLevelPage({ params }: Props) {
  const { category: slug } = await params
  if (!(await getCategoryBySlug(slug))) {
    const { isEnabled: isDraft } = await draftMode()
    const page = await getPageBySlug(slug, isDraft)
    if (page) return <PageView page={page} isDraft={isDraft} />
  }
  // Handles real sections, plus redirects and the 404 for unknown addresses.
  return <CategoryListing slug={slug} page={1} />
}
