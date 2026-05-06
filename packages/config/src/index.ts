import path from "node:path";

import { z } from "zod";

const RootEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("debug"),
  DATA_DIR: z.string().default("./data"),
  DATABASE_URL: z.string().default("file:./data/demand-planner.sqlite"),
  ALERT_ACTUAL_LOOKBACK_DAYS: z.coerce.number().int().positive().default(28),
  ALERT_FORECAST_JUMP_THRESHOLD: z.coerce.number().positive().default(0.25),
  ALERT_FORECAST_DROP_THRESHOLD: z.coerce.number().positive().default(0.25),
  ALERT_UNCERTAINTY_RATIO_THRESHOLD: z.coerce.number().positive().default(0.4),
  ALERT_PRICE_CHANGE_THRESHOLD: z.coerce.number().positive().default(0.05),
  ALERT_IN_STOCK_CHANGE_THRESHOLD: z.coerce.number().positive().default(0.15),
  IMPORT_MAX_FILE_MB: z.coerce.number().positive().default(20),
});

export type AppConfig = z.infer<typeof RootEnvSchema> & {
  resolvedDataDir: string;
  sqliteFilePath: string;
};

let cachedConfig: AppConfig | undefined;

export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cachedConfig && env === process.env) {
    return cachedConfig;
  }

  const parsed = RootEnvSchema.parse(env);
  const resolvedDataDir = path.resolve(parsed.DATA_DIR);
  const sqliteFilePath = parsed.DATABASE_URL.startsWith("file:")
    ? path.resolve(parsed.DATABASE_URL.slice(5))
    : parsed.DATABASE_URL;

  const config = { ...parsed, resolvedDataDir, sqliteFilePath };

  if (env === process.env) {
    cachedConfig = config;
  }

  return config;
}
