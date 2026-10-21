import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/queries'

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } }

/**
 * Placeholder. Replace with the client's reviewed policy before launch —
 * the newsletter signup collects email addresses, so UK GDPR applies.
 */
export default async function PrivacyPage() {
  const settings = await getSiteSettings()
  return (
    <div className="container-site py-16">
      <p className="eyebrow text-kicker">Legal</p>
      <h1 className="text-display-lg mt-3">Privacy policy</h1>
      <div className="prose-editorial mt-8">
        <p>
          {settings.siteName} respects your privacy. This page will set out what personal data we
          collect, how we use it and your rights under UK GDPR. For any privacy question, contact{' '}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>.
        </p>
      </div>
    </div>
  )
}
