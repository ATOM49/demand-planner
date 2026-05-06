import type { DashboardAggregateSeries, DashboardData, SkuSummary } from "@demand-planner/contracts";

import { filterToInferenceDate, filterToLatestInference, selectLatestInferenceDate } from "./latest-inference";
import type { ActualObservation, ForecastProjection } from "../types";
import type { Alert } from "@demand-planner/contracts";

const HISTORICAL_WEEKS = 13;
const FORECAST_WEEKS = 39;

const severityRank: Record<NonNullable<SkuSummary["severity"]>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sumByDate<T extends { date: string }>(
  rows: T[],
  getValue: (row: T) => number,
): Array<{ date: string; value: number }> {
  const totalsByDate = new Map<string, number>();

  for (const row of rows) {
    totalsByDate.set(row.date, (totalsByDate.get(row.date) ?? 0) + getValue(row));
  }

  return Array.from(totalsByDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date, value }));
}

function buildAggregateSeries(
  actuals: ActualObservation[],
  latestForecasts: ForecastProjection[],
): DashboardAggregateSeries {
  const actualsByDate = sumByDate(actuals, (actual) => actual.unitsSold).slice(-HISTORICAL_WEEKS);
  const forecastByDate = new Map<string, { date: string; p05: number; p50: number; p95: number }>();

  for (const forecast of latestForecasts) {
    const current = forecastByDate.get(forecast.date) ?? {
      date: forecast.date,
      p05: 0,
      p50: 0,
      p95: 0,
    };

    current.p05 += forecast.p05;
    current.p50 += forecast.p50;
    current.p95 += forecast.p95;
    forecastByDate.set(forecast.date, current);
  }

  return {
    actuals: actualsByDate,
    forecast: Array.from(forecastByDate.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(0, FORECAST_WEEKS),
  };
}

function buildDashboardSummariesForSnapshot(
  actuals: ActualObservation[],
  latestForecasts: ForecastProjection[],
  alerts: Alert[],
  latestInferenceDate: string | null,
): SkuSummary[] {
  if (!latestInferenceDate) {
    return [];
  }

  const latestActualBySku = new Map<string, ActualObservation>();

  for (const actual of actuals) {
    const current = latestActualBySku.get(actual.sku);
    if (!current || actual.date > current.date) {
      latestActualBySku.set(actual.sku, actual);
    }
  }

  const alertBySku = new Map(alerts.map((alert) => [alert.sku, alert]));
  const skus = new Set<string>(latestForecasts.map((forecast) => forecast.sku));

  return Array.from(skus)
    .map((sku) => {
      const latestActual = latestActualBySku.get(sku) ?? null;
      const alert = alertBySku.get(sku) ?? null;
      return {
        sku,
        latestInferenceDate,
        latestActualDate: latestActual?.date ?? null,
        latestActualUnits: latestActual?.unitsSold ?? null,
        severity: alert?.severity ?? null,
        reasons: alert?.reasons ?? [],
      } satisfies SkuSummary;
    })
    .sort((left, right) => {
      const leftRank = left.severity ? severityRank[left.severity] : 3;
      const rightRank = right.severity ? severityRank[right.severity] : 3;
      return leftRank - rightRank || left.sku.localeCompare(right.sku);
    });
}

export function buildDashboardData(
  actuals: ActualObservation[],
  forecasts: ForecastProjection[],
  alerts: Alert[],
): DashboardData {
  const latestInferenceDate = selectLatestInferenceDate(forecasts);
  const latestForecasts = filterToInferenceDate(forecasts, latestInferenceDate);

  return {
    latestInferenceDate,
    aggregateSeries: buildAggregateSeries(actuals, latestForecasts),
    alerts,
    skuSummaries: buildDashboardSummariesForSnapshot(actuals, latestForecasts, alerts, latestInferenceDate),
  };
}

export function buildDashboardSummaries(
  actuals: ActualObservation[],
  forecasts: ForecastProjection[],
  alerts: Alert[],
): SkuSummary[] {
  const latestInferenceDate = selectLatestInferenceDate(forecasts);
  const latestForecasts = filterToLatestInference(forecasts);

  return buildDashboardSummariesForSnapshot(actuals, latestForecasts, alerts, latestInferenceDate);
}
