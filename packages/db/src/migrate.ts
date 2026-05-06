import { getSqlite } from "./client";
import { pathToFileURL } from "node:url";

export function migrateDatabase(): void {
  const sqlite = getSqlite();

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS import_runs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      source_file_name TEXT NOT NULL,
      source_path TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS actuals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      date TEXT NOT NULL,
      units_sold REAL NOT NULL,
      avg_unit_price REAL NOT NULL,
      cust_in_stock REAL NOT NULL,
      import_run_id TEXT NOT NULL REFERENCES import_runs(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS actuals_natural_key ON actuals (sku, date);

    CREATE TABLE IF NOT EXISTS forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      date TEXT NOT NULL,
      inference_date TEXT NOT NULL,
      p05 REAL NOT NULL,
      p50 REAL NOT NULL,
      p95 REAL NOT NULL,
      mean REAL NOT NULL,
      projected_price REAL,
      projected_in_stock REAL,
      model_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      import_run_id TEXT NOT NULL REFERENCES import_runs(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS forecast_natural_key ON forecasts (sku, date, inference_date);

    CREATE TABLE IF NOT EXISTS alert_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      latest_inference_date TEXT NOT NULL,
      severity TEXT NOT NULL,
      reasons_json TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS alert_natural_key ON alert_snapshots (sku, latest_inference_date);
  `);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrateDatabase();
}
