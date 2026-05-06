"use client";

import type { SkuDemandDrivers, SkuSeriesResponse } from "@demand-planner/contracts";

import { EmptyState } from "@/components/ui/page-shell";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { MetricCard } from "../ui/page-shell";

type DriverKey = keyof SkuDemandDrivers;

type DriverRow = {
  date: string;
  actual?: number;
  forecast?: number | null;
};

function buildDriverRows(series: SkuDemandDrivers[DriverKey]): DriverRow[] {
  const rows = new Map<string, DriverRow>();

  for (const point of series.actuals) {
    rows.set(point.date, {
      ...(rows.get(point.date) ?? { date: point.date }),
      actual: point.value,
    });
  }

  for (const point of series.forecast) {
    rows.set(point.date, {
      ...(rows.get(point.date) ?? { date: point.date }),
      forecast: point.value,
    });
  }

  return Array.from(rows.values()).sort((left, right) => left.date.localeCompare(right.date));
}

function formatDriverValue(value: number | null | undefined, kind: DriverKey) {
  if (value === null || value === undefined) {
    return "--";
  }

  if (kind === "custInStock") {
    return `${(value * 100).toFixed(1)}%`;
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function coerceDriverAxisValue(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

function getLatestActualValue(series: SkuDemandDrivers[DriverKey]) {
  return series.actuals.at(-1)?.value ?? null;
}

function getFirstForecastValue(series: SkuDemandDrivers[DriverKey]) {
  return series.forecast.find((point) => point.value !== null)?.value ?? null;
}

function calculateDeltaPct(actual: number | null, forecast: number | null) {
  if (actual === null || forecast === null || actual === 0) {
    return null;
  }

  return (forecast - actual) / actual;
}

function formatDelta(value: number | null, kind: DriverKey) {
  if (value === null) {
    return "--";
  }

  const sign = value >= 0 ? "+" : "";
  const digits = kind === "custInStock" ? 1 : 1;
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

function DemandDriverChart({
  title,
  description,
  driver,
  kind,
}: {
  title: string;
  description: string;
  driver: SkuDemandDrivers[DriverKey];
  kind: DriverKey;
}) {
  const rows = buildDriverRows(driver);

  if (rows.length === 0) {
    return <EmptyState title={`No ${title.toLowerCase()} series`} description="Import historicals and forecasts to populate this driver." />;
  }

  return (
    <section className="rounded-4xl border border-border/80 bg-card/90 p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="font-heading text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid stroke="rgba(20,33,61,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value: string | number) => {
                return formatDriverValue(coerceDriverAxisValue(value), kind);
              }}
              width={72}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" name="Historical actual" stroke="#14213d" strokeWidth={2.4} dot={false} />
            <Line type="monotone" dataKey="forecast" name="Projected" stroke="#c46a2d" strokeWidth={2.4} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function DemandDriversDrawer({ data }: { data: SkuSeriesResponse }) {
  const priceDelta = calculateDeltaPct(
    getLatestActualValue(data.demandDrivers.avgUnitPrice),
    getFirstForecastValue(data.demandDrivers.avgUnitPrice),
  );
  const inStockDelta = calculateDeltaPct(
    getLatestActualValue(data.demandDrivers.custInStock),
    getFirstForecastValue(data.demandDrivers.custInStock),
  );

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button className="gap-2 shadow-sm" size="lg" type="button" variant="outline">
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M4 5.5h5v13H4zm11 0h5v13h-5zm-5 4h4v9h-4z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
          <span>View demand drivers</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent aria-label="Demand drivers panel" className="p-0" direction="right">
        <div className="flex h-full flex-col">
          <DrawerHeader className="border-b border-border/70 px-5 py-5">
            <p className="text-[0.78rem] font-medium tracking-[0.16em] text-primary uppercase">Demand drivers</p>
            <DrawerTitle>Price and in-stock projections</DrawerTitle>
            <DrawerDescription>
              Historical actuals and the latest projected values for avg unit price and customer in-stock.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Projected price delta"
                  value={formatDelta(priceDelta, "avgUnitPrice")}
                  helper="First projected week vs latest actual price"
                />
                <MetricCard
                  label="Projected in-stock delta"
                  value={formatDelta(inStockDelta, "custInStock")}
                  helper="First projected week vs latest actual in-stock"
                />
              </div>
              <DemandDriverChart
                description="Average unit price history alongside the projected forward path from the latest inference run."
                driver={data.demandDrivers.avgUnitPrice}
                kind="avgUnitPrice"
                title="Average unit price"
              />
              <DemandDriverChart
                description="Customer in-stock history and projected future coverage for the same weekly horizon."
                driver={data.demandDrivers.custInStock}
                kind="custInStock"
                title="Customer in-stock"
              />
            </div>
          </div>

          <DrawerFooter className="border-t border-border/70 px-5 py-4">
            <DrawerClose asChild>
              <Button type="button" variant="secondary">
                Close panel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}