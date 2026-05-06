import { notFound } from "next/navigation";

import { PageShell, SectionCard } from "@/components/ui/page-shell";

import { SkuSeriesChart } from "../../../../components/charts/sku-series-chart";
import { DemandDriversDrawer } from "../../../../components/sku-detail/demand-drivers-drawer";
import { AlertPanel } from "../../../../components/sku-detail/alert-panel";
import { getSkuPageData } from "../../../../lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function SkuDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const data = await getSkuPageData(sku);

  if (!data) {
    notFound();
  }

  return (
    <PageShell eyebrow="SKU detail" title={sku} actions={<DemandDriversDrawer data={data} />}>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionCard title="Demand and forecast series">
            <p className="text-sm leading-6 text-muted-foreground">
              Weekly workbench showing the last 13 weeks of historical actuals and the next 39 weeks of forecast from the latest inference run.
            </p>
            <SkuSeriesChart data={data} />
          </SectionCard>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <AlertPanel alerts={data.alerts} />
        </div>
      </div>
    </PageShell>
  );
}
