import type { Alert, SkuSummary } from "@demand-planner/contracts";

import { MetricCard } from "@/components/ui/page-shell";

export function AlertSummaryGrid({
  alerts,
  summaries,
  latestInferenceDate,
}: {
  alerts: Alert[];
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
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Tracked SKUs"
        value={summaries.length}
        helper={latestInferenceDate ? `Latest inference run ${latestInferenceDate}` : "No forecast run loaded"}
      />
      <MetricCard label="High-signal alerts" value={counts.high} helper="Jump/drop plus another risk in the latest run" />
      <MetricCard label="Medium-signal alerts" value={counts.medium} helper="Band width or projected driver changes in the latest run" />
    </div>
  );
}
