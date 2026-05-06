import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const importRunsTable = sqliteTable("import_runs", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  sourceFileName: text("source_file_name").notNull(),
  sourcePath: text("source_path").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const actualsTable = sqliteTable(
  "actuals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sku: text("sku").notNull(),
    date: text("date").notNull(),
    unitsSold: real("units_sold").notNull(),
    avgUnitPrice: real("avg_unit_price").notNull(),
    custInStock: real("cust_in_stock").notNull(),
    importRunId: text("import_run_id").references(() => importRunsTable.id).notNull(),
  },
  (table) => ({
    actualsNaturalKey: uniqueIndex("actuals_natural_key").on(table.sku, table.date),
  }),
);

export const forecastsTable = sqliteTable(
  "forecasts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sku: text("sku").notNull(),
    date: text("date").notNull(),
    inferenceDate: text("inference_date").notNull(),
    p05: real("p05").notNull(),
    p50: real("p50").notNull(),
    p95: real("p95").notNull(),
    mean: real("mean").notNull(),
    projectedPrice: real("projected_price"),
    projectedInStock: real("projected_in_stock"),
    modelId: text("model_id").notNull(),
    runId: text("run_id").notNull(),
    clientId: text("client_id").notNull(),
    importRunId: text("import_run_id").references(() => importRunsTable.id).notNull(),
  },
  (table) => ({
    forecastNaturalKey: uniqueIndex("forecast_natural_key").on(table.sku, table.date, table.inferenceDate),
  }),
);

export const alertSnapshotsTable = sqliteTable(
  "alert_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sku: text("sku").notNull(),
    latestInferenceDate: text("latest_inference_date").notNull(),
    severity: text("severity").notNull(),
    reasonsJson: text("reasons_json").notNull(),
    metricsJson: text("metrics_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    alertNaturalKey: uniqueIndex("alert_natural_key").on(table.sku, table.latestInferenceDate),
  }),
);
