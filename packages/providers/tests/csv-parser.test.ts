import fs from "node:fs/promises";
import path from "node:path";

import { parse as parseCsv } from "csv-parse/sync";
import { describe, expect, it } from "vitest";

import {
  CsvValidationError,
  parseAggregatedActualsCsv,
  parseAggregatedActualsCsvFile,
  parseForecastRunsCsv,
  parseForecastRunsCsvFile,
} from "@demand-planner/providers";

const fixturesDir = path.resolve(
  __dirname,
  "../../../test_csvs",
);

type FixtureRecord = Record<string, string>;

async function readFixtureRecords(fileName: string): Promise<FixtureRecord[]> {
  const input = await fs.readFile(path.join(fixturesDir, fileName), "utf8");
  return parseCsv(input, {
    columns: true,
    skip_empty_lines: true,
  }) as FixtureRecord[];
}

describe("CSV providers", () => {
  it("parses the valid aggregated actuals fixture", async () => {
    const fixtureFile = "aggregated_data_valid.csv";
    const [rows, fixtureRecords] = await Promise.all([
      parseAggregatedActualsCsvFile(path.join(fixturesDir, fixtureFile)),
      readFixtureRecords(fixtureFile),
    ]);
    const firstFixtureRecord = fixtureRecords[0];
    const firstDemandDrivers = JSON.parse(firstFixtureRecord?.demand_drivers ?? "{}") as {
      avg_unit_price: number;
      cust_instock: number;
    };

    expect(rows.length).toBeGreaterThan(30);
    expect(rows).toHaveLength(fixtureRecords.length);
    expect(new Set(rows.map((row) => row.sku))).toEqual(new Set(fixtureRecords.map((row) => row.item_id)));
    expect(rows[0]).toEqual({
      sku: firstFixtureRecord?.item_id,
      date: firstFixtureRecord?.timestamp,
      unitsSold: Number(firstFixtureRecord?.units_sold),
      avgUnitPrice: firstDemandDrivers.avg_unit_price,
      custInStock: firstDemandDrivers.cust_instock,
    });
  });

  it("accepts signed units_sold values in aggregated actuals", () => {
    const rows = parseAggregatedActualsCsv(
      [
        'item_id,timestamp,units_sold,demand_drivers',
        'SKU_SIGNED,2025-04-20,-5,"{""avg_unit_price"": 10.5, ""cust_instock"": 0.95}"',
      ].join("\n"),
      "signed-actuals.csv",
    );

    expect(rows).toEqual([
      {
        sku: "SKU_SIGNED",
        date: "2025-04-20",
        unitsSold: -5,
        avgUnitPrice: 10.5,
        custInStock: 0.95,
      },
    ]);
  });

  it("parses the valid forecast fixture across all imported runs", async () => {
    const runs = await parseForecastRunsCsvFile(path.join(fixturesDir, "forecast_data_valid.csv"));

    expect(runs.length).toBeGreaterThanOrEqual(5);
    expect(runs.length).toBeGreaterThanOrEqual(1000);
    expect(runs.every((run) => run.forecasts.length >= 40)).toBe(true);
    expect(runs.every((run) => run.demandDrivers.length >= 40)).toBe(true);
    expect(new Set(runs.map((run) => run.runId)).size).toBeGreaterThan(1);
    expect(new Set(runs.map((run) => run.inferenceDate)).size).toBeGreaterThan(1);
    expect(runs.every((run) => run.modelId.length > 0)).toBe(true);
    expect(runs.every((run) => run.clientId.length > 0)).toBe(true);
  });

  it("accepts nested projected demand drivers and aligns them to forecast weeks", () => {
    const runs = parseForecastRunsCsv(
      [
        "item_id,inference_date,forecasts,demand_drivers,auto_features,model_id,run_id,client_id",
        [
          "SKU_LIVE_FORMAT",
          "2025-04-20",
          '"[{""timestamp"": ""2025-04-27"", ""values"": {""mean"": 100, ""p05"": 90, ""p10"": 92, ""p25"": 96, ""p50"": 100, ""p75"": 104, ""p90"": 108, ""p95"": 112}}, {""timestamp"": ""2025-05-04"", ""values"": {""mean"": 101, ""p05"": 91, ""p10"": 93, ""p25"": 97, ""p50"": 101, ""p75"": 105, ""p90"": 109, ""p95"": 113}}, {""timestamp"": ""2025-05-11"", ""values"": {""mean"": 102, ""p05"": 92, ""p10"": 94, ""p25"": 98, ""p50"": 102, ""p75"": 106, ""p90"": 110, ""p95"": 114}}, {""timestamp"": ""2025-05-18"", ""values"": {""mean"": 103, ""p05"": 93, ""p10"": 95, ""p25"": 99, ""p50"": 103, ""p75"": 107, ""p90"": 111, ""p95"": 115}}, {""timestamp"": ""2025-05-25"", ""values"": {""mean"": 104, ""p05"": 94, ""p10"": 96, ""p25"": 100, ""p50"": 104, ""p75"": 108, ""p90"": 112, ""p95"": 116}}, {""timestamp"": ""2025-06-01"", ""values"": {""mean"": 105, ""p05"": 95, ""p10"": 97, ""p25"": 101, ""p50"": 105, ""p75"": 109, ""p90"": 113, ""p95"": 117}}, {""timestamp"": ""2025-06-08"", ""values"": {""mean"": 106, ""p05"": 96, ""p10"": 98, ""p25"": 102, ""p50"": 106, ""p75"": 110, ""p90"": 114, ""p95"": 118}}, {""timestamp"": ""2025-06-15"", ""values"": {""mean"": 107, ""p05"": 97, ""p10"": 99, ""p25"": 103, ""p50"": 107, ""p75"": 111, ""p90"": 115, ""p95"": 119}}, {""timestamp"": ""2025-06-22"", ""values"": {""mean"": 108, ""p05"": 98, ""p10"": 100, ""p25"": 104, ""p50"": 108, ""p75"": 112, ""p90"": 116, ""p95"": 120}}, {""timestamp"": ""2025-06-29"", ""values"": {""mean"": 109, ""p05"": 99, ""p10"": 101, ""p25"": 105, ""p50"": 109, ""p75"": 113, ""p90"": 117, ""p95"": 121}}, {""timestamp"": ""2025-07-06"", ""values"": {""mean"": 110, ""p05"": 100, ""p10"": 102, ""p25"": 106, ""p50"": 110, ""p75"": 114, ""p90"": 118, ""p95"": 122}}, {""timestamp"": ""2025-07-13"", ""values"": {""mean"": 111, ""p05"": 101, ""p10"": 103, ""p25"": 107, ""p50"": 111, ""p75"": 115, ""p90"": 119, ""p95"": 123}}, {""timestamp"": ""2025-07-20"", ""values"": {""mean"": 112, ""p05"": 102, ""p10"": 104, ""p25"": 108, ""p50"": 112, ""p75"": 116, ""p90"": 120, ""p95"": 124}}, {""timestamp"": ""2025-07-27"", ""values"": {""mean"": 113, ""p05"": 103, ""p10"": 105, ""p25"": 109, ""p50"": 113, ""p75"": 117, ""p90"": 121, ""p95"": 125}}, {""timestamp"": ""2025-08-03"", ""values"": {""mean"": 114, ""p05"": 104, ""p10"": 106, ""p25"": 110, ""p50"": 114, ""p75"": 118, ""p90"": 122, ""p95"": 126}}, {""timestamp"": ""2025-08-10"", ""values"": {""mean"": 115, ""p05"": 105, ""p10"": 107, ""p25"": 111, ""p50"": 115, ""p75"": 119, ""p90"": 123, ""p95"": 127}}, {""timestamp"": ""2025-08-17"", ""values"": {""mean"": 116, ""p05"": 106, ""p10"": 108, ""p25"": 112, ""p50"": 116, ""p75"": 120, ""p90"": 124, ""p95"": 128}}, {""timestamp"": ""2025-08-24"", ""values"": {""mean"": 117, ""p05"": 107, ""p10"": 109, ""p25"": 113, ""p50"": 117, ""p75"": 121, ""p90"": 125, ""p95"": 129}}, {""timestamp"": ""2025-08-31"", ""values"": {""mean"": 118, ""p05"": 108, ""p10"": 110, ""p25"": 114, ""p50"": 118, ""p75"": 122, ""p90"": 126, ""p95"": 130}}, {""timestamp"": ""2025-09-07"", ""values"": {""mean"": 119, ""p05"": 109, ""p10"": 111, ""p25"": 115, ""p50"": 119, ""p75"": 123, ""p90"": 127, ""p95"": 131}}, {""timestamp"": ""2025-09-14"", ""values"": {""mean"": 120, ""p05"": 110, ""p10"": 112, ""p25"": 116, ""p50"": 120, ""p75"": 124, ""p90"": 128, ""p95"": 132}}, {""timestamp"": ""2025-09-21"", ""values"": {""mean"": 121, ""p05"": 111, ""p10"": 113, ""p25"": 117, ""p50"": 121, ""p75"": 125, ""p90"": 129, ""p95"": 133}}, {""timestamp"": ""2025-09-28"", ""values"": {""mean"": 122, ""p05"": 112, ""p10"": 114, ""p25"": 118, ""p50"": 122, ""p75"": 126, ""p90"": 130, ""p95"": 134}}, {""timestamp"": ""2025-10-05"", ""values"": {""mean"": 123, ""p05"": 113, ""p10"": 115, ""p25"": 119, ""p50"": 123, ""p75"": 127, ""p90"": 131, ""p95"": 135}}, {""timestamp"": ""2025-10-12"", ""values"": {""mean"": 124, ""p05"": 114, ""p10"": 116, ""p25"": 120, ""p50"": 124, ""p75"": 128, ""p90"": 132, ""p95"": 136}}, {""timestamp"": ""2025-10-19"", ""values"": {""mean"": 125, ""p05"": 115, ""p10"": 117, ""p25"": 121, ""p50"": 125, ""p75"": 129, ""p90"": 133, ""p95"": 137}}, {""timestamp"": ""2025-10-26"", ""values"": {""mean"": 126, ""p05"": 116, ""p10"": 118, ""p25"": 122, ""p50"": 126, ""p75"": 130, ""p90"": 134, ""p95"": 138}}, {""timestamp"": ""2025-11-02"", ""values"": {""mean"": 127, ""p05"": 117, ""p10"": 119, ""p25"": 123, ""p50"": 127, ""p75"": 131, ""p90"": 135, ""p95"": 139}}, {""timestamp"": ""2025-11-09"", ""values"": {""mean"": 128, ""p05"": 118, ""p10"": 120, ""p25"": 124, ""p50"": 128, ""p75"": 132, ""p90"": 136, ""p95"": 140}}, {""timestamp"": ""2025-11-16"", ""values"": {""mean"": 129, ""p05"": 119, ""p10"": 121, ""p25"": 125, ""p50"": 129, ""p75"": 133, ""p90"": 137, ""p95"": 141}}, {""timestamp"": ""2025-11-23"", ""values"": {""mean"": 130, ""p05"": 120, ""p10"": 122, ""p25"": 126, ""p50"": 130, ""p75"": 134, ""p90"": 138, ""p95"": 142}}, {""timestamp"": ""2025-11-30"", ""values"": {""mean"": 131, ""p05"": 121, ""p10"": 123, ""p25"": 127, ""p50"": 131, ""p75"": 135, ""p90"": 139, ""p95"": 143}}, {""timestamp"": ""2025-12-07"", ""values"": {""mean"": 132, ""p05"": 122, ""p10"": 124, ""p25"": 128, ""p50"": 132, ""p75"": 136, ""p90"": 140, ""p95"": 144}}, {""timestamp"": ""2025-12-14"", ""values"": {""mean"": 133, ""p05"": 123, ""p10"": 125, ""p25"": 129, ""p50"": 133, ""p75"": 137, ""p90"": 141, ""p95"": 145}}, {""timestamp"": ""2025-12-21"", ""values"": {""mean"": 134, ""p05"": 124, ""p10"": 126, ""p25"": 130, ""p50"": 134, ""p75"": 138, ""p90"": 142, ""p95"": 146}}, {""timestamp"": ""2025-12-28"", ""values"": {""mean"": 135, ""p05"": 125, ""p10"": 127, ""p25"": 131, ""p50"": 135, ""p75"": 139, ""p90"": 143, ""p95"": 147}}, {""timestamp"": ""2026-01-04"", ""values"": {""mean"": 136, ""p05"": 126, ""p10"": 128, ""p25"": 132, ""p50"": 136, ""p75"": 140, ""p90"": 144, ""p95"": 148}}, {""timestamp"": ""2026-01-11"", ""values"": {""mean"": 137, ""p05"": 127, ""p10"": 129, ""p25"": 133, ""p50"": 137, ""p75"": 141, ""p90"": 145, ""p95"": 149}}, {""timestamp"": ""2026-01-18"", ""values"": {""mean"": 138, ""p05"": 128, ""p10"": 130, ""p25"": 134, ""p50"": 138, ""p75"": 142, ""p90"": 146, ""p95"": 150}}, {""timestamp"": ""2026-01-25"", ""values"": {""mean"": 139, ""p05"": 129, ""p10"": 131, ""p25"": 135, ""p50"": 139, ""p75"": 143, ""p90"": 147, ""p95"": 151}}]"',
          '"[{""timestamp"": ""2025-04-20"", ""values"": {""avg_unit_price"": 10, ""cust_instock"": 0.95}}, {""timestamp"": ""2025-04-27"", ""values"": {""avg_unit_price"": 11, ""cust_instock"": 0.94}}, {""timestamp"": ""2025-05-04"", ""values"": {""avg_unit_price"": 12, ""cust_instock"": 0.93}}, {""timestamp"": ""2025-05-11"", ""values"": {""avg_unit_price"": 13, ""cust_instock"": 0.92}}, {""timestamp"": ""2025-05-18"", ""values"": {""avg_unit_price"": 14, ""cust_instock"": 0.91}}, {""timestamp"": ""2025-05-25"", ""values"": {""avg_unit_price"": 15, ""cust_instock"": 0.9}}, {""timestamp"": ""2025-06-01"", ""values"": {""avg_unit_price"": 16, ""cust_instock"": 0.89}}, {""timestamp"": ""2025-06-08"", ""values"": {""avg_unit_price"": 17, ""cust_instock"": 0.88}}, {""timestamp"": ""2025-06-15"", ""values"": {""avg_unit_price"": 18, ""cust_instock"": 0.87}}, {""timestamp"": ""2025-06-22"", ""values"": {""avg_unit_price"": 19, ""cust_instock"": 0.86}}, {""timestamp"": ""2025-06-29"", ""values"": {""avg_unit_price"": 20, ""cust_instock"": 0.85}}, {""timestamp"": ""2025-07-06"", ""values"": {""avg_unit_price"": 21, ""cust_instock"": 0.84}}, {""timestamp"": ""2025-07-13"", ""values"": {""avg_unit_price"": 22, ""cust_instock"": 0.83}}, {""timestamp"": ""2025-07-20"", ""values"": {""avg_unit_price"": 23, ""cust_instock"": 0.82}}, {""timestamp"": ""2025-07-27"", ""values"": {""avg_unit_price"": 24, ""cust_instock"": 0.81}}, {""timestamp"": ""2025-08-03"", ""values"": {""avg_unit_price"": 25, ""cust_instock"": 0.8}}, {""timestamp"": ""2025-08-10"", ""values"": {""avg_unit_price"": 26, ""cust_instock"": 0.79}}, {""timestamp"": ""2025-08-17"", ""values"": {""avg_unit_price"": 27, ""cust_instock"": 0.78}}, {""timestamp"": ""2025-08-24"", ""values"": {""avg_unit_price"": 28, ""cust_instock"": 0.77}}, {""timestamp"": ""2025-08-31"", ""values"": {""avg_unit_price"": 29, ""cust_instock"": 0.76}}, {""timestamp"": ""2025-09-07"", ""values"": {""avg_unit_price"": 30, ""cust_instock"": 0.75}}, {""timestamp"": ""2025-09-14"", ""values"": {""avg_unit_price"": 31, ""cust_instock"": 0.74}}, {""timestamp"": ""2025-09-21"", ""values"": {""avg_unit_price"": 32, ""cust_instock"": 0.73}}, {""timestamp"": ""2025-09-28"", ""values"": {""avg_unit_price"": 33, ""cust_instock"": 0.72}}, {""timestamp"": ""2025-10-05"", ""values"": {""avg_unit_price"": 34, ""cust_instock"": 0.71}}, {""timestamp"": ""2025-10-12"", ""values"": {""avg_unit_price"": 35, ""cust_instock"": 0.7}}, {""timestamp"": ""2025-10-19"", ""values"": {""avg_unit_price"": 36, ""cust_instock"": 0.69}}, {""timestamp"": ""2025-10-26"", ""values"": {""avg_unit_price"": 37, ""cust_instock"": 0.68}}, {""timestamp"": ""2025-11-02"", ""values"": {""avg_unit_price"": 38, ""cust_instock"": 0.67}}, {""timestamp"": ""2025-11-09"", ""values"": {""avg_unit_price"": 39, ""cust_instock"": 0.66}}, {""timestamp"": ""2025-11-16"", ""values"": {""avg_unit_price"": 40, ""cust_instock"": 0.65}}, {""timestamp"": ""2025-11-23"", ""values"": {""avg_unit_price"": 41, ""cust_instock"": 0.64}}, {""timestamp"": ""2025-11-30"", ""values"": {""avg_unit_price"": 42, ""cust_instock"": 0.63}}, {""timestamp"": ""2025-12-07"", ""values"": {""avg_unit_price"": 43, ""cust_instock"": 0.62}}, {""timestamp"": ""2025-12-14"", ""values"": {""avg_unit_price"": 44, ""cust_instock"": 0.61}}, {""timestamp"": ""2025-12-21"", ""values"": {""avg_unit_price"": 45, ""cust_instock"": 0.6}}, {""timestamp"": ""2025-12-28"", ""values"": {""avg_unit_price"": 46, ""cust_instock"": 0.59}}, {""timestamp"": ""2026-01-04"", ""values"": {""avg_unit_price"": 47, ""cust_instock"": 0.58}}, {""timestamp"": ""2026-01-11"", ""values"": {""avg_unit_price"": 48, ""cust_instock"": 0.57}}, {""timestamp"": ""2026-01-18"", ""values"": {""avg_unit_price"": 49, ""cust_instock"": 0.56}}, {""timestamp"": ""2026-01-25"", ""values"": {""avg_unit_price"": 50, ""cust_instock"": 0.55}}]"',
          '"[{""timestamp"": ""2025-04-20"", ""values"": {""week_of_year"": 16}}]"',
          "model_v2",
          "run_live_format",
          "client_live",
        ].join(","),
      ].join("\n"),
      "live-format-forecast.csv",
    );

    expect(runs).toHaveLength(1);
    expect(runs[0]?.demandDrivers).toHaveLength(40);
    expect(runs[0]?.demandDrivers[0]).toEqual({
      timestamp: "2025-04-27",
      avg_unit_price: 11,
      cust_instock: 0.94,
    });
    expect(runs[0]?.demandDrivers.at(-1)).toEqual({
      timestamp: "2026-01-25",
      avg_unit_price: 50,
      cust_instock: 0.55,
    });
  });

  it("fills missing forecast percentile bands from mean when all bands are null", () => {
    const timestamps = Array.from({ length: 40 }, (_, index) =>
      new Date(Date.UTC(2025, 3, 27 + (index * 7))).toISOString().slice(0, 10),
    );
    const forecasts = timestamps.map((timestamp, index) => ({
      timestamp,
      values: {
        mean: 100 + index,
        p05: null,
        p10: null,
        p25: null,
        p50: null,
        p75: null,
        p90: null,
        p95: null,
      },
    }));
    const drivers = timestamps.map((timestamp, index) => ({
      timestamp,
      avg_unit_price: 10 + index,
      cust_instock: 0.95,
    }));

    const [run] = parseForecastRunsCsv(
      [
        "item_id,inference_date,forecasts,demand_drivers,auto_features,model_id,run_id,client_id",
        `SKU_MEAN_ONLY,2025-04-20,"${JSON.stringify(forecasts).replaceAll('"', '""')}","${JSON.stringify(drivers).replaceAll('"', '""')}",{},model_v2,run_mean_only,client_live`,
      ].join("\n"),
      "mean-only-forecast.csv",
    );

    expect(run?.forecasts[0]?.values).toMatchObject({
      mean: 100,
      p05: 100,
      p50: 100,
      p95: 100,
    });
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
