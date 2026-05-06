export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function severityLabel(value: string | null): string {
  return value ? value.replace(/_/g, " ") : "none";
}
