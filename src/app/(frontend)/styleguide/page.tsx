import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
}

const SWATCHES: Array<[string, string, string]> = [
  ['Ivory', 'bg-ivory', '#FBF8F2'],
  ['Cream', 'bg-cream', '#F5EFE6'],
  ['Nude', 'bg-nude', '#E8CDB0'],
  ['Caramel', 'bg-caramel', '#C4813C'],
  ['Cocoa', 'bg-cocoa', '#5C3A21'],
  ['Espresso', 'bg-espresso', '#2A1A12'],
  ['Butter', 'bg-butter', '#F3C94D'],
  ['Gold', 'bg-gold', '#D4A017'],
]

/**
 * Internal reference page for client sign-off on the visual language.
 * Not linked from navigation and excluded from search engines.
 */
export default function StyleguidePage() {
  return (
    <div className="container-site py-16">
      <p className="eyebrow text-caramel-600">Internal</p>
      <h1 className="text-display-lg mt-3">Styleguide</h1>
      <p className="text-fg-muted mt-4 max-w-prose">
        The design tokens, type scale and components the site is built from. Light editorial base
        with espresso accent sections, per the brief.
      </p>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Colour</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCHES.map(([name, cls, hex]) => (
            <li key={name}>
              <div className={`rounded-card border-line aspect-[4/3] border ${cls}`} />
              <p className="mt-2 text-sm font-semibold">{name}</p>
              <p className="text-fg-muted text-xs">{hex}</p>
            </li>
          ))}
        </ul>
        <p className="text-fg-muted mt-4 text-xs">
          Contrast note: butter and caramel on cream fail WCAG AA for body text — use them on
          espresso, or as eyebrows/accents only. Caramel-600 (#A3672C) is the text-safe caramel on
          light backgrounds.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Type scale</h2>
        <div className="mt-6 space-y-8">
          <p className="text-display-xl">Display XL — The Modern Black Woman Builds</p>
          <p className="text-display-lg">Display LG — From Passion to Profit</p>
          <p className="text-display-md">Display MD — A Community of Go-Getters</p>
          <p className="text-display-sm">Display SM — The Best Skincare Routine for Glowing Skin</p>
          <p className="font-script text-caramel text-5xl">Script — Style · Strategy · Self-care</p>
          <p className="eyebrow text-caramel-600">Eyebrow — Entrepreneurship</p>
          <p className="max-w-prose text-lg leading-relaxed">
            Body LG — More than a title, she&rsquo;s a vision. Discover how Black women are
            redefining success, style, wellness and wealth on their own terms.
          </p>
          <p className="text-fg-muted max-w-prose text-sm">
            Body SM / muted — Timeless style. Bold looks. Real women.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Buttons &amp; links</h2>
        <div className="mt-6 flex flex-wrap gap-4">
          <button className="btn-primary">Primary</button>
          <button className="btn-dark">Dark</button>
          <button className="btn-outline">Outline</button>
          <a href="#" className="link-arrow self-center">
            Arrow link
          </a>
        </div>
        <div className="dark-section rounded-card mt-6 flex flex-wrap gap-4 p-6">
          <button className="btn-primary">Primary on dark</button>
          <button className="btn-outline-light">Outline light</button>
        </div>
        <div className="caramel-section rounded-card mt-6 p-6">
          <p className="eyebrow text-kicker">Caramel section</p>
          <p className="text-display-sm text-fg mt-3">
            A community of <em className="font-script text-flourish not-italic">go-getters</em>
          </p>
          <p className="text-fg-muted mt-2 max-w-prose text-sm">
            Accent band between ivory and espresso. Butter fails contrast here, so CTAs use the dark
            button.
          </p>
          <button className="btn-dark mt-5">Dark on caramel</button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Article body</h2>
        <div className="prose-editorial mt-6">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. The drop cap, measure and
            leading are tuned for long-form reading on a phone first.
          </p>
          <h2>A second-level heading</h2>
          <p>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
            consequat.
          </p>
          <blockquote>
            <p>Strong women create stronger communities.</p>
          </blockquote>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur.
          </p>
        </div>
      </section>
    </div>
  )
}
