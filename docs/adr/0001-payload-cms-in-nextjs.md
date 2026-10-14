# ADR 0001 — Payload CMS embedded in the Next.js app

**Status:** Accepted · 2026-10-14

## Context

The client publishes weekly with one additional writer and must edit content herself without a developer. The site is the project's only purpose and budget is undecided, so recurring cost should be close to zero. The build is also a portfolio piece, so owning the backend matters.

## Options

| Option                       | Pros                                                                                                                                              | Cons                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Payload 3 inside Next.js** | One repo, one deploy; typed Local API (no HTTP hop at build); roles, drafts, versions, scheduled publish built in; data lives in our own Postgres | We run the admin; Payload-specific config to learn                                                          |
| Sanity (hosted)              | Zero ops; excellent editor                                                                                                                        | Content lives on a third party; usage-based pricing beyond free tier; thinner backend story for a portfolio |
| Headless WordPress           | Client familiarity                                                                                                                                | Separate host, PHP maintenance, security surface                                                            |
| MDX in repo                  | Simplest                                                                                                                                          | Client can't publish without git                                                                            |

## Decision

Payload 3 embedded in the Next.js App Router, Postgres on Neon, media on Vercel Blob, hosted on Vercel Hobby. All frontend reads use the Local API via `src/lib/queries.ts`.

## Consequences

- Schema changes require `pnpm migrate:create` before deploy.
- Admin UI is served from the same deployment; `/admin` is disallowed in `robots.txt`.
- Switching the storage or database adapter later is a config change, not a rewrite.
