# Melanated Online

A luxury lifestyle and empowerment editorial platform for the modern Black woman. Four sections (Fashion, Beauty, Wellness, Business) plus a Community page, published weekly by a small editorial team.

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
│  src/lib/queries.ts ──► Payload Local API ──► Postgres                           │
│                                        └──► Media: local disk (dev) / Vercel Blob│
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Content pipeline:** every page is prerendered. Publishing in the CMS fires `revalidateTag`/`revalidatePath`, so the site updates within seconds with no redeploy.
- **Scheduled publishing:** a Vercel Cron calls `/api/payload-jobs/run` daily at 06:00 UTC (Hobby plan limit), protected by `CRON_SECRET`. Scheduled posts go live at that run; **Publish** is still immediate. Locally, open `/api/payload-jobs/run` as an admin.
- **Redirects:** when a published post's slug or category changes, or a category is renamed, a redirect from the old URL is created automatically (Payload redirects plugin). A post requested under the wrong category 308s to its canonical URL.
- **Advertising disclosure:** posts can be marked Ad (paid), Ad (affiliate) or Gifted; the label shows above the article title and on cards (ASA/CMA guidance).
- **Roles:** `admin` (site owner) and `author` (contributing writer). Authors edit only their own posts; whether they can publish without review is a Site Settings toggle.
- **Images:** uploads are converted to WebP and resized into `thumbnail / card / feature / hero / og` on upload; the front end picks the right one per slot via `next/image` with `sizes`.
- **SEO:** per-page metadata, canonical URLs, Open Graph/Twitter cards, `Article` JSON-LD, `sitemap.xml`, `robots.txt`, RSS at `/feed.xml`.
- **Colour scheme:** the client's palette: a caramel page base, espresso header, hero, category headers and footer, and an ivory reading surface for article text. Components use semantic tokens, so text colours adapt to each surface; `/styleguide` lists the measured contrast rules.
- **Accessibility:** targets WCAG 2.2 AA with a skip link, landmarks, focus states, required alt text and reduced-motion support.

See [`docs/adr`](docs/adr) for the reasoning behind the main decisions.

## Project layout

```
src/
  access/               access-control helpers (admins, authors, published-only)
  collections/          Posts, Categories, Media, Users
  migrations/           Payload migrations (generated; commit with every schema change)
  globals/              SiteSettings (brand, contact, social, newsletter, editorial)
  fields/               reusable field configs (slug)
  hooks/                cache revalidation and automatic redirect hooks
  lib/                  fonts, queries (all data reads), disclosure labels, utils
  components/           Header, Footer, MobileNav, PostCard, CategoryTile, …
  app/
    (frontend)/         public site: home, [category], [category]/[slug], community, privacy, terms,
                        styleguide, sitemap, feed.xml
    (payload)/          Payload admin + API routes (generated, don't edit)
    api/                preview + manual revalidation endpoints
    robots.ts
scripts/seed.ts         creates the categories and first admin user
scripts/seed-demo.ts    placeholder posts + photos for design review (never production)
tests/int               Vitest unit + database tests (publish gate, redirects)
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

Optional demo content: put photos in `content/media/demo/` (git-ignored) and run `pnpm seed:demo`; `pnpm seed:demo --reset` removes it. The rights to the demo images are unconfirmed, so never seed them into production.

In development the database schema is pushed automatically. In production, run migrations:

```bash
pnpm generate:types             # after changing a collection or global
pnpm migrate:create <name>      # then commit the generated file in src/migrations
pnpm migrate                    # on deploy; Vercel's build command is pnpm vercel-build
```

## Scripts

| Script                | What it does                                          |
| --------------------- | ----------------------------------------------------- |
| `pnpm dev`            | Dev server with hot reload                            |
| `pnpm build`          | Production build (fails on type errors)               |
| `pnpm vercel-build`   | Migrate (production deploys only), then build         |
| `pnpm check`          | Lint, typecheck and Prettier; run before every commit |
| `pnpm test:int`       | Vitest unit + database tests (needs `DATABASE_URL`)   |
| `pnpm test:e2e`       | Playwright smoke tests (needs a running DB)           |
| `pnpm seed`           | Seed categories and first admin                       |
| `pnpm seed:demo`      | Demo posts and photos for design review (`--reset`)   |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after schema edits  |

## Deployment (Vercel)

> **Status:** not deployed. No Vercel project or production database exists yet; these are the steps for when they do.

1. Create a Postgres database (for example Neon) and a Vercel Blob store.
2. Import the repo into Vercel. Set env vars from `.env.example` (`DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, optional `REVALIDATION_SECRET`).
3. Build command: `pnpm vercel-build`. It runs migrations on **production** deploys only, then builds. Give preview deployments their own database (for example a Neon branch) in the Preview environment's `DATABASE_URL`, so a pull request can never change the production schema.
4. Create the first admin: either run `pnpm seed` against the production database with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` set (the default password is public in this repo), or register at `/admin`.
5. Point the domain at Vercel; security headers and the scheduled-publish cron are in `vercel.json`.
6. Turn on point-in-time restore or backups for the production database before real content is written.

## Definition of done (production checklist)

- [x] Mobile-first responsive layout, no horizontal scroll at 375px
- [ ] 44px tap targets (footer links, breadcrumbs, logo and arrow links are smaller)
- [x] Self-hosted fonts via `next/font`, `font-display: swap`
- [x] Responsive images (`next/image`, WebP, per-slot sizes, fixed aspect ratios to avoid layout shift)
- [x] Skip link, landmarks, focus-visible styles, required alt text, reduced motion
- [x] Static generation + tag-based revalidation on publish
- [x] Metadata, canonical, OG/Twitter, JSON-LD, sitemap, robots, RSS
- [x] Role-based access, draft → publish workflow, scheduled publishing, versions
- [x] ESLint + Prettier + TypeScript strict, GitHub Actions CI (lint, typecheck, unit + database tests, migrations on an empty database with a drift check, build, e2e)
- [x] Automatic redirects for changed URLs; advertising disclosure labels
- [x] Security headers; accounts lock for 10 minutes after 5 failed logins
- [ ] Lighthouse ≥ 90 mobile on home, category and post (run after first deploy)
- [ ] Error monitoring (Sentry) and analytics (Plausible), once the domain is live
- [ ] Privacy policy and terms: `/privacy` and `/terms` are placeholders awaiting the client's reviewed text
- [ ] Final logo SVG and brand name confirmed (currently a text wordmark)
- [ ] Real photography replacing placeholder imagery (demo photos' rights unconfirmed)
- [ ] Production database backups confirmed

## Open questions for the client

- Brand name: "Melanated Online" (brief) vs "Melanated Magazine" (logo)?
- Final sections: the brief says Business, the mockup says Entrepreneurship and Lifestyle.
- Should the contributing writer publish directly? (Site Settings → Editorial → "Authors can publish without review")
- Newsletter provider, WhatsApp group link, Instagram handle, domain.
- Is Community a section with its own articles, or only the community page? (Currently a page, so the home page shows four category tiles.)
