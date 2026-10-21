import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
}

// Ordered by role: body, frame, accent, text, reading surface. Gold is the only accent.
const SWATCHES: Array<[string, string, string, string]> = [
  ['Cocoa', 'bg-cocoa', '#5C3A21', 'Page body'],
  ['Espresso', 'bg-espresso', '#2A1A12', 'Header, hero, category headers, footer'],
  ['Gold', 'bg-gold', '#D4A017', 'Accent: buttons, wordmark, lines, focus'],
  ['Ivory', 'bg-ivory', '#FBF8F2', 'Text on dark; article reading surface'],
  ['Nude', 'bg-nude', '#E8CDB0', 'Muted text and small labels on cocoa'],
  ['Espresso 900', 'bg-espresso-900', '#1C110B', 'Text on gold buttons'],
  ['Caramel 600', 'bg-caramel-600', '#A3672C', 'Accent on the reading surface'],
  ['Caramel', 'bg-caramel', '#C4813C', 'Reserved: not in the current scheme'],
]

// Measured WCAG contrast. AA needs 4.5:1 for body text, 3:1 for large text and controls.
const PAIRS: Array<[string, string, string, string]> = [
  ['Ivory on cocoa', '9.5:1', 'Pass', 'Headings and body text'],
  ['Nude on cocoa', '6.6:1', 'Pass', 'Muted text, eyebrows, small labels'],
  [
    'Gold on cocoa',
    '4.25:1',
    'Large only',
    'Script words, lines, icons, buttons; never small text',
  ],
  ['Gold on espresso', '7.0:1', 'Pass', 'Eyebrows, wordmark and labels in the frame'],
  ['Espresso 900 on gold', '7.8:1', 'Pass', 'Primary button text'],
  ['Ivory on gold', '2.2:1', 'Fail', 'Never'],
  ['Cocoa on ivory', '9.5:1', 'Pass', 'Eyebrows on the reading surface'],
  [
    'Caramel 600 on ivory',
    '4.4:1',
    'Large only',
    'Drop caps and links (underlined), not small text',
  ],
]

/**
 * Internal reference page for client sign-off on the visual language.
 * Not linked from navigation and excluded from search engines.
 */
export default function StyleguidePage() {
  return (
    <div className="container-site py-16">
      <p className="eyebrow text-kicker">Internal</p>
      <h1 className="text-display-lg mt-3">Styleguide</h1>
      <p className="text-fg-muted mt-4 max-w-prose">
        The design tokens, type scale and components the site is built from. The client&rsquo;s
        palette: a cocoa body, an espresso frame (header, hero, category headers, footer), gold as
        the only accent, and an ivory reading surface for articles. Gold stays near 10% of any page.
      </p>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Colour</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCHES.map(([name, cls, hex, role]) => (
            <li key={name}>
              <div className={`rounded-card border-line aspect-[4/3] border ${cls}`} />
              <p className="mt-2 text-sm font-semibold">{name}</p>
              <p className="text-fg-muted text-xs">
                {hex} · {role}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Contrast rules</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-line border-b">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Pairing
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Ratio
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  AA
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Use
                </th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map(([pair, ratio, verdict, use]) => (
                <tr key={pair} className="border-line border-b">
                  <th scope="row" className="py-2 pr-4 font-normal">
                    {pair}
                  </th>
                  <td className="py-2 pr-4 tabular-nums">{ratio}</td>
                  <td className="py-2 pr-4 font-semibold">{verdict}</td>
                  <td className="text-fg-muted py-2">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Surfaces</h2>
        <p className="text-fg-muted mt-4 max-w-prose text-sm">
          Components use semantic tokens (fg, fg-muted, line, kicker, flourish, focus), so the same
          markup works on every surface. Never hard-code a palette colour for text in a component.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="border-line rounded-card border p-6">
            <p className="eyebrow text-kicker">Cocoa body</p>
            <p className="text-display-sm text-fg mt-3">
              A community of <em className="font-script text-flourish not-italic">go-getters</em>
            </p>
            <p className="text-fg-muted mt-2 text-sm">
              Default page surface. Small labels in nude.
            </p>
            <button className="btn-primary mt-5">Primary on cocoa</button>
          </div>
          <div className="dark-section rounded-card p-6">
            <p className="eyebrow text-kicker">Espresso section</p>
            <p className="text-display-sm text-fg mt-3">
              A community of <em className="font-script text-flourish not-italic">go-getters</em>
            </p>
            <p className="text-fg-muted mt-2 text-sm">Header, hero, category headers, footer.</p>
            <button className="btn-primary mt-5">Primary on dark</button>
          </div>
          <div className="paper-section rounded-card p-6">
            <p className="eyebrow text-kicker">Paper section</p>
            <p className="text-display-sm text-fg mt-3">
              A community of <em className="font-script text-flourish not-italic">go-getters</em>
            </p>
            <p className="text-fg-muted mt-2 text-sm">Article body: calm, high-contrast reading.</p>
            <button className="btn-dark mt-5">Dark on paper</button>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Type scale</h2>
        <div className="mt-6 space-y-8">
          <p className="text-display-xl">Display XL: The Modern Black Woman Builds</p>
          <p className="text-display-lg">Display LG: From Passion to Profit</p>
          <p className="text-display-md">Display MD: A Community of Go-Getters</p>
          <p className="text-display-sm">Display SM: The Best Skincare Routine for Glowing Skin</p>
          <p className="font-script text-flourish text-5xl">Script: Style · Strategy · Self-care</p>
          <p className="eyebrow text-kicker">Eyebrow: Entrepreneurship</p>
          <p className="max-w-prose text-lg leading-relaxed">
            Body LG: More than a title, she&rsquo;s a vision. Discover how Black women are
            redefining success, style, wellness and wealth on their own terms.
          </p>
          <p className="text-fg-muted max-w-prose text-sm">
            Body SM, muted: Timeless style. Bold looks. Real women.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Buttons &amp; links</h2>
        <div className="mt-6 flex flex-wrap gap-4">
          <button className="btn-primary">Primary</button>
          <button className="btn-outline">Outline</button>
          <a href="#" className="link-arrow self-center">
            Arrow link
          </a>
        </div>
        <div className="dark-section rounded-card mt-6 flex flex-wrap gap-4 p-6">
          <button className="btn-primary">Primary on dark</button>
          <button className="btn-outline-light">Outline light</button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="eyebrow border-line border-b pb-3">Article body</h2>
        <div className="paper-section rounded-card mt-6 px-5 py-10 sm:px-10">
          <div className="prose-editorial mx-auto">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. The drop cap, measure and
              leading are tuned for long-form reading on a phone first.
            </p>
            <h2>A second-level heading</h2>
            <p>
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat. <a href="#">An inline link</a> sits in the text.
            </p>
            <blockquote>
              <p>Strong women create stronger communities.</p>
            </blockquote>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
