import { createImportRun, recomputeAlerts, upsertActualRows, upsertForecastRows } from "@demand-planner/db";
import { parseAggregatedActualsCsvFile, parseForecastRunsCsvFile } from "@demand-planner/providers";
import { log } from "@demand-planner/observability";
import { stageLocalImport, stageUploadedImport } from "@demand-planner/storage";

import { ensureAppBootstrap } from "./bootstrap";

async function importActualsFromStaged(staged: { fileName: string; stagedPath: string }) {
  const rows = await parseAggregatedActualsCsvFile(staged.stagedPath);
  const importRun = createImportRun("actuals", staged.fileName, staged.stagedPath);
  upsertActualRows(importRun.id, rows);
  const alerts = recomputeAlerts();
  log("info", "Imported actuals", { sourcePath: staged.stagedPath, rows: rows.length });

  return {
    ok: true,
    importRunId: importRun.id,
    sourcePath: staged.stagedPath,
    rowsImported: rows.length,
    alertsRecomputed: alerts.length,
  };
}

function flattenForecastRuns(runs: Awaited<ReturnType<typeof parseForecastRunsCsvFile>>) {
  return runs.flatMap((run) =>
    run.forecasts.map((point, index) => {
      const driver = run.demandDrivers[index] ?? null;
      return {
        sku: run.sku,
        date: point.timestamp,
        inferenceDate: run.inferenceDate,
        p05: point.values.p05,
        p50: point.values.p50,
        p95: point.values.p95,
        mean: point.values.mean,
        projectedPrice: driver?.avg_unit_price ?? null,
        projectedInStock: driver?.cust_instock ?? null,
        modelId: run.modelId,
        runId: run.runId,
        clientId: run.clientId,
      };
    }),
  );
}

async function importForecastsFromStaged(staged: { fileName: string; stagedPath: string }) {
  const runs = await parseForecastRunsCsvFile(staged.stagedPath);
  const importRun = createImportRun("forecasts", staged.fileName, staged.stagedPath);
  const flattenedForecasts = flattenForecastRuns(runs);
  upsertForecastRows(importRun.id, flattenedForecasts);
  const alerts = recomputeAlerts();
  log("info", "Imported forecasts", { sourcePath: staged.stagedPath, rows: flattenedForecasts.length });

  return {
    ok: true,
    importRunId: importRun.id,
    sourcePath: staged.stagedPath,
    forecastPointsImported: flattenedForecasts.length,
    forecastRunsImported: runs.length,
    alertsRecomputed: alerts.length,
  };
}

export async function importActualsFromPath(sourcePath: string) {
  await ensureAppBootstrap();
  const staged = await stageLocalImport(sourcePath, "actuals");
  return importActualsFromStaged(staged);
}

export async function importActualsFromUpload(fileName: string, content: Uint8Array) {
  await ensureAppBootstrap();
  const staged = await stageUploadedImport(fileName, content, "actuals");
  return importActualsFromStaged(staged);
}

export async function importForecastsFromPath(sourcePath: string) {
  await ensureAppBootstrap();
  const staged = await stageLocalImport(sourcePath, "forecasts");
  return importForecastsFromStaged(staged);
}

export async function importForecastsFromUpload(fileName: string, content: Uint8Array) {
  await ensureAppBootstrap();
  const staged = await stageUploadedImport(fileName, content, "forecasts");
  return importForecastsFromStaged(staged);
}

export async function recomputeAlertData() {
  await ensureAppBootstrap();
  const alerts = recomputeAlerts();
  return { ok: true, alertsRecomputed: alerts.length };
}
