"use client";

import type { DashboardAggregateSeries, SkuSeriesResponse } from "@demand-planner/contracts";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

const PREVIOUS_YEAR_SERIES_NOTE =
  "Previous-year same-week actuals render only when a shifted weekly history exists for the same SKU.";

type LegendEntry = {
  color?: string;
  dataKey?: unknown;
  value?: string;
};

type ChartDatum = {
  date: string;
  actual?: number;
  previousYear?: number;
  p05?: number;
  p50?: number;
  p95?: number;
};

type DemandSeriesChartData = Pick<DashboardAggregateSeries, "actuals" | "forecast"> & {
  previousYearActuals?: SkuSeriesResponse["previousYearActuals"];
};

export function DemandSeriesChart({
  data,
  actualLabel = "Actual units sold",
  forecastLabel = "Forecast median",
  previousYearLabel = "Previous year actuals",
}: {
  data: DemandSeriesChartData;
  actualLabel?: string;
  forecastLabel?: string;
  previousYearLabel?: string;
}) {
  const chartData = new Map<string, ChartDatum>();

  for (const actual of data.actuals) {
    chartData.set(actual.date, {
      ...(chartData.get(actual.date) ?? { date: actual.date }),
      actual: actual.value,
    });
  }

  for (const forecast of data.forecast) {
    chartData.set(forecast.date, {
      ...(chartData.get(forecast.date) ?? { date: forecast.date }),
      p05: forecast.p05,
      p50: forecast.p50,
      p95: forecast.p95,
    });
  }

  for (const previous of data.previousYearActuals ?? []) {
    chartData.set(previous.date, {
      ...(chartData.get(previous.date) ?? { date: previous.date }),
      previousYear: previous.value,
    });
  }

  const rows = Array.from(chartData.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  );

  function renderLegendContent(props: unknown) {
    const payload =
      typeof props === "object" && props !== null && "payload" in props
        ? (props as { payload?: ReadonlyArray<LegendEntry> }).payload
        : undefined;

    if (!payload?.length) {
      return null;
    }

    return (
      <ul className="flex list-none flex-wrap items-center justify-center gap-x-4 gap-y-3 px-0 pb-2 text-sm text-muted-foreground" role="list">
        {payload.map((entry) => {
          const candidateKey = entry.dataKey ?? entry.value;
          const key = typeof candidateKey === "string" ? candidateKey : "legend-entry";
          const isPreviousYearEntry = entry.value === previousYearLabel;
          const isForecastEntry = entry.value === forecastLabel;

          return (
            <li className="inline-flex items-center gap-2" key={key}>
              <span
                aria-hidden="true"
                className="w-5 border-t-2"
                style={{ borderColor: entry.color ?? "currentColor", borderTopStyle: isPreviousYearEntry ? "dashed" : "solid" }}
              />
              <span className={cn(isForecastEntry && "font-medium text-foreground")}>{entry.value}</span>
              {isPreviousYearEntry ? (
                <button
                  aria-label={PREVIOUS_YEAR_SERIES_NOTE}
                  className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
                  title={PREVIOUS_YEAR_SERIES_NOTE}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16">
                    <circle
                      cx="8"
                      cy="8"
                      fill="none"
                      r="6.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 7.1v3.2"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                    <circle cx="8" cy="4.55" fill="currentColor" r="0.75" />
                  </svg>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="h-[360px] rounded-4xl border border-border/80 bg-background/70 p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows}>
          <CartesianGrid stroke="rgba(20,33,61,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend content={renderLegendContent} />
          <Area
            type="monotone"
            dataKey="p95"
            name="Forecast p95"
            legendType="none"
            stroke="transparent"
            fill="rgba(196,106,45,0.08)"
          />
          <Area
            type="monotone"
            dataKey="p05"
            name="Forecast p05"
            legendType="none"
            stroke="transparent"
            fill="rgba(247,245,239,1)"
          />
          <Line
            type="monotone"
            dataKey="actual"
            name={actualLabel}
            stroke="#14213d"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="p50"
            name={forecastLabel}
            stroke="#c46a2d"
            strokeWidth={3.5}
            activeDot={{ r: 4, fill: "#c46a2d", stroke: "#fffaf3", strokeWidth: 2 }}
            dot={false}
          />
          {data.previousYearActuals ? (
            <Line
              type="monotone"
              dataKey="previousYear"
              name={previousYearLabel}
              stroke="#0b6e4f"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SkuSeriesChart({ data }: { data: SkuSeriesResponse }) {
  return <DemandSeriesChart data={data} />;
}
