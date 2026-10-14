import { DM_Sans, Pinyon_Script, Playfair_Display } from 'next/font/google'

/**
 * Fonts are self-hosted by next/font at build time: no third-party requests,
 * no layout shift, `font-display: swap` by default.
 */
export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const script = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
})

export const fontClassNames = `${playfair.variable} ${dmSans.variable} ${script.variable}`
