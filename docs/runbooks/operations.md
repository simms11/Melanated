# Operations runbook

How to know the site is up, find out what broke, and get content back if the database is lost.
Status: the site is not deployed yet. Set these up on the first production deploy.

## 1. Uptime monitoring

There are two checks, on purpose:

| Check                                                                                                                          | What it proves                             | How often              |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ---------------------- |
| `GET /api/health` returns `200 {"status":"ok"}`                                                                                | The site is up. Doesn't touch the database | Every 1 to 5 minutes   |
| `GET /api/health/database` returns `200 {"status":"ok","database":"ok"}`, or `503` if the database doesn't answer in 3 seconds | The database is reachable                  | Every 30 to 60 minutes |

**Why two:** on Neon's free plan the database sleeps after 5 idle minutes and the plan includes
100 compute-hours a month. Pinging the database every few minutes keeps it awake all month
(about 730 hours, roughly 180 compute-hours at the smallest size), so the allowance runs out
mid-month and the admin stops working until the next month. Never point a frequent monitor at
`/api/health/database` on the free plan. Public pages are static, so the frequent check is the
one readers depend on. Check Neon's current limits on the dashboard when choosing the plan.

**Set up (once):** create two free monitors on Better Stack or UptimeRobot.

| Setting    | Uptime monitor                    | Database monitor                       |
| ---------- | --------------------------------- | -------------------------------------- |
| URL        | `https://<domain>/api/health`     | `https://<domain>/api/health/database` |
| Interval   | 1 to 5 minutes                    | 30 to 60 minutes                       |
| Alert when | status is not 200, twice in a row | status is not 200, twice in a row      |
| Notify     | owner and developer, by email     | developer, by email                    |

A public status page is optional; it is useful if the client gets "is the site down?" messages.

## 2. Errors

Every server error is written to the Vercel logs as one JSON line, for example:

```json
{
  "level": "error",
  "event": "request_error",
  "route": "/[category]/[slug]",
  "routeType": "render",
  "method": "GET",
  "digest": "2418...",
  "message": "..."
}
```

Only the route pattern, method and error are logged. Never the full URL, headers or cookies.

**Find errors:** Vercel dashboard, project, Logs, search `request_error`. The `digest` matches the
error ID shown in the browser console on the failed page.

**Alerts:** check whether the chosen Vercel plan includes log alerts. If not, and the client wants
error emails, add Sentry (free tier): install `@sentry/nextjs` and report from `onRequestError` in
`src/instrumentation.ts`, which is the one place every server error already passes through.

## 3. Backups and restore

### What needs backing up

| Data                                       | Where       | Covered by                                                                                |
| ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| Posts, categories, users, settings, hearts | Postgres    | Provider point-in-time restore (set up below)                                             |
| Images                                     | Vercel Blob | Durable storage, but not versioned: a deleted image is gone. See the monthly export below |
| Code                                       | GitHub      | Git history                                                                               |

### Set up (once, before real content is written)

1. In the Postgres provider (for example Neon), confirm point-in-time restore is on and note how
   many days it covers on the chosen plan. Write it here: **retention: ___ days**.
2. Keep `DATABASE_URL`, `PAYLOAD_SECRET` and `CRON_SECRET` in a password manager the client
   controls. `PAYLOAD_SECRET` signs login sessions, so a restored site needs the same value to
   behave as before.
3. Monthly: export a copy you own, independent of the provider:
   `pg_dump --format=custom "$DATABASE_URL" > melanated-$(date +%F).dump`
   and download the Blob images (Vercel dashboard, Storage, or the Blob API). Store both off Vercel.

### Restore drill (every 3 months, and once before launch)

A backup you haven't restored is a hope, not a backup. Time each drill.

1. Restore to a **new** database, never over production: in Neon, create a branch from a point in
   time an hour ago (or `pg_restore --dbname=<scratch db>` from the monthly dump).
2. Run the app against it locally: set `DATABASE_URL` to the restored database, then `pnpm dev`.
3. Check: the home page lists the latest posts, an article opens with its images, `/admin` signs in.
4. Compare counts with production (posts, users, media) and note any gap.
5. Record the date, how long it took and anything that didn't work in the log below. Delete the
   scratch database.

| Date | Restored from | Time taken | Result / issues |
| ---- | ------------- | ---------- | --------------- |
|      |               |            |                 |

## 4. Locked out of the admin

There's no email service yet, so "Forgot password" sends nothing.

- After 5 wrong passwords an account locks for 10 minutes; wait, then try again.
- Any admin can set a new password for another user under **Users**.
- If the only admin is locked out: run a one-off script against the production database (with
  `NODE_ENV=production`) that uses Payload's Local API to set a new password for that user, and
  hand the new password over in person or through a password manager. Adding an email adapter
  (for example Resend) would make this self-service.

## 5. If the site is down

1. Check `/api/health` (is the site up?) and `/api/health/database`. A 503 from the database check means the database: check the provider's status page, dashboard and remaining compute allowance.
2. Check the Vercel deployment status. If the latest deploy broke it, **Instant Rollback** to the
   previous deployment in the Vercel dashboard; fix forward afterwards.
3. Search the logs for `request_error` around the start time.
4. Tell the client what is affected and when you'll update them next, even if the cause is unknown.
5. Afterwards, write a short note: what happened, how it was found, what fixed it, and what would
   catch it sooner next time.
