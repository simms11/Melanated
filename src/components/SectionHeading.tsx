import Link from 'next/link'

type Props = { eyebrow?: string; title: string; href?: string; linkLabel?: string }

export function SectionHeading({ eyebrow, title, href, linkLabel = 'View all' }: Props) {
  return (
    <div className="border-line flex items-end justify-between gap-6 border-b pb-4">
      <div>
        {eyebrow && <p className="eyebrow text-kicker">{eyebrow}</p>}
        <h2 className="text-display-md mt-2">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="link-arrow shrink-0">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
