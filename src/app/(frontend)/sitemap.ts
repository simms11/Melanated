import type { MetadataRoute } from 'next'

import { getAllPostSlugs, getCategories, getPublishedPages } from '@/lib/queries'
import { absoluteUrl, postUrlPath } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, posts, pages] = await Promise.all([
    getCategories(),
    getAllPostSlugs(),
    getPublishedPages(),
  ])
  return [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/community'), changeFrequency: 'monthly', priority: 0.6 },
    ...categories.map((c) => ({
      url: absoluteUrl(`/${c.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...pages.map((p) => ({
      url: absoluteUrl(`/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
    ...posts.flatMap((p) => {
      const path = postUrlPath(p)
      if (!path) return []
      return [
        {
          url: absoluteUrl(path),
          lastModified: p.updatedAt,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        },
      ]
    }),
  ]
}
