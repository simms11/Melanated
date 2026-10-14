# Melanated Online

A luxury lifestyle and empowerment editorial platform for the modern Black woman. Five sections — Fashion, Beauty, Wellness, Business, Community — published weekly by a small editorial team.

Built with **Next.js 16 (App Router, TypeScript, Tailwind 4)** and **Payload CMS 3** on **Postgres**, deployed to **Vercel**.

## Architecture

```
┌──────────────────────────── Next.js app (one deploy) ────────────────────────────┐
│                                                                                  │
│  /admin  ──► Payload admin UI  (roles: admin · author, drafts, scheduled publish)│
│  /api/*  ──► Payload REST + GraphQL                                              │
│                                                                                  │
│  / /[category] /[category]/[slug] /community ──► static pages (SSG)              │
│        ▲                                                                         │
│        │ unstable_cache(tags) ◄── revalidateTag() from CMS afterChange hooks     │
│        │                                                                         │
│  src/lib/queries.ts ──► Payload Local API ──► Postgres (Neon)                    │
│                                        └──► Media: local disk (dev) / Vercel Blob│
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Content pipeline:** every page is prerendered. Publishing in the CMS fires `revalidateTag`/`revalidatePath`, so the site updates within seconds with no redeploy.
- **Roles:** `admin` (site owner) and `author` (contributing writer). Authors edit only their own posts; whether they can publish without review is a Site Settings toggle.
- **Images:** uploads are converted to WebP and resized into `thumbnail / card / feature / hero / og` on upload; the front end picks the right one per slot via `next/image` with `sizes`.
- **SEO:** per-page metadata, canonical URLs, Open Graph/Twitter cards, `Article` JSON-LD, `sitemap.xml`, `robots.txt`, RSS at `/feed.xml`.
- **Accessibility:** WCAG 2.2 AA targets — skip link, landmarks, focus states, required alt text, 44px tap targets, reduced-motion support.

See [`docs/adr`](docs/adr) for the reasoning behind the main decisions.

## Project layout

```
src/
  access/               access-control helpers (admins, authors, published-only)
  collections/          Posts, Categories, Media, Users
  globals/              SiteSettings (brand, contact, social, newsletter, editorial)
  fields/               reusable field configs (slug)
  hooks/                Next.js cache revalidation hooks
  lib/                  fonts, queries (all data reads), utils
  components/           Header, Footer, MobileNav, PostCard, CategoryTile, …
  app/
    (frontend)/         public site: home, [category], [category]/[slug], community, styleguide
    (payload)/          Payload admin + API routes (generated, don't edit)
    api/                preview + manual revalidation endpoints
    robots.ts
scripts/seed.ts         creates the categories and first admin user
tests/int               Vitest unit tests
tests/e2e               Playwright smoke tests
.github/workflows/ci.yml
```

## Getting started

Requirements: Node 20.9+ (22 recommended), pnpm 10, Postgres 16 (local or [Neon](https://neon.tech) free tier).

```bash
pnpm install
cp .env.example .env            # fill in DATABASE_URL and PAYLOAD_SECRET
pnpm seed                       # categories + admin@melanatedonline.com / ChangeMe123!
pnpm dev                        # http://localhost:3000, admin at /admin
```

In development the database schema is pushed automatically. In production, run migrations:

```bash
pnpm migrate:create             # after changing a collection
pnpm migrate                    # on deploy (Vercel build command: pnpm migrate && pnpm build)
```

## Scripts

| Script                | What it does                                         |
| --------------------- | ---------------------------------------------------- |
| `pnpm dev`            | Dev server with hot reload                           |
| `pnpm build`          | Production build (fails on type or lint errors)      |
| `pnpm check`          | lint + typecheck + prettier — same as CI             |
| `pnpm test:int`       | Vitest unit tests                                    |
| `pnpm test:e2e`       | Playwright smoke tests (needs a running DB)          |
| `pnpm seed`           | Seed categories and first admin                      |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after schema edits |

## Deployment (Vercel)

1. Create a Neon Postgres database and a Vercel Blob store.
2. Import the repo into Vercel. Set env vars from `.env.example` (`DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `BLOB_READ_WRITE_TOKEN`, optional `REVALIDATION_SECRET`).
3. Build command: `pnpm migrate && pnpm build`.
4. Run `pnpm seed` once against the production database (or create the first admin at `/admin`).
5. Point the domain at Vercel; security headers are in `vercel.json`.

## Definition of done (production checklist)

- [x] Mobile-first responsive layout, 44px tap targets, no horizontal scroll
- [x] Self-hosted fonts via `next/font`, `font-display: swap`
- [x] Responsive images (`next/image`, WebP, per-slot sizes, blur-free aspect boxes)
- [x] Skip link, landmarks, focus-visible styles, required alt text, reduced motion
- [x] Static generation + tag-based revalidation on publish
- [x] Metadata, canonical, OG/Twitter, JSON-LD, sitemap, robots, RSS
- [x] Role-based access, draft → publish workflow, scheduled publishing, versions
- [x] ESLint + Prettier + TypeScript strict, GitHub Actions CI (lint, typecheck, build, e2e)
- [x] Security headers, rate-limited login (5 attempts / 10 min lockout)
- [ ] Lighthouse ≥ 90 mobile on home, category and post (run after first deploy)
- [ ] Error monitoring (Sentry) and analytics (Plausible) — add once domain is live
- [ ] Privacy policy & terms pages (`/privacy`, `/terms` are linked but not yet written)
- [ ] Final logo SVG and brand name confirmed (currently a text wordmark)
- [ ] Real photography replacing placeholder imagery

## Open questions for the client

- Brand name: "Melanated Online" (brief) vs "Melanated Magazine" (logo)?
- Final five sections — brief says Business; mockup says Entrepreneurship and Lifestyle.
- Light editorial base (brief) vs dark luxury (mockup)? Currently light with espresso accent sections — see `/styleguide`.
- Should the contributing writer publish directly? (Site Settings → Editorial → "Authors can publish without review")
- Newsletter provider, WhatsApp group link, Instagram handle, domain.
