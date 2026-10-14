import Link from 'next/link'

import type { Category, SiteSetting } from '@/payload-types'

import { Logo } from './Logo'
import { MobileNav } from './MobileNav'

type Props = {
  categories: Category[]
  settings: SiteSetting
}

export function Header({ categories, settings }: Props) {
  const links = [
    ...categories.map((c) => ({ href: `/${c.slug}`, label: c.title })),
    { href: '/community', label: 'Community' },
  ]

  return (
    <header className="border-line bg-ivory/90 supports-[backdrop-filter]:bg-ivory/75 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" aria-label={`${settings.siteName} — home`} className="no-underline">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="eyebrow text-fg hover:text-caramel-600 no-underline transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {settings.whatsappUrl && (
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden min-h-10 px-5 py-2 text-[0.75rem] md:inline-flex"
            >
              Join the community
            </a>
          )}
          <MobileNav links={links} whatsappUrl={settings.whatsappUrl ?? undefined} />
        </div>
      </div>
    </header>
  )
}
