# Deployment Notes

## Target shape

The MVP is designed to run as a single Next.js app in `apps/web`.

- Deploy `apps/web` to Vercel for the application runtime.
- Keep SQLite only for local development and assignment evaluation.
- For a production deployment, move the database backing service to a managed provider and keep the rest of the app unchanged.

## Local prerequisites

- Node LTS
- pnpm 9.x
- Writable local filesystem for the SQLite database and staged CSV imports

## Local verification

Run the full local validation flow before any deployment handoff:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Runtime expectations

- API routes execute inside `apps/web/app/api/**/route.ts`.
- Import files are staged under `data/imports`.
- The SQLite database path is resolved through `@demand-planner/config`.
- Automatic bootstrapping runs migrations and seeds fixture data when the local database is empty.