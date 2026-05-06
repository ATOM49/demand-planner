import type { Alert, DashboardData, SkuSummary } from "@demand-planner/contracts";

import { MetricCard } from "@/components/ui/page-shell";

function formatCompactNumber(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AlertSummaryGrid({
  alerts,
  metrics,
  summaries,
  latestInferenceDate,
}: {
  alerts: Alert[];
  metrics: DashboardData["metrics"];
  summaries: SkuSummary[];
  latestInferenceDate: string | null;
}) {
  const counts = alerts.reduce(
    (accumulator, alert) => {
      accumulator[alert.severity] += 1;
      return accumulator;
    },
    { high: 0, medium: 0, low: 0 },
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Tracked SKUs"
        value={summaries.length}
        helper={latestInferenceDate ? `Latest inference run ${latestInferenceDate}` : "No forecast run loaded"}
      />
      <MetricCard label="High-signal alerts" value={counts.high} helper="Jump/drop plus another risk in the latest run" />
      <MetricCard
        label="4-week forecast gap"
        value={formatPercent(metrics.next4WeekForecastGapPct)}
        helper={
          metrics.next4WeekForecastGapUnits === null
            ? "Need 4 weeks of actuals and forecast"
            : `${formatCompactNumber(metrics.next4WeekForecastGapUnits)} units vs trailing 4-week actuals`
        }
      />
      <MetricCard
        label="13-week forecast units"
        value={formatCompactNumber(metrics.next13WeekForecastUnits)}
        helper={
          metrics.next13WeekUncertaintyBuffer === null
            ? "No uncertainty buffer available"
            : `${formatCompactNumber(metrics.next13WeekUncertaintyBuffer)} buffer units above median`
        }
      />
      <MetricCard
        label="13-week projected revenue"
        value={formatCurrency(metrics.next13WeekProjectedRevenue)}
        helper={metrics.latestModelId ? `Priced from ${metrics.latestModelId}` : "Projected price missing for some weeks"}
      />
    </div>
  );
}
