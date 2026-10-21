import { getAllPostSlugs, getSiteSettings } from '@/lib/queries'
import { absoluteUrl, postUrlPath } from '@/lib/utils'

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  const [settings, posts] = await Promise.all([getSiteSettings(), getAllPostSlugs()])
  const items = posts
    .flatMap((p) => {
      const path = postUrlPath(p)
      return path ? [{ p, path }] : []
    })
    .slice(0, 50)
    .map(({ p, path }) => {
      const url = absoluteUrl(path)
      return `<item>
  <title>${escape(p.title)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <description>${escape(p.excerpt)}</description>
  ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}
</item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escape(settings.siteName)}</title>
  <link>${absoluteUrl('/')}</link>
  <description>${escape(settings.description ?? '')}</description>
  <language>en-gb</language>
  <atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600',
    },
  })
}
