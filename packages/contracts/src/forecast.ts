import { z } from "zod";

export const DriverSnapshotSchema = z.object({
  timestamp: z.iso.date(),
  avg_unit_price: z.number(),
  cust_instock: z.number().min(0).max(1),
});

export const ForecastValuesSchema = z.object({
  mean: z.number(),
  p05: z.number(),
  p10: z.number(),
  p25: z.number(),
  p50: z.number(),
  p75: z.number(),
  p90: z.number(),
  p95: z.number(),
});

export const ForecastDistributionPointSchema = z.object({
  timestamp: z.iso.date(),
  values: ForecastValuesSchema,
});

export const ForecastPointSchema = z.object({
  sku: z.string().min(1),
  date: z.iso.date(),
  inferenceDate: z.iso.date(),
  p05: z.number(),
  p50: z.number(),
  p95: z.number(),
  projectedPrice: z.number().nullable(),
  projectedInStock: z.number().nullable(),
});

export const ForecastImportRunSchema = z.object({
  sku: z.string().min(1),
  inferenceDate: z.iso.date(),
  forecasts: z.array(ForecastDistributionPointSchema).min(40),
  demandDrivers: z.array(DriverSnapshotSchema).min(40),
  autoFeatures: z.record(z.string(), z.unknown()),
  modelId: z.string().min(1),
  runId: z.string().min(1),
  clientId: z.string().min(1),
});

export type DriverSnapshot = z.infer<typeof DriverSnapshotSchema>;
export type ForecastDistributionPoint = z.infer<typeof ForecastDistributionPointSchema>;
export type ForecastImportRun = z.infer<typeof ForecastImportRunSchema>;
export type ForecastPoint = z.infer<typeof ForecastPointSchema>;
