import type { Metadata, Viewport } from 'next'
import React from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { fontClassNames } from '@/lib/fonts'
import { getCategories, getPublishedPages, getSiteSettings } from '@/lib/queries'
import { SITE_URL } from '@/lib/utils'

import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.siteName} — ${settings.tagline ?? ''}`.trim(),
      template: `%s · ${settings.siteName}`,
    },
    description: settings.description ?? undefined,
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      locale: 'en_GB',
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: '#2a1a12',
  // The palette is designed, not inverted: stop phone browsers' auto dark mode recolouring it.
  colorScheme: 'only light',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, pages] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getPublishedPages(),
  ])

  return (
    <html lang="en-GB" className={fontClassNames}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header categories={categories} settings={settings} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer
          categories={categories}
          settings={settings}
          legalPages={pages.filter((p) => p.showInFooter)}
        />
      </body>
    </html>
  )
}
