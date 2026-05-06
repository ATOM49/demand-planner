import type { Alert } from "@demand-planner/contracts";

import type { ActualObservation, AlertThresholds, ForecastProjection } from "../types";
import { filterToLatestInference } from "../demand/latest-inference";

function subtractDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function evaluateAlerts(
  actuals: ActualObservation[],
  forecasts: ForecastProjection[],
  thresholds: AlertThresholds,
): Alert[] {
  const latestForecasts = filterToLatestInference(forecasts);
  const forecastGroups = new Map<string, ForecastProjection[]>();

  for (const forecast of latestForecasts) {
    const bucket = forecastGroups.get(forecast.sku) ?? [];
    bucket.push(forecast);
    forecastGroups.set(forecast.sku, bucket);
  }

  const actualGroups = new Map<string, ActualObservation[]>();
  for (const actual of actuals) {
    const bucket = actualGroups.get(actual.sku) ?? [];
    bucket.push(actual);
    actualGroups.set(actual.sku, bucket);
  }

  return Array.from(forecastGroups.entries())
    .map(([sku, skuForecasts]) => {
      const orderedForecasts = [...skuForecasts].sort((left, right) => left.date.localeCompare(right.date));
      const firstForecast = orderedForecasts[0];
      if (!firstForecast) {
        return null;
      }

      const skuActuals = [...(actualGroups.get(sku) ?? [])].sort((left, right) => left.date.localeCompare(right.date));
      const latestActual = skuActuals.at(-1) ?? null;
      const lookbackStart = latestActual ? subtractDays(latestActual.date, thresholds.actualLookbackDays) : null;
      const recentActualAverage = average(
        skuActuals
          .filter((actual) => !lookbackStart || actual.date >= lookbackStart)
          .map((actual) => actual.unitsSold),
      );

      const reasons: Alert["reasons"] = [];

      if (
        recentActualAverage !== null &&
        firstForecast.p50 >= recentActualAverage * (1 + thresholds.forecastJumpThreshold)
      ) {
        reasons.push("forecast_jump_vs_recent_actuals");
      }

      if (
        recentActualAverage !== null &&
        firstForecast.p50 <= recentActualAverage * (1 - thresholds.forecastDropThreshold)
      ) {
        reasons.push("forecast_drop_vs_recent_actuals");
      }

      const uncertaintyRatio = firstForecast.p50 === 0 ? null : (firstForecast.p95 - firstForecast.p05) / firstForecast.p50;
      if (uncertaintyRatio !== null && uncertaintyRatio >= thresholds.uncertaintyRatioThreshold) {
        reasons.push("wide_uncertainty_band");
      }

      const projectedPriceDeltaPct =
        latestActual && firstForecast.projectedPrice !== null && latestActual.avgUnitPrice !== 0
          ? (firstForecast.projectedPrice - latestActual.avgUnitPrice) / latestActual.avgUnitPrice
          : null;
      if (
        projectedPriceDeltaPct !== null &&
        Math.abs(projectedPriceDeltaPct) >= thresholds.priceChangeThreshold
      ) {
        reasons.push("projected_price_change");
      }

      const projectedInStockDeltaPct =
        latestActual && firstForecast.projectedInStock !== null && latestActual.custInStock !== 0
          ? (firstForecast.projectedInStock - latestActual.custInStock) / latestActual.custInStock
          : null;
      if (
        projectedInStockDeltaPct !== null &&
        Math.abs(projectedInStockDeltaPct) >= thresholds.inStockChangeThreshold
      ) {
        reasons.push("projected_in_stock_change");
      }

      const hasDemandShift =
        reasons.includes("forecast_jump_vs_recent_actuals") || reasons.includes("forecast_drop_vs_recent_actuals");
      const hasWideBand = reasons.includes("wide_uncertainty_band");

      const severity = hasDemandShift
        ? reasons.length > 1
          ? "high"
          : "medium"
        : hasWideBand || reasons.length >= 2
          ? "medium"
          : "low";

      return {
        sku,
        severity,
        reasons,
        latestInferenceDate: firstForecast.inferenceDate,
        metrics: {
          recentActualAverage,
          forecastMedian: firstForecast.p50,
          uncertaintyRatio,
          projectedPriceDeltaPct,
          projectedInStockDeltaPct,
        },
      } satisfies Alert;
    })
    .filter((alert): alert is Alert => alert !== null)
    .sort((left, right) => left.sku.localeCompare(right.sku));
}
