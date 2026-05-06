import type { Alert, SkuSummary } from "@demand-planner/contracts";

export type ActualObservation = {
  sku: string;
  date: string;
  unitsSold: number;
  avgUnitPrice: number;
  custInStock: number;
};

export type ForecastProjection = {
  sku: string;
  date: string;
  inferenceDate: string;
  p05: number;
  p50: number;
  p95: number;
  projectedPrice: number | null;
  projectedInStock: number | null;
  modelId?: string;
  runId?: string;
  clientId?: string;
};

export type AlertThresholds = {
  actualLookbackDays: number;
  forecastJumpThreshold: number;
  forecastDropThreshold: number;
  uncertaintyRatioThreshold: number;
  priceChangeThreshold: number;
  inStockChangeThreshold: number;
};

export type DashboardSummary = SkuSummary;
export type ComputedAlert = Alert;
