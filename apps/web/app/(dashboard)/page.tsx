import { EmptyState, PageShell, SectionCard } from "@/components/ui/page-shell";

import { DemandSeriesChart } from "../../components/charts/sku-series-chart";
import { AlertSummaryGrid } from "../../components/dashboard/alert-summary-grid";
import { ImportPanel } from "../../components/dashboard/import-panel";
import { SkuTable } from "../../components/dashboard/sku-table";
import { getDashboardPageData } from "../../lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { alerts, summaries, aggregateSeries, latestInferenceDate } = await getDashboardPageData();
  const hasAggregateSeries =
    aggregateSeries.actuals.length > 0 || aggregateSeries.forecast.length > 0;

  return (
    <PageShell eyebrow="Overview" title="Dashboard">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <AlertSummaryGrid
            alerts={alerts}
            summaries={summaries}
            latestInferenceDate={latestInferenceDate}
          />
        </div>

        <div className="lg:col-span-12">
          <SectionCard title="Aggregate demand outlook">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm leading-6 text-muted-foreground">
                  Historical units sold for the last 13 weeks and the next 39 weeks of forecast from
                  the latest inference run.
                </p>
                <p className="text-sm text-muted-foreground">
                  Latest inference date:{" "}
                  <strong>{latestInferenceDate ?? "No forecast run loaded"}</strong>
                </p>
              </div>

              {hasAggregateSeries ? (
                <DemandSeriesChart
                  data={aggregateSeries}
                  actualLabel="Historical units sold"
                  forecastLabel="Aggregate forecast median"
                />
              ) : (
                <EmptyState
                  title="No aggregate demand series available"
                  description="Import actuals and forecasts to populate the latest dashboard snapshot."
                />
              )}
            </div>
          </SectionCard>
        </div>
        <div className="lg:col-span-12">
          <SectionCard title="All SKU summaries">
            <SkuTable summaries={summaries} />
          </SectionCard>
        </div>
        <div className="lg:col-span-12">
          <ImportPanel />
        </div>
      </div>
    </PageShell>
  );
}
