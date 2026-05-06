import type { ForecastProjection } from "../types";

export function selectLatestInferenceDate(forecasts: ForecastProjection[]): string | null {
  let latestInferenceDate: string | null = null;

  for (const forecast of forecasts) {
    if (!latestInferenceDate || forecast.inferenceDate > latestInferenceDate) {
      latestInferenceDate = forecast.inferenceDate;
    }
  }

  return latestInferenceDate;
}

export function filterToInferenceDate(
  forecasts: ForecastProjection[],
  inferenceDate: string | null,
): ForecastProjection[] {
  if (!inferenceDate) {
    return [];
  }

  return forecasts.filter((forecast) => forecast.inferenceDate === inferenceDate);
}

export function filterToLatestInference(forecasts: ForecastProjection[]): ForecastProjection[] {
  return filterToInferenceDate(forecasts, selectLatestInferenceDate(forecasts));
}

export function selectLatestInferenceDateBySku(forecasts: ForecastProjection[]): Map<string, string> {
  const latestBySku = new Map<string, string>();

  for (const forecast of forecasts) {
    const current = latestBySku.get(forecast.sku);
    if (!current || forecast.inferenceDate > current) {
      latestBySku.set(forecast.sku, forecast.inferenceDate);
    }
  }

  return latestBySku;
}

export function filterToLatestInferencePerSku(forecasts: ForecastProjection[]): ForecastProjection[] {
  const latestBySku = selectLatestInferenceDateBySku(forecasts);
  return forecasts.filter((forecast) => latestBySku.get(forecast.sku) === forecast.inferenceDate);
}
