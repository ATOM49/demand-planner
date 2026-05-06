import type { SkuSeriesResponse } from "@demand-planner/contracts";

import type { ActualObservation, ForecastProjection } from "../types";
import { filterToLatestInference } from "../demand/latest-inference";
import type { Alert } from "@demand-planner/contracts";

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildSkuSeriesResponse(
  sku: string,
  actuals: ActualObservation[],
  forecasts: ForecastProjection[],
  alerts: Alert[],
): SkuSeriesResponse | null {
  const latestForecasts = filterToLatestInference(forecasts).filter((forecast) => forecast.sku === sku);
  const sortedLatestForecasts = latestForecasts.sort((left, right) => left.date.localeCompare(right.date));
  const latestForecast = sortedLatestForecasts[0];

  if (!latestForecast) {
    return null;
  }

  const latestInferenceDate = latestForecast.inferenceDate;
  const skuActuals = actuals
    .filter((actual) => actual.sku === sku)
    .sort((left, right) => left.date.localeCompare(right.date));

  const shiftedActuals = new Map(
    skuActuals.map((actual) => [addDays(actual.date, 364), actual.unitsSold] as const),
  );
  const previousYearActuals = latestForecasts
    .map((forecast) => ({ date: forecast.date, value: shiftedActuals.get(forecast.date) }))
    .filter((entry): entry is { date: string; value: number } => entry.value !== undefined);

  return {
    sku,
    latestInferenceDate,
    actuals: skuActuals.map((actual) => ({ date: actual.date, value: actual.unitsSold })),
    forecast: sortedLatestForecasts.map((forecast) => ({
        sku: forecast.sku,
        date: forecast.date,
        inferenceDate: forecast.inferenceDate,
        p05: forecast.p05,
        p50: forecast.p50,
        p95: forecast.p95,
        projectedPrice: forecast.projectedPrice,
        projectedInStock: forecast.projectedInStock,
      })),
    previousYearActuals: previousYearActuals.length > 0 ? previousYearActuals : undefined,
    demandDrivers: {
      avgUnitPrice: {
        actuals: skuActuals.map((actual) => ({ date: actual.date, value: actual.avgUnitPrice })),
        forecast: sortedLatestForecasts.map((forecast) => ({ date: forecast.date, value: forecast.projectedPrice })),
      },
      custInStock: {
        actuals: skuActuals.map((actual) => ({ date: actual.date, value: actual.custInStock })),
        forecast: sortedLatestForecasts.map((forecast) => ({ date: forecast.date, value: forecast.projectedInStock })),
      },
    },
    alerts: alerts.filter((alert) => alert.sku === sku),
  };
}
