import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CsvValidationError,
  parseAggregatedActualsCsvFile,
  parseForecastRunsCsvFile,
} from "@demand-planner/providers";

const fixturesDir = path.resolve(
  __dirname,
  "../../../test_csvs",
);

describe("CSV providers", () => {
  it("parses the valid aggregated actuals fixture", async () => {
    const rows = await parseAggregatedActualsCsvFile(
      path.join(fixturesDir, "aggregated_data_valid.csv"),
    );

    expect(rows.length).toBeGreaterThan(30);
    expect(new Set(rows.map((row) => row.sku))).toEqual(
      new Set(["SKU_STABLE_001", "SKU_SPIKE_002", "SKU_LOW_INSTOCK_003"]),
    );
  });

  it("parses the valid forecast fixture with stale and latest runs", async () => {
    const runs = await parseForecastRunsCsvFile(path.join(fixturesDir, "forecast_data_valid.csv"));

    expect(runs.length).toBeGreaterThanOrEqual(5);
    expect(runs.every((run) => run.forecasts.length >= 40)).toBe(true);
    expect(runs.some((run) => run.runId.includes("run_old"))).toBe(true);
    expect(runs.some((run) => run.runId.includes("run_latest"))).toBe(true);
  });

  it("rejects the aggregated failure cases fixture with row-level issues", async () => {
    await expect(
      parseAggregatedActualsCsvFile(path.join(fixturesDir, "aggregated_data_failure_cases.csv")),
    ).rejects.toMatchObject({
      name: "CsvValidationError",
    });

    try {
      await parseAggregatedActualsCsvFile(path.join(fixturesDir, "aggregated_data_failure_cases.csv"));
    } catch (error) {
      expect(error).toBeInstanceOf(CsvValidationError);
      const issues = (error as CsvValidationError).issues;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.map((issue) => issue.field)).toEqual(
        expect.arrayContaining([
          "item_id",
          "timestamp",
          "units_sold",
          "avg_unit_price",
          "cust_instock",
          "item_id+timestamp",
        ]),
      );
    }
  });

  it("rejects the forecast failure cases fixture with row-level issues", async () => {
    await expect(
      parseForecastRunsCsvFile(path.join(fixturesDir, "forecast_data_failure_cases.csv")),
    ).rejects.toMatchObject({
      name: "CsvValidationError",
    });

    try {
      await parseForecastRunsCsvFile(path.join(fixturesDir, "forecast_data_failure_cases.csv"));
    } catch (error) {
      expect(error).toBeInstanceOf(CsvValidationError);
      const issues = (error as CsvValidationError).issues;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.map((issue) => issue.field)).toEqual(
        expect.arrayContaining([
          "item_id",
          "inference_date",
          "forecasts",
          "demand_drivers",
          "metadata",
        ]),
      );
    }
  });
});
