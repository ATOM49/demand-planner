import { z } from "zod";

export const ImportUploadFieldName = "file";

export const AggregatedActualImportRowSchema = z.object({
  sku: z.string().min(1),
  date: z.iso.date(),
  unitsSold: z.number().nonnegative(),
  avgUnitPrice: z.number(),
  custInStock: z.number().min(0).max(1),
});

export const ImportSourceSchema = z.object({
  sourcePath: z.string().min(1),
});

export const RecomputeAlertsRequestSchema = z.object({
  triggeredBy: z.string().min(1).default("manual"),
});

export type AggregatedActualImportRow = z.infer<typeof AggregatedActualImportRowSchema>;
export type ImportSource = z.infer<typeof ImportSourceSchema>;
