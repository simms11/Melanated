# Contributing

- Branch from `main`; open a PR. CI runs lint, typecheck, prettier, build and Playwright.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `chore:`, `docs:`.
- After changing a collection or global: `pnpm generate:types` and `pnpm migrate:create`, and commit the migration.
- Run `pnpm check` before pushing.
- Architecture decisions go in `docs/adr/` as a new numbered file.
