import { z } from "zod";

import { AlertSchema } from "./alert";
import { ForecastPointSchema } from "./forecast";

const TimeSeriesValueSchema = z.object({ date: z.iso.date(), value: z.number() });
const NullableTimeSeriesValueSchema = z.object({ date: z.iso.date(), value: z.number().nullable() });

const SkuDriverSeriesSchema = z.object({
  actuals: z.array(TimeSeriesValueSchema),
  forecast: z.array(NullableTimeSeriesValueSchema),
});

const SkuDemandDriversSchema = z.object({
  avgUnitPrice: SkuDriverSeriesSchema,
  custInStock: SkuDriverSeriesSchema,
});

export const AggregateForecastPointSchema = z.object({
  date: z.iso.date(),
  p05: z.number(),
  p50: z.number(),
  p95: z.number(),
});

export const DashboardAggregateSeriesSchema = z.object({
  actuals: z.array(TimeSeriesValueSchema),
  forecast: z.array(AggregateForecastPointSchema),
});

export const DashboardMetricsSchema = z.object({
  trackedSkuCount: z.number().int().nonnegative(),
  trailing4WeekActualUnits: z.number().nullable(),
  next4WeekForecastUnits: z.number().nullable(),
  next4WeekForecastGapUnits: z.number().nullable(),
  next4WeekForecastGapPct: z.number().nullable(),
  next13WeekForecastUnits: z.number().nullable(),
  next13WeekProjectedRevenue: z.number().nullable(),
  next13WeekUncertaintyBuffer: z.number().nullable(),
  latestModelId: z.string().nullable(),
  latestRunId: z.string().nullable(),
});

export const SkuSummarySchema = z.object({
  sku: z.string().min(1),
  latestInferenceDate: z.iso.date().nullable(),
  latestActualDate: z.iso.date().nullable(),
  latestActualUnits: z.number().nullable(),
  latestForecastUnits: z.number().nullable(),
  firstForecastGapPct: z.number().nullable(),
  projectedRevenue13Weeks: z.number().nullable(),
  projectedPriceDeltaPct: z.number().nullable(),
  projectedInStockDeltaPct: z.number().nullable(),
  severity: z.enum(["low", "medium", "high"]).nullable(),
  reasons: z.array(z.string()),
});

export const SkuListResponseSchema = z.object({
  items: z.array(SkuSummarySchema),
  total: z.number().int().nonnegative(),
});

export const SkuSeriesResponseSchema = z.object({
  sku: z.string(),
  latestInferenceDate: z.iso.date(),
  actuals: z.array(TimeSeriesValueSchema),
  forecast: z.array(ForecastPointSchema),
  previousYearActuals: z.array(TimeSeriesValueSchema).optional(),
  demandDrivers: SkuDemandDriversSchema,
  alerts: z.array(AlertSchema),
});

export const DashboardDataSchema = z.object({
  latestInferenceDate: z.iso.date().nullable(),
  aggregateSeries: DashboardAggregateSeriesSchema,
  metrics: DashboardMetricsSchema,
  alerts: z.array(AlertSchema),
  skuSummaries: z.array(SkuSummarySchema),
});

export const SkuListQuerySchema = z.object({
  search: z.string().trim().optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
});

export type SkuListQuery = z.infer<typeof SkuListQuerySchema>;
export type SkuListResponse = z.infer<typeof SkuListResponseSchema>;
export type DashboardAggregateSeries = z.infer<typeof DashboardAggregateSeriesSchema>;
export type DashboardData = z.infer<typeof DashboardDataSchema>;
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type SkuDemandDrivers = z.infer<typeof SkuDemandDriversSchema>;
export type SkuSeriesResponse = z.infer<typeof SkuSeriesResponseSchema>;
export type SkuSummary = z.infer<typeof SkuSummarySchema>;
