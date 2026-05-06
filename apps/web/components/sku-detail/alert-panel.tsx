import type { Alert } from "@demand-planner/contracts";

import { EmptyState, SectionCard } from "@/components/ui/page-shell";

import { Badge } from "../ui/badge";

export function AlertPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <EmptyState title="No active alerts" description="This SKU is within the current threshold envelope." />;
  }

  return (
    <SectionCard title="Alert explanations">
      <div className="space-y-4">
        {alerts.map((alert) => (
          <article className="rounded-4xl border border-border/80 bg-card/90 p-4 shadow-sm" key={`${alert.sku}-${alert.latestInferenceDate}`}>
            <div className="space-y-3">
              <div>
                <Badge tone={alert.severity}>{alert.severity}</Badge>
              </div>
              <ul className="space-y-2 pl-5 text-sm text-foreground">
                {alert.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground font-bold">Forecast median: {alert.metrics.forecastMedian.toFixed(2)}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
