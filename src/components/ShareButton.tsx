'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Opens the phone's own share sheet (Instagram, WhatsApp, Messages...) via the Web Share
 * API. Where there's no share sheet (most desktop browsers), it copies the link instead and
 * says so. Nothing is tracked.
 */
export function ShareButton({
  title,
  path,
  variant = 'inline',
}: {
  title: string
  path: string
  variant?: 'inline' | 'prominent'
}) {
  const [status, setStatus] = useState('')

  const share = async () => {
    const url = new URL(path, window.location.origin).toString()
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
      } catch {
        // The reader closed the share sheet: nothing to do.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Link copied')
    } catch {
      setStatus('Copy this link: ' + url)
    }
    window.setTimeout(() => setStatus(''), 3000)
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void share()}
        className={cn(
          'text-fg inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full text-sm font-semibold',
          variant === 'prominent' ? 'border-line hover:border-fg border px-5 py-2' : 'px-2',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 fill-none stroke-current"
          strokeWidth={1.75}
        >
          <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
        Share
      </button>
      <span role="status" aria-live="polite" className="text-fg-muted text-xs">
        {status}
      </span>
    </span>
  )
}
