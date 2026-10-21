# Melanated Online

An online magazine for the modern Black woman: four sections (Fashion, Beauty, Wellness, Business) plus a Community page, published weekly by a small editorial team.

Built with **Next.js 16 (App Router, TypeScript, Tailwind 4)** and **Payload CMS 3** on **Postgres**, deployed to **Vercel**.

## Architecture

```
┌──────────────────────────── Next.js app (one deploy) ────────────────────────────┐
│                                                                                  │
│  /admin  ──► Payload admin UI  (roles: admin · author, drafts, scheduled publish)│
│  /api/*  ──► Payload REST + GraphQL, health check, hearts, preview               │
│                                                                                  │
│  / /[slug] /[category]/[slug] /community ──► static pages (SSG)                  │
│        ▲         (a section or a standalone page such as /privacy)               │
│        │ unstable_cache(tags) ◄── revalidateTag() from CMS afterChange hooks     │
│        │                                                                         │
│  src/lib/queries.ts ──► Payload Local API ──► Postgres                           │
│                                        └──► Media: local disk (dev) / Vercel Blob│
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Publishing:** pages are prerendered. Publishing in the CMS revalidates their cache tags, so the site updates within seconds without a redeploy. Scheduled posts go live at a daily cron run (`/api/payload-jobs/run`, protected by `CRON_SECRET`).
- **Editing:** editors manage posts (with a photo Gallery block and Ad/Affiliate/Gifted disclosure labels), standalone Pages, the home and Community page wording, sections, images and Site Settings. The layout stays in code, so the design can't be broken.
- **Roles:** admins can do everything. Authors edit only their own posts and images, and can't publish unless Site Settings allows it.
- **Redirects:** changing a published post's address, or renaming a section, creates a redirect from the old URL automatically.
- **Reader features:** hearts (one per browser, rate-limited), sharing, and a reading-progress line on articles.
- **Security and accessibility:** a Content Security Policy and security headers (`src/lib/securityHeaders.ts`), login lockout after 5 failed attempts, and WCAG 2.2 AA targets; `/styleguide` lists the colour contrast rules.

See [`docs/adr`](docs/adr) for the reasoning behind the main decisions and [`docs/runbooks/operations.md`](docs/runbooks/operations.md) for running the live site.

## Project layout

```
src/
  access/               access-control rules (admins, own posts, own images, published-only)
  blocks/               rich-text blocks (Gallery)
  collections/          Posts, Pages, Categories, Media, Users, Reactions, heart votes and limits
  globals/              SiteSettings (brand, contact, social, editorial), PageContent (home and Community copy)
  fields/               shared fields: slug, the post/page editor, top-level address rules
  hooks/                cache revalidation and automatic redirects
  lib/                  queries (all data reads), hearts, security headers, disclosure labels, utils
  components/           Header, SectionNav, Footer, PostCard, Gallery, HeartButton, ShareButton, ...
  migrations/           Payload migrations (generated; commit with every schema change)
  instrumentation.ts    structured server error logs
  app/
    (frontend)/         public site: home, [category] (sections and pages), [category]/[slug],
                        community, styleguide, sitemap, feed.xml
    (payload)/          Payload admin + API routes (generated, don't edit)
    api/                health, hearts, preview, manual revalidation
scripts/seed.ts         categories, first admin user, and draft privacy policy and terms
scripts/seed-demo.ts    placeholder posts and photos for local design review only
tests/int               Vitest unit and database tests (access, publishing, redirects, hearts...)
tests/e2e               Playwright end-to-end tests (navigation, articles, admin)
docs/                   ADRs, editor guide, operations runbook
```

## Getting started

Requirements: Node 22, pnpm 10, Postgres 16 (local, or [Neon](https://neon.tech) free tier). Docker isn't required.

```bash
pnpm install
cp .env.example .env            # fill in DATABASE_URL and PAYLOAD_SECRET
pnpm seed                       # categories, a local admin (see scripts/seed.ts), draft legal pages
pnpm dev                        # http://localhost:3000, admin at /admin
```

Optional demo content: put photos in `content/media/demo/` (git-ignored) and run `pnpm seed:demo`; `pnpm seed:demo --reset` removes it. It refuses a hosted database unless `ALLOW_NON_LOCAL_DATABASE=1` is set.

In development the database schema is pushed automatically. In production, run migrations:

```bash
pnpm generate:types             # after changing a collection or global
pnpm migrate:create <name>      # then commit the generated file in src/migrations
pnpm migrate                    # on deploy; Vercel's build command is pnpm vercel-build
```

## Scripts

| Script                | What it does                                                       |
| --------------------- | ------------------------------------------------------------------ |
| `pnpm dev`            | Dev server with hot reload                                         |
| `pnpm build`          | Production build (fails on type errors)                            |
| `pnpm vercel-build`   | Migrate and check (production deploys only), then build            |
| `pnpm migrate:check`  | Fail if any migration is not applied to the database               |
| `pnpm check`          | Lint, typecheck and Prettier; run before every commit              |
| `pnpm test:int`       | Vitest unit and database tests, in a separate `<db>_test` database |
| `pnpm test:e2e`       | Playwright end-to-end tests against a running dev server           |
| `pnpm seed`           | Categories, first admin and draft legal pages (never overwrites)   |
| `pnpm seed:demo`      | Demo posts and photos (`--reset` to remove)                        |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after schema edits               |

## Deployment (Vercel)

> **Status:** live at [melanated.vercel.app](https://melanated.vercel.app), showing demo content until the real articles and photography are ready.

1. Create a Postgres database (for example Neon, with point-in-time restore on) and a Vercel Blob store.
2. Import the GitHub repo into Vercel. Set the env vars from `.env.example`: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, optional `REVALIDATION_SECRET` and `FRAME_ANCESTORS` (sites allowed to embed the public pages; the admin never can).
3. Build command: `pnpm vercel-build`. It runs migrations on **production** deploys only, then builds. Give preview deployments their own database (for example a Neon branch) so a pull request can never change the production schema.
4. Create the first admin and the draft privacy policy and terms by running `pnpm seed` against the production database with `NODE_ENV=production`, the real `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` (16+ characters). The seed refuses a hosted database without all three, and Payload never auto-syncs ("pushes") the schema to a hosted database, so migrations stay in charge.
5. The client reviews the privacy policy and terms, fills in the [bracketed] details and publishes them in the admin.
6. Point the domain at Vercel. Security headers are in `src/lib/securityHeaders.ts`; the scheduled-publish cron is in `vercel.json`.
7. Follow [`docs/runbooks/operations.md`](docs/runbooks/operations.md): uptime monitors (`/api/health` often, `/api/health/database` rarely), error logs, backups and a restore drill.

## Definition of done (production checklist)

- [x] Mobile-first responsive layout, no horizontal scroll at 375px
- [x] 44px tap targets everywhere (cards are one link covering the whole card)
- [x] Self-hosted fonts via `next/font`, `font-display: swap`
- [x] Responsive images (`next/image`, WebP, per-slot sizes, fixed aspect ratios to avoid layout shift)
- [x] Skip link, landmarks, focus-visible styles, required alt text, reduced motion, AA contrast
- [x] Static generation + tag-based revalidation on publish
- [x] Metadata, canonical, OG/Twitter, JSON-LD, sitemap, robots, RSS
- [x] Role-based access, draft → publish workflow, scheduled publishing, versions
- [x] ESLint + Prettier + TypeScript strict, GitHub Actions CI (lint, typecheck, unit and database tests, migrations on an empty database with a drift check, build, e2e)
- [x] Automatic redirects for changed URLs; advertising disclosure labels
- [x] Security headers including a Content Security Policy; login lockout after 5 failed attempts
- [x] Health checks (`/api/health` for uptime, `/api/health/database` checked rarely so a free Neon database can sleep) and structured server error logs
- [ ] Lighthouse ≥ 90 mobile on home, category and post (run after first deploy)
- [ ] Uptime monitors on `/api/health` and `/api/health/database`, error alerts (Sentry if wanted) and analytics (Plausible), once the domain is live
- [ ] Privacy policy and terms reviewed (ideally by a solicitor), [bracketed] details filled in and published. They already cover the `mo_voter` heart cookie and the hashed network data used to rate-limit hearts
- [ ] Final logo as an SVG (the brand name, Melanated Online, is confirmed; the logo is currently a text wordmark)
- [ ] Real photography replacing the placeholder images
- [ ] Production database backups confirmed and one restore drill done (runbook section 3)
- [ ] Once every subdomain of the client's domain serves HTTPS, add `includeSubDomains` (and only then consider `preload`) to HSTS in `src/lib/securityHeaders.ts`

## Open questions for the client

- Final sections: the brief says Business, the mockup says Entrepreneurship and Lifestyle.
- Should the contributing writer publish directly? (Site Settings → Editorial → "Authors can publish without review")
- The Community page will become the newsletter signup: which newsletter provider? Its form address must then be allowed in the CSP's `form-action`.
- Domain.
