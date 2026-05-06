import fs from "node:fs";
import path from "node:path";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { ulid } from "ulid";

import { getConfig } from "@demand-planner/config";
import type { Alert } from "@demand-planner/contracts";
import {
  buildDashboardData,
  buildSkuSeriesResponse,
  evaluateAlerts,
  type ActualObservation,
  type ForecastProjection,
} from "@demand-planner/domain";

import { getDb } from "./client";
import { actualsTable, alertSnapshotsTable, forecastsTable, importRunsTable } from "./schema";

export function createImportRun(kind: "actuals" | "forecasts", sourceFileName: string, sourcePath: string) {
  const db = getDb();
  const importRun = {
    id: ulid(),
    kind,
    sourceFileName,
    sourcePath,
    status: "completed",
    createdAt: new Date().toISOString(),
  };
  db.insert(importRunsTable).values(importRun).run();
  return importRun;
}

export function upsertActualRows(importRunId: string, rows: ActualObservation[]): void {
  const db = getDb();
  for (const row of rows) {
    db.insert(actualsTable)
      .values({
        sku: row.sku,
        date: row.date,
        unitsSold: row.unitsSold,
        avgUnitPrice: row.avgUnitPrice,
        custInStock: row.custInStock,
        importRunId,
      })
      .onConflictDoUpdate({
        target: [actualsTable.sku, actualsTable.date],
        set: {
          unitsSold: row.unitsSold,
          avgUnitPrice: row.avgUnitPrice,
          custInStock: row.custInStock,
          importRunId,
        },
      })
      .run();
  }
}

export function upsertForecastRows(importRunId: string, rows: Array<ForecastProjection & { mean: number; modelId: string; runId: string; clientId: string }>): void {
  const db = getDb();
  for (const row of rows) {
    db.insert(forecastsTable)
      .values({
        sku: row.sku,
        date: row.date,
        inferenceDate: row.inferenceDate,
        p05: row.p05,
        p50: row.p50,
        p95: row.p95,
        mean: row.mean,
        projectedPrice: row.projectedPrice,
        projectedInStock: row.projectedInStock,
        modelId: row.modelId,
        runId: row.runId,
        clientId: row.clientId,
        importRunId,
      })
      .onConflictDoUpdate({
        target: [forecastsTable.sku, forecastsTable.date, forecastsTable.inferenceDate],
        set: {
          p05: row.p05,
          p50: row.p50,
          p95: row.p95,
          mean: row.mean,
          projectedPrice: row.projectedPrice,
          projectedInStock: row.projectedInStock,
          modelId: row.modelId,
          runId: row.runId,
          clientId: row.clientId,
          importRunId,
        },
      })
      .run();
  }
}

export function listActuals(): ActualObservation[] {
  const db = getDb();
  return db
    .select({
      sku: actualsTable.sku,
      date: actualsTable.date,
      unitsSold: actualsTable.unitsSold,
      avgUnitPrice: actualsTable.avgUnitPrice,
      custInStock: actualsTable.custInStock,
    })
    .from(actualsTable)
    .orderBy(asc(actualsTable.sku), asc(actualsTable.date))
    .all();
}

export function listForecasts(): Array<ForecastProjection & { mean: number; modelId: string; runId: string; clientId: string }> {
  const db = getDb();
  return db
    .select({
      sku: forecastsTable.sku,
      date: forecastsTable.date,
      inferenceDate: forecastsTable.inferenceDate,
      p05: forecastsTable.p05,
      p50: forecastsTable.p50,
      p95: forecastsTable.p95,
      mean: forecastsTable.mean,
      projectedPrice: forecastsTable.projectedPrice,
      projectedInStock: forecastsTable.projectedInStock,
      modelId: forecastsTable.modelId,
      runId: forecastsTable.runId,
      clientId: forecastsTable.clientId,
    })
    .from(forecastsTable)
    .orderBy(asc(forecastsTable.sku), asc(forecastsTable.inferenceDate), asc(forecastsTable.date))
    .all();
}

export function replaceAlertSnapshots(alerts: Alert[]): void {
  const db = getDb();
  db.delete(alertSnapshotsTable).run();
  if (alerts.length === 0) {
    return;
  }
  db.insert(alertSnapshotsTable)
    .values(
      alerts.map((alert) => ({
        sku: alert.sku,
        latestInferenceDate: alert.latestInferenceDate,
        severity: alert.severity,
        reasonsJson: JSON.stringify(alert.reasons),
        metricsJson: JSON.stringify(alert.metrics),
        createdAt: new Date().toISOString(),
      })),
    )
    .run();
}

export function listAlerts(): Alert[] {
  const db = getDb();
  return db
    .select()
    .from(alertSnapshotsTable)
    .orderBy(desc(alertSnapshotsTable.latestInferenceDate), asc(alertSnapshotsTable.sku))
    .all()
    .map((row) => ({
      sku: row.sku,
      latestInferenceDate: row.latestInferenceDate,
      severity: row.severity as Alert["severity"],
      reasons: JSON.parse(row.reasonsJson) as Alert["reasons"],
      metrics: JSON.parse(row.metricsJson) as Alert["metrics"],
    }));
}

export function recomputeAlerts(): Alert[] {
  const alerts = evaluateAlerts(listActuals(), listForecasts(), {
    actualLookbackDays: getConfig().ALERT_ACTUAL_LOOKBACK_DAYS,
    forecastJumpThreshold: getConfig().ALERT_FORECAST_JUMP_THRESHOLD,
    forecastDropThreshold: getConfig().ALERT_FORECAST_DROP_THRESHOLD,
    uncertaintyRatioThreshold: getConfig().ALERT_UNCERTAINTY_RATIO_THRESHOLD,
    priceChangeThreshold: getConfig().ALERT_PRICE_CHANGE_THRESHOLD,
    inStockChangeThreshold: getConfig().ALERT_IN_STOCK_CHANGE_THRESHOLD,
  });
  replaceAlertSnapshots(alerts);
  return alerts;
}

export function getDashboardData() {
  const alerts = listAlerts();
  const actuals = listActuals();
  const forecasts = listForecasts();

  return buildDashboardData(actuals, forecasts, alerts);
}

export function getSkuSeriesData(sku: string) {
  return buildSkuSeriesResponse(sku, listActuals(), listForecasts(), listAlerts());
}

export function countStoredActuals(): number {
  const db = getDb();
  const result = db.select({ count: sql<number>`count(*)` }).from(actualsTable).get();
  return result?.count ?? 0;
}

export function resolveDefaultFixturePath(fileName: string): string {
  let currentDirectory = process.cwd();

  while (true) {
    const fixturePath = path.resolve(currentDirectory, "test_csvs", fileName);
    if (fs.existsSync(fixturePath)) {
      return fixturePath;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      break;
    }

    currentDirectory = parentDirectory;
  }

  return path.resolve(process.cwd(), "test_csvs", fileName);
}
