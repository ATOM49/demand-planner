"use client";

import Link from "next/link";
import { useState } from "react";

import type { SkuSummary } from "@demand-planner/contracts";

import { EmptyState } from "@/components/ui/page-shell";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCaption, TableCell, TableCellStack, TableHead, TableHeader, TableRow, TableShell } from "../ui/table";

export function SkuTable({ summaries }: { summaries: SkuSummary[] }) {
  const [showAlertedOnly, setShowAlertedOnly] = useState(false);
  const visibleSummaries = showAlertedOnly ? summaries.filter((summary) => summary.reasons.length > 0) : summaries;

  if (summaries.length === 0) {
    return <EmptyState title="No SKU summaries available" description="Import actuals and forecasts to populate the latest snapshot." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-4xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Snapshot view</p>
          <p className="text-sm text-muted-foreground">
            {showAlertedOnly ? "Only SKUs with active alerts are shown." : "All SKUs in the latest forecast snapshot are shown."}
          </p>
        </div>
        <div className="inline-flex rounded-4xl border border-border/80 bg-background/80 p-1" role="group" aria-label="SKU summary filters">
          <Button
            aria-pressed={!showAlertedOnly}
            onClick={() => {
              setShowAlertedOnly(false);
            }}
            size="sm"
            type="button"
            variant={showAlertedOnly ? "ghost" : "secondary"}
          >
            All SKUs
          </Button>
          <Button
            aria-pressed={showAlertedOnly}
            onClick={() => {
              setShowAlertedOnly(true);
            }}
            size="sm"
            type="button"
            variant={showAlertedOnly ? "default" : "ghost"}
          >
            Alerted only
          </Button>
        </div>
      </div>

      {visibleSummaries.length === 0 ? (
        <EmptyState
          title="No alerted SKUs in this snapshot"
          description="Switch back to all SKU summaries to review the full forecast snapshot." 
        />
      ) : (
        <TableShell>
          <Table>
            <TableCaption>
              {showAlertedOnly
                ? `${String(visibleSummaries.length)} alerted SKU summaries`
                : `${String(visibleSummaries.length)} SKU summaries`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">SKU</TableHead>
                <TableHead scope="col">Severity</TableHead>
                <TableHead scope="col">Latest actual</TableHead>
                <TableHead scope="col">Latest inference</TableHead>
                <TableHead scope="col">Reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSummaries.map((summary) => (
                <TableRow key={summary.sku}>
                  <TableCell>
                    <TableCellStack
                      primary={<Link className="font-medium text-foreground hover:text-primary" href={`/sku/${summary.sku}`}>{summary.sku}</Link>}
                      secondary="View series"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge tone={summary.severity ?? "neutral"}>{summary.severity ?? "none"}</Badge>
                  </TableCell>
                  <TableCell>{summary.latestActualUnits ?? "-"}</TableCell>
                  <TableCell>{summary.latestInferenceDate ?? "-"}</TableCell>
                  <TableCell>{summary.reasons.length > 0 ? summary.reasons.join(", ") : "No active reasons"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      )}
    </div>
  );
}
