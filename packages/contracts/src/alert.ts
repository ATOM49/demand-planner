import { z } from "zod";

export const AlertSeveritySchema = z.enum(["low", "medium", "high"]);

export const AlertReasonSchema = z.enum([
  "forecast_jump_vs_recent_actuals",
  "forecast_drop_vs_recent_actuals",
  "wide_uncertainty_band",
  "projected_price_change",
  "projected_in_stock_change",
]);

export const AlertSchema = z.object({
  sku: z.string().min(1),
  severity: AlertSeveritySchema,
  reasons: z.array(AlertReasonSchema),
  latestInferenceDate: z.iso.date(),
  metrics: z.object({
    recentActualAverage: z.number().nullable(),
    forecastMedian: z.number(),
    uncertaintyRatio: z.number().nullable(),
    projectedPriceDeltaPct: z.number().nullable(),
    projectedInStockDeltaPct: z.number().nullable(),
  }),
});

export type Alert = z.infer<typeof AlertSchema>;
export type AlertReason = z.infer<typeof AlertReasonSchema>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
