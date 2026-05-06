import { describe, expect, it } from "vitest";

import {
  buildDashboardData,
  buildDashboardSummaries,
  buildSkuSeriesResponse,
  evaluateAlerts,
  filterToLatestInference,
  selectLatestInferenceDate,
  selectLatestInferenceDateBySku,
  type ActualObservation,
  type ForecastProjection,
} from "@demand-planner/domain";

const thresholds = {
  actualLookbackDays: 28,
  forecastJumpThreshold: 0.25,
  forecastDropThreshold: 0.25,
  uncertaintyRatioThreshold: 0.4,
  priceChangeThreshold: 0.05,
  inStockChangeThreshold: 0.15,
};

describe("domain services", () => {
  it("chooses the latest inference date across the dataset", () => {
    const latest = selectLatestInferenceDate([
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_A", date: "2025-04-27", inferenceDate: "2025-04-20", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_B", date: "2025-04-27", inferenceDate: "2025-04-06", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
    ]);

    expect(latest).toBe("2025-04-20");
  });

  it("chooses the latest inference date per SKU", () => {
    const latest = selectLatestInferenceDateBySku([
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_A", date: "2025-04-27", inferenceDate: "2025-04-20", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_B", date: "2025-04-20", inferenceDate: "2025-04-06", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
    ]);

    expect(latest.get("SKU_A")).toBe("2025-04-20");
    expect(latest.get("SKU_B")).toBe("2025-04-06");
  });

  it("filters forecasts to the latest global inference date", () => {
    const filtered = filterToLatestInference([
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_A", date: "2025-04-27", inferenceDate: "2025-04-20", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_B", date: "2025-04-27", inferenceDate: "2025-04-20", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
      { sku: "SKU_C", date: "2025-04-27", inferenceDate: "2025-04-06", p05: 1, p50: 2, p95: 3, projectedPrice: null, projectedInStock: null },
    ]);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((forecast) => forecast.inferenceDate === "2025-04-20")).toBe(true);
  });

  it("omits previous-year series when no aligned history exists", () => {
    const actuals: ActualObservation[] = [
      { sku: "SKU_A", date: "2025-03-30", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
    ];
    const forecasts: ForecastProjection[] = [
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 90, p50: 100, p95: 120, projectedPrice: 10.5, projectedInStock: 0.9 },
    ];

    const series = buildSkuSeriesResponse("SKU_A", actuals, forecasts, []);
    expect(series?.previousYearActuals).toBeUndefined();
  });

  it("builds demand driver series for the sku workbench", () => {
    const actuals: ActualObservation[] = [
      { sku: "SKU_A", date: "2025-03-30", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
      { sku: "SKU_A", date: "2025-04-06", unitsSold: 105, avgUnitPrice: 10.5, custInStock: 0.92 },
    ];
    const forecasts: ForecastProjection[] = [
      { sku: "SKU_A", date: "2025-04-13", inferenceDate: "2025-04-06", p05: 95, p50: 110, p95: 120, projectedPrice: 11, projectedInStock: 0.9 },
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-06", p05: 96, p50: 111, p95: 122, projectedPrice: null, projectedInStock: 0.88 },
    ];

    const series = buildSkuSeriesResponse("SKU_A", actuals, forecasts, []);

    expect(series?.demandDrivers.avgUnitPrice).toEqual({
      actuals: [
        { date: "2025-03-30", value: 10 },
        { date: "2025-04-06", value: 10.5 },
      ],
      forecast: [
        { date: "2025-04-13", value: 11 },
        { date: "2025-04-20", value: null },
      ],
    });
    expect(series?.demandDrivers.custInStock).toEqual({
      actuals: [
        { date: "2025-03-30", value: 0.95 },
        { date: "2025-04-06", value: 0.92 },
      ],
      forecast: [
        { date: "2025-04-13", value: 0.9 },
        { date: "2025-04-20", value: 0.88 },
      ],
    });
  });

  it("raises alert severity when uncertainty exceeds the threshold", () => {
    const actuals: ActualObservation[] = [
      { sku: "SKU_A", date: "2025-04-06", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
      { sku: "SKU_A", date: "2025-04-13", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
    ];
    const forecasts: ForecastProjection[] = [
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 40, p50: 100, p95: 160, projectedPrice: 10, projectedInStock: 0.95 },
    ];

    const alerts = evaluateAlerts(actuals, forecasts, thresholds);
    expect(alerts[0]?.reasons).toContain("wide_uncertainty_band");
    expect(alerts[0]?.severity).toBe("medium");
  });

  it("captures projected price and in-stock changes without demand jumps", () => {
    const actuals: ActualObservation[] = [
      { sku: "SKU_A", date: "2025-04-06", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
      { sku: "SKU_A", date: "2025-04-13", unitsSold: 102, avgUnitPrice: 10, custInStock: 0.95 },
    ];
    const forecasts: ForecastProjection[] = [
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 95, p50: 101, p95: 110, projectedPrice: 11, projectedInStock: 0.7 },
    ];

    const alerts = evaluateAlerts(actuals, forecasts, thresholds);
    expect(alerts[0]?.reasons).toEqual(
      expect.arrayContaining(["projected_price_change", "projected_in_stock_change"]),
    );

    const summaries = buildDashboardSummaries(actuals, forecasts, alerts);
    expect(summaries[0]?.sku).toBe("SKU_A");
  });

  it("pins dashboard summaries and alerts to the latest global inference run", () => {
    const actuals: ActualObservation[] = [
      { sku: "SKU_A", date: "2025-04-13", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
      { sku: "SKU_B", date: "2025-04-13", unitsSold: 80, avgUnitPrice: 8, custInStock: 0.9 },
    ];
    const forecasts: ForecastProjection[] = [
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 90, p50: 100, p95: 120, projectedPrice: 10, projectedInStock: 0.95 },
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-20", p05: 120, p50: 140, p95: 160, projectedPrice: 10, projectedInStock: 0.95 },
      { sku: "SKU_B", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 70, p50: 80, p95: 90, projectedPrice: 8, projectedInStock: 0.9 },
    ];

    const alerts = evaluateAlerts(actuals, forecasts, thresholds);
    const summaries = buildDashboardSummaries(actuals, forecasts, alerts);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.sku).toBe("SKU_A");
    expect(alerts[0]?.latestInferenceDate).toBe("2025-04-20");
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      sku: "SKU_A",
      latestInferenceDate: "2025-04-20",
    });
  });

  it("pins sku series to the latest global inference run", () => {
    const actuals: ActualObservation[] = [
      { sku: "SKU_A", date: "2025-04-13", unitsSold: 100, avgUnitPrice: 10, custInStock: 0.95 },
    ];
    const forecasts: ForecastProjection[] = [
      { sku: "SKU_A", date: "2025-04-20", inferenceDate: "2025-04-13", p05: 90, p50: 100, p95: 120, projectedPrice: 10, projectedInStock: 0.95 },
      { sku: "SKU_B", date: "2025-04-20", inferenceDate: "2025-04-20", p05: 75, p50: 80, p95: 90, projectedPrice: 8, projectedInStock: 0.9 },
    ];

    expect(buildSkuSeriesResponse("SKU_A", actuals, forecasts, [])).toBeNull();
  });

  it("builds aggregate dashboard windows from the latest global snapshot", () => {
    const actuals: ActualObservation[] = Array.from({ length: 15 }, (_, index) => ({
      sku: index % 2 === 0 ? "SKU_A" : "SKU_B",
      date: `2025-01-${String(index + 1).padStart(2, "0")}`,
      unitsSold: 10 + index,
      avgUnitPrice: 10,
      custInStock: 0.95,
    }));
    const forecasts: ForecastProjection[] = Array.from({ length: 41 }, (_, index) => ({
      sku: index % 2 === 0 ? "SKU_A" : "SKU_B",
      date: `2025-02-${String(index + 1).padStart(2, "0")}`,
      inferenceDate: index < 2 ? "2025-01-31" : "2025-02-07",
      p05: 20 + index,
      p50: 30 + index,
      p95: 40 + index,
      projectedPrice: 10,
      projectedInStock: 0.95,
    }));

    const dashboard = buildDashboardData(actuals, forecasts, []);

    expect(dashboard.latestInferenceDate).toBe("2025-02-07");
    expect(dashboard.aggregateSeries.actuals).toHaveLength(13);
    expect(dashboard.aggregateSeries.actuals[0]?.date).toBe("2025-01-03");
    expect(dashboard.aggregateSeries.actuals.at(-1)?.date).toBe("2025-01-15");
    expect(dashboard.aggregateSeries.forecast).toHaveLength(39);
    expect(dashboard.aggregateSeries.forecast[0]?.date).toBe("2025-02-03");
    expect(dashboard.aggregateSeries.forecast.at(-1)?.date).toBe("2025-02-41");
  });
});
