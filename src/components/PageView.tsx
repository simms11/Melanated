import { RichText } from '@payloadcms/richtext-lexical/react'

import { formatDate } from '@/lib/utils'
import type { Page } from '@/payload-types'

/** Layout for standalone pages: espresso title band, then the ivory reading surface. */
export function PageView({ page, isDraft = false }: { page: Page; isDraft?: boolean }) {
  return (
    <article>
      <header className="dark-section">
        <div className="container-site py-14 lg:py-20">
          {isDraft && (
            <p className="bg-gold text-espresso-900 mb-6 inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Draft preview
            </p>
          )}
          <h1 className="text-display-xl text-fg max-w-4xl">{page.title}</h1>
          {page.intro && <p className="text-fg-muted mt-5 max-w-2xl lg:text-lg">{page.intro}</p>}
          {page.lastUpdated && (
            <p className="text-fg-muted mt-5 text-sm">
              Last updated <time dateTime={page.lastUpdated}>{formatDate(page.lastUpdated)}</time>
            </p>
          )}
        </div>
      </header>
      <div className="container-site mt-12 lg:mt-16">
        <div className="paper-section rounded-card px-5 py-10 sm:px-10 lg:py-16">
          <div className="prose-editorial mx-auto">
            <RichText data={page.content} />
          </div>
        </div>
      </div>
    </article>
  )
}
