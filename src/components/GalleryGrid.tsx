'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type GalleryItem = {
  id: number
  thumb: string
  full: string
  alt: string
  width?: number | null
  height?: number | null
}

/**
 * The gallery grid, plus a full-screen viewer. Each photo is a real link to the full image,
 * so without JavaScript it simply opens; with it, the link opens a modal <dialog> (which
 * handles focus and Esc natively). Arrow keys and swipes move between photos, and closing
 * returns focus to the photo that opened it.
 */
export function GalleryGrid({ items, three }: { items: GalleryItem[]; three: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggers = useRef<Array<HTMLAnchorElement | null>>([])
  const touchX = useRef<number | null>(null)
  const opener = useRef<number | null>(null)
  const [index, setIndex] = useState<number | null>(null)

  const go = useCallback(
    (step: number) => setIndex((i) => (i === null ? i : (i + step + items.length) % items.length)),
    [items.length],
  )

  const open = (i: number) => (e: React.MouseEvent) => {
    // Let modified clicks (new tab, etc.) behave like normal links.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    opener.current = i
    setIndex(i)
    dialogRef.current?.showModal()
  }

  const close = () => dialogRef.current?.close()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // Return focus to the photo that opened the viewer, after the dialog has finished closing.
    const onClose = () => {
      setIndex(null)
      const i = opener.current
      requestAnimationFrame(() => {
        if (i !== null) triggers.current[i]?.focus()
      })
    }
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [])

  const current = index === null ? null : items[index]
  const isOpen = index !== null

  // showModal() runs before React renders the contents, so move focus once they exist.
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  return (
    <>
      <ul className={cn('grid grid-cols-2 gap-2 sm:gap-3', three && 'md:grid-cols-3')}>
        {items.map((m, i) => (
          <li key={m.id}>
            <a
              href={m.full}
              ref={(el) => {
                triggers.current[i] = el
              }}
              onClick={open(i)}
              aria-label={`View photo ${i + 1} of ${items.length} full screen: ${m.alt}`}
              className="rounded-card bg-cocoa group relative block aspect-[4/5] overflow-hidden"
            >
              <Image
                src={m.thumb}
                alt={m.alt}
                fill
                sizes={three ? '(min-width: 768px) 14rem, 50vw' : '(min-width: 768px) 21rem, 50vw'}
                className="ease-out-soft object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </a>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Photo viewer"
        className="bg-espresso-900/95 text-ivory fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-black/80"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <p aria-live="polite" className="text-sm">
                {index! + 1} of {items.length}
                <span className="sr-only">: {current.alt}</span>
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl"
                aria-label="Close photo viewer"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image
                src={current.full}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {items.length > 1 && (
              <div className="flex justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="btn-outline-light min-w-11"
                  aria-label="Previous photo"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="btn-outline-light min-w-11"
                  aria-label="Next photo"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}
