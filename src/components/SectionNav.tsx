'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  links: Array<{ href: string; label: string }>
  /** `bar`: its own scrollable row on phones. `inline`: inside the header row, tablet up. */
  variant: 'bar' | 'inline'
  className?: string
}

/**
 * The sections are always visible, never behind a menu: there are only five, and readers
 * arriving on an article from Instagram or WhatsApp should see at once what else is here.
 */
export function SectionNav({ links, variant, className }: Props) {
  const pathname = usePathname()
  const listRef = useRef<HTMLUListElement>(null)
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  // On a narrow phone the row scrolls sideways; bring the current section into view
  // without moving the page vertically.
  useEffect(() => {
    if (variant !== 'bar') return
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !active) return
    const overflowRight = active.offsetLeft + active.offsetWidth - list.clientWidth
    if (overflowRight > 0) list.scrollLeft = overflowRight + 24
  }, [pathname, variant])

  return (
    <nav aria-label="Sections" className={className}>
      <ul
        ref={listRef}
        className={cn(
          'flex items-center',
          variant === 'bar'
            ? // Scrolls sideways if needed; the faded right edge hints there is more.
              'px-gutter [scrollbar-width:none] gap-6 overflow-x-auto [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:px-6 [&::-webkit-scrollbar]:hidden'
            : 'gap-6 lg:gap-8',
        )}
      >
        {links.map((l) => (
          <li key={l.href} className="shrink-0">
            <Link
              href={l.href}
              aria-current={isCurrent(l.href) ? 'page' : undefined}
              className="eyebrow text-fg hover:text-kicker aria-[current=page]:text-kicker aria-[current=page]:decoration-kicker flex min-h-11 items-center no-underline decoration-2 underline-offset-8 transition-colors aria-[current=page]:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
