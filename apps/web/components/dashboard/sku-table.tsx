"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import type { SkuSummary } from "@demand-planner/contracts";

import { EmptyState } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCaption, TableCell, TableCellStack, TableHead, TableHeader, TableRow, TableShell } from "../ui/table";

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

function formatPercent(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

const severityRank: Record<NonNullable<SkuSummary["severity"]> | "neutral", number> = {
  neutral: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const tableControlClassName =
  "h-9 rounded-4xl border border-border/80 bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function SortableHeader({
  title,
  isSorted,
  onToggle,
}: {
  title: string;
  isSorted: false | "asc" | "desc";
  onToggle: () => void;
}) {
  const Icon = isSorted === "asc" ? ArrowUp : isSorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      className="-ml-3 h-8 px-3 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
      onClick={onToggle}
      size="sm"
      type="button"
      variant="ghost"
    >
      {title}
      <Icon className="size-3.5" />
    </Button>
  );
}

const columns: ColumnDef<SkuSummary>[] = [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="SKU"
      />
    ),
    cell: ({ row }) => {
      const summary = row.original;

      return (
        <TableCellStack
          primary={
            <Link className="font-medium text-foreground hover:text-primary" href={`/sku/${summary.sku}`}>
              {summary.sku}
            </Link>
          }
          secondary="View series"
        />
      );
    },
  },
  {
    id: "severity",
    accessorFn: (summary) => severityRank[summary.severity ?? "neutral"],
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="Severity"
      />
    ),
    cell: ({ row }) => <Badge tone={row.original.severity ?? "neutral"}>{row.original.severity ?? "none"}</Badge>,
  },
  {
    accessorKey: "latestActualUnits",
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="Latest actual"
      />
    ),
    cell: ({ row }) => row.original.latestActualUnits ?? "-",
  },
  {
    accessorKey: "latestForecastUnits",
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="First forecast"
      />
    ),
    cell: ({ row }) => (
      <TableCellStack
        primary={row.original.latestForecastUnits ?? "-"}
        secondary={`Gap ${formatPercent(row.original.firstForecastGapPct)}`}
      />
    ),
  },
  {
    accessorKey: "projectedRevenue13Weeks",
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="13W revenue"
      />
    ),
    cell: ({ row }) => formatCurrency(row.original.projectedRevenue13Weeks),
  },
  {
    accessorKey: "projectedPriceDeltaPct",
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="Driver delta"
      />
    ),
    cell: ({ row }) => (
      <TableCellStack
        primary={`Price ${formatPercent(row.original.projectedPriceDeltaPct)}`}
        secondary={`In-stock ${formatPercent(row.original.projectedInStockDeltaPct)}`}
      />
    ),
  },
  {
    id: "reasons",
    accessorFn: (summary) => (summary.reasons.length > 0 ? summary.reasons.join(", ") : "No active reasons"),
    header: ({ column }) => (
      <SortableHeader
        isSorted={column.getIsSorted()}
        onToggle={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        title="Reasons"
      />
    ),
    cell: ({ row }) => (row.original.reasons.length > 0 ? row.original.reasons.join(", ") : "No active reasons"),
  },
];

export function SkuTable({ summaries }: { summaries: SkuSummary[] }) {
  const [showAlertedOnly, setShowAlertedOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const visibleSummaries = showAlertedOnly ? summaries.filter((summary) => summary.reasons.length > 0) : summaries;

  if (summaries.length === 0) {
    return <EmptyState title="No SKU summaries available" description="Import actuals and forecasts to populate the latest snapshot." />;
  }

  const table = useReactTable({
    data: visibleSummaries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnFilters,
      sorting,
    },
  });

  const skuFilter = (table.getColumn("sku")?.getFilterValue() as string | undefined) ?? "";
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;
  const captionLabel = showAlertedOnly ? "alerted SKU summaries" : "SKU summaries";
  const emptyMessage = showAlertedOnly ? "No alerted SKUs match the current filter." : "No SKU summaries match the current filter.";

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

      <div className="flex flex-col gap-3 rounded-4xl border border-border/70 bg-background/80 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            aria-label="Filter SKU summaries"
            className={cn(tableControlClassName, "w-full min-w-0 sm:max-w-sm")}
            onChange={(event) => {
              table.getColumn("sku")?.setFilterValue(event.target.value);
            }}
            placeholder="Filter by SKU..."
            type="search"
            value={skuFilter}
          />
          <p className="text-sm text-muted-foreground">
            {filteredRowCount === visibleSummaries.length
              ? `${String(filteredRowCount)} ${captionLabel}`
              : `${String(filteredRowCount)} of ${String(visibleSummaries.length)} ${captionLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="sku-table-page-size">
            Rows
          </label>
          <select
            className={cn(tableControlClassName, "pr-8")}
            id="sku-table-page-size"
            onChange={(event) => {
              table.setPageSize(Number(event.target.value));
            }}
            value={String(table.getState().pagination.pageSize)}
          >
            {[10, 25, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TableShell>
        <Table>
          <TableCaption>
            {filteredRowCount === visibleSummaries.length
              ? `${String(filteredRowCount)} ${captionLabel}`
              : `${String(filteredRowCount)} of ${String(visibleSummaries.length)} ${captionLabel}`}
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} scope="col">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {pageRows.length > 0 ? (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-12 text-center text-muted-foreground" colSpan={columns.length}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableShell>

      <div className="flex flex-col gap-3 rounded-4xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {String(table.getState().pagination.pageIndex + 1)} of {String(Math.max(table.getPageCount(), 1))}
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => {
              table.previousPage();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => {
              table.nextPage();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
