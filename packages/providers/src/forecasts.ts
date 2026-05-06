import fs from "node:fs/promises";

import { ForecastImportRunSchema, type ForecastImportRun } from "@demand-planner/contracts";

import { isIsoDate, parseCsv, safeJsonParse } from "./csv";
import { CsvValidationError, type CsvRowIssue } from "./errors";

type RawForecastPoint = {
  timestamp?: unknown;
  values?: Record<string, unknown>;
};

type RawDriverSnapshot = {
  timestamp?: unknown;
  avg_unit_price?: unknown;
  cust_instock?: unknown;
  values?: Record<string, unknown>;
};

const requiredPercentiles = ["p05", "p10", "p25", "p50", "p75", "p90", "p95"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildIssue(fileName: string, rowNumber: number, itemId: string | undefined, field: string, reason: string) {
  return {
    fileName,
    rowNumber,
    ...(itemId ? { itemId } : {}),
    field,
    reason,
  } satisfies CsvRowIssue;
}

export function parseForecastRunsCsv(input: string, fileName: string): ForecastImportRun[] {
  const records = parseCsv(input);
  const parsedRuns: ForecastImportRun[] = [];
  const issues: CsvRowIssue[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const itemId = record.item_id?.trim() || undefined;

    if (!itemId) {
      issues.push(buildIssue(fileName, rowNumber, itemId, "item_id", "Missing item_id"));
      return;
    }

    const inferenceDate = record.inference_date?.trim();
    if (!inferenceDate || !isIsoDate(inferenceDate)) {
      issues.push(
        buildIssue(fileName, rowNumber, itemId, "inference_date", "Invalid inference_date"),
      );
      return;
    }

    const metadata = {
      modelId: record.model_id?.trim(),
      runId: record.run_id?.trim(),
      clientId: record.client_id?.trim(),
    };
    if (!metadata.modelId || !metadata.runId || !metadata.clientId) {
      issues.push(buildIssue(fileName, rowNumber, itemId, "metadata", "Missing metadata fields"));
      return;
    }

    const forecastsJson = record.forecasts;
    if (!forecastsJson) {
      issues.push(buildIssue(fileName, rowNumber, itemId, "forecasts", "Missing forecasts JSON"));
      return;
    }

    let rawForecasts: unknown;
    try {
      rawForecasts = safeJsonParse(forecastsJson);
    } catch {
      issues.push(buildIssue(fileName, rowNumber, itemId, "forecasts", "Invalid forecasts JSON"));
      return;
    }

    if (!Array.isArray(rawForecasts) || rawForecasts.length < 40) {
      issues.push(
        buildIssue(fileName, rowNumber, itemId, "forecasts", "Forecast array must contain 40 weeks"),
      );
      return;
    }

    const normalizedForecasts = rawForecasts.map((entry) => entry as RawForecastPoint);
    const forecastTimestamps: string[] = [];

    for (const forecast of normalizedForecasts) {
      if (typeof forecast.timestamp !== "string" || !isIsoDate(forecast.timestamp)) {
        issues.push(buildIssue(fileName, rowNumber, itemId, "forecasts.timestamp", "Invalid forecast timestamp"));
        return;
      }

      if (!isObject(forecast.values)) {
        issues.push(buildIssue(fileName, rowNumber, itemId, "forecasts.values", "Missing forecast values"));
        return;
      }

      const mean = Number(forecast.values.mean);
      const finitePercentiles = requiredPercentiles.filter((percentile) =>
        Number.isFinite(forecast.values[percentile]),
      );

      if (finitePercentiles.length === 0) {
        if (!Number.isFinite(mean)) {
          issues.push(
            buildIssue(fileName, rowNumber, itemId, "forecasts.values", "Missing forecast values"),
          );
          return;
        }

        for (const percentile of requiredPercentiles) {
          forecast.values[percentile] = mean;
        }
      }

      for (const percentile of requiredPercentiles) {
        if (!Number.isFinite(forecast.values[percentile])) {
          issues.push(
            buildIssue(fileName, rowNumber, itemId, percentile, `Missing percentile field ${percentile}`),
          );
          return;
        }
      }

      const p05 = Number(forecast.values.p05);
      const p25 = Number(forecast.values.p25);
      const p50 = Number(forecast.values.p50);
      const p75 = Number(forecast.values.p75);
      const p95 = Number(forecast.values.p95);

      const hasValidEnvelope = p05 <= p50 && p25 <= p50 && p50 <= p75 && p50 <= p95;

      if (!hasValidEnvelope) {
        issues.push(
          buildIssue(fileName, rowNumber, itemId, "forecasts.values", "Invalid percentile ordering"),
        );
        return;
      }

      forecastTimestamps.push(forecast.timestamp);
    }

    const demandDriversJson = record.demand_drivers;
    if (!demandDriversJson) {
      issues.push(buildIssue(fileName, rowNumber, itemId, "demand_drivers", "Missing projected demand_drivers JSON"));
      return;
    }

    let rawDrivers: unknown;
    try {
      rawDrivers = safeJsonParse(demandDriversJson);
    } catch {
      issues.push(
        buildIssue(fileName, rowNumber, itemId, "demand_drivers", "Invalid projected demand_drivers JSON"),
      );
      return;
    }

    if (!Array.isArray(rawDrivers) || rawDrivers.length < 40) {
      issues.push(
        buildIssue(fileName, rowNumber, itemId, "demand_drivers", "Projected demand_drivers must contain 40 weeks"),
      );
      return;
    }

    const normalizedDrivers = rawDrivers.map((entry) => entry as RawDriverSnapshot);
    const alignedDriverTimestamps = new Set(forecastTimestamps);
    const parsedDrivers: ForecastImportRun["demandDrivers"] = [];

    for (const driver of normalizedDrivers) {
      const driverValues = isObject(driver.values) ? driver.values : driver;
      const avgUnitPrice = Number(driverValues.avg_unit_price);
      const customerInStock = Number(driverValues.cust_instock);

      if (
        typeof driver.timestamp !== "string" ||
        !isIsoDate(driver.timestamp) ||
        !Number.isFinite(avgUnitPrice)
      ) {
        issues.push(
          buildIssue(fileName, rowNumber, itemId, "demand_drivers", "Invalid projected demand_drivers JSON"),
        );
        return;
      }

      if (!Number.isFinite(customerInStock) || customerInStock < 0 || customerInStock > 1) {
        issues.push(
          buildIssue(
            fileName,
            rowNumber,
            itemId,
            "demand_drivers.cust_instock",
            "Projected cust_instock must be between 0 and 1",
          ),
        );
        return;
      }

      if (!alignedDriverTimestamps.has(driver.timestamp)) {
        continue;
      }

      parsedDrivers.push({
        timestamp: driver.timestamp,
        avg_unit_price: avgUnitPrice,
        cust_instock: customerInStock,
      });
    }

    if (parsedDrivers.length < 40) {
      issues.push(
        buildIssue(fileName, rowNumber, itemId, "demand_drivers", "Projected demand_drivers must align to 40 forecast weeks"),
      );
      return;
    }

    let autoFeatures: unknown;
    try {
      autoFeatures = record.auto_features ? safeJsonParse(record.auto_features) : {};
    } catch {
      autoFeatures = {};
    }

    parsedRuns.push(
      ForecastImportRunSchema.parse({
        sku: itemId,
        inferenceDate,
        forecasts: normalizedForecasts,
        demandDrivers: parsedDrivers,
        autoFeatures: isObject(autoFeatures) ? autoFeatures : {},
        modelId: metadata.modelId,
        runId: metadata.runId,
        clientId: metadata.clientId,
      }),
    );
  });

  if (issues.length > 0) {
    throw new CsvValidationError(`Failed to parse ${fileName}`, issues);
  }

  return parsedRuns;
}

export async function parseForecastRunsCsvFile(filePath: string): Promise<ForecastImportRun[]> {
  const input = await fs.readFile(filePath, "utf8");
  return parseForecastRunsCsv(input, filePath);
}
