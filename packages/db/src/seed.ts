import { parseAggregatedActualsCsvFile, parseForecastRunsCsvFile } from "@demand-planner/providers";
import { pathToFileURL } from "node:url";

import { migrateDatabase } from "./migrate";
import {
  countStoredActuals,
  createImportRun,
  recomputeAlerts,
  resolveDefaultFixturePath,
  upsertActualRows,
  upsertForecastRows,
} from "./repositories";

export async function seedDatabase(force = false): Promise<void> {
  migrateDatabase();

  if (!force && countStoredActuals() > 0) {
    return;
  }

  const actualsFilePath = resolveDefaultFixturePath("aggregated_data_valid.csv");
  const forecastsFilePath = resolveDefaultFixturePath("forecast_data_valid.csv");

  const actualRows = await parseAggregatedActualsCsvFile(actualsFilePath);
  const actualImport = createImportRun("actuals", "aggregated_data_valid.csv", actualsFilePath);
  upsertActualRows(actualImport.id, actualRows);

  const forecastRuns = await parseForecastRunsCsvFile(forecastsFilePath);
  const forecastImport = createImportRun("forecasts", "forecast_data_valid.csv", forecastsFilePath);
  const flattenedForecasts = forecastRuns.flatMap((run) =>
    run.forecasts.map((point, index) => {
      const driver = run.demandDrivers[index] ?? null;
      return {
        sku: run.sku,
        date: point.timestamp,
        inferenceDate: run.inferenceDate,
        p05: point.values.p05,
        p50: point.values.p50,
        p95: point.values.p95,
        mean: point.values.mean,
        projectedPrice: driver?.avg_unit_price ?? null,
        projectedInStock: driver?.cust_instock ?? null,
        modelId: run.modelId,
        runId: run.runId,
        clientId: run.clientId,
      };
    }),
  );
  upsertForecastRows(forecastImport.id, flattenedForecasts);

  recomputeAlerts();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void seedDatabase(true);
}
