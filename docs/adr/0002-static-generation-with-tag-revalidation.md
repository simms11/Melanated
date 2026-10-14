# ADR 0002 — Static generation with tag-based revalidation

**Status:** Accepted · 2026-10-14

## Context

Core Web Vitals and Lighthouse ≥ 90 on mobile are explicit goals. Content changes weekly, not per request. The client expects a publish in the CMS to appear on the site immediately without a developer redeploying.

## Decision

- All public routes are prerendered (`generateStaticParams` for categories, paged listings and posts).
- Data reads are wrapped in `unstable_cache` with tags (`posts`, `categories`, `settings`) and a one-hour TTL as a safety net.
- Payload `afterChange` / `afterDelete` hooks call `revalidateTag` and `revalidatePath` for the affected pages. A `disableRevalidate` request context flag lets scripts (seed, imports) skip this when running outside Next.
- Pagination is path-based (`/fashion/page/2`) rather than `?page=2` so listing pages stay static.
- `POST /api/revalidate` with a shared secret is available as a manual cache bust.

## Consequences

- First request after a publish may be served from the previous version for a second or two while the page regenerates; acceptable for an editorial site.
- Draft preview uses Next draft mode via `/api/preview`, bypassing the cache for signed-in users.
