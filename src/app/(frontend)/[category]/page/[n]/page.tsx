import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { CategoryListing } from '@/components/CategoryListing'
import { getCategories, getCategoryBySlug, getPosts, getSiteSettings } from '@/lib/queries'

type Props = { params: Promise<{ category: string; n: string }> }

export async function generateStaticParams() {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()])
  const limit = settings.editorial?.postsPerPage ?? 12
  const params: Array<{ category: string; n: string }> = []
  for (const c of categories) {
    const { totalPages } = await getPosts({ categorySlug: c.slug, limit, page: 1 })
    for (let n = 2; n <= totalPages; n++) params.push({ category: c.slug, n: String(n) })
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug, n } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `${category.title} — page ${n}`,
    alternates: { canonical: `/${category.slug}/page/${n}` },
    robots: { index: false, follow: true },
  }
}

export default async function CategoryPagedPage({ params }: Props) {
  const { category, n } = await params
  const page = Number(n)
  // Page 1 lives at /<category>; send /<category>/page/1 there rather than 404.
  if (page === 1) permanentRedirect(`/${category}`)
  if (!Number.isInteger(page) || page < 2) notFound()
  return <CategoryListing slug={category} page={page} />
}
