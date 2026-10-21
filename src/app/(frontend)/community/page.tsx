import type { Metadata } from 'next'

import { getPageContent, getSiteSettings } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  const { community } = await getPageContent()
  return {
    title: 'Community',
    description: community.metaDescription,
    alternates: { canonical: '/community' },
  }
}

export default async function CommunityPage() {
  const [settings, { community }] = await Promise.all([getSiteSettings(), getPageContent()])

  return (
    <>
      <section className="dark-section">
        <div className="container-site py-16 lg:py-24">
          <p className="eyebrow text-kicker">{community.eyebrow}</p>
          <h1 className="text-display-xl text-fg mt-4 max-w-3xl">
            {community.heading}{' '}
            <em className="font-script text-flourish not-italic">{community.highlight}</em>
          </h1>
          <p className="text-fg-muted mt-6 max-w-xl lg:text-lg">{community.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="btn-primary">
                {community.emailLabel}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="container-site py-16 lg:py-20">
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {(community.pillars ?? []).map((p, i) => (
            <li key={p.id ?? p.title}>
              <p className="font-display text-display-sm text-flourish">0{i + 1}</p>
              <h2 className="mt-3 font-sans text-sm font-semibold tracking-wide uppercase">
                {p.title}
              </h2>
              <p className="text-fg-muted mt-2 text-sm">{p.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
