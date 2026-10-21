import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="container-site py-32 text-center">
      <p className="font-script text-flourish text-5xl">Oops</p>
      <h1 className="text-display-lg mt-4">We couldn&rsquo;t find that page</h1>
      <p className="text-fg-muted mt-4">It may have moved, or the link might be out of date.</p>
      <Link href="/" className="btn-primary mt-8">
        Back to home
      </Link>
    </section>
  )
}
