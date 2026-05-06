import Link from "next/link";

import type { Alert } from "@demand-planner/contracts";

import { EmptyState } from "@/components/ui/page-shell";

import { formatNumber, formatPercent, severityLabel } from "../../lib/utils/format";
import { Badge } from "../ui/badge";

function formatReason(reason: string) {
  return reason.replace(/_/g, " ");
}

export function AlertCardGrid({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <EmptyState title="No active alert cards" description="SKU workbench links will appear here when alerts are active." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {alerts.map((alert) => (
        <Link className="block h-full" href={`/sku/${encodeURIComponent(alert.sku)}`} key={`${alert.sku}-${alert.latestInferenceDate}`}>
          <article className="flex h-full flex-col gap-4 rounded-4xl border border-border/80 bg-card/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30">
            <header className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[0.78rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">SKU</p>
                <h3 className="text-xl font-medium text-foreground">{alert.sku}</h3>
              </div>
              <Badge tone={alert.severity}>{severityLabel(alert.severity)}</Badge>
            </header>
            <p className="text-sm text-muted-foreground">Latest inference {alert.latestInferenceDate}</p>
            <ul className="flex flex-wrap gap-2">
              {alert.reasons.map((reason) => (
                <li className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground" key={reason}>
                  {formatReason(reason)}
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <dt className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Forecast median</dt>
                <dd className="mt-1 text-lg font-medium text-foreground">{formatNumber(alert.metrics.forecastMedian)}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Uncertainty</dt>
                <dd className="mt-1 text-lg font-medium text-foreground">{formatPercent(alert.metrics.uncertaintyRatio)}</dd>
              </div>
            </dl>
          </article>
        </Link>
      ))}
    </div>
  );
}