import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/queries'

export const metadata: Metadata = { title: 'Terms of use', alternates: { canonical: '/terms' } }

/** Placeholder — replace with reviewed terms before launch. */
export default async function TermsPage() {
  const settings = await getSiteSettings()
  return (
    <div className="container-site py-16">
      <p className="eyebrow text-kicker">Legal</p>
      <h1 className="text-display-lg mt-3">Terms of use</h1>
      <div className="prose-editorial mt-8">
        <p>
          By using {settings.siteName} you agree to these terms. Content is provided for general
          information and inspiration only. Questions:{' '}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>.
        </p>
      </div>
    </div>
  )
}
