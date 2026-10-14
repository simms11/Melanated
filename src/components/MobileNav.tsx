'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

type Props = {
  links: Array<{ href: string; label: string }>
  whatsappUrl?: string
}

export function MobileNav({ links, whatsappUrl }: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const pathname = usePathname()

  // Close on route change (derived state, no effect needed).
  const [seenPath, setSeenPath] = useState(pathname)
  if (pathname !== seenPath) {
    setSeenPath(pathname)
    setOpen(false)
  }

  // Lock scroll and listen for Escape while open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="text-fg flex h-11 w-11 items-center justify-center rounded-sm"
      >
        <span className="relative block h-3.5 w-6">
          <span
            className={`ease-out-soft absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ${open ? 'top-1/2 rotate-45' : 'top-0'}`}
          />
          <span
            className={`absolute top-1/2 left-0 h-[1.5px] w-full bg-current transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
          />
          <span
            className={`ease-out-soft absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ${open ? 'top-1/2 -rotate-45' : 'top-full'}`}
          />
        </span>
      </button>

      <div
        id={id}
        hidden={!open}
        className="dark-section px-gutter fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto py-10"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="border-line font-display text-display-sm text-ivory flex min-h-14 items-center border-b no-underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-8 w-full"
          >
            Join the community
          </a>
        )}
      </div>
    </div>
  )
}
