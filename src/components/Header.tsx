import Link from 'next/link'

import type { Category, SiteSetting } from '@/payload-types'

import { Logo } from './Logo'
import { SectionNav } from './SectionNav'

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
    <header className="dark-section border-line supports-[backdrop-filter]:bg-espresso/90 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" aria-label={`${settings.siteName}, home`} className="no-underline">
          <Logo light />
        </Link>

        <SectionNav links={links} variant="inline" className="hidden md:block" />

        {settings.whatsappUrl && (
          <a
            href={settings.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary hidden min-h-10 px-5 py-2 text-[0.75rem] lg:inline-flex"
          >
            Join the community
          </a>
        )}
      </div>

      {/* Phones: the sections get their own row instead of hiding behind a menu. */}
      <SectionNav links={links} variant="bar" className="border-line border-t md:hidden" />
    </header>
  )
}
