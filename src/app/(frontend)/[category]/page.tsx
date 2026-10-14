import type { Metadata } from 'next'

import { CategoryListing } from '@/components/CategoryListing'
import { getCategories, getCategoryBySlug } from '@/lib/queries'
import { asMedia, mediaSrc } from '@/lib/utils'

type Props = { params: Promise<{ category: string }> }

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  const image = asMedia(category.image)
  return {
    title: category.title,
    description: category.description ?? category.tagline ?? undefined,
    alternates: { canonical: `/${category.slug}` },
    openGraph: image ? { images: [{ url: mediaSrc(image, 'og'), alt: image.alt }] } : undefined,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  return <CategoryListing slug={category} page={1} />
}
