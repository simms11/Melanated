# Task for Claude Code: publish this repo to GitHub and verify CI

Open Claude Code in the project root (`cd melanated-online && claude`) and paste everything below the line as your first message. Read `CLAUDE.md` first — it has the conventions.

---

I want this project on GitHub under my account with CI running. Work through these steps in order, stop and ask me if any step fails, and don't force-push anything.

## 1. Sanity-check the working tree

- Run `git status` and `git log --oneline`. The repo already has a logical commit history (one commit per feature area). Keep it — do not squash or rewrite it.
- If `git status` shows uncommitted changes, show them to me and ask whether to commit them before continuing.
- Confirm `.env` is **not** tracked (`git ls-files | grep -c '^.env$'` should print 0) and that `.env.example` is.

## 2. Verify quality gates locally

Run `pnpm install --frozen-lockfile` then `pnpm check` and `pnpm test:int`. All must pass. If `pnpm check` fails, fix the issue in a new commit following the commit conventions in `CLAUDE.md` — do not amend existing commits.

## 3. Create the GitHub repository

- Check `gh auth status`. If I'm not logged in, tell me to run `gh auth login` and wait.
- Create a **private** repo named `melanated-online` under my account with the description: "Luxury lifestyle and empowerment editorial platform for the modern Black woman — Next.js 16, Payload CMS 3, Postgres, Tailwind 4." Use:
  `gh repo create melanated-online --private --source=. --remote=origin --description "<the description>"`
- Ensure the default branch is `main` (`git branch -M main` if needed).

## 4. Push

`git push -u origin main`. Then confirm with `gh repo view --web` is **not** needed — just print the repo URL.

## 5. Repository settings

Using `gh api` or `gh repo edit`:

- Enable "Automatically delete head branches" after merge.
- Add topics: `nextjs`, `payloadcms`, `typescript`, `tailwindcss`, `postgres`, `editorial`, `portfolio`.
- Add a branch protection rule on `main` requiring the `Lint, typecheck, build` status check to pass and requiring a PR (no direct pushes) — if my plan doesn't allow branch protection on private repos, tell me and skip it.

## 6. Watch CI

- `gh run list --limit 1` then `gh run watch` on the latest run.
- The `quality` job must go green. The `e2e` job needs Playwright browsers and a Postgres service, which the workflow provides; if it fails for an environmental reason (browser download, service timing), show me the failing step's log and propose a fix as a new commit on a branch `ci/fix-e2e`, then open a PR with `gh pr create`. Don't push CI fixes straight to `main`.

## 7. Report back

Give me: the repo URL, the CI run URL and status, and a one-paragraph summary of anything you had to change. Then suggest the next step (my plan: connect the repo to Vercel with a Neon database and open a preview deployment to show the client).

## Commit conventions (also in CLAUDE.md)

Conventional Commits, imperative mood, one logical change per commit, `pnpm check` green before each one. Examples:

```
fix(ci): install Playwright browsers before e2e job
chore(repo): add GitHub topics and branch protection notes
```
