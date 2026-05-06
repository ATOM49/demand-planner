import { cache } from "react";

import { SkuListQuerySchema, type SkuListQuery } from "@demand-planner/contracts";
import { getDashboardData, getSkuSeriesData, listAlerts } from "@demand-planner/db";

import { ensureAppBootstrap } from "./bootstrap";

const loadDashboardData = cache(async () => {
  await ensureAppBootstrap();
  return getDashboardData();
});

export function parseSkuListQuery(searchParams: URLSearchParams): SkuListQuery {
  return SkuListQuerySchema.parse({
    search: searchParams.get("search") ?? undefined,
    severity: searchParams.get("severity") ?? undefined,
  });
}

export async function getDashboardPageData() {
  const { alerts, skuSummaries, aggregateSeries, latestInferenceDate, metrics } = await loadDashboardData();
  return { alerts, summaries: skuSummaries, aggregateSeries, latestInferenceDate, metrics };
}

export async function getDashboardHeaderData() {
  const { skuSummaries } = await loadDashboardData();
  return { skus: skuSummaries.map((summary) => summary.sku) };
}

export async function listSkusData(query: SkuListQuery) {
  const { skuSummaries } = await loadDashboardData();
  const filtered = skuSummaries.filter((summary) => {
    const matchesSearch = query.search
      ? summary.sku.toLowerCase().includes(query.search.toLowerCase())
      : true;
    const matchesSeverity = query.severity ? summary.severity === query.severity : true;
    return matchesSearch && matchesSeverity;
  });

  return { items: filtered, total: filtered.length };
}

export async function listAlertsData(severity?: string) {
  await ensureAppBootstrap();
  const alerts = listAlerts();
  return severity ? alerts.filter((alert) => alert.severity === severity) : alerts;
}

export async function getSkuPageData(sku: string) {
  await ensureAppBootstrap();
  return getSkuSeriesData(sku);
}
