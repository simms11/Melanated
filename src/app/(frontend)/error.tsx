'use client'

import Link from 'next/link'

/**
 * Shown if a page fails to render, instead of Next's unbranded error screen. The error is
 * already logged on the server (src/instrumentation.ts); the digest helps match the two.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <section className="container-site py-32 text-center">
      <p className="font-script text-flourish text-5xl">Sorry</p>
      <h1 className="text-display-lg mt-4">Something went wrong on our side</h1>
      <p className="text-fg-muted mt-4">Please try again in a moment.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back to home
        </Link>
      </div>
      {error.digest && <p className="text-fg-muted mt-8 text-xs">Reference: {error.digest}</p>}
    </section>
  )
}
