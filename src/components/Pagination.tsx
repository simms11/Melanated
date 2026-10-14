import Link from 'next/link'

type Props = { page: number; totalPages: number; basePath: string }

export function Pagination({ page, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null
  const href = (p: number) => (p === 1 ? basePath : `${basePath}/page/${p}`)
  return (
    <nav
      aria-label="Pagination"
      className="border-line mt-14 flex items-center justify-between border-t pt-6"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="link-arrow before:content-['←'] after:content-none"
        >
          Newer
        </Link>
      ) : (
        <span />
      )}
      <p className="eyebrow text-fg-muted">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className="link-arrow">
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
