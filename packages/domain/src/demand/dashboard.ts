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

const SHORT_TERM_WEEKS = 4;
const REVENUE_WEEKS = 13;

function sum(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundMetric(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function getFirstProjectedDriverValue(
  forecasts: ForecastProjection[],
  key: "projectedPrice" | "projectedInStock",
): number | null {
  for (const forecast of forecasts) {
    const value = forecast[key];
    if (value !== null) {
      return value;
    }
  }

  return null;
}

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

function buildDashboardMetrics(
  aggregateSeries: DashboardAggregateSeries,
  latestForecasts: ForecastProjection[],
): DashboardData["metrics"] {
  const trailing4WeekActualUnits = roundMetric(
    sum(aggregateSeries.actuals.slice(-SHORT_TERM_WEEKS).map((point) => point.value)),
  );
  const next4WeekForecastUnits = roundMetric(
    sum(aggregateSeries.forecast.slice(0, SHORT_TERM_WEEKS).map((point) => point.p50)),
  );
  const next4WeekForecastGapUnits =
    trailing4WeekActualUnits === null || next4WeekForecastUnits === null
      ? null
      : roundMetric(next4WeekForecastUnits - trailing4WeekActualUnits);
  const next4WeekForecastGapPct =
    trailing4WeekActualUnits === null || trailing4WeekActualUnits === 0 || next4WeekForecastUnits === null
      ? null
      : roundMetric((next4WeekForecastUnits - trailing4WeekActualUnits) / trailing4WeekActualUnits);

  const next13WeekForecastUnits = roundMetric(
    sum(aggregateSeries.forecast.slice(0, REVENUE_WEEKS).map((point) => point.p50)),
  );
  const next13WeekUncertaintyBuffer = roundMetric(
    sum(aggregateSeries.forecast.slice(0, REVENUE_WEEKS).map((point) => point.p95 - point.p50)),
  );

  const revenueWindowForecasts = latestForecasts
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .reduce<Map<string, ForecastProjection[]>>((groups, forecast) => {
      const bucket = groups.get(forecast.sku) ?? [];
      bucket.push(forecast);
      groups.set(forecast.sku, bucket);
      return groups;
    }, new Map());

  let next13WeekProjectedRevenue: number | null = 0;

  for (const forecastsBySku of revenueWindowForecasts.values()) {
    for (const forecast of forecastsBySku.slice(0, REVENUE_WEEKS)) {
      if (forecast.projectedPrice === null) {
        next13WeekProjectedRevenue = null;
        break;
      }

      next13WeekProjectedRevenue += forecast.p50 * forecast.projectedPrice;
    }

    if (next13WeekProjectedRevenue === null) {
      break;
    }
  }

  const metadataSource = latestForecasts[0];

  return {
    trackedSkuCount: new Set(latestForecasts.map((forecast) => forecast.sku)).size,
    trailing4WeekActualUnits,
    next4WeekForecastUnits,
    next4WeekForecastGapUnits,
    next4WeekForecastGapPct,
    next13WeekForecastUnits,
    next13WeekProjectedRevenue: roundMetric(next13WeekProjectedRevenue),
    next13WeekUncertaintyBuffer,
    latestModelId: metadataSource?.modelId ?? null,
    latestRunId: metadataSource?.runId ?? null,
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
  const forecastsBySku = latestForecasts.reduce<Map<string, ForecastProjection[]>>((groups, forecast) => {
    const bucket = groups.get(forecast.sku) ?? [];
    bucket.push(forecast);
    groups.set(forecast.sku, bucket);
    return groups;
  }, new Map());
  const actualsBySku = actuals.reduce<Map<string, ActualObservation[]>>((groups, actual) => {
    const bucket = groups.get(actual.sku) ?? [];
    bucket.push(actual);
    groups.set(actual.sku, bucket);
    return groups;
  }, new Map());

  return Array.from(skus)
    .map((sku) => {
      const latestActual = latestActualBySku.get(sku) ?? null;
      const alert = alertBySku.get(sku) ?? null;
      const orderedSkuForecasts = [...(forecastsBySku.get(sku) ?? [])].sort((left, right) => left.date.localeCompare(right.date));
      const firstForecast = orderedSkuForecasts[0] ?? null;
      const recentActualAverage = average(
        [...(actualsBySku.get(sku) ?? [])]
          .sort((left, right) => left.date.localeCompare(right.date))
          .slice(-SHORT_TERM_WEEKS)
          .map((actual) => actual.unitsSold),
      );
      const projectedRevenue13Weeks = orderedSkuForecasts.slice(0, REVENUE_WEEKS).every((forecast) => forecast.projectedPrice !== null)
        ? roundMetric(
            orderedSkuForecasts
              .slice(0, REVENUE_WEEKS)
              .reduce((total, forecast) => total + forecast.p50 * (forecast.projectedPrice ?? 0), 0),
          )
        : null;
      const firstForecastGapPct =
        recentActualAverage === null || recentActualAverage === 0 || !firstForecast
          ? null
          : roundMetric((firstForecast.p50 - recentActualAverage) / recentActualAverage);
      const firstProjectedPrice = getFirstProjectedDriverValue(orderedSkuForecasts, "projectedPrice");
      const firstProjectedInStock = getFirstProjectedDriverValue(orderedSkuForecasts, "projectedInStock");
      const projectedPriceDeltaPct =
        latestActual && firstProjectedPrice !== null && latestActual.avgUnitPrice !== 0
          ? roundMetric((firstProjectedPrice - latestActual.avgUnitPrice) / latestActual.avgUnitPrice)
          : null;
      const projectedInStockDeltaPct =
        latestActual && firstProjectedInStock !== null && latestActual.custInStock !== 0
          ? roundMetric((firstProjectedInStock - latestActual.custInStock) / latestActual.custInStock)
          : null;

      return {
        sku,
        latestInferenceDate,
        latestActualDate: latestActual?.date ?? null,
        latestActualUnits: latestActual?.unitsSold ?? null,
        latestForecastUnits: roundMetric(firstForecast?.p50 ?? null),
        firstForecastGapPct,
        projectedRevenue13Weeks,
        projectedPriceDeltaPct,
        projectedInStockDeltaPct,
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
  const aggregateSeries = buildAggregateSeries(actuals, latestForecasts);

  return {
    latestInferenceDate,
    aggregateSeries,
    metrics: buildDashboardMetrics(aggregateSeries, latestForecasts),
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
