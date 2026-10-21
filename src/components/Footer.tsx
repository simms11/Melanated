import Link from 'next/link'

import type { Category, SiteSetting } from '@/payload-types'

import { Logo } from './Logo'
import { Newsletter } from './Newsletter'

type Props = {
  categories: Category[]
  settings: SiteSetting
}

const SOCIALS: Array<{ key: keyof NonNullable<SiteSetting['social']>; label: string }> = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X' },
]

export function Footer({ categories, settings }: Props) {
  const socials = SOCIALS.filter((s) => settings.social?.[s.key])
  const year = new Date().getFullYear()

  return (
    <footer className="dark-section mt-24">
      {settings.newsletter?.formAction && (
        <div className="border-line border-b">
          <div className="container-site py-14">
            <Newsletter
              heading={settings.newsletter.heading ?? 'Get the Melanated Edit'}
              body={settings.newsletter.body ?? ''}
              action={settings.newsletter.formAction}
            />
          </div>
        </div>
      )}

      <div className="container-site grid gap-12 py-14 md:grid-cols-[1.2fr_1fr_1fr] lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="text-nude mt-5 text-sm leading-relaxed">{settings.description}</p>
        </div>

        <nav aria-label="Footer — sections">
          <h2 className="eyebrow text-kicker">Explore</h2>
          <ul className="mt-5 space-y-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${c.slug}`}
                  className="text-ivory/85 hover:text-ivory text-sm no-underline"
                >
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/community"
                className="text-ivory/85 hover:text-ivory text-sm no-underline"
              >
                Community
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-kicker">Contact</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {settings.contactEmail && (
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-ivory/85 hover:text-ivory"
                >
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.whatsappUrl && (
              <li>
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ivory/85 hover:text-ivory no-underline"
                >
                  WhatsApp community
                </a>
              </li>
            )}
          </ul>
        </div>

        {socials.length > 0 && (
          <div>
            <h2 className="eyebrow text-kicker">Follow</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={settings.social?.[s.key] ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ivory/85 hover:text-ivory no-underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-line border-t">
        <div className="container-site text-nude/80 flex flex-col gap-3 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.siteName}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="hover:text-ivory no-underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ivory no-underline">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
