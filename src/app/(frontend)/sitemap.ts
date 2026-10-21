import type { MetadataRoute } from 'next'

import { getAllPostSlugs, getCategories } from '@/lib/queries'
import { absoluteUrl, postUrlPath } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, posts] = await Promise.all([getCategories(), getAllPostSlugs()])
  return [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/community'), changeFrequency: 'monthly', priority: 0.6 },
    ...categories.map((c) => ({
      url: absoluteUrl(`/${c.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
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
