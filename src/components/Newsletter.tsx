type Props = { heading: string; body: string; action: string }

/**
 * Posts straight to the newsletter provider's form endpoint (Beehiiv, Mailchimp…),
 * so no subscriber data is stored here — one less GDPR obligation for the client.
 */
export function Newsletter({ heading, body, action }: Props) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div>
        <p className="eyebrow text-butter">Stay inspired</p>
        <h2 className="text-display-md text-ivory mt-3">{heading}</h2>
        <p className="text-nude mt-3 max-w-md text-sm">{body}</p>
      </div>
      <form action={action} method="post" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className="border-line bg-ivory/5 text-ivory placeholder:text-nude/60 min-h-12 flex-1 rounded-[2px] border px-4"
        />
        <button type="submit" className="btn-primary">
          Subscribe
        </button>
      </form>
    </div>
  )
}
