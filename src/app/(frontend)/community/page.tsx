import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Connect with like-minded women, build relationships and encourage collaboration and empowerment.',
  alternates: { canonical: '/community' },
}

const PILLARS = [
  ['Exclusive content', 'Inspiration, resources and tools shared first with members.'],
  ['Member events', 'Virtual and in-person experiences throughout the year.'],
  ['Networking', 'Connect with ambitious, like-minded women.'],
  ['Business support', 'Accountability and advice to take your vision to the next level.'],
]

export default async function CommunityPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <section className="dark-section">
        <div className="container-site py-16 lg:py-24">
          <p className="eyebrow text-kicker">Community</p>
          <h1 className="text-display-xl text-ivory mt-4 max-w-3xl">
            A space to connect, collaborate and{' '}
            <em className="font-script text-flourish not-italic">rise together</em>
          </h1>
          <p className="text-nude mt-6 max-w-xl lg:text-lg">
            Melanated Online is more than a magazine. It&rsquo;s a community of Black women building
            beautiful lives, pursuing personal growth and creating successful businesses.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {settings.whatsappUrl ? (
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Join on WhatsApp
              </a>
            ) : (
              <span className="btn-outline-light cursor-default opacity-70">
                WhatsApp link coming soon
              </span>
            )}
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="btn-outline-light">
                Email us
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="container-site py-16 lg:py-20">
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(([t, d], i) => (
            <li key={t}>
              <p className="font-display text-display-sm text-flourish">0{i + 1}</p>
              <h2 className="mt-3 font-sans text-sm font-semibold tracking-wide uppercase">{t}</h2>
              <p className="text-fg-muted mt-2 text-sm">{d}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
