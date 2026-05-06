# Demand Planner MVP

Local-first demand planning dashboard built as a pnpm monorepo with one Next.js app in `apps/web`. It imports actuals and forecast snapshots from CSV, stores normalized data in SQLite, computes alert states per SKU, and renders a dashboard plus SKU detail pages.

## What it does

- Imports actuals and forecast runs from local CSV files.
- Resolves the latest inference date per SKU instead of one global snapshot.
- Computes alerts from forecast jumps or drops, uncertainty bands, projected price changes, and projected in-stock changes.
- Serves a dashboard, SKU detail page, and thin API routes from the same Next.js app.

### Dashboard
<img width="1367" height="822" alt="image" src="https://github.com/user-attachments/assets/441dca0e-727e-4bcd-af1e-f07f383e9b28" />

### SKU Detail
<img width="1512" height="829" alt="image" src="https://github.com/user-attachments/assets/b3ec005a-94c8-4f97-b9fc-d770937528d8" />

## Stack

- pnpm workspace + Turborepo
- Next.js App Router + React
- TypeScript + Zod
- SQLite + Drizzle
- Vitest + Playwright

## Quickstart

### Requirements

- Node LTS
- pnpm 9.x

### Install

```bash
pnpm install
```

### Optional env setup

The app runs with sensible local defaults. If you want explicit local env files, use these values.

Root env:

```dotenv
NODE_ENV=development
LOG_LEVEL=debug
DATA_DIR=./data
DATABASE_URL=file:./data/demand-planner.sqlite
ALERT_ACTUAL_LOOKBACK_DAYS=28
ALERT_FORECAST_JUMP_THRESHOLD=0.25
ALERT_FORECAST_DROP_THRESHOLD=0.25
ALERT_UNCERTAINTY_RATIO_THRESHOLD=0.40
ALERT_PRICE_CHANGE_THRESHOLD=0.05
ALERT_IN_STOCK_CHANGE_THRESHOLD=0.15
IMPORT_MAX_FILE_MB=20
```

Web env:

```dotenv
NEXT_PUBLIC_DEFAULT_HISTORY_DAYS=180
NEXT_PUBLIC_ENABLE_IMPORTS=true
```

### Start the app

```bash
pnpm dev
```

Open `http://localhost:3000`.

On first boot, the app migrates the local SQLite database and seeds it from the root `test_csvs` happy-path fixtures if the database is empty.

## Seed data

The initial local dataset is sourced from the repository root `test_csvs` directory:

- `test_csvs/aggregated_data_valid.csv`
- `test_csvs/forecast_data_valid.csv`

These files are the source of truth for the default seed data used by the app and by `pnpm db:seed`.

### How seeding works

- On app startup, the server bootstraps the local SQLite database by running migrations first.
- If there are no stored actuals yet, it seeds from the two happy-path files in `test_csvs`.
- The seed process parses the CSVs, creates import-run records, upserts normalized actual and forecast rows, and then recomputes alert snapshots.
- Running `pnpm db:seed` forces the same seed flow again even when data already exists.

### How to add more data

There are two supported ways to extend the dataset:

1. Add rows to `test_csvs/aggregated_data_valid.csv` or `test_csvs/forecast_data_valid.csv`.
2. Add new CSV files under `test_csvs` and import them through the API routes.

If you update the default seed files and want to reload them locally, run:

```bash
pnpm db:reset
```

This clears the monorepo-root local SQLite files under `./data`, reruns migrations, and reseeds from the root `test_csvs` fixtures.

## Import workflow

The app stages imports under `data/imports`, validates them through shared contracts, persists normalized rows, and recomputes alerts.

Happy-path fixtures live in the root `test_csvs` directory and are also used as the default seed inputs:

- `aggregated_data_valid.csv`
- `forecast_data_valid.csv`

Failure-case fixtures are also included and covered by tests:

- `aggregated_data_failure_cases.csv`
- `forecast_data_failure_cases.csv`

To import additional files, place them under `test_csvs` and send their relative path in the request body.

Example requests:

```bash
curl -X POST http://localhost:3000/api/imports/actuals \
  -H "Content-Type: application/json" \
  -d '{"sourcePath":"test_csvs/aggregated_data_valid.csv"}'

curl -X POST http://localhost:3000/api/imports/forecasts \
  -H "Content-Type: application/json" \
  -d '{"sourcePath":"test_csvs/forecast_data_valid.csv"}'
```

Useful routes:

- `GET /api/health`
- `GET /api/skus`
- `GET /api/skus/[sku]`
- `GET /api/alerts`
- `POST /api/imports/actuals`
- `POST /api/imports/forecasts`
- `POST /api/recompute-alerts`

## Schema design

The SQLite schema is intentionally small and normalized around import provenance, time-series facts, and derived alert state.

- `import_runs` is the audit table for every CSV load, including the file name, source path, status, and creation time.
- `actuals` stores observed daily SKU metrics. Its natural key is `(sku, date)`, which keeps one canonical actual record per SKU-day.
- `forecasts` stores forecast snapshots by SKU, target date, and inference date. Its natural key is `(sku, date, inference_date)`, which allows multiple forecast runs over time for the same future day.
- `alert_snapshots` stores the latest derived alert outcome per SKU and inference date, including serialized reasons and computed metrics.

This split keeps raw imported facts separate from computed outputs. Actuals and forecasts remain append-friendly and traceable to an `import_run`, while alert snapshots can be fully recomputed whenever new forecast data arrives.

## Common commands

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:clear
pnpm db:seed
pnpm db:reset
pnpm check
```

## Repo layout

```txt
apps/web               Next.js UI and API routes
apps/web/components/ui App-local shadcn primitives and composites
packages/contracts     Shared Zod contracts and DTOs
packages/domain        Alert logic and series assembly
packages/config        Typed env parsing
packages/db            SQLite, schema, repositories, seed
packages/storage       Local import staging
packages/providers     CSV parsing and normalization
packages/observability Logging and error helpers
```

## Validation status

The scaffold is set up to pass the main local checks:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

CSV fixture coverage is implemented in provider tests, including both valid and failure-case files.

## Notes

- `item_id` is treated as the SKU identifier.
- Previous-year actuals are optional and render only when aligned history exists.
- Dashboard pages are intentionally dynamic because they depend on the local SQLite database.
- For production, keep `apps/web` as the only app and swap the local database backing service if needed.
